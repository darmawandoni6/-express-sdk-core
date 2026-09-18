import { describe, it, expect } from 'vitest';
import { loadConfig } from '../src/config/index.js';

describe('Config Module', () => {
  it('should validate and load valid environment variables', () => {
    const config = loadConfig({
      override: {
        JWT_SECRET: 'a-very-long-secret-key-that-is-at-least-32-chars-long',
        PORT: '8080',
        NODE_ENV: 'test',
      },
    });

    expect(config.JWT_SECRET).toBe('a-very-long-secret-key-that-is-at-least-32-chars-long');
    expect(config.PORT).toBe(8080);
    expect(config.NODE_ENV).toBe('test');
    expect(config.JWT_EXPIRES_IN).toBe('7d'); // Default value
  });

  it('should throw when JWT_SECRET is too short (< 32 chars)', () => {
    expect(() =>
      loadConfig({
        override: {
          JWT_SECRET: 'short-secret',
        },
      }),
    ).toThrow(/JWT_SECRET/);
  });
});
