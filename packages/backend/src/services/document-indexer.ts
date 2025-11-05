/**
 * @fileoverview Document indexer with chunking and hybrid search support
 * @lastmodified 2025-11-05
 *
 * Features: Chunk documents, generate embeddings, index with BM25 + vectors
 * Main APIs: indexDocument(), indexBatch(), deleteDocument()
 * Constraints: Configurable chunk size, overlap, supports hybrid search
 * Patterns: Chunking strategy, batch processing, hybrid indexing
 */

import { Client } from '@opensearch-project/opensearch';

import { config } from '../config';
import { logger } from '../utils/logger';

import { embeddingsService, BatchEmbeddingRequest } from './embeddings';

/**
 * Document chunk
 */
export interface DocumentChunk {
  chunk_id: string;
  document_id: string;
  text: string;
  embedding?: number[];
  chunk_index: number;
  start_char: number;
  end_char: number;
  metadata: Record<string, unknown>;
}

/**
 * Document to index
 */
export interface Document {
  document_id: string;
  url: string;
  title: string;
  content: string;
  author?: string;
  published_date?: string;
  fetched_at: string;
  metadata?: Record<string, unknown>;
}

/**
 * Index result
 */
export interface IndexResult {
  document_id: string;
  chunks: number;
  indexed: boolean;
  duration_ms: number;
}

/**
 * Document indexer with chunking
 */
export class DocumentIndexer {
  private client: Client;

  private readonly indexName = 'research-documents';

  private readonly chunkSize = 500; // words

  private readonly chunkOverlap = 50; // words

  constructor() {
    this.client = new Client({
      node: config.opensearch.node,
      auth: {
        username: config.opensearch.username,
        password: config.opensearch.password,
      },
      ssl: {
        rejectUnauthorized: false,
      },
    });
  }

