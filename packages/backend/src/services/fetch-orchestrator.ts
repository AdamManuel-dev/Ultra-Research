/**
 * @fileoverview Fetch orchestrator with queue management, deduplication, and retry logic
 * @lastmodified 2025-11-05
 *
 * Features: Queue management, request deduplication, retry with exponential backoff, caching
 * Main APIs: fetch(), fetchMultiple(), queueFetch()
 * Constraints: Respects rate limits, robots.txt, handles failures gracefully
 * Patterns: Queue-based orchestration, LRU cache for deduplication, exponential backoff
 */

import { createHash } from 'crypto';

import { logger } from '../utils/logger';
import {
  createFetchStartEvent,
  createFetchCompleteEvent,
  createFetchErrorEvent,
  createExtractStartEvent,
  createExtractCompleteEvent,
  publishEvent,
} from '../utils/event-producers';

import { contentExtractor, ExtractedContent } from './content-extractor';
import { httpClient, FetchResponse } from './http-client';
import { markdownConverter, MarkdownResult } from './markdown-converter';
import { rateLimiter } from './rate-limiter';
import { robotsParser } from './robots-parser';

/**
 * Fetch request options
 */
export interface FetchRequest {
  url: string;
  runId: string;
  priority?: number;
  skipCache?: boolean;
  maxRetries?: number;
  extractContent?: boolean;
  convertMarkdown?: boolean;
}

/**
 * Fetch result with extracted content
 */
export interface FetchResult {
  url: string;
  finalUrl: string;
  status: number;
  contentType: string;
  html: string;
  extracted?: ExtractedContent;
  markdown?: MarkdownResult;
  duration_ms: number;
  fromCache: boolean;
  retries: number;
}

/**
 * Cache entry
 */
interface CacheEntry {
  result: FetchResult;
  timestamp: number;
  etag?: string;
}

/**
 * Queue item
 */
interface QueueItem {
  request: FetchRequest;
  resolve: (result: FetchResult) => void;
  reject: (error: Error) => void;
  retryCount: number;
}

/**
 * Fetch orchestrator service
 */
export class FetchOrchestrator {
  private cache: Map<string, CacheEntry>;

  private queue: QueueItem[];

  private processing: Set<string>;

  private readonly maxCacheSize = 10000;

  private readonly cacheMaxAge = 3600000; // 1 hour

  private readonly maxRetries = 3;

  private readonly baseDelayMs = 1000;

  constructor() {
    this.cache = new Map();
    this.queue = [];
    this.processing = new Set();
  }

  /**
   * Generate cache key for URL
   */
  private getCacheKey(url: string): string {
    return createHash('sha256').update(url).digest('hex');
  }

  /**
   * Check cache for URL
   */
  private getFromCache(url: string): FetchResult | null {
    const key = this.getCacheKey(url);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    if (age > this.cacheMaxAge) {
      this.cache.delete(key);
      return null;
    }

    logger.debug('Cache hit', { metadata: { url, age_ms: age } });
    return { ...entry.result, fromCache: true };
  }

