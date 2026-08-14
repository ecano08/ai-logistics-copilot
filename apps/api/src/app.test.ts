import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

vi.mock('./db', () => ({
  db: {
    query: vi.fn().mockResolvedValue({ rows: [{ '?column?': 1 }] }),
  },
}));

import { app } from './app';

describe('GET /health', () => {
  it('returns API health status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);

    expect(response.body).toEqual({
      status: 'ok',
      service: 'api',
      database: 'connected',
    });
  });
});