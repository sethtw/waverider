import request from 'supertest';
import app, { server } from '../src/index.ts';
import { describe, it, afterAll, expect } from '@jest/globals';

describe('Analysis Routes', () => {
  afterAll(done => {
    server.close(done);
  });

  it('should return a healthy status', async () => {
    const res = await request(app).get('/health');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('status', 'healthy');
  });

  it('should return the analysis engine status', async () => {
    const res = await request(app).get('/api/analysis/status');
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('data.status', 'running');
    expect(res.body).toHaveProperty('data.version', '1.0.0');
  });
}); 