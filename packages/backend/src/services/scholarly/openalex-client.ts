/**
 * @fileoverview OpenAlex API client for scholarly metadata
 * @lastmodified 2025-11-05
 *
 * Features: Work lookup, author search, cursor pagination, rate limiting
 * Main APIs: lookupDOI, getWork, searchWorks, getAuthor
 * Constraints: 10 req/s polite API, 100k req/day
 * Patterns: Cursor-based pagination, rate limiting with bottleneck
 */

import axios, { AxiosInstance } from 'axios';
import Bottleneck from 'bottleneck';

import { config } from '../../config';
import { logger } from '../../utils/logger';
import type { Author, Citation, Venue, OpenAccess } from '../../types/source-profile';

/**
 * OpenAlex work response
 */
interface OpenAlexWork {
  id: string;
  doi?: string;
  title?: string;
  display_name?: string;
  authorships?: Array<{
    author: {
      id: string;
      display_name: string;
      orcid?: string;
    };
    institutions?: Array<{
      id: string;
      display_name: string;
    }>;
  }>;
  host_venue?: {
    id?: string;
    display_name?: string;
    type?: string;
    issn?: string[];
    publisher?: string;
  };
  publication_date?: string;
  abstract_inverted_index?: Record<string, number[]>;
  type?: string;
  cited_by_count?: number;
  referenced_works_count?: number;
  referenced_works?: string[];
  open_access?: {
    is_oa: boolean;
    oa_status: string;
    oa_url?: string;
    any_repository_has_fulltext?: boolean;
  };
  primary_location?: {
    source?: {
      display_name?: string;
      type?: string;
    };
    license?: string;
    version?: string;
  };
  biblio?: {
    volume?: string;
    issue?: string;
    first_page?: string;
    last_page?: string;
  };
  is_retracted?: boolean;
  is_paratext?: boolean;
}

/**
 * OpenAlex search response with cursor pagination
 */
interface OpenAlexSearchResponse {
  meta: {
    count: number;
    db_response_time_ms: number;
    page: number;
    per_page: number;
    next_cursor?: string;
  };
  results: OpenAlexWork[];
}

/**
 * OpenAlex author response
 */
interface OpenAlexAuthor {
  id: string;
  display_name: string;
  orcid?: string;
  works_count?: number;
  cited_by_count?: number;
  h_index?: number;
  affiliations?: Array<{
    institution: {
      id: string;
      display_name: string;
    };
  }>;
}

/**
 * Pagination options for OpenAlex queries
 */
interface PaginationOptions {
  perPage?: number;
  cursor?: string;
  maxResults?: number;
}

/**
 * OpenAlex API client
 */
export class OpenAlexClient {
  private client: AxiosInstance;

  private limiter: Bottleneck;

  private readonly baseURL = 'https://api.openalex.org';

  private readonly politeEmail: string;

