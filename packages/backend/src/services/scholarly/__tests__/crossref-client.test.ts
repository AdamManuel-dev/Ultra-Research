/**
 * @fileoverview Tests for Crossref API client
 * @lastmodified 2025-11-05
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

import { CrossrefClient } from '../crossref-client';

vi.mock('axios');
vi.mock('../../../config', () => ({
  config: {
    crossref: {
      politeEmail: 'test@example.com',
    },
  },
}));

describe('CrossrefClient', () => {
  let client: CrossrefClient;
  const mockedAxios = vi.mocked(axios, true);

  beforeEach(() => {
    vi.clearAllMocks();
    mockedAxios.create.mockReturnValue({
      get: vi.fn(),
      interceptors: {
        response: {
          use: vi.fn(),
        },
      },
    } as any);
    client = new CrossrefClient();
  });

  describe('lookupDOI', () => {
    it('should return metadata for a valid DOI', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        author: [
          {
            given: 'John',
            family: 'Doe',
            ORCID: 'https://orcid.org/0000-0000-0000-0000',
          },
        ],
        'container-title': ['Test Journal'],
        publisher: 'Test Publisher',
        'published-print': {
          'date-parts': [[2024, 1, 1]],
        },
        abstract: 'This is a test abstract',
        type: 'journal-article',
        'is-referenced-by-count': 100,
        'references-count': 50,
        reference: [
          {
            DOI: '10.1234/ref1',
            'article-title': 'Reference 1',
          },
        ],
        license: [
          {
            URL: 'https://creativecommons.org/licenses/by/4.0/',
            'content-version': 'vor',
            'delay-in-days': 0,
          },
        ],
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result).toBeDefined();
      expect(result?.title).toBe('Test Paper');
      expect(result?.authors).toHaveLength(1);
      expect(result?.authors[0]?.name).toBe('John Doe');
      expect(result?.citationCount).toBe(100);
      expect(result?.openAccess.isOA).toBe(true);
      expect(result?.openAccess.oaStatus).toBe('gold');
    });

    it('should return null for non-existent DOI', async () => {
      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockRejectedValue({
        isAxiosError: true,
        response: { status: 404 },
      });

      mockedAxios.isAxiosError = vi.fn().mockReturnValue(true);

      const result = await client.lookupDOI('10.1234/nonexistent');

      expect(result).toBeNull();
    });

    it('should parse venue information correctly', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'container-title': ['Nature'],
        ISSN: ['1234-5678'],
        publisher: 'Nature Publishing Group',
        type: 'journal-article',
        'is-referenced-by-count': 0,
        'references-count': 0,
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result?.venue).toBeDefined();
      expect(result?.venue?.name).toBe('Nature');
      expect(result?.venue?.type).toBe('journal');
      expect(result?.venue?.issn).toBe('1234-5678');
      expect(result?.venue?.publisher).toBe('Nature Publishing Group');
    });
  });

  describe('searchWorks', () => {
    it('should return search results', async () => {
      const mockResponse = {
        status: 'ok',
        'message-type': 'work-list',
        'message-version': '1.0.0',
        message: {
          'total-results': 100,
          items: [
            {
              DOI: '10.1234/result1',
              title: ['First Result'],
              author: [{ given: 'Alice', family: 'Smith' }],
              'published-print': {
                'date-parts': [[2024, 1, 1]],
              },
              'is-referenced-by-count': 50,
            },
            {
              DOI: '10.1234/result2',
              title: ['Second Result'],
              author: [{ given: 'Bob', family: 'Jones' }],
              'published-print': {
                'date-parts': [[2024, 2, 1]],
              },
              'is-referenced-by-count': 25,
            },
          ],
        },
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: mockResponse,
      });

      const results = await client.searchWorks('machine learning', 10);

      expect(results).toHaveLength(2);
      expect(results[0]?.doi).toBe('10.1234/result1');
      expect(results[0]?.title).toBe('First Result');
      expect(results[0]?.citationCount).toBe(50);
    });

    it('should filter out results without titles', async () => {
      const mockResponse = {
        status: 'ok',
        'message-type': 'work-list',
        'message-version': '1.0.0',
        message: {
          'total-results': 2,
          items: [
            {
              DOI: '10.1234/result1',
              title: ['Valid Result'],
              author: [],
              'is-referenced-by-count': 10,
            },
            {
              DOI: '10.1234/result2',
              // No title
              author: [],
              'is-referenced-by-count': 5,
            },
          ],
        },
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: mockResponse,
      });

      const results = await client.searchWorks('test query', 10);

      expect(results).toHaveLength(1);
      expect(results[0]?.doi).toBe('10.1234/result1');
    });
  });

  describe('getReferences', () => {
    it('should return references for a DOI', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'is-referenced-by-count': 0,
        'references-count': 2,
        reference: [
          {
            DOI: '10.1234/ref1',
            'article-title': 'Reference 1',
            author: 'Smith, J.',
            year: '2023',
          },
          {
            DOI: '10.1234/ref2',
            'article-title': 'Reference 2',
            author: 'Jones, B.',
            year: '2022',
          },
        ],
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const references = await client.getReferences('10.1234/test');

      expect(references).toHaveLength(2);
      expect(references[0]?.doi).toBe('10.1234/ref1');
      expect(references[0]?.title).toBe('Reference 1');
      expect(references[0]?.year).toBe(2023);
    });
  });

  describe('open access detection', () => {
    it('should detect gold open access', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'is-referenced-by-count': 0,
        'references-count': 0,
        license: [
          {
            URL: 'https://creativecommons.org/licenses/by/4.0/',
            'content-version': 'vor',
            'delay-in-days': 0,
          },
        ],
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result?.openAccess.isOA).toBe(true);
      expect(result?.openAccess.oaStatus).toBe('gold');
      expect(result?.openAccess.license).toBe(
        'https://creativecommons.org/licenses/by/4.0/'
      );
    });

    it('should detect hybrid open access', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'is-referenced-by-count': 0,
        'references-count': 0,
        license: [
          {
            URL: 'https://creativecommons.org/licenses/by/4.0/',
            'content-version': 'vor',
            'delay-in-days': 365,
          },
        ],
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result?.openAccess.isOA).toBe(true);
      expect(result?.openAccess.oaStatus).toBe('hybrid');
    });

    it('should detect bronze open access', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'is-referenced-by-count': 0,
        'references-count': 0,
        link: [
          {
            URL: 'https://example.com/fulltext',
            'content-type': 'application/pdf',
            'content-version': 'vor',
            'intended-application': 'text-mining',
          },
        ],
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result?.openAccess.isOA).toBe(true);
      expect(result?.openAccess.oaStatus).toBe('bronze');
    });

    it('should detect closed access', async () => {
      const mockWork = {
        DOI: '10.1234/test',
        title: ['Test Paper'],
        'is-referenced-by-count': 0,
        'references-count': 0,
      };

      const axiosInstance = mockedAxios.create();
      vi.mocked(axiosInstance.get).mockResolvedValue({
        data: {
          message: mockWork,
        },
      });

      const result = await client.lookupDOI('10.1234/test');

      expect(result?.openAccess.isOA).toBe(false);
      expect(result?.openAccess.oaStatus).toBe('closed');
    });
  });
});
