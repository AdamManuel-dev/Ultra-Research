/**
 * @fileoverview Search API routes for hybrid search
 * @lastmodified 2025-11-05
 */

import express, { Request, Response } from 'express';

import { documentIndexer } from '../services/document-indexer';
import { hybridRetriever, SearchOptions } from '../services/hybrid-retriever';
import { logger } from '../utils/logger';

const router = express.Router();

/**
 * POST /search
 * Perform hybrid search
 */
router.post('/', async (req: Request, res: Response) => {
  try {
    const { query, size = 10, minScore, hybridWeight, includeHighlights, filters } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Query is required and must be a string',
      });
      return;
    }

    const options: SearchOptions = {
      size: typeof size === 'number' ? size : 10,
      minScore: typeof minScore === 'number' ? minScore : undefined,
      hybridWeight: typeof hybridWeight === 'number' ? hybridWeight : 0.5,
      includeHighlights: typeof includeHighlights === 'boolean' ? includeHighlights : false,
      filters: filters && typeof filters === 'object' ? filters : undefined,
    };

    const results = await hybridRetriever.search(query, options);

    res.json(results);
  } catch (error) {
    logger.error('Search request failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Search failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /search/documents
 * Search and group results by document
 */
router.post('/documents', async (req: Request, res: Response) => {
  try {
    const { query, size = 20, minScore, hybridWeight, includeHighlights, filters } = req.body;

    if (!query || typeof query !== 'string') {
      res.status(400).json({
        error: 'Query is required and must be a string',
      });
      return;
    }

    const options: SearchOptions = {
      size: typeof size === 'number' ? size : 20,
      minScore: typeof minScore === 'number' ? minScore : undefined,
      hybridWeight: typeof hybridWeight === 'number' ? hybridWeight : 0.5,
      includeHighlights: typeof includeHighlights === 'boolean' ? includeHighlights : false,
      filters: filters && typeof filters === 'object' ? filters : undefined,
    };

    const searchResponse = await hybridRetriever.search(query, options);

    // Group by document
    const grouped = hybridRetriever.groupByDocument(searchResponse.results);

    // Convert to array format
    const documents = Array.from(grouped.entries()).map(([documentId, chunks]) => ({
      document_id: documentId,
      url: chunks[0]?.url || '',
      title: chunks[0]?.title || '',
      chunks: chunks.map((chunk) => ({
        chunk_id: chunk.chunk_id,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        score: chunk.score,
        rank: chunk.rank,
        highlights: chunk.highlights,
      })),
      topScore: chunks[0]?.score || 0,
      totalChunks: chunks.length,
    }));

    // Sort documents by top score
    documents.sort((a, b) => b.topScore - a.topScore);

    res.json({
      documents,
      total: searchResponse.total,
      duration_ms: searchResponse.duration_ms,
      searchMethod: searchResponse.searchMethod,
    });
  } catch (error) {
    logger.error('Document search request failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Document search failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /search/similar/:chunkId
 * Find similar chunks
 */
router.get('/similar/:chunkId', async (req: Request, res: Response) => {
  try {
    const chunkId = req.params['chunkId'];
    if (!chunkId) {
      res.status(400).json({ error: 'Missing chunk ID' });
      return;
    }
    const size = typeof req.query['size'] === 'string' ? parseInt(req.query['size'], 10) : 10;

    const results = await hybridRetriever.findSimilar(chunkId, size);

    res.json({
      results,
      total: results.length,
    });
  } catch (error) {
    logger.error('Similar chunks request failed', {
      metadata: {
        chunk_id: req.params['chunkId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to find similar chunks',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * POST /search/index
 * Index a document
 */
router.post('/index', async (req: Request, res: Response) => {
  try {
    const { document_id, url, title, content, author, published_date, metadata } = req.body;

    if (!document_id || !url || !title || !content) {
      res.status(400).json({
        error: 'Missing required fields: document_id, url, title, content',
      });
      return;
    }

    const result = await documentIndexer.indexDocument({
      document_id,
      url,
      title,
      content,
      author,
      published_date,
      fetched_at: new Date().toISOString(),
      metadata,
    });

    res.json(result);
  } catch (error) {
    logger.error('Index request failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Indexing failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * DELETE /search/index/:documentId
 * Delete a document
 */
router.delete('/index/:documentId', async (req: Request, res: Response) => {
  try {
    const documentId = req.params['documentId'];
    if (!documentId) {
      res.status(400).json({ error: 'Missing document ID' });
      return;
    }

    const deleted = await documentIndexer.deleteDocument(documentId);

    if (deleted) {
      res.json({
        success: true,
        document_id: documentId,
      });
    } else {
      res.status(404).json({
        error: 'Document not found',
      });
    }
  } catch (error) {
    logger.error('Delete request failed', {
      metadata: {
        document_id: req.params['documentId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Delete failed',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /search/document/:documentId
 * Get a document by ID
 */
router.get('/document/:documentId', async (req: Request, res: Response) => {
  try {
    const documentId = req.params['documentId'];
    if (!documentId) {
      res.status(400).json({ error: 'Missing document ID' });
      return;
    }

    const chunks = await documentIndexer.getDocument(documentId);

    if (chunks.length === 0) {
      res.status(404).json({
        error: 'Document not found',
      });
      return;
    }

    res.json({
      document_id: documentId,
      url: chunks[0]?.metadata['url'] || '',
      title: chunks[0]?.metadata['title'] || '',
      chunks: chunks.map((chunk) => ({
        chunk_id: chunk.chunk_id,
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        start_char: chunk.start_char,
        end_char: chunk.end_char,
      })),
      metadata: chunks[0]?.metadata || {},
    });
  } catch (error) {
    logger.error('Get document request failed', {
      metadata: {
        document_id: req.params['documentId'] || 'unknown',
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to get document',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

/**
 * GET /search/stats
 * Get index statistics
 */
router.get('/stats', async (_req: Request, res: Response) => {
  try {
    const stats = await documentIndexer.getStats();

    res.json(stats);
  } catch (error) {
    logger.error('Stats request failed', {
      metadata: {
        error: error instanceof Error ? error.message : String(error),
      },
    });

    res.status(500).json({
      error: 'Failed to get stats',
      message: error instanceof Error ? error.message : String(error),
    });
  }
});

export default router;
