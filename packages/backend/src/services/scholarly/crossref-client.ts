/**
 * @fileoverview Crossref API client for scholarly metadata
 * @lastmodified 2025-11-05
 *
 * Features: DOI lookup, metadata extraction, rate limiting
 * Main APIs: lookupDOI, searchWorks, getReferences
 * Constraints: 50 req/s rate limit, polite API usage
 * Patterns: Rate limiting with bottleneck, retry on 429
 */

import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';

import { config } from '../../config';
import { logger } from '../../utils/logger';
import type { Author, Citation, Venue, OpenAccess } from '../../types/source-profile';

/**
 * Crossref work response
 */
interface CrossrefWork {
  DOI: string;
  title?: string[];
  author?: Array<{
    given?: string;
    family?: string;
    ORCID?: string;
    affiliation?: Array<{ name?: string }>;
  }>;
  'container-title'?: string[];
  publisher?: string;
  'published-print'?: { 'date-parts': number[][] };
  'published-online'?: { 'date-parts': number[][] };
  abstract?: string;
  type?: string;
  ISSN?: string[];
  ISBN?: string[];
  'is-referenced-by-count'?: number;
  'references-count'?: number;
  reference?: Array<{
    DOI?: string;
    'article-title'?: string;
    author?: string;
    year?: string;
  }>;
  link?: Array<{
    URL: string;
    'content-type': string;
    'content-version': string;
    'intended-application': string;
  }>;
  license?: Array<{
    URL: string;
    'content-version': string;
    'delay-in-days': number;
  }>;
}

/**
 * Crossref search response
 */
interface CrossrefSearchResponse {
  status: string;
  'message-type': string;
  'message-version': string;
  message: {
    'total-results': number;
    items: CrossrefWork[];
    query?: {
      'search-terms'?: string;
    };
  };
}

/**
 * Crossref API client
 */
export class CrossrefClient {
  private client: AxiosInstance;

  private limiter: Bottleneck;

  private readonly baseURL = 'https://api.crossref.org';

  private readonly politeEmail: string;

