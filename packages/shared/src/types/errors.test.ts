/**
 * @fileoverview Tests for custom error classes
 * @lastmodified 2025-10-28
 */

import {
  AppError,
  AuthError,
  FetchError,
  GraphError,
  ValidationError,
  ServiceError,
  ConfigError,
} from './errors';

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create error with message and status code', () => {
      const error = new AppError('Test error', 500);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(500);
      expect(error.isOperational).toBe(true);
      expect(error.timestamp).toBeDefined();
    });

    it('should include context in error', () => {
      const context = { userId: '123', action: 'fetch' };
      const error = new AppError('Test error', 500, context);
      expect(error.context).toEqual(context);
    });

    it('should serialize to JSON', () => {
      const error = new AppError('Test error', 500, { key: 'value' });
      const json = error.toJSON();
      expect(json.name).toBe('AppError');
      expect(json.message).toBe('Test error');
      expect(json.statusCode).toBe(500);
      expect(json.context).toEqual({ key: 'value' });
    });
  });

  describe('AuthError', () => {
    it('should create auth error with 401 status', () => {
      const error = new AuthError('Unauthorized');
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe('Unauthorized');
    });
  });

  describe('FetchError', () => {
    it('should create fetch error with URL', () => {
      const error = new FetchError('Failed to fetch', 404, 'https://example.com');
      expect(error.statusCode).toBe(404);
      expect(error.url).toBe('https://example.com');
      expect(error.context?.['url']).toBe('https://example.com');
    });
  });

  describe('GraphError', () => {
    it('should create graph error with query', () => {
      const query = 'MATCH (n) RETURN n';
      const error = new GraphError('Query failed', query);
      expect(error.query).toBe(query);
      expect(error.context?.['query']).toBe(query);
    });
  });

  describe('ValidationError', () => {
    it('should create validation error with fields', () => {
      const fields = ['email', 'password'];
      const error = new ValidationError('Invalid input', fields);
      expect(error.statusCode).toBe(400);
      expect(error.fields).toEqual(fields);
    });
  });

  describe('ServiceError', () => {
    it('should create service error with service name', () => {
      const error = new ServiceError('Service unavailable', 'redis');
      expect(error.statusCode).toBe(503);
      expect(error.service).toBe('redis');
    });
  });

  describe('ConfigError', () => {
    it('should create config error as non-operational', () => {
      const error = new ConfigError('Missing env var');
      expect(error.isOperational).toBe(false);
      expect(error.statusCode).toBe(500);
    });
  });
});
