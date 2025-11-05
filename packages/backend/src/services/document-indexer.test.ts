/**
 * @fileoverview Tests for document indexer
 * @lastmodified 2025-11-05
 */

import { Client } from '@opensearch-project/opensearch';

import { DocumentIndexer, Document, IndexResult } from './document-indexer';
import { embeddingsService } from './embeddings';

// Mock OpenSearch client
jest.mock('@opensearch-project/opensearch');

// Mock embeddings service
jest.mock('./embeddings', () => ({
  embeddingsService: {
    generateBatch: jest.fn(),
  },
}));

describe('DocumentIndexer', () => {
  let indexer: DocumentIndexer;
  let mockClient: jest.Mocked<Client>;

  beforeEach(() => {
    jest.clearAllMocks();

    indexer = new DocumentIndexer();
    mockClient = (indexer as any).client as jest.Mocked<Client>;

    // Setup default mock implementations
    mockClient.indices = {
      exists: jest.fn().mockResolvedValue({ body: false }),
      create: jest.fn().mockResolvedValue({ body: {} }),
      stats: jest.fn().mockResolvedValue({
        body: {
          _all: {
            primaries: {
              store: {
                size_in_bytes: 1000,
              },
            },
          },
        },
      }),
    } as any;

    mockClient.bulk = jest.fn().mockResolvedValue({
      body: {
        errors: false,
        items: [],
      },
    });

    mockClient.search = jest.fn().mockResolvedValue({
      body: {
        hits: {
          hits: [],
        },
        aggregations: {
          unique_documents: {
            value: 0,
          },
        },
      },
    });

    mockClient.count = jest.fn().mockResolvedValue({
      body: {
        count: 0,
      },
    });

    mockClient.deleteByQuery = jest.fn().mockResolvedValue({
      body: {
        deleted: 1,
      },
    });

    mockClient.cluster = {
      health: jest.fn().mockResolvedValue({
        body: {
          status: 'green',
        },
      }),
    } as any;
  });

  describe('initializeIndex', () => {
    it('should create index if not exists', async () => {
      await indexer.initializeIndex();

      expect(mockClient.indices.exists).toHaveBeenCalledWith({
        index: 'research-documents',
      });

      expect(mockClient.indices.create).toHaveBeenCalledWith({
        index: 'research-documents',
        body: expect.objectContaining({
          settings: expect.any(Object),
          mappings: expect.any(Object),
        }),
      });
    });

    it('should not create index if already exists', async () => {
      mockClient.indices.exists = jest.fn().mockResolvedValue({ body: true });

      await indexer.initializeIndex();

      expect(mockClient.indices.exists).toHaveBeenCalled();
      expect(mockClient.indices.create).not.toHaveBeenCalled();
    });

    it('should handle errors during initialization', async () => {
      mockClient.indices.exists = jest.fn().mockRejectedValue(new Error('Connection failed'));

      await expect(indexer.initializeIndex()).rejects.toThrow('Connection failed');
    });
  });

  describe('indexDocument', () => {
    const mockDocument: Document = {
      document_id: 'doc-123',
      url: 'https://example.com/article',
      title: 'Test Article',
      content: 'This is a test article with enough content to create multiple chunks. '.repeat(100),
      author: 'John Doe',
      published_date: '2025-01-01',
      fetched_at: '2025-01-02T00:00:00Z',
      metadata: { source: 'test' },
    };

    beforeEach(() => {
      // Mock embeddings service
      (embeddingsService.generateBatch as jest.Mock).mockResolvedValue(
        new Map([
          ['doc-123-0', { vector: new Array(1536).fill(0.1), model: 'test', dimensions: 1536, cached: false }],
          ['doc-123-1', { vector: new Array(1536).fill(0.2), model: 'test', dimensions: 1536, cached: false }],
        ])
      );
    });

    it('should index document with chunking', async () => {
      const result: IndexResult = await indexer.indexDocument(mockDocument);

      expect(result.document_id).toBe('doc-123');
      expect(result.indexed).toBe(true);
      expect(result.chunks).toBeGreaterThan(0);
      expect(result.duration_ms).toBeGreaterThan(0);

      expect(embeddingsService.generateBatch).toHaveBeenCalled();
      expect(mockClient.bulk).toHaveBeenCalled();
    });

    it('should handle bulk indexing errors', async () => {
      mockClient.bulk = jest.fn().mockResolvedValue({
        body: {
          errors: true,
          items: [
            {
              index: {
                error: 'Index error',
              },
            },
          ],
        },
      });

      const result: IndexResult = await indexer.indexDocument(mockDocument);

      expect(result.indexed).toBe(false);
    });

    it('should handle indexing errors', async () => {
      mockClient.bulk = jest.fn().mockRejectedValue(new Error('Bulk index failed'));

      await expect(indexer.indexDocument(mockDocument)).rejects.toThrow('Bulk index failed');
    });

    it('should chunk text correctly', async () => {
      // Create a document with exactly 1000 words
      const words = Array(1000).fill('word').map((w, i) => `${w}${i}`);
      const content = words.join(' ');

      const doc: Document = {
        ...mockDocument,
        content,
      };

      await indexer.indexDocument(doc);

      const bulkCall = mockClient.bulk.mock.calls[0];
      const bulkOps = bulkCall?.[0]?.body as any[];

      // Count chunks (every 2 operations is 1 chunk: index operation + document)
      const chunkCount = bulkOps.length / 2;

      // With 500 word chunks and 50 word overlap, 1000 words should create ~3 chunks
      expect(chunkCount).toBeGreaterThanOrEqual(2);
      expect(chunkCount).toBeLessThanOrEqual(4);
    });
  });

  describe('indexBatch', () => {
    it('should index multiple documents', async () => {
      (embeddingsService.generateBatch as jest.Mock).mockResolvedValue(
        new Map([
          ['doc-1-0', { vector: new Array(1536).fill(0.1), model: 'test', dimensions: 1536, cached: false }],
          ['doc-2-0', { vector: new Array(1536).fill(0.2), model: 'test', dimensions: 1536, cached: false }],
        ])
      );

      const docs: Document[] = [
        {
          document_id: 'doc-1',
          url: 'https://example.com/1',
          title: 'Doc 1',
          content: 'Content 1 '.repeat(100),
          fetched_at: '2025-01-01T00:00:00Z',
        },
        {
          document_id: 'doc-2',
          url: 'https://example.com/2',
          title: 'Doc 2',
          content: 'Content 2 '.repeat(100),
          fetched_at: '2025-01-01T00:00:00Z',
        },
      ];

      const results = await indexer.indexBatch(docs);

      expect(results).toHaveLength(2);
      expect(results[0]?.document_id).toBe('doc-1');
      expect(results[1]?.document_id).toBe('doc-2');
    });

    it('should continue on individual failures', async () => {
      (embeddingsService.generateBatch as jest.Mock)
        .mockResolvedValueOnce(new Map())
        .mockRejectedValueOnce(new Error('Embedding failed'))
        .mockResolvedValueOnce(new Map([
          ['doc-3-0', { vector: new Array(1536).fill(0.3), model: 'test', dimensions: 1536, cached: false }],
        ]));

      mockClient.bulk
        .mockResolvedValueOnce({ body: { errors: false, items: [] } })
        .mockRejectedValueOnce(new Error('Bulk failed'))
        .mockResolvedValueOnce({ body: { errors: false, items: [] } });

      const docs: Document[] = [
        {
          document_id: 'doc-1',
          url: 'https://example.com/1',
          title: 'Doc 1',
          content: 'Content 1 '.repeat(100),
          fetched_at: '2025-01-01T00:00:00Z',
        },
        {
          document_id: 'doc-2',
          url: 'https://example.com/2',
          title: 'Doc 2',
          content: 'Content 2 '.repeat(100),
          fetched_at: '2025-01-01T00:00:00Z',
        },
        {
          document_id: 'doc-3',
          url: 'https://example.com/3',
          title: 'Doc 3',
          content: 'Content 3 '.repeat(100),
          fetched_at: '2025-01-01T00:00:00Z',
        },
      ];

      const results = await indexer.indexBatch(docs);

      // Should have results for doc-1 and doc-3 (doc-2 failed)
      expect(results.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('deleteDocument', () => {
    it('should delete document and all chunks', async () => {
      const deleted = await indexer.deleteDocument('doc-123');

      expect(deleted).toBe(true);
      expect(mockClient.deleteByQuery).toHaveBeenCalledWith({
        index: 'research-documents',
        body: {
          query: {
            term: {
              document_id: 'doc-123',
            },
          },
        },
      });
    });

    it('should return false if document not found', async () => {
      mockClient.deleteByQuery = jest.fn().mockResolvedValue({
        body: {
          deleted: 0,
        },
      });

      const deleted = await indexer.deleteDocument('doc-999');

      expect(deleted).toBe(false);
    });

    it('should handle delete errors', async () => {
      mockClient.deleteByQuery = jest.fn().mockRejectedValue(new Error('Delete failed'));

      await expect(indexer.deleteDocument('doc-123')).rejects.toThrow('Delete failed');
    });
  });

  describe('getDocument', () => {
    it('should retrieve document chunks', async () => {
      mockClient.search = jest.fn().mockResolvedValue({
        body: {
          hits: {
            hits: [
              {
                _source: {
                  chunk_id: 'doc-123-0',
                  document_id: 'doc-123',
                  text: 'Chunk 0',
                  chunk_index: 0,
                  start_char: 0,
                  end_char: 100,
                  metadata: {},
                },
              },
              {
                _source: {
                  chunk_id: 'doc-123-1',
                  document_id: 'doc-123',
                  text: 'Chunk 1',
                  chunk_index: 1,
                  start_char: 100,
                  end_char: 200,
                  metadata: {},
                },
              },
            ],
          },
        },
      });

      const chunks = await indexer.getDocument('doc-123');

      expect(chunks).toHaveLength(2);
      expect(chunks[0]?.chunk_index).toBe(0);
      expect(chunks[1]?.chunk_index).toBe(1);
    });

    it('should return empty array for non-existent document', async () => {
      const chunks = await indexer.getDocument('doc-999');

      expect(chunks).toHaveLength(0);
    });
  });

  describe('getStats', () => {
    it('should return index statistics', async () => {
      mockClient.count = jest.fn().mockResolvedValue({
        body: {
          count: 100,
        },
      });

      mockClient.search = jest.fn().mockResolvedValue({
        body: {
          aggregations: {
            unique_documents: {
              value: 10,
            },
          },
        },
      });

      const stats = await indexer.getStats();

      expect(stats.documents).toBe(10);
      expect(stats.chunks).toBe(100);
      expect(stats.size_bytes).toBe(1000);
    });

    it('should return zeros on error', async () => {
      mockClient.count = jest.fn().mockRejectedValue(new Error('Stats failed'));

      const stats = await indexer.getStats();

      expect(stats.documents).toBe(0);
      expect(stats.chunks).toBe(0);
      expect(stats.size_bytes).toBe(0);
    });
  });

  describe('healthCheck', () => {
    it('should return true for healthy cluster', async () => {
      const healthy = await indexer.healthCheck();

      expect(healthy).toBe(true);
    });

    it('should return false for red cluster', async () => {
      mockClient.cluster.health = jest.fn().mockResolvedValue({
        body: {
          status: 'red',
        },
      });

      const healthy = await indexer.healthCheck();

      expect(healthy).toBe(false);
    });

    it('should return false on error', async () => {
      mockClient.cluster.health = jest.fn().mockRejectedValue(new Error('Health check failed'));

      const healthy = await indexer.healthCheck();

      expect(healthy).toBe(false);
    });
  });
});