  /**
   * Initialize index with mappings
   */
  async initializeIndex(): Promise<void> {
    try {
      const exists = await this.client.indices.exists({
        index: this.indexName,
      });

      if (exists.body) {
        logger.info('Index already exists', { metadata: { index: this.indexName } });
        return;
      }

      // Create index with hybrid search mappings
      await this.client.indices.create({
        index: this.indexName,
        body: {
          settings: {
            number_of_shards: 1,
            number_of_replicas: 0,
            'index.knn': true, // Enable k-NN for vector search
          },
          mappings: {
            properties: {
              chunk_id: { type: 'keyword' },
              document_id: { type: 'keyword' },
              url: { type: 'keyword' },
              title: { type: 'text', analyzer: 'standard' },
              text: { type: 'text', analyzer: 'standard' },
              embedding: {
                type: 'knn_vector',
                dimension: 1536,
                method: {
                  name: 'hnsw',
                  space_type: 'cosinesimil',
                  engine: 'nmslib',
                  parameters: {
                    ef_construction: 128,
                    m: 24,
                  },
                },
              },
              chunk_index: { type: 'integer' },
              start_char: { type: 'integer' },
              end_char: { type: 'integer' },
              author: { type: 'keyword' },
              published_date: { type: 'date' },
              fetched_at: { type: 'date' },
              metadata: { type: 'object', enabled: true },
            },
          },
        },
      });

      logger.info('Index created successfully', { metadata: { index: this.indexName } });
    } catch (error) {
      logger.error('Failed to initialize index', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Chunk text into overlapping segments
   */
  private chunkText(text: string): Array<{ text: string; start: number; end: number }> {
    const words = text.split(/\s+/);
    const chunks: Array<{ text: string; start: number; end: number }> = [];

    let charPosition = 0;
    for (let i = 0; i < words.length; i += this.chunkSize - this.chunkOverlap) {
      const chunkWords = words.slice(i, i + this.chunkSize);
      const chunkText = chunkWords.join(' ');

      const start = charPosition;
      const end = start + chunkText.length;

      chunks.push({
        text: chunkText,
        start,
        end,
      });

      charPosition += chunkText.length + 1; // +1 for space
    }

    logger.debug('Text chunked', {
      metadata: {
        text_length: text.length,
        word_count: words.length,
        chunks: chunks.length,
      },
    });

    return chunks;
  }

  /**
   * Index a document with chunking and embeddings
   */
  async indexDocument(doc: Document): Promise<IndexResult> {
    const startTime = Date.now();

    try {
      // Chunk the document
      const textChunks = this.chunkText(doc.content);

      // Generate embeddings for all chunks
      const embeddingRequests: BatchEmbeddingRequest[] = textChunks.map((chunk, index) => ({
        text: chunk.text,
        id: `${doc.document_id}-${index}`,
      }));

      const embeddings = await embeddingsService.generateBatch(embeddingRequests);

      // Prepare bulk indexing operations
      const bulkOps: Array<Record<string, unknown> | DocumentChunk> = [];

      textChunks.forEach((chunk, index) => {
        const chunkId = `${doc.document_id}-${index}`;
        const embedding = embeddings.get(chunkId);

        const docChunk: DocumentChunk & Partial<Document> = {
          chunk_id: chunkId,
          document_id: doc.document_id,
          url: doc.url,
          title: doc.title,
          text: chunk.text,
          embedding: embedding?.vector,
          chunk_index: index,
          start_char: chunk.start,
          end_char: chunk.end,
          author: doc.author,
          published_date: doc.published_date,
          fetched_at: doc.fetched_at,
          metadata: doc.metadata || {},
        };

        // Add index operation
        bulkOps.push({ index: { _index: this.indexName, _id: chunkId } });
        bulkOps.push(docChunk);
      });

      // Bulk index
      const response = await this.client.bulk({
        body: bulkOps,
        refresh: false,
      });

      const duration = Date.now() - startTime;

      if (response.body['errors']) {
        logger.error('Bulk indexing had errors', {
          metadata: {
            document_id: doc.document_id,
            errors: response.body['items']
              .filter((item: { index?: { error?: unknown } }) => item.index?.error)
              .map((item: { index?: { error?: unknown } }) => item.index?.error),
          },
        });
      }

      logger.info('Document indexed', {
        metadata: {
          document_id: doc.document_id,
          chunks: textChunks.length,
          duration_ms: duration,
        },
      });

      return {
        document_id: doc.document_id,
        chunks: textChunks.length,
        indexed: !response.body['errors'],
        duration_ms: duration,
      };
    } catch (error) {
      logger.error('Failed to index document', {
        metadata: {
          document_id: doc.document_id,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Index multiple documents
   */
  async indexBatch(docs: Document[]): Promise<IndexResult[]> {
    const results: IndexResult[] = [];

    for (const doc of docs) {
      try {
        const result = await this.indexDocument(doc);
        results.push(result);
      } catch (error) {
        logger.error('Failed to index document in batch', {
          metadata: {
            document_id: doc.document_id,
            error: error instanceof Error ? error.message : String(error),
          },
        });
      }
    }

    logger.info('Batch indexing complete', {
      metadata: {
        total: docs.length,
        successful: results.filter((r) => r.indexed).length,
        failed: results.filter((r) => !r.indexed).length,
      },
    });

    return results;
  }

  /**
   * Delete a document and all its chunks
   */
  async deleteDocument(documentId: string): Promise<boolean> {
    try {
      const response = await this.client.deleteByQuery({
        index: this.indexName,
        body: {
          query: {
            term: {
              document_id: documentId,
            },
          },
        },
      });

      const deleted = response.body['deleted'] || 0;

      logger.info('Document deleted', {
        metadata: {
          document_id: documentId,
          chunks_deleted: deleted,
        },
      });

      return deleted > 0;
    } catch (error) {
      logger.error('Failed to delete document', {
        metadata: {
          document_id: documentId,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Get document by ID (returns all chunks)
   */
  async getDocument(documentId: string): Promise<DocumentChunk[]> {
    try {
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            term: {
              document_id: documentId,
            },
          },
          sort: [{ chunk_index: { order: 'asc' } }],
          size: 1000,
        },
      });

      const chunks = response.body['hits'].hits.map(
        (hit: { _source: DocumentChunk }) => hit._source
      );

      return chunks;
    } catch (error) {
      logger.error('Failed to get document', {
        metadata: {
          document_id: documentId,
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<{ documents: number; chunks: number; size_bytes: number }> {
    try {
      const stats = await this.client.indices.stats({ index: this.indexName });

      // Count unique documents
      const countResponse = await this.client.count({
        index: this.indexName,
        body: {
          query: {
            match_all: {},
          },
        },
      });

      // Aggregate unique document IDs
      const aggResponse = await this.client.search({
        index: this.indexName,
        body: {
          size: 0,
          aggs: {
            unique_documents: {
              cardinality: {
                field: 'document_id',
              },
            },
          },
        },
      });

      return {
        documents: aggResponse.body['aggregations'].unique_documents.value,
        chunks: countResponse.body['count'],
        size_bytes: stats.body['_all'].primaries.store.size_in_bytes,
      };
    } catch (error) {
      logger.error('Failed to get index stats', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return { documents: 0, chunks: 0, size_bytes: 0 };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const health = await this.client.cluster.health();
      return health.body['status'] !== 'red';
    } catch (error) {
      logger.error('Health check failed', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return false;
    }
  }
}

// Singleton instance
export const documentIndexer = new DocumentIndexer();
