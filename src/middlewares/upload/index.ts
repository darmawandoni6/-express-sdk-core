import type { Request, RequestHandler } from "express";

import multer from "multer";
import crypto from "node:crypto";
import path from "node:path";

import type { CustomFileFilter, DiskUploadConfig, MemoryUploadConfig } from "./types";

const DEFAULT_ALLOWED_MIME = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const DEFAULT_MAX_SIZE = 5 * 1024 * 1024; // 5 MB

function generateUuidFilename(_req: Request, file: Express.Multer.File): string {
  const ext = path.extname(file.originalname).toLowerCase();
  const safeExt = /^\.[a-z0-9]+$/.test(ext) ? ext : "";
  return `${crypto.randomUUID()}${safeExt}`;
}

function buildFileFilter(allowedMimeTypes?: string[], customFilter?: CustomFileFilter): multer.Options["fileFilter"] {
  if (customFilter) {
    return (req, file, cb) => {
      customFilter(req as unknown as Request, file, cb);
    };
  }

  const allowed = allowedMimeTypes ?? DEFAULT_ALLOWED_MIME;

  return (_req, file, cb) => {
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Invalid file type "${file.mimetype}". Allowed types: ${allowed.join(", ")}`));
    }
  };
}

/**
 * Membuat Multer instance dengan disk storage.
 */
export function createDiskMulter(config: DiskUploadConfig = {}): multer.Multer {
  const storage = multer.diskStorage({
    destination: config.dest ?? "uploads/",
    filename: (req, file, cb) => {
      const filenameGen = config.filenameGenerator ?? generateUuidFilename;
      cb(null, filenameGen(req as unknown as Request, file));
    },
  });

  return multer({
    storage,
    fileFilter: buildFileFilter(config.allowedMimeTypes, config.fileFilter),
    limits: {
      fileSize: config.maxFileSize ?? DEFAULT_MAX_SIZE,
    },
  });
}

/**
 * Membuat Multer instance dengan memory storage (file tersimpan di buffer).
 */
export function createMemoryMulter(config: MemoryUploadConfig = {}): multer.Multer {
  return multer({
    storage: multer.memoryStorage(),
    fileFilter: buildFileFilter(config.allowedMimeTypes, config.fileFilter),
    limits: {
      fileSize: config.maxFileSize ?? DEFAULT_MAX_SIZE,
    },
  });
}

/**
 * Middleware untuk upload single file ke disk.
 */
export function createDiskUpload(config: DiskUploadConfig = {}): RequestHandler {
  const upload = createDiskMulter(config);
  return upload.single(config.fieldName ?? "file") as unknown as RequestHandler;
}

/**
 * Middleware untuk upload multiple files (array) ke disk.
 */
export function createDiskUploadMultiple(config: DiskUploadConfig = {}): RequestHandler {
  const upload = createDiskMulter(config);
  return upload.array(config.fieldName ?? "files", config.maxCount ?? 10) as unknown as RequestHandler;
}

/**
 * Middleware untuk upload single file ke memory (req.file.buffer).
 */
export function createMemoryUpload(config: MemoryUploadConfig = {}): RequestHandler {
  const upload = createMemoryMulter(config);
  return upload.single(config.fieldName ?? "file") as unknown as RequestHandler;
}

/**
 * Middleware untuk upload multiple files ke memory.
 */
export function createMemoryUploadMultiple(config: MemoryUploadConfig = {}): RequestHandler {
  const upload = createMemoryMulter(config);
  return upload.array(config.fieldName ?? "files", config.maxCount ?? 10) as unknown as RequestHandler;
}

export type { CustomFileFilter, DiskUploadConfig, MemoryUploadConfig };
