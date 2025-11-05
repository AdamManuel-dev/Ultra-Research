/**
 * @fileoverview Semantic Scholar API client for scholarly metadata
 * @lastmodified 2025-11-05
 *
 * Features: Paper lookup, author search, recommendations, rate limiting
 * Main APIs: lookupDOI, getPaper, searchPapers, getAuthor, getRecommendations
 * Constraints: 1 req/s public, 100 req/s with API key
 * Patterns: API key auth, rate limiting with bottleneck
 */

import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';

import { config } from '../../config';
import { logger } from '../../utils/logger';
import type { Author, Citation, Venue, OpenAccess } from '../../types/source-profile';

/**
 * Semantic Scholar paper response
 */
interface S2Paper {
  paperId: string;
  externalIds?: {
    DOI?: string;
    ArXiv?: string;
    MAG?: string;
    PubMed?: string;
  };
  title?: string;
  abstract?: string;
  venue?: string;
  year?: number;
  publicationDate?: string;
  authors?: Array<{
    authorId: string;
    name: string;
  }>;
  citationCount?: number;
  referenceCount?: number;
  influentialCitationCount?: number;
  isOpenAccess?: boolean;
  openAccessPdf?: {
    url: string;
    status: string;
  };
  fieldsOfStudy?: string[];
  s2FieldsOfStudy?: Array<{
    category: string;
    source: string;
  }>;
  publicationTypes?: string[];
  publicationVenue?: {
    id?: string;
    name?: string;
    type?: string;
    alternate_names?: string[];
    issn?: string;
    url?: string;
  };
  citations?: Array<{
    paperId: string;
    title?: string;
  }>;
  references?: Array<{
    paperId: string;
    title?: string;
  }>;
}

/**
 * Semantic Scholar search response
 */
interface S2SearchResponse {
  total: number;
  offset: number;
  next?: number;
  data: S2Paper[];
}

/**
 * Semantic Scholar author response
 */
interface S2Author {
  authorId: string;
  name: string;
  aliases?: string[];
  affiliations?: string[];
  homepage?: string;
  paperCount?: number;
  citationCount?: number;
  hIndex?: number;
  papers?: Array<{
    paperId: string;
    title: string;
  }>;
}

/**
 * Search options for Semantic Scholar
 */
interface SearchOptions {
  limit?: number;
  offset?: number;
  fields?: string[];
  year?: string; // e.g., "2020-2023" or "2020"
  venue?: string[];
  fieldsOfStudy?: string[];
  openAccessPdf?: boolean;
  minCitationCount?: number;
}

/**
 * Semantic Scholar API client
 */
export class SemanticScholarClient {
  private client: AxiosInstance;

  private limiter: Bottleneck;

  private readonly baseURL = 'https://api.semanticscholar.org/graph/v1';

  private readonly apiKey?: string;

