import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app/index.js';

describe('App Factory (createApp)', () => {
  it('should initialize an express application with helmet, cors, and body parser', async () => {
    const app = createApp({
      logger: false, // disable console logs during test
      httpLogger: false,
    });

    app.post('/echo', (req, res) => {
      res.json({ body: req.body });
    });

    const res = await request(app)
      .post('/echo')
      .send({ hello: 'world' });

    expect(res.status).toBe(200);
    expect(res.body.body.hello).toBe('world');
    // Check helmet headers
    expect(res.headers['strict-transport-security']).toBeDefined();
    // Check cors headers
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });
});
