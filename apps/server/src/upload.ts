import multer from 'multer';
import path from 'path';
import fs from 'fs';
import express from 'express';
import { UPLOADS_DIR, STORAGE_TYPE } from './storage';

// Configure storage - use memory storage for S3, disk storage for local
const storage = STORAGE_TYPE === 's3' 
  ? multer.memoryStorage() // Store in memory for S3 upload
  : multer.diskStorage({
      destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
      }
    });

// File filter for images and videos
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'video/quicktime'
  ];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and videos are allowed.'));
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve uploaded files statically (only for local storage)
export function setupUploadRoutes(app: express.Application) {
  if (STORAGE_TYPE === 'local') {
    app.use('/uploads', express.static(UPLOADS_DIR));
  }
  // For S3, files are served directly from S3 URLs
}

export { UPLOADS_DIR };