  constructor() {
    this.apiKey = config.semanticScholar?.apiKey;

    const headers: Record<string, string> = {
      'User-Agent': 'DeepResearchCockpit/1.0',
    };

    if (this.apiKey) {
      headers['x-api-key'] = this.apiKey;
    }

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers,
    });

    // Rate limiter: 1 req/s without key, 100 req/s with key
    const hasApiKey = Boolean(this.apiKey);
    this.limiter = new Bottleneck({
      maxConcurrent: hasApiKey ? 20 : 1,
      minTime: hasApiKey ? 10 : 1000, // 100 req/s vs 1 req/s
      reservoir: hasApiKey ? 100 : 1,
      reservoirRefreshAmount: hasApiKey ? 100 : 1,
      reservoirRefreshInterval: 1000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after'] || 60;
          logger.warn('Semantic Scholar rate limit hit, waiting', {
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
      const fields = this.getDefaultFields();
      const response = await this.limiter.schedule(() =>
        this.client.get<S2Paper>(`/paper/DOI:${encodeURIComponent(doi)}`, {
          params: { fields: fields.join(',') },
        })
      );

      return this.parsePaper(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('DOI not found in Semantic Scholar', { metadata: { doi } });
        return null;
      }

      logger.error('Semantic Scholar DOI lookup failed', {
        metadata: {
          doi,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get a paper by Semantic Scholar ID
   */
  async getPaper(paperId: string): Promise<{
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
      const fields = this.getDefaultFields();
      const response = await this.limiter.schedule(() =>
        this.client.get<S2Paper>(`/paper/${paperId}`, {
          params: { fields: fields.join(',') },
        })
      );

      return this.parsePaper(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('Paper not found in Semantic Scholar', { metadata: { paperId } });
        return null;
      }

      logger.error('Semantic Scholar paper lookup failed', {
        metadata: {
          paperId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Search for papers
   */
  async searchPapers(
    query: string,
    options: SearchOptions = {}
  ): Promise<{
    results: Array<{
      paperId: string;
      doi?: string;
      title: string;
      authors: Author[];
      publishedDate?: string;
      citationCount: number;
    }>;
    total: number;
    offset: number;
    hasMore: boolean;
  }> {
    try {
      const {
        limit = 10,
        offset = 0,
        fields = this.getSearchFields(),
        year,
        venue,
        fieldsOfStudy,
        openAccessPdf,
        minCitationCount,
      } = options;

      const params: Record<string, string | number | boolean> = {
        query,
        offset,
        limit,
        fields: fields.join(','),
      };

      if (year) params['year'] = year;
      if (venue) params['venue'] = venue.join(',');
      if (fieldsOfStudy) params['fieldsOfStudy'] = fieldsOfStudy.join(',');
      if (openAccessPdf !== undefined) params['openAccessPdf'] = openAccessPdf;
      if (minCitationCount !== undefined) params['minCitationCount'] = minCitationCount;

      const response = await this.limiter.schedule(() =>
        this.client.get<S2SearchResponse>('/paper/search', { params })
      );

      const results = response.data.data
        .map((paper: S2Paper) => {
          const parsed = this.parsePaper(paper);
          if (!parsed) return null;

          return {
            paperId: paper.paperId,
            doi: paper.externalIds?.DOI,
            title: parsed.title,
            authors: parsed.authors,
            publishedDate: parsed.publishedDate,
            citationCount: parsed.citationCount,
          };
        })
        .filter((item: any): item is NonNullable<typeof item> => item !== null);

      return {
        results,
        total: response.data.total,
        offset: response.data.offset,
        hasMore: Boolean(response.data.next),
      };
    } catch (error) {
      logger.error('Semantic Scholar search failed', {
        metadata: {
          query,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get author information
   */
  async getAuthor(authorId: string): Promise<{
    name: string;
    aliases: string[];
    affiliations: string[];
    paperCount: number;
    citationCount: number;
    hIndex: number;
  } | null> {
    try {
      const response = await this.limiter.schedule(() =>
        this.client.get<S2Author>(`/author/${authorId}`, {
          params: {
            fields: 'name,aliases,affiliations,paperCount,citationCount,hIndex',
          },
        })
      );

      const author = response.data;

      return {
        name: author.name,
        aliases: author.aliases || [],
        affiliations: author.affiliations || [],
        paperCount: author.paperCount || 0,
        citationCount: author.citationCount || 0,
        hIndex: author.hIndex || 0,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('Author not found in Semantic Scholar', { metadata: { authorId } });
        return null;
      }

      logger.error('Semantic Scholar author lookup failed', {
        metadata: {
          authorId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get paper recommendations based on a paper
   */
  async getRecommendations(
    paperId: string,
    limit: number = 10
  ): Promise<
    Array<{
      paperId: string;
      doi?: string;
      title: string;
      authors: Author[];
      citationCount: number;
    }>
  > {
    try {
      const fields = this.getSearchFields();
      const response = await this.limiter.schedule(() =>
        this.client.get<{ recommendedPapers: S2Paper[] }>(
          `/paper/${paperId}/recommendations`,
          {
            params: {
              fields: fields.join(','),
              limit,
            },
          }
        )
      );

      return response.data.recommendedPapers
        .map((paper: S2Paper) => {
          const parsed = this.parsePaper(paper);
          if (!parsed) return null;

          return {
            paperId: paper.paperId,
            doi: paper.externalIds?.DOI,
            title: parsed.title,
            authors: parsed.authors,
            citationCount: parsed.citationCount,
          };
        })
        .filter((item: any): item is NonNullable<typeof item> => item !== null);
    } catch (error) {
      logger.error('Semantic Scholar recommendations failed', {
        metadata: {
          paperId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get references for a paper
   */
  async getReferences(paperId: string): Promise<Citation[]> {
    const metadata = await this.getPaper(paperId);
    return metadata?.references || [];
  }

  /**
   * Parse a Semantic Scholar paper into our format
   */
  private parsePaper(paper: S2Paper): {
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
    if (!paper.title) {
      return null;
    }

    // Parse authors
    const authors: Author[] = (paper.authors || []).map((author) => ({
      name: author.name,
    }));

    // Parse venue
    const venue: Venue | undefined = paper.publicationVenue?.name || paper.venue
      ? {
          name: paper.publicationVenue?.name || paper.venue || '',
          type: this.mapPublicationTypeToVenueType(paper.publicationTypes?.[0]),
          issn: paper.publicationVenue?.issn,
        }
      : undefined;

    // Parse references
    const references: Citation[] = (paper.references || []).map((ref) => ({
      title: ref.title,
    }));

    // Determine open access
    const openAccess: OpenAccess = this.determineOpenAccess(paper);

    return {
      title: paper.title,
      authors,
      venue,
      publishedDate: paper.publicationDate,
      abstract: paper.abstract,
      citationCount: paper.citationCount || 0,
      referencesCount: paper.referenceCount || 0,
      references,
      openAccess,
      type: paper.publicationTypes?.[0],
    };
  }

  /**
   * Map publication type to venue type
   */
  private mapPublicationTypeToVenueType(
    type?: string
  ): 'journal' | 'conference' | 'workshop' | 'preprint' | 'book' | 'other' {
    if (!type) return 'other';

    const lowerType = type.toLowerCase();

    if (lowerType.includes('journal')) return 'journal';
    if (lowerType.includes('conference')) return 'conference';
    if (lowerType.includes('workshop')) return 'workshop';
    if (lowerType.includes('book')) return 'book';
    if (lowerType.includes('review')) return 'journal';

    return 'other';
  }

  /**
   * Determine open access status
   */
  private determineOpenAccess(paper: S2Paper): OpenAccess {
    if (!paper.isOpenAccess) {
      return {
        isOA: false,
        oaStatus: 'closed',
      };
    }

    return {
      isOA: true,
      oaStatus: paper.openAccessPdf?.url ? 'green' : 'bronze',
      oaUrl: paper.openAccessPdf?.url,
    };
  }

  /**
   * Get default fields for paper lookup
   */
  private getDefaultFields(): string[] {
    return [
      'title',
      'abstract',
      'venue',
      'year',
      'publicationDate',
      'authors',
      'citationCount',
      'referenceCount',
      'influentialCitationCount',
      'isOpenAccess',
      'openAccessPdf',
      'fieldsOfStudy',
      'publicationTypes',
      'publicationVenue',
      'externalIds',
      'references',
    ];
  }

  /**
   * Get default fields for search
   */
  private getSearchFields(): string[] {
    return [
      'title',
      'authors',
      'venue',
      'year',
      'publicationDate',
      'citationCount',
      'externalIds',
    ];
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
export const semanticScholarClient = new SemanticScholarClient();
