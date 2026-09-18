import { describe, it, expect, afterAll } from 'vitest';
import express from 'express';
import request from 'supertest';
import fs from 'node:fs';
import path from 'node:path';
import {
  createMemoryUpload,
  createDiskUpload,
  createMemoryUploadArray,
} from '../src/middlewares/upload/index.js';
import { errorHandler } from '../src/middlewares/error/index.js';

describe('Upload Middleware', () => {
  const uploadDir = path.join(process.cwd(), 'test-uploads');

  afterAll(() => {
    if (fs.existsSync(uploadDir)) {
      fs.rmSync(uploadDir, { recursive: true, force: true });
    }
  });

  it('should handle single file upload to memory', async () => {
    const app = express();
    app.post(
      '/upload-memory',
      createMemoryUpload({ allowedMimeTypes: ['text/plain'] }),
      (req, res) => {
        if (!req.file) {
          res.status(400).json({ error: 'No file' });
          return;
        }
        res.json({
          filename: req.file.originalname,
          size: req.file.size,
          content: req.file.buffer.toString('utf-8'),
        });
      },
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/upload-memory')
      .attach('file', Buffer.from('hello world content'), {
        filename: 'hello.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(200);
    expect(res.body.filename).toBe('hello.txt');
    expect(res.body.content).toBe('hello world content');
  });

  it('should reject disallowed mime types', async () => {
    const app = express();
    app.post(
      '/upload-images-only',
      createMemoryUpload({ allowedMimeTypes: ['image/png'] }),
      (req, res) => res.json({ success: true }),
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/upload-images-only')
      .attach('file', Buffer.from('not an image'), {
        filename: 'doc.pdf',
        contentType: 'application/pdf',
      });

    expect(res.status).toBe(500); // Thrown error from fileFilter handled by errorHandler
  });

  it('should handle multiple files upload to memory', async () => {
    const app = express();
    app.post(
      '/upload-multiple',
      createMemoryUploadArray({
        fieldName: 'docs',
        allowedMimeTypes: ['text/plain'],
        maxCount: 3,
      }),
      (req, res) => {
        const files = req.files as Express.Multer.File[];
        res.json({ count: files.length });
      },
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/upload-multiple')
      .attach('docs', Buffer.from('file 1'), {
        filename: '1.txt',
        contentType: 'text/plain',
      })
      .attach('docs', Buffer.from('file 2'), {
        filename: '2.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(200);
    expect(res.body.count).toBe(2);
  });

  it('should handle single file upload to disk', async () => {
    const app = express();
    app.post(
      '/upload-disk',
      createDiskUpload({
        dest: uploadDir,
        allowedMimeTypes: ['text/plain'],
      }),
      (req, res) => {
        res.json({
          savedName: req.file?.filename,
          path: req.file?.path,
        });
      },
    );
    app.use(errorHandler);

    const res = await request(app)
      .post('/upload-disk')
      .attach('file', Buffer.from('persisted on disk'), {
        filename: 'persist.txt',
        contentType: 'text/plain',
      });

    expect(res.status).toBe(200);
    expect(res.body.savedName).toBeDefined();
    expect(fs.existsSync(res.body.path)).toBe(true);
  });
});
