/**
 * @fileoverview OpenAI embeddings service with caching
 * @lastmodified 2025-11-05
 *
 * Features: Generate embeddings using OpenAI, cache results in Redis
 * Main APIs: generateEmbedding(), generateBatch()
 * Constraints: Rate limiting, batch processing, cache TTL
 * Patterns: Cache-aside pattern, batch processing for efficiency
 */

import { createHash } from 'crypto';

import Redis from 'ioredis';
import OpenAI from 'openai';

import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Embedding result
 */
export interface Embedding {
  vector: number[];
  model: string;
  dimensions: number;
  cached: boolean;
}

/**
 * Batch embedding request
 */
export interface BatchEmbeddingRequest {
  text: string;
  id?: string;
}

/**
 * OpenAI embeddings service with caching
 */
export class EmbeddingsService {
  private openai: OpenAI;

  private redis: Redis;

  private readonly model = 'text-embedding-3-small';

  private readonly dimensions = 1536;

  private readonly cacheTTL = 7 * 24 * 60 * 60; // 7 days

  private readonly maxBatchSize = 100;

  constructor() {
    this.openai = new OpenAI({
      apiKey: config.openai?.apiKey || process.env['OPENAI_API_KEY'],
    });

    this.redis = new Redis({
      host: config.redis?.host || 'localhost',
      port: config.redis?.port || 6379,
      password: config.redis?.password,
      db: 1, // Use separate DB for embeddings
      keyPrefix: 'embed:',
    });
  }

  /**
   * Generate cache key for text
   */
  private getCacheKey(text: string): string {
    const hash = createHash('sha256').update(text).digest('hex');
    return `${this.model}:${hash}`;
  }

  /**
   * Get embedding from cache
   */
  private async getFromCache(text: string): Promise<number[] | null> {
    try {
      const key = this.getCacheKey(text);
      const cached = await this.redis.get(key);

      if (cached) {
        logger.debug('Embedding cache hit', {
          metadata: {
            text_length: text.length,
            key,
          },
        });
        return JSON.parse(cached) as number[];
      }

      return null;
    } catch (error) {
      logger.warn('Failed to get embedding from cache', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return null;
    }
  }

  /**
   * Save embedding to cache
   */
  private async saveToCache(text: string, embedding: number[]): Promise<void> {
    try {
      const key = this.getCacheKey(text);
      await this.redis.setex(key, this.cacheTTL, JSON.stringify(embedding));

      logger.debug('Embedding cached', {
        metadata: {
          text_length: text.length,
          dimensions: embedding.length,
        },
      });
    } catch (error) {
      logger.warn('Failed to cache embedding', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  /**
   * Generate embedding for text
   */
  async generateEmbedding(text: string, useCache: boolean = true): Promise<Embedding> {
    const startTime = Date.now();

    // Check cache first
    if (useCache) {
      const cached = await this.getFromCache(text);
      if (cached) {
        return {
          vector: cached,
          model: this.model,
          dimensions: this.dimensions,
          cached: true,
        };
      }
    }

    try {
      // Generate embedding via OpenAI
      const response = await this.openai.embeddings.create({
        model: this.model,
        input: text,
        dimensions: this.dimensions,
      });

      const embedding = response.data[0]?.embedding;
      if (!embedding) {
        throw new Error('No embedding returned from API');
      }
      const duration = Date.now() - startTime;

      // Cache the result
      if (useCache) {
        await this.saveToCache(text, embedding);
      }

      logger.info('Embedding generated', {
        metadata: {
          text_length: text.length,
          dimensions: embedding.length,
          duration_ms: duration,
          cached: false,
        },
      });

      return {
        vector: embedding,
        model: this.model,
        dimensions: embedding.length,
        cached: false,
      };
    } catch (error) {
      logger.error('Failed to generate embedding', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
          text_length: text.length,
        },
      });
      throw error;
    }
  }

  /**
   * Generate embeddings in batch
   */
  async generateBatch(
    requests: BatchEmbeddingRequest[],
    useCache: boolean = true
  ): Promise<Map<string, Embedding>> {
    const results = new Map<string, Embedding>();
    const uncached: BatchEmbeddingRequest[] = [];

    // Check cache for all requests
    if (useCache) {
      for (const req of requests) {
        const cached = await this.getFromCache(req.text);
        if (cached) {
          results.set(req.id || req.text, {
            vector: cached,
            model: this.model,
            dimensions: this.dimensions,
            cached: true,
          });
        } else {
          uncached.push(req);
        }
      }
    } else {
      uncached.push(...requests);
    }

    // Generate embeddings for uncached texts
    if (uncached.length > 0) {
      // Process in batches to respect API limits
      for (let i = 0; i < uncached.length; i += this.maxBatchSize) {
        const batch = uncached.slice(i, i + this.maxBatchSize);

        try {
          const response = await this.openai.embeddings.create({
            model: this.model,
            input: batch.map((r) => r.text),
            dimensions: this.dimensions,
          });

          // Process results
          batch.forEach((req, index) => {
            const embedding = response.data[index]?.embedding;
            if (!embedding) {
              logger.warn('No embedding for batch item', { metadata: { index, id: req.id } });
              return;
            }

            // Cache the result
            if (useCache) {
              void this.saveToCache(req.text, embedding);
            }

            results.set(req.id || req.text, {
              vector: embedding,
              model: this.model,
              dimensions: embedding.length,
              cached: false,
            });
          });

          logger.info('Batch embeddings generated', {
            metadata: {
              batch_size: batch.length,
              total_requests: uncached.length,
            },
          });
        } catch (error) {
          logger.error('Failed to generate batch embeddings', {
            metadata: {
              error: error instanceof Error ? error.message : String(error),
              batch_size: batch.length,
            },
          });
          throw error;
        }
      }
    }

    logger.info('Batch embedding complete', {
      metadata: {
        total: requests.length,
        cached: results.size - uncached.length,
        generated: uncached.length,
      },
    });

    return results;
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  cosineSimilarity(a: number[], b: number[]): number {
    if (a.length !== b.length) {
      throw new Error('Vectors must have the same dimensions');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < a.length; i++) {
      const aVal = a[i];
      const bVal = b[i];
      if (aVal === undefined || bVal === undefined) {
        throw new Error('Vector dimensions must match');
      }
      dotProduct += aVal * bVal;
      normA += aVal * aVal;
      normB += bVal * bVal;
    }

    const magnitude = Math.sqrt(normA) * Math.sqrt(normB);
    if (magnitude === 0) {
      throw new Error('Vector magnitude cannot be zero');
    }

    return dotProduct / magnitude;
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{ keys: number; memory: string }> {
    try {
      const keys = await this.redis.dbsize();
      const info = await this.redis.info('memory');
      const memoryMatch = info.match(/used_memory_human:([^\r\n]+)/);
      const memory = memoryMatch?.[1] ?? 'unknown';

      return { keys, memory };
    } catch (error) {
      logger.error('Failed to get cache stats', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      return { keys: 0, memory: 'unknown' };
    }
  }

  /**
   * Clear cache
   */
  async clearCache(): Promise<void> {
    try {
      await this.redis.flushdb();
      logger.info('Embedding cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache', {
        metadata: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
      throw error;
    }
  }

  /**
   * Close connections
   */
  async close(): Promise<void> {
    await this.redis.quit();
  }
}

// Singleton instance
export const embeddingsService = new EmbeddingsService();
