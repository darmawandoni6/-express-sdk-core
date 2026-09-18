import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  AppError,
  errorHandler,
  notFoundHandler,
} from '../src/middlewares/error/index.js';

describe('Error Handling Middleware', () => {
  it('should handle AppError with appropriate status code and payload', async () => {
    const app = express();
    app.get('/custom-error', () => {
      throw new AppError('Resource not found', {
        statusCode: 404,
        code: 'RESOURCE_NOT_FOUND',
        details: { id: 123 },
      });
    });
    app.use(errorHandler);

    const res = await request(app).get('/custom-error');

    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
    expect(res.body.message).toBe('Resource not found');
    expect(res.body.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('should catch 404 for unhandled routes via notFoundHandler', async () => {
    const app = express();
    app.get('/exists', (_req, res) => res.send('ok'));
    app.use(notFoundHandler);
    app.use(errorHandler);

    const res = await request(app).get('/non-existent-route');

    expect(res.status).toBe(404);
    expect(res.body.code).toBe('NOT_FOUND');
    expect(res.body.message).toContain('/non-existent-route');
  });

  it('should handle unexpected errors with 500 status', async () => {
    const app = express();
    app.get('/crash', () => {
      throw new Error('Unexpected database failure');
    });
    app.use(errorHandler);

    const res = await request(app).get('/crash');

    expect(res.status).toBe(500);
    expect(res.body.success).toBe(false);
    expect(res.body.code).toBe('INTERNAL_ERROR');
  });
});
