import { describe, it, expect } from 'vitest';
import express from 'express';
import request from 'supertest';
import {
  hashPassword,
  comparePassword,
  hashPasswordSync,
  comparePasswordSync,
  signToken,
  verifyToken,
  decodeToken,
  createJwtMiddleware,
} from '../src/middlewares/auth/index.js';

describe('Auth - Bcrypt Utilities', () => {
  it('should hash and compare passwords asynchronously', async () => {
    const raw = 'my-secret-password-123';
    const hash = await hashPassword(raw);

    expect(hash).toBeDefined();
    expect(hash).not.toBe(raw);

    const isMatch = await comparePassword(raw, hash);
    expect(isMatch).toBe(true);

    const isWrongMatch = await comparePassword('wrong-pass', hash);
    expect(isWrongMatch).toBe(false);
  });

  it('should hash and compare passwords synchronously', () => {
    const raw = 'sync-password-abc';
    const hash = hashPasswordSync(raw, 8);

    expect(hash).toBeDefined();
    expect(comparePasswordSync(raw, hash)).toBe(true);
    expect(comparePasswordSync('invalid', hash)).toBe(false);
  });
});

describe('Auth - JWT Utilities', () => {
  const secret = 'super-secret-key-that-is-at-least-32-chars-long';

  it('should sign and verify a token', () => {
    const payload = { sub: 'user-123', role: 'admin' };
    const token = signToken(payload, { secret, expiresIn: '1h' });

    expect(token).toBeTypeOf('string');

    const decoded = verifyToken(token, secret);
    expect(decoded.sub).toBe('user-123');
    expect(decoded['role']).toBe('admin');
    expect(decoded.exp).toBeDefined();
  });

  it('should decode a token without verifying', () => {
    const token = signToken({ sub: 'user-456' }, { secret });
    const decoded = decodeToken(token);
    expect(decoded?.sub).toBe('user-456');
  });

  it('should throw when verifying with wrong secret', () => {
    const token = signToken({ sub: 'user-789' }, { secret });
    expect(() => verifyToken(token, 'wrong-secret-key')).toThrow();
  });
});

describe('Auth - JWT Middleware', () => {
  const secret = 'super-secret-jwt-key-for-middleware-testing';

  const createTestApp = () => {
    const app = express();
    app.use(express.json());
    app.get('/protected', createJwtMiddleware({ secret }), (req, res) => {
      res.json({ success: true, user: req.user });
    });
    return app;
  };

  it('should return 401 if Authorization header is missing', async () => {
    const app = createTestApp();
    const res = await request(app).get('/protected');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should return 401 if token is invalid', async () => {
    const app = createTestApp();
    const res = await request(app)
      .get('/protected')
      .set('Authorization', 'Bearer invalid.token.value');

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it('should pass and attach req.user if token is valid', async () => {
    const app = createTestApp();
    const token = signToken({ sub: 'user-999', name: 'John Doe' }, { secret });

    const res = await request(app)
      .get('/protected')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.sub).toBe('user-999');
    expect(res.body.user.name).toBe('John Doe');
  });
});
