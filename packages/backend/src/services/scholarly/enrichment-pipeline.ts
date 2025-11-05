/**
 * @fileoverview Metadata enrichment pipeline for scholarly sources
 * @lastmodified 2025-11-05
 *
 * Features: Parallel API calls, result merging, caching
 * Main APIs: enrichByDOI, enrichByTitle, batchEnrich
 * Constraints: Coordinates rate limits across clients
 * Patterns: Promise.allSettled for parallel calls, Redis caching
 */

// @ts-ignore - Redis types may not be available
// eslint-disable-next-line @typescript-eslint/no-unused-vars
type RedisClientType = any;

import { logger } from '../../utils/logger';
import type {
  PaperSourceProfile,
  Author,
  Citation,
  OpenAccess,
} from '../../types/source-profile';
import { crossrefClient } from './crossref-client';
import { openAlexClient } from './openalex-client';
import { semanticScholarClient } from './semanticscholar-client';
import { unpaywallClient } from './unpaywall-client';

/**
 * Enrichment result with source tracking
 */
interface EnrichmentResult {
  doi?: string;
  title: string;
  authors: Author[];
  venue?: PaperSourceProfile['venue'];
  publishedDate?: string;
  abstract?: string;
  citationCount: number;
  referencesCount: number;
  references: Citation[];
  openAccess: OpenAccess;
  type?: string;
  sources: string[];
}

/**
 * Enrichment options
 */
interface EnrichmentOptions {
  skipCache?: boolean;
  preferredSources?: Array<'crossref' | 'openalex' | 'semanticscholar'>;
  includeReferences?: boolean;
  includeOpenAccess?: boolean;
}

/**
 * Metadata enrichment pipeline
 */
export class EnrichmentPipeline {
  private cacheClient?: RedisClientType;

  private readonly cacheTTL = 7 * 24 * 60 * 60; // 7 days in seconds

  constructor(cacheClient?: RedisClientType) {
    this.cacheClient = cacheClient;
  }