  constructor() {
    this.politeEmail = config.openAlex?.politeEmail || 'research@example.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 15000,
      headers: {
        'User-Agent': `DeepResearchCockpit/1.0 (mailto:${this.politeEmail})`,
      },
    });

    // Rate limiter: 10 requests per second (polite API limit)
    this.limiter = new Bottleneck({
      maxConcurrent: 5,
      minTime: 100, // 10 req/s = 1000ms / 10 = 100ms between requests
      reservoir: 10,
      reservoirRefreshAmount: 10,
      reservoirRefreshInterval: 1000,
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = error.response.headers['retry-after'] || 60;
          logger.warn('OpenAlex rate limit hit, waiting', {
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
      // OpenAlex uses DOI URLs as work IDs
      const doiUrl = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
      const response = await this.limiter.schedule(() =>
        this.client.get<OpenAlexWork>(`/works/${encodeURIComponent(doiUrl)}`)
      );

      return this.parseWork(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('DOI not found in OpenAlex', { metadata: { doi } });
        return null;
      }

      logger.error('OpenAlex DOI lookup failed', {
        metadata: {
          doi,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get a work by OpenAlex ID
   */
  async getWork(workId: string): Promise<{
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
        this.client.get<OpenAlexWork>(`/works/${workId}`)
      );

      return this.parseWork(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('Work not found in OpenAlex', { metadata: { workId } });
        return null;
      }

      logger.error('OpenAlex work lookup failed', {
        metadata: {
          workId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Search for works with cursor pagination
   */
  async searchWorks(
    query: string,
    options: PaginationOptions = {}
  ): Promise<{
    results: Array<{
      id: string;
      doi?: string;
      title: string;
      authors: Author[];
      publishedDate?: string;
      citationCount: number;
    }>;
    nextCursor?: string;
    totalCount: number;
  }> {
    try {
      const { perPage = 25, cursor, maxResults } = options;

      const params: Record<string, string | number> = {
        search: query,
        per_page: perPage,
      };

      if (cursor) {
        params['cursor'] = cursor;
      }

      const response = await this.limiter.schedule(() =>
        this.client.get<OpenAlexSearchResponse>('/works', { params })
      );

      const results = response.data.results
        .map((work: OpenAlexWork) => {
          const parsed = this.parseWork(work);
          if (!parsed) return null;

          return {
            id: work.id,
            doi: work.doi,
            title: parsed.title,
            authors: parsed.authors,
            publishedDate: parsed.publishedDate,
            citationCount: parsed.citationCount,
          };
        })
        .filter((item: any): item is NonNullable<typeof item> => item !== null);

      // Apply max results if specified
      const limitedResults =
        maxResults && results.length > maxResults ? results.slice(0, maxResults) : results;

      return {
        results: limitedResults,
        nextCursor: response.data.meta.next_cursor,
        totalCount: response.data.meta.count,
      };
    } catch (error) {
      logger.error('OpenAlex search failed', {
        metadata: {
          query,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Search for works with automatic pagination (fetches all pages)
   */
  async searchWorksAll(
    query: string,
    maxResults: number = 100
  ): Promise<
    Array<{
      id: string;
      doi?: string;
      title: string;
      authors: Author[];
      publishedDate?: string;
      citationCount: number;
    }>
  > {
    const allResults: Array<{
      id: string;
      doi?: string;
      title: string;
      authors: Author[];
      publishedDate?: string;
      citationCount: number;
    }> = [];

    let cursor: string | undefined;
    let fetchedCount = 0;

    while (fetchedCount < maxResults) {
      const remaining = maxResults - fetchedCount;
      const perPage = Math.min(25, remaining);

      const response = await this.searchWorks(query, { perPage, cursor });

      allResults.push(...response.results);
      fetchedCount += response.results.length;

      if (!response.nextCursor || response.results.length === 0) {
        break;
      }

      cursor = response.nextCursor;
    }

    return allResults.slice(0, maxResults);
  }

  /**
   * Get author information
   */
  async getAuthor(authorId: string): Promise<{
    name: string;
    orcid?: string;
    worksCount: number;
    citationCount: number;
    hIndex: number;
    affiliations: string[];
  } | null> {
    try {
      const response = await this.limiter.schedule(() =>
        this.client.get<OpenAlexAuthor>(`/authors/${authorId}`)
      );

      const author = response.data;

      return {
        name: author.display_name,
        orcid: author.orcid,
        worksCount: author.works_count || 0,
        citationCount: author.cited_by_count || 0,
        hIndex: author.h_index || 0,
        affiliations:
          author.affiliations?.map((aff: { institution: { id: string; display_name: string } }) => aff.institution.display_name).filter(Boolean) || [],
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('Author not found in OpenAlex', { metadata: { authorId } });
        return null;
      }

      logger.error('OpenAlex author lookup failed', {
        metadata: {
          authorId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get references for a work
   */
  async getReferences(workId: string): Promise<Citation[]> {
    const metadata = await this.getWork(workId);
    return metadata?.references || [];
  }

  /**
   * Parse an OpenAlex work into our format
   */
  private parseWork(work: OpenAlexWork): {
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
    const title = work.title || work.display_name;
    if (!title) {
      return null;
    }

    // Parse authors
    const authors: Author[] = (work.authorships || []).map((authorship) => ({
      name: authorship.author.display_name,
      orcid: authorship.author.orcid,
      affiliation: authorship.institutions?.[0]?.display_name,
    }));

    // Parse venue
    const venue: Venue | undefined = work.host_venue?.display_name
      ? {
          name: work.host_venue.display_name,
          type: this.mapOpenAlexTypeToVenueType(work.host_venue.type),
          issn: work.host_venue.issn?.[0],
          publisher: work.host_venue.publisher,
        }
      : undefined;

    // Parse abstract from inverted index
    const abstract = work.abstract_inverted_index
      ? this.reconstructAbstract(work.abstract_inverted_index)
      : undefined;

    // Parse references (OpenAlex provides work IDs, not full citations)
    const references: Citation[] = (work.referenced_works || []).map((refId) => ({
      title: undefined, // Would need additional API calls to get full citation
      url: refId,
    }));

    // Determine open access
    const openAccess: OpenAccess = this.determineOpenAccess(work);

    return {
      title,
      authors,
      venue,
      publishedDate: work.publication_date,
      abstract,
      citationCount: work.cited_by_count || 0,
      referencesCount: work.referenced_works_count || 0,
      references,
      openAccess,
      type: work.type,
    };
  }

  /**
   * Reconstruct abstract from inverted index
   */
  private reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    const words: Array<{ word: string; position: number }> = [];

    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push({ word, position: pos });
      }
    }

    words.sort((a, b) => a.position - b.position);
    return words.map((w) => w.word).join(' ');
  }

  /**
   * Map OpenAlex type to venue type
   */
  private mapOpenAlexTypeToVenueType(
    type?: string
  ): 'journal' | 'conference' | 'workshop' | 'preprint' | 'book' | 'other' {
    if (!type) return 'other';

    if (type === 'journal') return 'journal';
    if (type === 'conference') return 'conference';
    if (type === 'repository') return 'preprint';
    if (type === 'book') return 'book';

    return 'other';
  }

  /**
   * Determine open access status
   */
  private determineOpenAccess(work: OpenAlexWork): OpenAccess {
    if (!work.open_access?.is_oa) {
      return {
        isOA: false,
        oaStatus: 'closed',
      };
    }

    const oaStatus = work.open_access.oa_status || 'bronze';

    return {
      isOA: true,
      oaStatus: oaStatus as 'gold' | 'green' | 'hybrid' | 'bronze',
      oaUrl: work.open_access.oa_url,
      license: work.primary_location?.license,
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
export const openAlexClient = new OpenAlexClient();
