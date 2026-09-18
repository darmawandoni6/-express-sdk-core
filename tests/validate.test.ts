import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import { z } from 'zod';
import {
  validate,
  validateBody,
  validateQuery,
  validateParams,
  validateRequest,
} from '../src/middlewares/validate/index.js';

describe('Validation Middleware', () => {
  it('should validate request body and return 400 on invalid data', async () => {
    const app = express();
    app.use(express.json());

    const schema = z.object({
      email: z.string().email(),
      age: z.number().min(18),
    });

    app.post('/user', validateBody(schema), (req, res) => {
      res.json({ success: true, data: req.body });
    });

    // Invalid body
    const invalidRes = await request(app)
      .post('/user')
      .send({ email: 'not-an-email', age: 15 });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.success).toBe(false);
    expect(invalidRes.body.errors.email).toBeDefined();
    expect(invalidRes.body.errors.age).toBeDefined();

    // Valid body
    const validRes = await request(app)
      .post('/user')
      .send({ email: 'john@example.com', age: 25 });

    expect(validRes.status).toBe(200);
    expect(validRes.body.success).toBe(true);
    expect(validRes.body.data.email).toBe('john@example.com');
  });

  it('should validate and coerce query parameters', async () => {
    const app = express();

    const querySchema = z.object({
      page: z.coerce.number().min(1).default(1),
      search: z.string().optional(),
    });

    app.get('/items', validateQuery(querySchema), (req, res) => {
      res.json({ success: true, query: req.query });
    });

    const res = await request(app).get('/items?page=2&search=test');
    expect(res.status).toBe(200);
    expect(res.body.query.page).toBe(2);
    expect(res.body.query.search).toBe('test');
  });

  it('should validate route params', async () => {
    const app = express();

    const paramsSchema = z.object({
      id: z.coerce.number().positive(),
    });

    app.get('/items/:id', validateParams(paramsSchema), (req, res) => {
      res.json({ success: true, id: req.params['id'] });
    });

    const invalidRes = await request(app).get('/items/abc');
    expect(invalidRes.status).toBe(400);

    const validRes = await request(app).get('/items/42');
    expect(validRes.status).toBe(200);
    expect(validRes.body.id).toBe(42);
  });

  it('should validate composite request (validateRequest)', async () => {
    const app = express();
    app.use(express.json());

    app.post(
      '/products/:id',
      validateRequest({
        params: z.object({ id: z.coerce.number() }),
        query: z.object({ notify: z.enum(['true', 'false']).optional() }),
        body: z.object({ title: z.string().min(3), price: z.number().positive() }),
      }),
      (req, res) => {
        res.json({
          params: req.params,
          query: req.query,
          body: req.body,
        });
      },
    );

    const invalidRes = await request(app)
      .post('/products/abc')
      .send({ title: 'a', price: -5 });

    expect(invalidRes.status).toBe(400);
    expect(invalidRes.body.errors.params).toBeDefined();
    expect(invalidRes.body.errors.body).toBeDefined();

    const validRes = await request(app)
      .post('/products/10?notify=true')
      .send({ title: 'MacBook Pro', price: 1999 });

    expect(validRes.status).toBe(200);
    expect(validRes.body.params.id).toBe(10);
    expect(validRes.body.body.title).toBe('MacBook Pro');
  });
});