  constructor() {
    this.politeEmail = config.crossref?.politeEmail || 'research@example.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': `DeepResearchCockpit/1.0 (mailto:${this.politeEmail})`,
      },
    });

    // Rate limiter: 50 requests per second (Crossref polite API limit)
    this.limiter = new Bottleneck({
      maxConcurrent: 10,
      minTime: 20, // 50 req/s = 1000ms / 50 = 20ms between requests
      reservoir: 50, // Initial tokens
      reservoirRefreshAmount: 50,
      reservoirRefreshInterval: 1000, // Refill every second
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after'] || 60;
          logger.warn('Crossref rate limit hit, waiting', {
            metadata: { retryAfter },
          });
          await this.sleep(retryAfter * 1000);
          return this.client.request(error.config);
        }
        throw error;
      }
    );
  }

  /**
   * Look up a DOI and get metadata
   */
  async lookupDOI(doi: string): Promise<{
    title: string;
    authors: Author[];
    venue?: Venue;
    publishedDate?: string;
    abstract?: string;
    citationCount: number;
    referencesCount: number;
    references: Citation[];
    openAccess: OpenAccess;
    type?: string;
  } | null> {
    try {
      const response = await this.limiter.schedule(() =>
        this.client.get<CrossrefSearchResponse>(`/works/${encodeURIComponent(doi)}`)
      );

      const work = response.data.message as unknown as CrossrefWork;

      return this.parseWork(work);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('DOI not found in Crossref', { metadata: { doi } });
        return null;
      }

      logger.error('Crossref DOI lookup failed', {
        metadata: {
          doi,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Search for works by query
   */
  async searchWorks(query: string, limit: number = 10): Promise<Array<{
    doi: string;
    title: string;
    authors: Author[];
    publishedDate?: string;
    citationCount: number;
  }>> {
    try {
      const response = await this.limiter.schedule(() =>
        this.client.get<CrossrefSearchResponse>('/works', {
          params: {
            query,
            rows: limit,
            select: 'DOI,title,author,published-print,is-referenced-by-count',
          },
        })
      );

      return response.data.message.items
        .map((work: CrossrefWork) => {
          const parsed = this.parseWork(work);
          if (!parsed) return null;

          return {
            doi: work.DOI,
            title: parsed.title,
            authors: parsed.authors,
            publishedDate: parsed.publishedDate,
            citationCount: parsed.citationCount,
          };
        })
        .filter((item: any): item is NonNullable<typeof item> => item !== null);
    } catch (error) {
      logger.error('Crossref search failed', {
        metadata: {
          query,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get references for a DOI
   */
  async getReferences(doi: string): Promise<Citation[]> {
    const metadata = await this.lookupDOI(doi);
    return metadata?.references || [];
  }

  /**
   * Parse a Crossref work into our format
   */
  private parseWork(work: CrossrefWork): {
    title: string;
    authors: Author[];
    venue?: Venue;
    publishedDate?: string;
    abstract?: string;
    citationCount: number;
    referencesCount: number;
    references: Citation[];
    openAccess: OpenAccess;
    type?: string;
  } | null {
    if (!work.title || work.title.length === 0) {
      return null;
    }

    // Parse authors
    const authors: Author[] = (work.author || []).map((author) => ({
      name: `${author.given || ''} ${author.family || ''}`.trim(),
      orcid: author.ORCID,
      affiliation: author.affiliation?.[0]?.name,
    }));

    // Parse venue
    const venue: Venue | undefined = work['container-title']?.[0]
      ? {
          name: work['container-title'][0],
          type: this.mapCrossrefTypeToVenueType(work.type),
          issn: work.ISSN?.[0],
          isbn: work.ISBN?.[0],
          publisher: work.publisher,
        }
      : undefined;

    // Parse published date
    const publishedDate = this.parseDateParts(
      work['published-print']?.['date-parts'] || work['published-online']?.['date-parts']
    );

    // Parse references
    const references: Citation[] = (work.reference || []).map((ref) => ({
      doi: ref.DOI,
      title: ref['article-title'],
      authors: ref.author ? [ref.author] : undefined,
      year: ref.year ? parseInt(ref.year, 10) : undefined,
    }));

    // Determine open access
    const openAccess: OpenAccess = this.determineOpenAccess(work);

    return {
      title: work.title[0] || '',
      authors,
      venue,
      publishedDate,
      abstract: work.abstract,
      citationCount: work['is-referenced-by-count'] || 0,
      referencesCount: work['references-count'] || 0,
      references,
      openAccess,
      type: work.type,
    };
  }

  /**
   * Map Crossref type to venue type
   */
  private mapCrossrefTypeToVenueType(
    type?: string
  ): 'journal' | 'conference' | 'workshop' | 'preprint' | 'book' | 'other' {
    if (!type) return 'other';

    if (type.includes('journal')) return 'journal';
    if (type.includes('proceedings')) return 'conference';
    if (type.includes('book')) return 'book';
    if (type.includes('posted-content')) return 'preprint';

    return 'other';
  }

  /**
   * Parse Crossref date parts into ISO string
   */
  private parseDateParts(dateParts?: number[][]): string | undefined {
    if (!dateParts || dateParts.length === 0 || dateParts[0]?.length === 0) {
      return undefined;
    }

    const [year, month = 1, day = 1] = dateParts[0] || [];
    if (!year) {
      return undefined;
    }
    return new Date(year, month - 1, day).toISOString();
  }

  /**
   * Determine open access status
   */
  private determineOpenAccess(work: CrossrefWork): OpenAccess {
    // Check for license information
    if (work.license && work.license.length > 0) {
      const license = work.license[0];
      if (license) {
        return {
          isOA: true,
          oaStatus: license['delay-in-days'] === 0 ? 'gold' : 'hybrid',
          oaUrl: license.URL,
          license: license.URL,
        };
      }
    }

    // Check for full text links
    const fullTextLink = work.link?.find((link) => link['intended-application'] === 'text-mining');
    if (fullTextLink) {
      return {
        isOA: true,
        oaStatus: 'bronze',
        oaUrl: fullTextLink.URL,
      };
    }

    return {
      isOA: false,
      oaStatus: 'closed',
    };
  }

  /**
   * Sleep utility
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }
}

// Singleton instance
export const crossrefClient = new CrossrefClient();
