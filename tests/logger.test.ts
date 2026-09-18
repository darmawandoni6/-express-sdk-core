import { describe, it, expect, beforeEach } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  createLogger,
  resetLogger,
  createHttpLogger,
} from '../src/middlewares/logger/index.js';

describe('Logger Module', () => {
  beforeEach(() => {
    resetLogger();
  });

  it('should create a singleton Winston logger', () => {
    const logger1 = createLogger({ level: 'info', serviceName: 'test-service' });
    const logger2 = createLogger();

    expect(logger1).toBeDefined();
    expect(logger1).toBe(logger2);
  });

  it('should reset the singleton logger when requested', () => {
    const logger1 = createLogger({ serviceName: 'service-1' });
    resetLogger();
    const logger2 = createLogger({ serviceName: 'service-2' });

    expect(logger1).not.toBe(logger2);
  });

  it('should stream Morgan HTTP requests into Winston logger', async () => {
    const logMessages: string[] = [];
    const logger = createLogger();

    // Mock logger.http to collect output
    const originalHttp = logger.http.bind(logger);
    logger.http = (msg: string) => {
      logMessages.push(msg);
      return logger;
    };

    const app = express();
    app.use(createHttpLogger(logger));
    app.get('/ping', (_req, res) => res.send('pong'));

    await request(app).get('/ping');

    expect(logMessages.length).toBeGreaterThan(0);
    expect(logMessages[0]).toContain('GET /ping');

    // Restore
    logger.http = originalHttp;
  });
});
