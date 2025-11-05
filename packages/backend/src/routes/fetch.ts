/**
 * @fileoverview Fetch API routes for content fetching and extraction
 * @lastmodified 2025-11-05
 *
 * Features: Fetch URLs, extract content, convert to markdown, batch operations
 * Main APIs: POST /fetch, POST /fetch/batch, GET /fetch/stats
 * Constraints: Validates URLs, respects rate limits and robots.txt
 * Patterns: RESTful API with async request handling
 */

import { Router, Request, Response } from 'express';

import { asyncHandler } from '../middleware/errorHandler';
import { fetchOrchestrator, FetchRequest } from '../services/fetch-orchestrator';
import { logger } from '../utils/logger';

export const fetchRouter = Router();

/**
 * POST /fetch
 * Fetch a single URL with content extraction
 */
fetchRouter.post(
  '/',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      url,
      runId,
      extractContent = true,
      convertMarkdown = true,
      skipCache = false,
    } = req.body;

    // Validate required fields
    if (!url || !runId) {
      res.status(400).json({
        success: false,
        error: 'url and runId are required',
      });
      return;
    }

    // Validate URL format
    try {
      new URL(url);
    } catch {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
      return;
    }

    const fetchRequest: FetchRequest = {
      url,
      runId,
      extractContent,
      convertMarkdown,
      skipCache,
    };

    try {
      const result = await fetchOrchestrator.fetch(fetchRequest);

      logger.info('Fetch request completed', {
        metadata: {
          url,
          runId,
          status: result.status,
          fromCache: result.fromCache,
        },
      });

      res.json({
        success: true,
        data: {
          url: result.url,
          finalUrl: result.finalUrl,
          status: result.status,
          contentType: result.contentType,
          title: result.extracted?.title,
          excerpt: result.extracted?.excerpt,
          textLength: result.extracted?.textContent.length,
          markdownLength: result.markdown?.markdown.length,
          wordCount: result.markdown?.wordCount,
          linkCount: result.markdown?.linkCount,
          duration_ms: result.duration_ms,
          fromCache: result.fromCache,
          retries: result.retries,
          metadata: result.extracted?.metadata,
        },
      });
    } catch (error) {
      logger.error('Fetch request failed', {
        metadata: {
          url,
          runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Fetch failed',
      });
    }
  })
);

/**
 * POST /fetch/batch
 * Fetch multiple URLs concurrently
 */
fetchRouter.post(
  '/batch',
  asyncHandler(async (req: Request, res: Response) => {
    const {
      urls,
      runId,
      extractContent = true,
      convertMarkdown = true,
      concurrency = 5,
    } = req.body;

    // Validate required fields
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      res.status(400).json({
        success: false,
        error: 'urls array is required and must not be empty',
      });
      return;
    }

    if (!runId) {
      res.status(400).json({
        success: false,
        error: 'runId is required',
      });
      return;
    }

    // Validate URLs
    for (const url of urls) {
      try {
        new URL(url);
      } catch {
        res.status(400).json({
          success: false,
          error: `Invalid URL format: ${url}`,
        });
        return;
      }
    }

    const requests: FetchRequest[] = urls.map((url: string) => ({
      url,
      runId,
      extractContent,
      convertMarkdown,
    }));

    try {
      const results = await fetchOrchestrator.fetchMultiple(requests, concurrency);

      logger.info('Batch fetch completed', {
        metadata: {
          runId,
          total: urls.length,
          successful: results.length,
          failed: urls.length - results.length,
        },
      });

      res.json({
        success: true,
        data: {
          total: urls.length,
          successful: results.length,
          failed: urls.length - results.length,
          results: results.map((r) => ({
            url: r.url,
            finalUrl: r.finalUrl,
            status: r.status,
            title: r.extracted?.title,
            textLength: r.extracted?.textContent.length,
            markdownLength: r.markdown?.markdown.length,
            fromCache: r.fromCache,
          })),
        },
      });
    } catch (error) {
      logger.error('Batch fetch failed', {
        metadata: {
          runId,
          error: error instanceof Error ? error.message : String(error),
        },
      });

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Batch fetch failed',
      });
    }
  })
);

/**
 * GET /fetch/stats
 * Get fetch cache and queue statistics
 */
fetchRouter.get(
  '/stats',
  asyncHandler(async (_req: Request, res: Response) => {
    const stats = fetchOrchestrator.getCacheStats();

    res.json({
      success: true,
      data: stats,
    });
  })
);

/**
 * POST /fetch/cache/clear
 * Clear fetch cache
 */
fetchRouter.post(
  '/cache/clear',
  asyncHandler(async (_req: Request, res: Response) => {
    fetchOrchestrator.clearCache();

    logger.info('Fetch cache cleared via API');

    res.json({
      success: true,
      message: 'Cache cleared successfully',
    });
  })
);

/**
 * GET /fetch/content/:url
 * Get full fetched content with HTML and markdown
 */
fetchRouter.get(
  '/content',
  asyncHandler(async (req: Request, res: Response) => {
    const { url, runId } = req.query;

    if (!url || !runId) {
      res.status(400).json({
        success: false,
        error: 'url and runId query parameters are required',
      });
      return;
    }

    // Validate URL
    try {
      new URL(url as string);
    } catch {
      res.status(400).json({
        success: false,
        error: 'Invalid URL format',
      });
      return;
    }

    const fetchRequest: FetchRequest = {
      url: url as string,
      runId: runId as string,
      extractContent: true,
      convertMarkdown: true,
    };

    try {
      const result = await fetchOrchestrator.fetch(fetchRequest);

      res.json({
        success: true,
        data: {
          url: result.url,
          finalUrl: result.finalUrl,
          status: result.status,
          contentType: result.contentType,
          html: result.html,
          extracted: result.extracted,
          markdown: result.markdown?.markdown,
          duration_ms: result.duration_ms,
          fromCache: result.fromCache,
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Fetch failed',
      });
    }
  })
);