  /**
   * Enrich a paper by DOI
   */
  async enrichByDOI(
    doi: string,
    options: EnrichmentOptions = {}
  ): Promise<PaperSourceProfile | null> {
    const cacheKey = `enrichment:doi:${doi}`;

    // Check cache first
    if (!options.skipCache && this.cacheClient) {
      try {
        const cached = await this.cacheClient.get(cacheKey);
        if (cached) {
          logger.debug('Enrichment cache hit', { metadata: { doi } });
          return JSON.parse(cached) as PaperSourceProfile;
        }
      } catch (error) {
        logger.warn('Cache read failed', {
          metadata: {
            doi,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    // Call all API clients in parallel
    const results = await Promise.allSettled([
      crossrefClient.lookupDOI(doi),
      openAlexClient.lookupDOI(doi),
      semanticScholarClient.lookupDOI(doi),
      options.includeOpenAccess !== false ? unpaywallClient.lookupDOI(doi) : Promise.resolve(null),
    ]);

    // Extract successful results
    const crossrefData = results[0].status === 'fulfilled' ? results[0].value : null;
    const openAlexData = results[1].status === 'fulfilled' ? results[1].value : null;
    const s2Data = results[2].status === 'fulfilled' ? results[2].value : null;
    const unpaywallData = results[3].status === 'fulfilled' ? results[3].value : null;

    // Log any failures
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        const sources = ['crossref', 'openalex', 'semanticscholar', 'unpaywall'];
        logger.warn(`Failed to fetch from ${sources[index]}`, {
          metadata: {
            doi,
            error: result.reason,
          },
        });
      }
    });

    // Merge results
    const merged = this.mergeResults(
      {
        crossref: crossrefData,
        openalex: openAlexData,
        semanticscholar: s2Data,
        unpaywall: unpaywallData,
      },
      options
    );

    if (!merged) {
      logger.info('No metadata found for DOI', { metadata: { doi } });
      return null;
    }

    // Build source profile
    const profile: PaperSourceProfile = {
      type: 'paper',
      url: `https://doi.org/${doi}`,
      doi,
      title: merged.title,
      authors: merged.authors,
      venue: merged.venue || { name: 'Unknown', type: 'other' },
      abstract: merged.abstract,
      publishedDate: merged.publishedDate,
      accessedDate: new Date().toISOString(),
      citationCount: merged.citationCount,
      references: options.includeReferences !== false ? merged.references : undefined,
      openAccess: merged.openAccess,
      peerReviewed: Boolean(merged.venue),
      enrichedAt: new Date().toISOString(),
      enrichmentSources: merged.sources,
    };

    // Cache the result
    if (this.cacheClient) {
      try {
        await this.cacheClient.setEx(cacheKey, this.cacheTTL, JSON.stringify(profile));
      } catch (error) {
        logger.warn('Cache write failed', {
          metadata: {
            doi,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    return profile;
  }

  /**
   * Enrich a paper by title (searches and picks best match)
   */
  async enrichByTitle(
    title: string,
    options: EnrichmentOptions = {}
  ): Promise<PaperSourceProfile | null> {
    // Search all sources in parallel
    const results = await Promise.allSettled([
      crossrefClient.searchWorks(title, 5),
      openAlexClient.searchWorks(title, { perPage: 5, maxResults: 5 }),
      semanticScholarClient.searchPapers(title, { limit: 5 }),
    ]);

    // Extract successful results
    const crossrefResults = results[0].status === 'fulfilled' ? results[0].value : [];
    const openAlexResults =
      results[1].status === 'fulfilled' ? results[1].value.results : [];
    const s2Results = results[2].status === 'fulfilled' ? results[2].value.results : [];

    // Find best match (prioritize exact title match, then highest citation count)
    const allResults = [
      ...crossrefResults.map((r) => ({ ...r, source: 'crossref' })),
      ...openAlexResults.map((r) => ({ ...r, source: 'openalex' })),
      ...s2Results.map((r) => ({ ...r, source: 'semanticscholar', id: r.paperId })),
    ];

    const normalizedTitle = this.normalizeTitle(title);
    const bestMatch = allResults
      .map((result) => ({
        result,
        titleMatch: this.normalizeTitle(result.title) === normalizedTitle,
        citations: result.citationCount || 0,
      }))
      .sort((a, b) => {
        // Exact matches first
        if (a.titleMatch && !b.titleMatch) return -1;
        if (!a.titleMatch && b.titleMatch) return 1;
        // Then by citation count
        return b.citations - a.citations;
      })[0];

    if (!bestMatch) {
      logger.info('No matching papers found for title', { metadata: { title } });
      return null;
    }

    // If we have a DOI, use enrichByDOI for complete data
    if (bestMatch.result.doi) {
      return this.enrichByDOI(bestMatch.result.doi, options);
    }

    // Otherwise, fetch from the source that provided the result
    logger.info('Best match found without DOI, using source data', {
      metadata: {
        title,
        source: bestMatch.result.source,
      },
    });

    // Return a basic profile from search results
    return {
      type: 'paper',
      url: bestMatch.result.doi
        ? `https://doi.org/${bestMatch.result.doi}`
        : '',
      doi: bestMatch.result.doi,
      title: bestMatch.result.title,
      authors: bestMatch.result.authors,
      venue: { name: 'Unknown', type: 'other' },
      publishedDate: bestMatch.result.publishedDate,
      accessedDate: new Date().toISOString(),
      citationCount: bestMatch.result.citationCount,
      openAccess: { isOA: false, oaStatus: 'closed' },
      peerReviewed: false,
      enrichedAt: new Date().toISOString(),
      enrichmentSources: [bestMatch.result.source],
    };
  }

  /**
   * Batch enrich multiple DOIs
   */
  async batchEnrich(
    dois: string[],
    options: EnrichmentOptions = {}
  ): Promise<Map<string, PaperSourceProfile | null>> {
    const results = new Map<string, PaperSourceProfile | null>();

    // Process in batches to manage rate limits
    const batchSize = 5;
    for (let i = 0; i < dois.length; i += batchSize) {
      const batch = dois.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (doi) => {
          const profile = await this.enrichByDOI(doi, options);
          return { doi, profile };
        })
      );

      for (const result of batchResults) {
        if (result.status === 'fulfilled') {
          results.set(result.value.doi, result.value.profile);
        } else {
          logger.warn('Failed to enrich DOI in batch', {
            metadata: {
              error: result.reason,
            },
          });
        }
      }

      // Small delay between batches
      if (i + batchSize < dois.length) {
        await this.sleep(500);
      }
    }

    return results;
  }

  /**
   * Merge results from multiple sources
   */
  private mergeResults(
    data: {
      crossref: any;
      openalex: any;
      semanticscholar: any;
      unpaywall: any;
    },
    options: EnrichmentOptions
  ): EnrichmentResult | null {
    const { crossref, openalex, semanticscholar, unpaywall } = data;

    // Determine which sources provided data
    const availableSources: string[] = [];
    if (crossref) availableSources.push('crossref');
    if (openalex) availableSources.push('openalex');
    if (semanticscholar) availableSources.push('semanticscholar');
    if (unpaywall) availableSources.push('unpaywall');

    if (availableSources.length === 0) {
      return null;
    }

    // Priority order for different fields (can be customized via options)
    const preferredSources = options.preferredSources || [
      'crossref',
      'openalex',
      'semanticscholar',
    ];

    // Pick best value for each field
    const pickBest = (field: string): any => {
      for (const source of preferredSources) {
        const value = data[source as keyof typeof data]?.[field];
        if (value !== undefined && value !== null) {
          return value;
        }
      }
      return undefined;
    };

    // Merge authors (combine all unique authors)
    const allAuthors: Author[] = [
      ...(crossref?.authors || []),
      ...(openalex?.authors || []),
      ...(semanticscholar?.authors || []),
    ];

    const uniqueAuthors = this.deduplicateAuthors(allAuthors);

    // Pick highest citation count
    const citationCount = Math.max(
      crossref?.citationCount || 0,
      openalex?.citationCount || 0,
      semanticscholar?.citationCount || 0
    );

    // Merge open access info (prefer Unpaywall, then others)
    const openAccess: OpenAccess = unpaywall
      ? unpaywallClient.toOpenAccessFormat(unpaywall)
      : pickBest('openAccess') || { isOA: false, oaStatus: 'closed' };

    // Merge references (combine all unique references)
    const allReferences: Citation[] = [
      ...(crossref?.references || []),
      ...(openalex?.references || []),
      ...(semanticscholar?.references || []),
    ];

    const uniqueReferences = this.deduplicateReferences(allReferences);

    return {
      title: pickBest('title'),
      authors: uniqueAuthors,
      venue: pickBest('venue'),
      publishedDate: pickBest('publishedDate'),
      abstract: pickBest('abstract'),
      citationCount,
      referencesCount: pickBest('referencesCount') || uniqueReferences.length,
      references: uniqueReferences,
      openAccess,
      type: pickBest('type'),
      sources: availableSources,
    };
  }

  /**
   * Deduplicate authors by name
   */
  private deduplicateAuthors(authors: Author[]): Author[] {
    const seen = new Map<string, Author>();

    for (const author of authors) {
      const key = this.normalizeAuthorName(author.name);
      if (!seen.has(key)) {
        seen.set(key, author);
      } else {
        // Merge additional info if available
        const existing = seen.get(key)!;
        if (!existing.orcid && author.orcid) {
          existing.orcid = author.orcid;
        }
        if (!existing.affiliation && author.affiliation) {
          existing.affiliation = author.affiliation;
        }
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Deduplicate references by DOI or title
   */
  private deduplicateReferences(references: Citation[]): Citation[] {
    const seen = new Map<string, Citation>();

    for (const ref of references) {
      const key = ref.doi || (ref.title ? this.normalizeTitle(ref.title) : '');
      if (key && !seen.has(key)) {
        seen.set(key, ref);
      }
    }

    return Array.from(seen.values());
  }

  /**
   * Normalize title for comparison
   */
  private normalizeTitle(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  /**
   * Normalize author name for comparison
   */
  private normalizeAuthorName(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^\w\s]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
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

// Factory function to create enrichment pipeline with cache
export function createEnrichmentPipeline(
  cacheClient?: RedisClientType
): EnrichmentPipeline {
  return new EnrichmentPipeline(cacheClient);
}
