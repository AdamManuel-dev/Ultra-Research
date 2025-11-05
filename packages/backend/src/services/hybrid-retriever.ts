/**
 * @fileoverview Hybrid search retriever with BM25 + k-NN vector search and RRF fusion
 * @lastmodified 2025-11-05
 *
 * Features: Hybrid search combining keyword (BM25) and semantic (k-NN) search with RRF fusion
 * Main APIs: search(), hybridSearch(), rerankResults()
 * Constraints: Configurable weights for BM25 vs vector search, RRF constant k=60
 * Patterns: Reciprocal Rank Fusion (RRF), query enhancement, result deduplication
 */

import { Client } from '@opensearch-project/opensearch';

import { config } from '../config';
import { logger } from '../utils/logger';

import { DocumentChunk } from './document-indexer';
import { embeddingsService } from './embeddings';

/**
 * Search result with score
 */
export interface SearchResult {
  chunk_id: string;
  document_id: string;
  url: string;
  title: string;
  text: string;
  chunk_index: number;
  score: number;
  rank: number;
  metadata: Record<string, unknown>;
  highlights?: string[];
}

/**
 * Search options
 */
export interface SearchOptions {
  size?: number;
  minScore?: number;
  hybridWeight?: number; // 0.0 = pure BM25, 1.0 = pure vector, 0.5 = balanced
  includeHighlights?: boolean;
  filters?: Record<string, unknown>;
}

/**
 * Search response
 */
export interface SearchResponse {
  results: SearchResult[];
  total: number;
  duration_ms: number;
  searchMethod: 'hybrid' | 'bm25' | 'vector';
}

/**
 * Ranked result for RRF fusion
 */
interface RankedResult {
  chunk_id: string;
  rank: number;
  score: number;
  source: 'bm25' | 'vector';
}

/**
 * Hybrid retriever with BM25 + k-NN vector search
 */
export class HybridRetriever {
  private client: Client;

  private readonly indexName = 'research-documents';

  private readonly rrfConstant = 60; // Standard RRF constant

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
   * Enhance query with common research terms
   */
  private enhanceQuery(query: string): string {
    // Simple query enhancement - can be expanded with LLM-based rewriting
    const enhanced = query.trim();

    logger.debug('Query enhanced', {
      metadata: {
        original: query,
        enhanced,
      },
    });

    return enhanced;
  }

