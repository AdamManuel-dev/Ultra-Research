/**
 * @fileoverview Tests for embeddings service
 * @lastmodified 2025-11-05
 */

import OpenAI from 'openai';
import { Redis } from 'ioredis';

import { EmbeddingsService, Embedding, BatchEmbeddingRequest } from './embeddings';

// Mock OpenAI
jest.mock('openai');

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      get: jest.fn(),
      setex: jest.fn(),
      quit: jest.fn(),
    })),
  };
});

describe('EmbeddingsService', () => {
  let service: EmbeddingsService;
  let mockOpenAI: jest.Mocked<OpenAI>;
  let mockRedis: jest.Mocked<Redis>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create service instance
    service = new EmbeddingsService();

    // Get mock instances
    mockOpenAI = (service as any).openai as jest.Mocked<OpenAI>;
    mockRedis = (service as any).redis as jest.Mocked<Redis>;
  });

  describe('generateEmbedding', () => {
    it('should generate embedding for text', async () => {
      const mockEmbedding = new Array(1536).fill(0.1);

      mockOpenAI.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }],
        }),
      } as any;

      mockRedis.get.mockResolvedValue(null);

      const result: Embedding = await service.generateEmbedding('test text');

      expect(result.vector).toEqual(mockEmbedding);
      expect(result.model).toBe('text-embedding-3-small');
      expect(result.dimensions).toBe(1536);
      expect(result.cached).toBe(false);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: 'test text',
        dimensions: 1536,
      });
    });

    it('should return cached embedding if available', async () => {
      const mockEmbedding = new Array(1536).fill(0.2);

      mockRedis.get.mockResolvedValue(JSON.stringify(mockEmbedding));

      const result: Embedding = await service.generateEmbedding('test text', true);

      expect(result.vector).toEqual(mockEmbedding);
      expect(result.cached).toBe(true);

      expect(mockOpenAI.embeddings.create).not.toHaveBeenCalled();
    });

    it('should skip cache if useCache is false', async () => {
      const mockEmbedding = new Array(1536).fill(0.3);

      mockOpenAI.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding }],
        }),
      } as any;

      mockRedis.get.mockResolvedValue(JSON.stringify([1, 2, 3]));

      const result: Embedding = await service.generateEmbedding('test text', false);

      expect(result.vector).toEqual(mockEmbedding);
      expect(result.cached).toBe(false);

      expect(mockRedis.get).not.toHaveBeenCalled();
      expect(mockOpenAI.embeddings.create).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors', async () => {
      mockOpenAI.embeddings = {
        create: jest.fn().mockRejectedValue(new Error('API error')),
      } as any;

      mockRedis.get.mockResolvedValue(null);

      await expect(service.generateEmbedding('test text')).rejects.toThrow('API error');
    });
  });

  describe('generateBatch', () => {
    it('should generate embeddings for batch of texts', async () => {
      const mockEmbeddings = [
        new Array(1536).fill(0.1),
        new Array(1536).fill(0.2),
      ];

      mockOpenAI.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: [
            { embedding: mockEmbeddings[0], index: 0 },
            { embedding: mockEmbeddings[1], index: 1 },
          ],
        }),
      } as any;

      mockRedis.get.mockResolvedValue(null);

      const requests: BatchEmbeddingRequest[] = [
        { text: 'text 1', id: 'id-1' },
        { text: 'text 2', id: 'id-2' },
      ];

      const results = await service.generateBatch(requests);

      expect(results.size).toBe(2);
      expect(results.get('id-1')?.vector).toEqual(mockEmbeddings[0]);
      expect(results.get('id-2')?.vector).toEqual(mockEmbeddings[1]);

      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['text 1', 'text 2'],
        dimensions: 1536,
      });
    });

    it('should handle batches larger than max batch size', async () => {
      const requests: BatchEmbeddingRequest[] = [];
      for (let i = 0; i < 150; i++) {
        requests.push({ text: `text ${i}`, id: `id-${i}` });
      }

      const mockEmbedding = new Array(1536).fill(0.1);

      mockOpenAI.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: Array(100).fill(null).map((_, i) => ({
            embedding: mockEmbedding,
            index: i,
          })),
        }),
      } as any;

      mockRedis.get.mockResolvedValue(null);

      const results = await service.generateBatch(requests);

      expect(results.size).toBe(150);

      // Should make 2 API calls (100 + 50)
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledTimes(2);
    });

    it('should use cached embeddings when available', async () => {
      const mockEmbedding1 = new Array(1536).fill(0.1);
      const mockEmbedding2 = new Array(1536).fill(0.2);

      // First request is cached, second is not
      mockRedis.get
        .mockResolvedValueOnce(JSON.stringify(mockEmbedding1))
        .mockResolvedValueOnce(null);

      mockOpenAI.embeddings = {
        create: jest.fn().mockResolvedValue({
          data: [{ embedding: mockEmbedding2, index: 0 }],
        }),
      } as any;

      const requests: BatchEmbeddingRequest[] = [
        { text: 'text 1', id: 'id-1' },
        { text: 'text 2', id: 'id-2' },
      ];

      const results = await service.generateBatch(requests, true);

      expect(results.size).toBe(2);
      expect(results.get('id-1')?.vector).toEqual(mockEmbedding1);
      expect(results.get('id-1')?.cached).toBe(true);
      expect(results.get('id-2')?.vector).toEqual(mockEmbedding2);
      expect(results.get('id-2')?.cached).toBe(false);

      // Should only call OpenAI for non-cached items
      expect(mockOpenAI.embeddings.create).toHaveBeenCalledWith({
        model: 'text-embedding-3-small',
        input: ['text 2'],
        dimensions: 1536,
      });
    });
  });

  describe('cosineSimilarity', () => {
    it('should calculate cosine similarity correctly', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0, 0];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(1.0);
    });

    it('should handle orthogonal vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [0, 1, 0];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBe(0.0);
    });

    it('should handle opposite vectors', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [-1, 0, 0];

      const similarity = service.cosineSimilarity(vec1, vec2);

      expect(similarity).toBeCloseTo(-1.0, 5);
    });

    it('should throw error for mismatched dimensions', () => {
      const vec1 = [1, 0, 0];
      const vec2 = [1, 0];

      expect(() => service.cosineSimilarity(vec1, vec2)).toThrow('Vector dimensions must match');
    });

    it('should throw error for zero vectors', () => {
      const vec1 = [0, 0, 0];
      const vec2 = [1, 0, 0];

      expect(() => service.cosineSimilarity(vec1, vec2)).toThrow('Vector magnitude cannot be zero');
    });
  });

  describe('close', () => {
    it('should close Redis connection', async () => {
      await service.close();

      expect(mockRedis.quit).toHaveBeenCalled();
    });
  });
});
