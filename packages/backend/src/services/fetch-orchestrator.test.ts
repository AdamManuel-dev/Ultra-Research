/**
 * @fileoverview Tests for fetch orchestrator
 * @lastmodified 2025-11-05
 */

import { FetchOrchestrator, FetchRequest } from './fetch-orchestrator';

// Mock dependencies
jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  },
}));

jest.mock('../utils/event-producers', () => ({
  publishEvent: jest.fn(),
  createFetchStartEvent: jest.fn().mockReturnValue({}),
  createFetchCompleteEvent: jest.fn().mockReturnValue({}),
  createFetchErrorEvent: jest.fn().mockReturnValue({}),
  createExtractStartEvent: jest.fn().mockReturnValue({}),
  createExtractCompleteEvent: jest.fn().mockReturnValue({}),
}));

jest.mock('./http-client', () => ({
  httpClient: {
    get: jest.fn().mockResolvedValue({
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'text/html' },
      body: '<html><body><p>Test content</p></body></html>',
      contentType: 'text/html',
      contentLength: 100,
      finalUrl: 'https://example.com',
      redirectChain: [],
      duration_ms: 100,
    }),
  },
}));

jest.mock('./rate-limiter', () => ({
  rateLimiter: {
    canMakeRequest: jest.fn().mockReturnValue(true),
    waitForSlot: jest.fn().mockResolvedValue(undefined),
    recordRequest: jest.fn(),
    applyRobotsCrawlDelay: jest.fn(),
  },
}));

jest.mock('./robots-parser', () => ({
  robotsParser: {
    isAllowed: jest.fn().mockResolvedValue(true),
    getCrawlDelay: jest.fn().mockResolvedValue(null),
  },
}));

jest.mock('./content-extractor', () => ({
  contentExtractor: {
    extract: jest.fn().mockResolvedValue({
      title: 'Test Title',
      content: '<p>Test content</p>',
      textContent: 'Test content',
      excerpt: 'Test excerpt',
      byline: null,
      dir: null,
      siteName: null,
      lang: 'en',
      publishedTime: null,
      length: 100,
      metadata: {},
    }),
  },
}));

jest.mock('./markdown-converter', () => ({
  markdownConverter: {
    convertWithMetadata: jest.fn().mockReturnValue({
      markdown: '# Test\n\nTest content',
      wordCount: 3,
      linkCount: 0,
      imageCount: 0,
      headingCount: 1,
    }),
  },
}));

