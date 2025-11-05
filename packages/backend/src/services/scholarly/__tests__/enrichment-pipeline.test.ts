/**
 * @fileoverview Tests for metadata enrichment pipeline
 * @lastmodified 2025-11-05
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';

import { EnrichmentPipeline } from '../enrichment-pipeline';
import type { Author, OpenAccess } from '../../../types/source-profile';

// Mock all API clients
vi.mock('../crossref-client', () => ({
  crossrefClient: {
    lookupDOI: vi.fn(),
    searchWorks: vi.fn(),
  },
}));

vi.mock('../openalex-client', () => ({
  openAlexClient: {
    lookupDOI: vi.fn(),
    searchWorks: vi.fn(),
  },
}));

vi.mock('../semanticscholar-client', () => ({
  semanticScholarClient: {
    lookupDOI: vi.fn(),
    searchPapers: vi.fn(),
  },
}));

vi.mock('../unpaywall-client', () => ({
  unpaywallClient: {
    lookupDOI: vi.fn(),
    toOpenAccessFormat: vi.fn((data) => ({
      isOA: data.isOA,
      oaStatus: data.oaStatus,
      oaUrl: data.oaUrl,
      license: data.license,
    })),
  },
}));

describe('EnrichmentPipeline', () => {
  let pipeline: EnrichmentPipeline;

  beforeEach(() => {
    vi.clearAllMocks();
    pipeline = new EnrichmentPipeline();
  });

  describe('enrichByDOI', () => {
    it('should merge results from multiple sources', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');
      const { unpaywallClient } = await import('../unpaywall-client');

      // Mock responses from different sources
      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper from Crossref',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 100,
        referencesCount: 50,
        references: [{ doi: '10.1234/ref1', title: 'Reference 1' }],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper from OpenAlex',
        authors: [{ name: 'Alice Smith', orcid: 'https://orcid.org/0000-0000-0000-0000' }],
        venue: {
          name: 'Nature',
          type: 'journal',
        },
        publishedDate: '2024-01-01',
        abstract: 'This is a test abstract',
        citationCount: 120,
        referencesCount: 50,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper from S2',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 110,
        referencesCount: 50,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(unpaywallClient.lookupDOI).mockResolvedValue({
        isOA: true,
        oaStatus: 'green',
        oaUrl: 'https://arxiv.org/pdf/test.pdf',
        license: 'CC-BY-4.0',
        allLocations: [],
      });

      const result = await pipeline.enrichByDOI('10.1234/test');

      expect(result).toBeDefined();
      expect(result?.type).toBe('paper');
      expect(result?.doi).toBe('10.1234/test');

      // Should use Crossref title (first in preferred sources)
      expect(result?.title).toBe('Test Paper from Crossref');

      // Should merge authors with ORCID from OpenAlex
      expect(result?.authors).toHaveLength(1);
      expect(result?.authors[0]?.orcid).toBe('https://orcid.org/0000-0000-0000-0000');

      // Should use OpenAlex venue
      expect(result?.venue?.name).toBe('Nature');

      // Should use OpenAlex abstract
      expect(result?.abstract).toBe('This is a test abstract');

      // Should use highest citation count
      expect(result?.citationCount).toBe(120);

      // Should use Unpaywall for open access
      expect(result?.openAccess.isOA).toBe(true);
      expect(result?.openAccess.oaStatus).toBe('green');

      // Should track all sources
      expect(result?.enrichmentSources).toContain('crossref');
      expect(result?.enrichmentSources).toContain('openalex');
      expect(result?.enrichmentSources).toContain('semanticscholar');
      expect(result?.enrichmentSources).toContain('unpaywall');
    });

    it('should handle partial failures gracefully', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');
      const { unpaywallClient } = await import('../unpaywall-client');

      // Crossref succeeds
      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 100,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      // OpenAlex fails
      vi.mocked(openAlexClient.lookupDOI).mockRejectedValue(
        new Error('OpenAlex API error')
      );

      // S2 succeeds
      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [{ name: 'Alice Smith' }],
        abstract: 'Abstract from S2',
        citationCount: 110,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      // Unpaywall fails
      vi.mocked(unpaywallClient.lookupDOI).mockRejectedValue(
        new Error('Unpaywall API error')
      );

      const result = await pipeline.enrichByDOI('10.1234/test');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Paper');
      expect(result?.abstract).toBe('Abstract from S2');
      expect(result?.enrichmentSources).toHaveLength(2);
      expect(result?.enrichmentSources).toContain('crossref');
      expect(result?.enrichmentSources).toContain('semanticscholar');
    });

    it('should return null when all sources fail', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');
      const { unpaywallClient } = await import('../unpaywall-client');

      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue(null);
      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue(null);
      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue(null);
      vi.mocked(unpaywallClient.lookupDOI).mockResolvedValue(null);

      const result = await pipeline.enrichByDOI('10.1234/nonexistent');

      expect(result).toBeNull();
    });

    it('should deduplicate authors by name', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');

      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [
          { name: 'Alice Smith' },
          { name: 'Bob Jones' },
        ],
        citationCount: 100,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [
          { name: 'Alice Smith', orcid: 'https://orcid.org/0000-0000-0000-0001' },
          { name: 'Bob Jones', affiliation: 'MIT' },
          { name: 'Charlie Brown' },
        ],
        citationCount: 100,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 100,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      const result = await pipeline.enrichByDOI('10.1234/test');

      expect(result?.authors).toHaveLength(3);

      // Alice should have ORCID from OpenAlex
      const alice = result?.authors.find((a) => a.name === 'Alice Smith');
      expect(alice?.orcid).toBe('https://orcid.org/0000-0000-0000-0001');

      // Bob should have affiliation from OpenAlex
      const bob = result?.authors.find((a) => a.name === 'Bob Jones');
      expect(bob?.affiliation).toBe('MIT');

      // Charlie should be included
      expect(result?.authors.find((a) => a.name === 'Charlie Brown')).toBeDefined();
    });

    it('should deduplicate references by DOI', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');

      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [],
        citationCount: 0,
        referencesCount: 2,
        references: [
          { doi: '10.1234/ref1', title: 'Reference 1' },
          { doi: '10.1234/ref2', title: 'Reference 2' },
        ],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [],
        citationCount: 0,
        referencesCount: 3,
        references: [
          { doi: '10.1234/ref1', title: 'Reference 1' }, // Duplicate
          { doi: '10.1234/ref3', title: 'Reference 3' }, // New
        ],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue({
        title: 'Test Paper',
        authors: [],
        citationCount: 0,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      const result = await pipeline.enrichByDOI('10.1234/test', {
        includeReferences: true,
      });

      expect(result?.references).toHaveLength(3);
      expect(result?.references?.map((r) => r.doi)).toContain('10.1234/ref1');
      expect(result?.references?.map((r) => r.doi)).toContain('10.1234/ref2');
      expect(result?.references?.map((r) => r.doi)).toContain('10.1234/ref3');
    });
  });

  describe('enrichByTitle', () => {
    it('should find best match and enrich', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');

      // Mock search results
      vi.mocked(crossrefClient.searchWorks).mockResolvedValue([
        {
          doi: '10.1234/match',
          title: 'Machine Learning in Healthcare',
          authors: [{ name: 'Alice Smith' }],
          citationCount: 100,
        },
      ]);

      vi.mocked(openAlexClient.searchWorks).mockResolvedValue({
        results: [
          {
            id: 'W123',
            doi: '10.1234/match',
            title: 'Machine Learning in Healthcare',
            authors: [{ name: 'Alice Smith' }],
            citationCount: 120,
          },
        ],
        totalCount: 1,
      });

      vi.mocked(semanticScholarClient.searchPapers).mockResolvedValue({
        results: [
          {
            paperId: 'abc123',
            doi: '10.1234/match',
            title: 'Machine Learning in Healthcare',
            authors: [{ name: 'Alice Smith' }],
            citationCount: 110,
          },
        ],
        total: 1,
        offset: 0,
        hasMore: false,
      });

      // Mock DOI lookup for the matched paper
      vi.mocked(crossrefClient.lookupDOI).mockResolvedValue({
        title: 'Machine Learning in Healthcare',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 100,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue({
        title: 'Machine Learning in Healthcare',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 120,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue({
        title: 'Machine Learning in Healthcare',
        authors: [{ name: 'Alice Smith' }],
        citationCount: 110,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      });

      const result = await pipeline.enrichByTitle('Machine Learning in Healthcare');

      expect(result).toBeDefined();
      expect(result?.doi).toBe('10.1234/match');
      expect(result?.title).toBe('Machine Learning in Healthcare');
    });

    it('should return null when no matches found', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');

      vi.mocked(crossrefClient.searchWorks).mockResolvedValue([]);
      vi.mocked(openAlexClient.searchWorks).mockResolvedValue({
        results: [],
        totalCount: 0,
      });
      vi.mocked(semanticScholarClient.searchPapers).mockResolvedValue({
        results: [],
        total: 0,
        offset: 0,
        hasMore: false,
      });

      const result = await pipeline.enrichByTitle('Nonexistent Paper Title');

      expect(result).toBeNull();
    });
  });

  describe('batchEnrich', () => {
    it('should enrich multiple DOIs', async () => {
      const { crossrefClient } = await import('../crossref-client');
      const { openAlexClient } = await import('../openalex-client');
      const { semanticScholarClient } = await import('../semanticscholar-client');

      vi.mocked(crossrefClient.lookupDOI).mockImplementation(async (doi: string) => ({
        title: `Paper ${doi}`,
        authors: [{ name: 'Test Author' }],
        citationCount: 10,
        referencesCount: 0,
        references: [],
        openAccess: { isOA: false, oaStatus: 'closed' },
      }));

      vi.mocked(openAlexClient.lookupDOI).mockResolvedValue(null);
      vi.mocked(semanticScholarClient.lookupDOI).mockResolvedValue(null);

      const dois = ['10.1234/test1', '10.1234/test2', '10.1234/test3'];
      const results = await pipeline.batchEnrich(dois);

      expect(results.size).toBe(3);
      expect(results.get('10.1234/test1')?.title).toBe('Paper 10.1234/test1');
      expect(results.get('10.1234/test2')?.title).toBe('Paper 10.1234/test2');
      expect(results.get('10.1234/test3')?.title).toBe('Paper 10.1234/test3');
    });
  });
});