  /**
   * Perform BM25 keyword search
   */
  private async bm25Search(
    query: string,
    size: number,
    filters?: Record<string, unknown>
  ): Promise<RankedResult[]> {
    const startTime = Date.now();

    const mustClauses: unknown[] = [
      {
        multi_match: {
          query,
          fields: ['title^2', 'text'],
          type: 'best_fields',
          operator: 'or',
          fuzziness: 'AUTO',
        },
      },
    ];

    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        mustClauses.push({
          term: {
            [field]: value,
          },
        });
      });
    }

    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          bool: {
            must: mustClauses,
          },
        },
        size,
        _source: ['chunk_id'],
      },
    });

    const duration = Date.now() - startTime;

    const results: RankedResult[] = response.body['hits'].hits.map(
      (hit: { _source: { chunk_id: string }; _score: number }, index: number) => ({
        chunk_id: hit._source.chunk_id,
        rank: index + 1,
        score: hit._score,
        source: 'bm25' as const,
      })
    );

    logger.debug('BM25 search completed', {
      metadata: {
        query,
        hits: results.length,
        duration_ms: duration,
      },
    });

    return results;
  }

  /**
   * Perform k-NN vector search
   */
  private async vectorSearch(
    query: string,
    size: number,
    filters?: Record<string, unknown>
  ): Promise<RankedResult[]> {
    const startTime = Date.now();

    // Generate embedding for query
    const embedding = await embeddingsService.generateEmbedding(query);

    const filterClauses: unknown[] = [];

    // Add filters if provided
    if (filters) {
      Object.entries(filters).forEach(([field, value]) => {
        filterClauses.push({
          term: {
            [field]: value,
          },
        });
      });
    }

    const knnQuery: Record<string, unknown> = {
      field: 'embedding',
      query_vector: embedding.vector,
      k: size,
    };

    if (filterClauses.length > 0) {
      knnQuery['filter'] = {
        bool: {
          must: filterClauses,
        },
      };
    }

    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          knn: {
            embedding: knnQuery,
          },
        },
        size,
        _source: ['chunk_id'],
      },
    });

    const duration = Date.now() - startTime;

    const results: RankedResult[] = response.body['hits'].hits.map(
      (hit: { _source: { chunk_id: string }; _score: number }, index: number) => ({
        chunk_id: hit._source.chunk_id,
        rank: index + 1,
        score: hit._score,
        source: 'vector' as const,
      })
    );

    logger.debug('Vector search completed', {
      metadata: {
        query,
        hits: results.length,
        embedding_cached: embedding.cached,
        duration_ms: duration,
      },
    });

    return results;
  }

  /**
   * Apply Reciprocal Rank Fusion (RRF) to combine rankings
   */
  private applyRRF(
    bm25Results: RankedResult[],
    vectorResults: RankedResult[],
    weight: number
  ): string[] {
    // RRF formula: score = sum(1 / (k + rank))
    // weight controls blend: 0.0 = pure BM25, 1.0 = pure vector, 0.5 = balanced

    const scores = new Map<string, number>();

    // Process BM25 results with (1 - weight)
    const bm25Weight = 1 - weight;
    bm25Results.forEach((result) => {
      const rrfScore = bm25Weight * (1 / (this.rrfConstant + result.rank));
      scores.set(result.chunk_id, (scores.get(result.chunk_id) || 0) + rrfScore);
    });

    // Process vector results with weight
    vectorResults.forEach((result) => {
      const rrfScore = weight * (1 / (this.rrfConstant + result.rank));
      scores.set(result.chunk_id, (scores.get(result.chunk_id) || 0) + rrfScore);
    });

    // Sort by final RRF score
    const sortedChunkIds = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([chunkId]) => chunkId);

    logger.debug('RRF fusion applied', {
      metadata: {
        bm25_results: bm25Results.length,
        vector_results: vectorResults.length,
        weight,
        unique_chunks: sortedChunkIds.length,
      },
    });

    return sortedChunkIds;
  }

  /**
   * Fetch full document chunks by IDs
   */
  private async fetchChunks(
    chunkIds: string[],
    includeHighlights: boolean = false
  ): Promise<Map<string, DocumentChunk>> {
    if (chunkIds.length === 0) {
      return new Map();
    }

    const response = await this.client.search({
      index: this.indexName,
      body: {
        query: {
          terms: {
            chunk_id: chunkIds,
          },
        },
        size: chunkIds.length,
        highlight: includeHighlights
          ? {
              fields: {
                text: {
                  fragment_size: 150,
                  number_of_fragments: 3,
                },
              },
            }
          : undefined,
      },
    });

    const chunks = new Map<string, DocumentChunk>();

    response.body['hits'].hits.forEach(
      (hit: { _source: DocumentChunk; highlight?: { text: string[] } }) => {
        const chunk = hit._source;
        if (hit.highlight?.text) {
          chunk.metadata = {
            ...chunk.metadata,
            highlights: hit.highlight.text,
          };
        }
        chunks.set(chunk.chunk_id, chunk);
      }
    );

    return chunks;
  }

  /**
   * Perform hybrid search with BM25 + vector search and RRF fusion
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now();

    const {
      size = 10,
      minScore = 0.0,
      hybridWeight = 0.5,
      includeHighlights = false,
      filters,
    } = options;

    try {
      // Enhance query
      const enhancedQuery = this.enhanceQuery(query);

      let rankedChunkIds: string[];
      let searchMethod: 'hybrid' | 'bm25' | 'vector';

      if (hybridWeight === 0.0) {
        // Pure BM25 search
        searchMethod = 'bm25';
        const bm25Results = await this.bm25Search(enhancedQuery, size * 2, filters);
        rankedChunkIds = bm25Results.map((r) => r.chunk_id);
      } else if (hybridWeight === 1.0) {
        // Pure vector search
        searchMethod = 'vector';
        const vectorResults = await this.vectorSearch(enhancedQuery, size * 2, filters);
        rankedChunkIds = vectorResults.map((r) => r.chunk_id);
      } else {
        // Hybrid search with RRF fusion
        searchMethod = 'hybrid';
        const [bm25Results, vectorResults] = await Promise.all([
          this.bm25Search(enhancedQuery, size * 2, filters),
          this.vectorSearch(enhancedQuery, size * 2, filters),
        ]);

        rankedChunkIds = this.applyRRF(bm25Results, vectorResults, hybridWeight);
      }

      // Limit to requested size
      const topChunkIds = rankedChunkIds.slice(0, size);

      // Fetch full chunks
      const chunks = await this.fetchChunks(topChunkIds, includeHighlights);

      // Build results in ranked order
      const results: SearchResult[] = topChunkIds
        .map((chunkId, index) => {
          const chunk = chunks.get(chunkId);
          if (!chunk) return null;

          const result: SearchResult = {
            chunk_id: chunk.chunk_id,
            document_id: chunk.document_id,
            url: chunk.metadata['url'] as string,
            title: chunk.metadata['title'] as string,
            text: chunk.text,
            chunk_index: chunk.chunk_index,
            score: 1.0 / (index + 1), // Normalized score based on rank
            rank: index + 1,
            metadata: chunk.metadata,
          };

          if (chunk.metadata['highlights']) {
            result.highlights = chunk.metadata['highlights'] as string[];
          }

          return result;
        })
        .filter((r): r is SearchResult => r !== null && r.score >= minScore);

      const duration = Date.now() - startTime;

      logger.info('Hybrid search completed', {
        metadata: {
          query,
          search_method: searchMethod,
          hybrid_weight: hybridWeight,
          results: results.length,
          duration_ms: duration,
        },
      });

      return {
        results,
        total: rankedChunkIds.length,
        duration_ms: duration,
        searchMethod,
      };
    } catch (error) {
      logger.error('Hybrid search failed', {
        metadata: {
          query,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }

  /**
   * Group search results by document
   */
  groupByDocument(results: SearchResult[]): Map<string, SearchResult[]> {
    const grouped = new Map<string, SearchResult[]>();

    results.forEach((result) => {
      const existing = grouped.get(result.document_id) || [];
      existing.push(result);
      grouped.set(result.document_id, existing);
    });

    // Sort chunks within each document by chunk_index
    grouped.forEach((chunks) => {
      chunks.sort((a, b) => a.chunk_index - b.chunk_index);
    });

    return grouped;
  }

  /**
   * Get similar chunks to a given chunk
   */
  async findSimilar(chunkId: string, size: number = 10): Promise<SearchResult[]> {
    const startTime = Date.now();

    try {
      // Get the chunk
      const chunkResponse = await this.client.get({
        index: this.indexName,
        id: chunkId,
      });

      const chunk: DocumentChunk = chunkResponse.body['_source'];

      if (!chunk.embedding) {
        throw new Error('Chunk has no embedding');
      }

      // Find similar using vector search
      const response = await this.client.search({
        index: this.indexName,
        body: {
          query: {
            knn: {
              embedding: {
                field: 'embedding',
                query_vector: chunk.embedding,
                k: size + 1, // +1 to exclude self
              },
            },
          },
          size: size + 1,
        },
      });

      const results: SearchResult[] = response.body['hits'].hits
        .filter((hit: { _source: DocumentChunk }) => hit._source.chunk_id !== chunkId)
        .slice(0, size)
        .map((hit: { _source: DocumentChunk; _score: number }, index: number) => ({
          chunk_id: hit._source.chunk_id,
          document_id: hit._source.document_id,
          url: hit._source.metadata['url'] as string,
          title: hit._source.metadata['title'] as string,
          text: hit._source.text,
          chunk_index: hit._source.chunk_index,
          score: hit._score,
          rank: index + 1,
          metadata: hit._source.metadata,
        }));

      const duration = Date.now() - startTime;

      logger.info('Similar chunks found', {
        metadata: {
          chunk_id: chunkId,
          results: results.length,
          duration_ms: duration,
        },
      });

      return results;
    } catch (error) {
      logger.error('Failed to find similar chunks', {
        metadata: {
          chunk_id: chunkId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      throw error;
    }
  }
}

// Singleton instance
export const hybridRetriever = new HybridRetriever();