  /**
   * Save to cache
   */
  private saveToCache(url: string, result: FetchResult, etag?: string) {
    const key = this.getCacheKey(url);

    // LRU cache eviction
    if (this.cache.size >= this.maxCacheSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now(),
      etag,
    });
  }

  /**
   * Check if URL is being processed
   */
  private isProcessing(url: string): boolean {
    return this.processing.has(url);
  }

  /**
   * Calculate exponential backoff delay
   */
  private getBackoffDelay(retryCount: number): number {
    return this.baseDelayMs * Math.pow(2, retryCount);
  }

  /**
   * Sleep for specified milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  /**
   * Check robots.txt and rate limits
   */
  private async checkPermissions(url: string): Promise<{ allowed: boolean; reason?: string }> {
    // Check robots.txt
    try {
      const allowed = await robotsParser.isAllowed(url);
      if (!allowed) {
        return { allowed: false, reason: 'Disallowed by robots.txt' };
      }

      // Get crawl delay from robots.txt
      const crawlDelay = await robotsParser.getCrawlDelay(url);
      if (crawlDelay) {
        rateLimiter.applyRobotsCrawlDelay(url, crawlDelay);
      }
    } catch (error) {
      logger.warn('Failed to check robots.txt, proceeding anyway', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }

    // Check rate limit
    const canFetch = rateLimiter.canMakeRequest(url);
    if (!canFetch) {
      return { allowed: false, reason: 'Rate limit exceeded' };
    }

    return { allowed: true };
  }

  /**
   * Fetch URL with retries
   */
  private async fetchWithRetry(request: FetchRequest, retryCount: number = 0): Promise<FetchResult> {
    const { url, runId, maxRetries = this.maxRetries, extractContent = true, convertMarkdown = true } = request;

    const startTime = Date.now();

    try {
      // Publish fetch start event
      publishEvent(createFetchStartEvent(runId, { url }, { type: 'url', value: url }));

      // Wait for rate limit slot
      await rateLimiter.waitForSlot(url);

      // Fetch HTML
      const response: FetchResponse = await httpClient.get(url);

      // Record request
      rateLimiter.recordRequest(url);

      // Check if successful
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      let extracted: ExtractedContent | undefined;
      let markdown: MarkdownResult | undefined;

      // Extract content if requested
      if (extractContent && response.contentType.includes('text/html')) {
        publishEvent(createExtractStartEvent(
          runId,
          { url, html_size: response.body.length },
          { type: 'url', value: url }
        ));

        extracted = await contentExtractor.extract(response.body, url);

        // Convert to markdown if requested
        if (convertMarkdown) {
          markdown = markdownConverter.convertWithMetadata(extracted.content);
        }

        publishEvent(createExtractCompleteEvent(
          runId,
          { url },
          {
            text_length: extracted.textContent.length,
            markdown_length: markdown?.markdown.length || 0,
            extraction_method: 'readability',
            duration_ms: Date.now() - startTime,
          }
        ));
      }

      const result: FetchResult = {
        url,
        finalUrl: response.finalUrl,
        status: response.status,
        contentType: response.contentType,
        html: response.body,
        extracted,
        markdown,
        duration_ms: Date.now() - startTime,
        fromCache: false,
        retries: retryCount,
      };

      // Publish fetch complete event
      publishEvent(createFetchCompleteEvent(
        runId,
        { url },
        {
          status_code: response.status,
          content_length: response.body.length,
          content_type: response.contentType,
          duration_ms: result.duration_ms,
        }
      ));

      logger.info('Fetch completed successfully', {
        metadata: {
          url,
          status: response.status,
          content_length: response.body.length,
          extracted: !!extracted,
          markdown: !!markdown,
          duration_ms: result.duration_ms,
          retries: retryCount,
        },
      });

      return result;
    } catch (error) {
      const duration = Date.now() - startTime;

      // Check if we should retry
      if (retryCount < maxRetries) {
        const delay = this.getBackoffDelay(retryCount);

        logger.warn('Fetch failed, retrying', {
          metadata: {
            url,
            error: error instanceof Error ? error.message : String(error),
            retry_count: retryCount + 1,
            max_retries: maxRetries,
            delay_ms: delay,
          },
        });

        // Wait with exponential backoff
        await this.sleep(delay);

        // Retry
        return this.fetchWithRetry(request, retryCount + 1);
      }

      // Max retries exceeded, publish error event
      publishEvent(createFetchErrorEvent(
        runId,
        { url },
        {
          message: error instanceof Error ? error.message : String(error),
          code: 'FETCH_ERROR',
        }
      ));

      logger.error('Fetch failed after retries', {
        metadata: {
          url,
          error: error instanceof Error ? error.message : String(error),
          retries: retryCount,
          duration_ms: duration,
        },
      });

      throw error;
    }
  }

  /**
   * Fetch a URL with orchestration
   */
  async fetch(request: FetchRequest): Promise<FetchResult> {
    const { url, skipCache = false } = request;

    // Check cache first
    if (!skipCache) {
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    // Check if already processing (deduplication)
    if (this.isProcessing(url)) {
      logger.debug('URL already being processed, waiting', { metadata: { url } });

      // Wait for existing request to complete
      while (this.isProcessing(url)) {
        await this.sleep(100);
      }

      // Check cache again after waiting
      const cached = this.getFromCache(url);
      if (cached) {
        return cached;
      }
    }

    // Check permissions (robots.txt, rate limit)
    const permissions = await this.checkPermissions(url);
    if (!permissions.allowed) {
      throw new Error(`Fetch not allowed: ${permissions.reason}`);
    }

    // Mark as processing
    this.processing.add(url);

    try {
      // Fetch with retry logic
      const result = await this.fetchWithRetry(request);

      // Save to cache
      this.saveToCache(url, result);

      return result;
    } finally {
      // Remove from processing
      this.processing.delete(url);
    }
  }

  /**
   * Fetch multiple URLs concurrently
   */
  async fetchMultiple(requests: FetchRequest[], concurrency: number = 5): Promise<FetchResult[]> {
    const results: FetchResult[] = [];
    const errors: Array<{ url: string; error: Error }> = [];

    // Process in batches
    for (let i = 0; i < requests.length; i += concurrency) {
      const batch = requests.slice(i, i + concurrency);

      const batchResults = await Promise.allSettled(
        batch.map((req) => this.fetch(req))
      );

      batchResults.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          results.push(result.value);
        } else {
          const batchItem = batch[index];
          if (batchItem) {
            errors.push({
              url: batchItem.url,
              error: result.reason,
            });
          }
        }
      });
    }

    if (errors.length > 0) {
      logger.warn('Some fetches failed', {
        metadata: {
          total: requests.length,
          failed: errors.length,
          errors: errors.map((e) => ({ url: e.url, error: e.error.message })),
        },
      });
    }

    return results;
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
    logger.info('Fetch cache cleared');
  }

  /**
   * Get cache stats
   */
  getCacheStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxCacheSize,
      processing: this.processing.size,
      queueSize: this.queue.length,
    };
  }
}

// Singleton instance
export const fetchOrchestrator = new FetchOrchestrator();
