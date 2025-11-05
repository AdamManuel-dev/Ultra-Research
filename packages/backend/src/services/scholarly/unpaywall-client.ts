/**
 * @fileoverview Unpaywall API client for open access metadata
 * @lastmodified 2025-11-05
 *
 * Features: OA status lookup, best OA location, license info
 * Main APIs: lookupDOI, getOALocation
 * Constraints: Polite usage with email required
 * Patterns: Simple REST API, no rate limiting needed
 */

import axios, { AxiosInstance } from 'axios';

import { config } from '../../config';
import { logger } from '../../utils/logger';
import type { OpenAccess } from '../../types/source-profile';

/**
 * Unpaywall OA location
 */
interface UnpaywallOALocation {
  url: string;
  url_for_pdf?: string;
  url_for_landing_page?: string;
  version?: 'submittedVersion' | 'acceptedVersion' | 'publishedVersion';
  license?: string;
  host_type?: 'publisher' | 'repository';
  is_best?: boolean;
}

/**
 * Unpaywall response
 */
interface UnpaywallResponse {
  doi: string;
  doi_url: string;
  title?: string;
  is_oa: boolean;
  oa_status?: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
  best_oa_location?: UnpaywallOALocation;
  oa_locations?: UnpaywallOALocation[];
  oa_locations_embargoed?: UnpaywallOALocation[];
  published_date?: string;
  journal_name?: string;
  journal_issns?: string;
  journal_is_oa?: boolean;
  journal_is_in_doaj?: boolean;
  publisher?: string;
  genre?: string;
  year?: number;
  updated?: string;
}

/**
 * Unpaywall API client
 */
export class UnpaywallClient {
  private client: AxiosInstance;

  private readonly baseURL = 'https://api.unpaywall.org/v2';

  private readonly email: string;

  constructor() {
    this.email = config.unpaywall?.email || 'research@example.com';

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'User-Agent': 'DeepResearchCockpit/1.0',
      },
    });
  }

  /**
   * Look up a DOI and get open access information
   */
  async lookupDOI(doi: string): Promise<{
    isOA: boolean;
    oaStatus: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
    oaUrl?: string;
    pdfUrl?: string;
    license?: string;
    version?: string;
    hostType?: string;
    allLocations: Array<{
      url: string;
      pdfUrl?: string;
      version?: string;
      license?: string;
      hostType?: string;
    }>;
  } | null> {
    try {
      const response = await this.client.get<UnpaywallResponse>(
        `/${encodeURIComponent(doi)}`,
        {
          params: { email: this.email },
        }
      );

      const data = response.data;

      // Parse best OA location
      const bestLocation = data.best_oa_location;

      // Parse all OA locations
      const allLocations = (data.oa_locations || []).map((loc) => ({
        url: loc.url_for_landing_page || loc.url,
        pdfUrl: loc.url_for_pdf,
        version: loc.version,
        license: loc.license,
        hostType: loc.host_type,
      }));

      return {
        isOA: data.is_oa,
        oaStatus: data.oa_status || 'closed',
        oaUrl: bestLocation?.url_for_landing_page || bestLocation?.url,
        pdfUrl: bestLocation?.url_for_pdf,
        license: bestLocation?.license,
        version: bestLocation?.version,
        hostType: bestLocation?.host_type,
        allLocations,
      };
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        logger.debug('DOI not found in Unpaywall', { metadata: { doi } });
        return null;
      }

      logger.error('Unpaywall DOI lookup failed', {
        metadata: {
          doi,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Get best open access location for a DOI
   */
  async getOALocation(doi: string): Promise<{
    url?: string;
    pdfUrl?: string;
    version?: string;
    license?: string;
  } | null> {
    const result = await this.lookupDOI(doi);

    if (!result || !result.isOA) {
      return null;
    }

    return {
      url: result.oaUrl,
      pdfUrl: result.pdfUrl,
      version: result.version,
      license: result.license,
    };
  }

  /**
   * Convert Unpaywall response to our OpenAccess format
   */
  toOpenAccessFormat(unpaywallData: {
    isOA: boolean;
    oaStatus: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
    oaUrl?: string;
    pdfUrl?: string;
    license?: string;
    version?: string;
    hostType?: string;
  }): OpenAccess {
    if (!unpaywallData.isOA) {
      return {
        isOA: false,
        oaStatus: 'closed',
      };
    }

    return {
      isOA: true,
      oaStatus: unpaywallData.oaStatus,
      oaUrl: unpaywallData.oaUrl,
      license: unpaywallData.license,
    };
  }

  /**
   * Batch lookup multiple DOIs
   * Note: Unpaywall doesn't have a native batch endpoint, so we make individual requests
   */
  async batchLookup(
    dois: string[]
  ): Promise<Map<string, {
    isOA: boolean;
    oaStatus: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
    oaUrl?: string;
    pdfUrl?: string;
    license?: string;
  } | null>> {
    const results = new Map<string, {
      isOA: boolean;
      oaStatus: 'gold' | 'green' | 'hybrid' | 'bronze' | 'closed';
      oaUrl?: string;
      pdfUrl?: string;
      license?: string;
    } | null>();

    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < dois.length; i += batchSize) {
      const batch = dois.slice(i, i + batchSize);

      const batchResults = await Promise.allSettled(
        batch.map(async (doi) => {
          const result = await this.lookupDOI(doi);
          return { doi, result };
        })
      );

      for (const promiseResult of batchResults) {
        if (promiseResult.status === 'fulfilled') {
          results.set(promiseResult.value.doi, promiseResult.value.result);
        } else {
          logger.warn('Failed to lookup DOI in batch', {
            metadata: {
              error: promiseResult.reason,
            },
          });
        }
      }

      // Small delay between batches
      if (i + batchSize < dois.length) {
        await this.sleep(1000);
      }
    }

    return results;
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
export const unpaywallClient = new UnpaywallClient();
