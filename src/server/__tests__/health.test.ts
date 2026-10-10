import { describe, it, expect } from 'vitest';
import request from 'supertest';

// Import the app for testing
import express from 'express';
import { apiRouter } from '../routes';
import { db } from '../db';

const app = express();
app.use(express.json());
app.use('/api', apiRouter);

describe('Health Check', () => {
  it('GET /api/health should return 200 with status, timestamp, and uptime', async () => {
    const res = await request(app).get('/api/health');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('uptime');
    expect(typeof res.body.uptime).toBe('number');
  });
});

describe('CSRF Token', () => {
  it('GET /api/csrf-token should return a csrfToken', async () => {
    const res = await request(app).get('/api/csrf-token');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('csrfToken');
    expect(typeof res.body.csrfToken).toBe('string');
    expect(res.body.csrfToken.length).toBeGreaterThan(0);
  });
});