describe('FetchOrchestrator', () => {
  let orchestrator: FetchOrchestrator;

  beforeEach(() => {
    orchestrator = new FetchOrchestrator();
    jest.clearAllMocks();
  });

  describe('fetch()', () => {
    it('should fetch URL successfully', async () => {
      const request: FetchRequest = {
        url: 'https://example.com',
        runId: 'test-run-123',
        extractContent: true,
        convertMarkdown: true,
      };

      const result = await orchestrator.fetch(request);

      expect(result).toBeDefined();
      expect(result.url).toBe('https://example.com');
      expect(result.status).toBe(200);
      expect(result.extracted).toBeDefined();
      expect(result.markdown).toBeDefined();
      expect(result.fromCache).toBe(false);
    });

    it('should return cached result on second fetch', async () => {
      const request: FetchRequest = {
        url: 'https://example.com/cached',
        runId: 'test-run-123',
      };

      // First fetch
      const result1 = await orchestrator.fetch(request);
      expect(result1.fromCache).toBe(false);

      // Second fetch should be cached
      const result2 = await orchestrator.fetch(request);
      expect(result2.fromCache).toBe(true);
    });

    it('should skip cache when skipCache is true', async () => {
      const request: FetchRequest = {
        url: 'https://example.com/nocache',
        runId: 'test-run-123',
      };

      // First fetch
      await orchestrator.fetch(request);

      // Second fetch with skipCache
      const result = await orchestrator.fetch({ ...request, skipCache: true });
      expect(result.fromCache).toBe(false);
    });

    it('should handle fetch errors with retry', async () => {
      const { httpClient } = require('./http-client');

      // First two attempts fail, third succeeds
      httpClient.get
        .mockRejectedValueOnce(new Error('Network error'))
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({
          status: 200,
          body: '<html><body>Success</body></html>',
          contentType: 'text/html',
          finalUrl: 'https://example.com',
          duration_ms: 100,
        });

      const request: FetchRequest = {
        url: 'https://example.com/retry',
        runId: 'test-run-123',
        maxRetries: 3,
      };

      const result = await orchestrator.fetch(request);

      expect(result).toBeDefined();
      expect(result.retries).toBeGreaterThan(0);
      expect(httpClient.get).toHaveBeenCalledTimes(3);
    });

    it('should fail after max retries', async () => {
      const { httpClient } = require('./http-client');

      httpClient.get.mockRejectedValue(new Error('Persistent error'));

      const request: FetchRequest = {
        url: 'https://example.com/fail',
        runId: 'test-run-123',
        maxRetries: 2,
      };

      await expect(orchestrator.fetch(request)).rejects.toThrow('Persistent error');
    });

    it('should respect robots.txt disallow', async () => {
      const { robotsParser } = require('./robots-parser');

      robotsParser.isAllowed.mockResolvedValueOnce(false);

      const request: FetchRequest = {
        url: 'https://example.com/disallowed',
        runId: 'test-run-123',
      };

      await expect(orchestrator.fetch(request)).rejects.toThrow('robots.txt');
    });

    it('should deduplicate concurrent requests for same URL', async () => {
      const { httpClient } = require('./http-client');

      // Slow down the fetch
      httpClient.get.mockImplementation(() =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                status: 200,
                body: '<html><body>Content</body></html>',
                contentType: 'text/html',
                finalUrl: 'https://example.com',
                duration_ms: 100,
              }),
            100
          )
        )
      );

      const request: FetchRequest = {
        url: 'https://example.com/dedup',
        runId: 'test-run-123',
      };

      // Start two fetches concurrently
      const [result1, result2] = await Promise.all([
        orchestrator.fetch(request),
        orchestrator.fetch(request),
      ]);

      // Both should succeed
      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Second should be from cache
      expect(result2.fromCache).toBe(true);

      // HTTP client should only be called once
      expect(httpClient.get).toHaveBeenCalledTimes(1);
    });
  });

  describe('fetchMultiple()', () => {
    it('should fetch multiple URLs concurrently', async () => {
      const requests: FetchRequest[] = [
        { url: 'https://example.com/1', runId: 'test-run' },
        { url: 'https://example.com/2', runId: 'test-run' },
        { url: 'https://example.com/3', runId: 'test-run' },
      ];

      const results = await orchestrator.fetchMultiple(requests, 2);

      expect(results).toHaveLength(3);
      expect(results.every((r) => r.status === 200)).toBe(true);
    });

    it('should handle partial failures in batch', async () => {
      const { httpClient } = require('./http-client');

      httpClient.get
        .mockResolvedValueOnce({
          status: 200,
          body: '<html><body>Success</body></html>',
          contentType: 'text/html',
          finalUrl: 'https://example.com/1',
          duration_ms: 100,
        })
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce({
          status: 200,
          body: '<html><body>Success</body></html>',
          contentType: 'text/html',
          finalUrl: 'https://example.com/3',
          duration_ms: 100,
        });

      const requests: FetchRequest[] = [
        { url: 'https://example.com/1', runId: 'test-run', maxRetries: 0 },
        { url: 'https://example.com/2', runId: 'test-run', maxRetries: 0 },
        { url: 'https://example.com/3', runId: 'test-run', maxRetries: 0 },
      ];

      const results = await orchestrator.fetchMultiple(requests);

      expect(results).toHaveLength(2); // Only successful ones
    });
  });

  describe('cache management', () => {
    it('should clear cache', () => {
      orchestrator.clearCache();

      const stats = orchestrator.getCacheStats();
      expect(stats.size).toBe(0);
    });

    it('should return cache stats', async () => {
      const request: FetchRequest = {
        url: 'https://example.com/stats',
        runId: 'test-run-123',
      };

      await orchestrator.fetch(request);

      const stats = orchestrator.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('maxSize');
      expect(stats).toHaveProperty('processing');
      expect(stats).toHaveProperty('queueSize');
      expect(stats.size).toBeGreaterThan(0);
    });
  });
});
