/**
 * @fileoverview Tests for health check endpoint
 * @lastmodified 2025-10-28
 */

import request from 'supertest';
import { createApp } from '../app';

describe('Health Check Endpoint', () => {
  const app = createApp();

  it('should return 200 OK for GET /health', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('uptime');
    expect(response.body).toHaveProperty('version');
    expect(response.body).toHaveProperty('dependencies');
  });

  it('should return healthy status', async () => {
    const response = await request(app).get('/health');

    expect(response.body.status).toBe('healthy');
    expect(typeof response.body.uptime).toBe('number');
  });

  it('should include dependency checks', async () => {
    const response = await request(app).get('/health');

    expect(response.body.dependencies).toHaveProperty('neo4j');
    expect(response.body.dependencies).toHaveProperty('opensearch');
    expect(response.body.dependencies).toHaveProperty('redis');
  });
});
