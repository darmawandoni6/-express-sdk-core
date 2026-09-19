import type { Request } from "express";

import type { FileFilterCallback } from "multer";

export type CustomFileFilter = (req: Request, file: Express.Multer.File, callback: FileFilterCallback) => void;

export interface BaseUploadConfig {
  /** Ukuran file maksimum dalam bytes. Default: 5MB (5 * 1024 * 1024) */
  maxFileSize?: number;
  /** Daftar MIME type yang diizinkan (e.g. ['image/jpeg', 'image/png']) */
  allowedMimeTypes?: string[];
  /** Custom file filter function (override allowedMimeTypes jika disediakan) */
  fileFilter?: CustomFileFilter;
  /** Nama field multipart form-data. Default: 'file' */
  fieldName?: string;
  /** Jumlah file maksimum untuk array upload. Default: 1 */
  maxCount?: number;
}

export interface DiskUploadConfig extends BaseUploadConfig {
  /** Direktori penyimpanan file di disk. Default: 'uploads/' */
  dest?: string;
  /** Custom filename generator */
  filenameGenerator?: (req: Request, file: Express.Multer.File) => string;
}

export type MemoryUploadConfig = BaseUploadConfig;
