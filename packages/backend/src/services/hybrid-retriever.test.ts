/**
 * @fileoverview Tests for hybrid retriever
 * @lastmodified 2025-11-05
 */

import { Client } from '@opensearch-project/opensearch';

import { HybridRetriever, SearchResult, SearchOptions } from './hybrid-retriever';
import { embeddingsService } from './embeddings';

// Mock OpenSearch client
jest.mock('@opensearch-project/opensearch');

// Mock embeddings service
jest.mock('./embeddings', () => ({
  embeddingsService: {
    generateEmbedding: jest.fn(),
  },
}));

describe('HybridRetriever', () => {
  let retriever: HybridRetriever;
  let mockClient: jest.Mocked<Client>;

  const mockEmbedding = new Array(1536).fill(0.1);

  beforeEach(() => {
    jest.clearAllMocks();

    retriever = new HybridRetriever();
    mockClient = (retriever as any).client as jest.Mocked<Client>;

    // Mock embeddings service
    (embeddingsService.generateEmbedding as jest.Mock).mockResolvedValue({
      vector: mockEmbedding,
      model: 'test',
      dimensions: 1536,
      cached: false,
    });

    // Setup default search mock
    mockClient.search = jest.fn().mockResolvedValue({
      body: {
        hits: {
          hits: [],
        },
      },
    });

    mockClient.get = jest.fn().mockResolvedValue({
      body: {
        _source: {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          text: 'Test content',
          embedding: mockEmbedding,
          chunk_index: 0,
          metadata: {},
        },
      },
    });
  });

  describe('search', () => {
    it('should perform hybrid search with default options', async () => {
      // Mock BM25 results
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: { chunk_id: 'chunk-1' },
                  _score: 10.5,
                },
                {
                  _source: { chunk_id: 'chunk-2' },
                  _score: 8.3,
                },
              ],
            },
          },
        })
        // Mock vector results
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: { chunk_id: 'chunk-2' },
                  _score: 0.95,
                },
                {
                  _source: { chunk_id: 'chunk-3' },
                  _score: 0.89,
                },
              ],
            },
          },
        })
        // Mock fetch chunks
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-2',
                    document_id: 'doc-1',
                    text: 'Test content 2',
                    chunk_index: 1,
                    metadata: {
                      url: 'https://example.com',
                      title: 'Test Article',
                    },
                  },
                },
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Test content 1',
                    chunk_index: 0,
                    metadata: {
                      url: 'https://example.com',
                      title: 'Test Article',
                    },
                  },
                },
              ],
            },
          },
        });

      const response = await retriever.search('test query');

      expect(response.results.length).toBeGreaterThan(0);
      expect(response.searchMethod).toBe('hybrid');
      expect(response.total).toBeGreaterThan(0);
      expect(response.duration_ms).toBeGreaterThan(0);

      expect(embeddingsService.generateEmbedding).toHaveBeenCalledWith('test query');
      expect(mockClient.search).toHaveBeenCalledTimes(3);
    });

    it('should perform pure BM25 search when hybridWeight is 0', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: { chunk_id: 'chunk-1' },
                  _score: 10.5,
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Test content',
                    chunk_index: 0,
                    metadata: {
                      url: 'https://example.com',
                      title: 'Test',
                    },
                  },
                },
              ],
            },
          },
        });

      const options: SearchOptions = {
        hybridWeight: 0.0,
      };

      const response = await retriever.search('test query', options);

      expect(response.searchMethod).toBe('bm25');
      expect(embeddingsService.generateEmbedding).not.toHaveBeenCalled();
    });

    it('should perform pure vector search when hybridWeight is 1', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: { chunk_id: 'chunk-1' },
                  _score: 0.95,
                },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Test content',
                    chunk_index: 0,
                    metadata: {
                      url: 'https://example.com',
                      title: 'Test',
                    },
                  },
                },
              ],
            },
          },
        });

      const options: SearchOptions = {
        hybridWeight: 1.0,
      };

      const response = await retriever.search('test query', options);

      expect(response.searchMethod).toBe('vector');
      expect(embeddingsService.generateEmbedding).toHaveBeenCalledWith('test query');
    });

    it('should respect size option', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: Array(20).fill(null).map((_, i) => ({
                _source: { chunk_id: `chunk-${i}` },
                _score: 10 - i,
              })),
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: Array(20).fill(null).map((_, i) => ({
                _source: { chunk_id: `chunk-${i}` },
                _score: 0.9 - i * 0.01,
              })),
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: Array(5).fill(null).map((_, i) => ({
                _source: {
                  chunk_id: `chunk-${i}`,
                  document_id: 'doc-1',
                  text: `Content ${i}`,
                  chunk_index: i,
                  metadata: {
                    url: 'https://example.com',
                    title: 'Test',
                  },
                },
              })),
            },
          },
        });

      const options: SearchOptions = {
        size: 5,
      };

      const response = await retriever.search('test query', options);

      expect(response.results.length).toBeLessThanOrEqual(5);
    });

    it('should filter results by minScore', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                { _source: { chunk_id: 'chunk-1' }, _score: 10 },
                { _source: { chunk_id: 'chunk-2' }, _score: 5 },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                { _source: { chunk_id: 'chunk-1' }, _score: 0.9 },
              ],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Content 1',
                    chunk_index: 0,
                    metadata: { url: 'https://example.com', title: 'Test' },
                  },
                },
                {
                  _source: {
                    chunk_id: 'chunk-2',
                    document_id: 'doc-1',
                    text: 'Content 2',
                    chunk_index: 1,
                    metadata: { url: 'https://example.com', title: 'Test' },
                  },
                },
              ],
            },
          },
        });

      const options: SearchOptions = {
        minScore: 0.5,
      };

      const response = await retriever.search('test query', options);

      // All results should have score >= minScore
      response.results.forEach((result) => {
        expect(result.score).toBeGreaterThanOrEqual(0.5);
      });
    });

    it('should include highlights when requested', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [{ _source: { chunk_id: 'chunk-1' }, _score: 10 }],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [{ _source: { chunk_id: 'chunk-1' }, _score: 0.9 }],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Test content',
                    chunk_index: 0,
                    metadata: { url: 'https://example.com', title: 'Test' },
                  },
                  highlight: {
                    text: ['<em>Test</em> content'],
                  },
                },
              ],
            },
          },
        });

      const options: SearchOptions = {
        includeHighlights: true,
      };

      const response = await retriever.search('test query', options);

      // Check that highlights were included in fetch
      const fetchCall = mockClient.search.mock.calls[2];
      expect(fetchCall?.[0]).toHaveProperty('body.highlight');
    });

    it('should apply filters', async () => {
      mockClient.search
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [{ _source: { chunk_id: 'chunk-1' }, _score: 10 }],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [{ _source: { chunk_id: 'chunk-1' }, _score: 0.9 }],
            },
          },
        })
        .mockResolvedValueOnce({
          body: {
            hits: {
              hits: [
                {
                  _source: {
                    chunk_id: 'chunk-1',
                    document_id: 'doc-1',
                    text: 'Test',
                    chunk_index: 0,
                    metadata: { url: 'https://example.com', title: 'Test' },
                  },
                },
              ],
            },
          },
        });

      const options: SearchOptions = {
        filters: {
          document_id: 'doc-1',
        },
      };

      await retriever.search('test query', options);

      // Check that filters were applied to both BM25 and vector searches
      const bm25Call = mockClient.search.mock.calls[0];
      const vectorCall = mockClient.search.mock.calls[1];

      expect(bm25Call?.[0]?.body?.query?.bool?.must).toContainEqual({
        term: { document_id: 'doc-1' },
      });
      expect(vectorCall?.[0]?.body?.query?.knn?.embedding?.filter).toBeDefined();
    });

    it('should handle search errors', async () => {
      mockClient.search = jest.fn().mockRejectedValue(new Error('Search failed'));

      await expect(retriever.search('test query')).rejects.toThrow('Search failed');
    });
  });

  describe('groupByDocument', () => {
    it('should group results by document ID', () => {
      const results: SearchResult[] = [
        {
          chunk_id: 'chunk-1',
          document_id: 'doc-1',
          url: 'https://example.com/1',
          title: 'Doc 1',
          text: 'Content 1',
          chunk_index: 0,
          score: 0.9,
          rank: 1,
          metadata: {},
        },
        {
          chunk_id: 'chunk-2',
          document_id: 'doc-1',
          url: 'https://example.com/1',
          title: 'Doc 1',
          text: 'Content 2',
          chunk_index: 1,
          score: 0.8,
          rank: 2,
          metadata: {},
        },
        {
          chunk_id: 'chunk-3',
          document_id: 'doc-2',
          url: 'https://example.com/2',
          title: 'Doc 2',
          text: 'Content 3',
          chunk_index: 0,
          score: 0.7,
          rank: 3,
          metadata: {},
        },
      ];

      const grouped = retriever.groupByDocument(results);

      expect(grouped.size).toBe(2);
      expect(grouped.get('doc-1')).toHaveLength(2);
      expect(grouped.get('doc-2')).toHaveLength(1);

      // Check that chunks are sorted by chunk_index
      const doc1Chunks = grouped.get('doc-1');
      expect(doc1Chunks?.[0]?.chunk_index).toBe(0);
      expect(doc1Chunks?.[1]?.chunk_index).toBe(1);
    });
  });

  describe('findSimilar', () => {
    it('should find similar chunks', async () => {
      mockClient.search = jest.fn().mockResolvedValue({
        body: {
          hits: {
            hits: [
              {
                _source: {
                  chunk_id: 'chunk-1',
                  document_id: 'doc-1',
                  text: 'Original content',
                  chunk_index: 0,
                  metadata: {
                    url: 'https://example.com',
                    title: 'Test',
                  },
                },
                _score: 1.0,
              },
              {
                _source: {
                  chunk_id: 'chunk-2',
                  document_id: 'doc-2',
                  text: 'Similar content',
                  chunk_index: 0,
                  metadata: {
                    url: 'https://example.com',
                    title: 'Test 2',
                  },
                },
                _score: 0.95,
              },
            ],
          },
        },
      });

      const results = await retriever.findSimilar('chunk-1', 10);

      expect(results.length).toBe(1); // Excludes self
      expect(results[0]?.chunk_id).toBe('chunk-2');
      expect(results[0]?.score).toBe(0.95);
    });

    it('should throw error if chunk has no embedding', async () => {
      mockClient.get = jest.fn().mockResolvedValue({
        body: {
          _source: {
            chunk_id: 'chunk-1',
            document_id: 'doc-1',
            text: 'Content',
            chunk_index: 0,
            metadata: {},
            // No embedding field
          },
        },
      });

      await expect(retriever.findSimilar('chunk-1')).rejects.toThrow('Chunk has no embedding');
    });

    it('should handle errors', async () => {
      mockClient.get = jest.fn().mockRejectedValue(new Error('Get failed'));

      await expect(retriever.findSimilar('chunk-1')).rejects.toThrow('Get failed');
    });
  });
});
