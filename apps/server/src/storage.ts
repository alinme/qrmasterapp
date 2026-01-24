import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';
import path from 'path';

// Storage configuration
const STORAGE_TYPE = process.env.STORAGE_TYPE || 'local'; // 'local' or 's3'
const UPLOADS_DIR = path.join(__dirname, '../uploads');

// S3/Tebi.io configuration
const S3_CONFIG = {
  endpoint: process.env.S3_ENDPOINT || process.env.TEBI_ENDPOINT, // Tebi.io endpoint
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || process.env.TEBI_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || process.env.TEBI_SECRET_ACCESS_KEY || '',
  },
  forcePathStyle: true, // Required for S3-compatible services like Tebi.io
};

const S3_BUCKET = process.env.S3_BUCKET || process.env.TEBI_BUCKET || '';
const S3_PUBLIC_URL = process.env.S3_PUBLIC_URL || process.env.TEBI_PUBLIC_URL || ''; // Public URL for accessing files

// Initialize S3 client if using S3 storage
let s3Client: S3Client | null = null;
if (STORAGE_TYPE === 's3' && S3_CONFIG.endpoint && S3_CONFIG.credentials.accessKeyId) {
  s3Client = new S3Client(S3_CONFIG);
  console.log('✅ S3 storage initialized (Tebi.io compatible)');
} else if (STORAGE_TYPE === 's3') {
  console.warn('⚠️ S3 storage requested but missing configuration. Falling back to local storage.');
}

// Ensure uploads directory exists for local storage
if (STORAGE_TYPE === 'local' && !fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('✅ Local storage directory created');
}

export interface UploadResult {
  url: string;
  key: string; // File identifier (filename for local, key for S3)
}

/**
 * Upload a file to storage (S3 or local)
 */
export async function uploadFile(file: Express.Multer.File): Promise<UploadResult> {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
  const ext = path.extname(file.originalname);
  const filename = `file-${uniqueSuffix}${ext}`;

  if (STORAGE_TYPE === 's3' && s3Client && S3_BUCKET) {
    // Upload to S3/Tebi.io
    const key = `uploads/${filename}`;
    
    // Get file buffer - either from memory storage or read from disk
    let fileBuffer: Buffer;
    if (file.buffer) {
      fileBuffer = file.buffer;
    } else if (file.path && fs.existsSync(file.path)) {
      fileBuffer = fs.readFileSync(file.path);
    } else {
      throw new Error('File buffer or path not found');
    }

    try {
      await s3Client.send(new PutObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
        Body: fileBuffer,
        ContentType: file.mimetype,
        ACL: 'public-read', // Make file publicly accessible
      }));

      // Construct public URL
      const url = S3_PUBLIC_URL 
        ? `${S3_PUBLIC_URL}/${key}`
        : `https://${S3_BUCKET}.${S3_CONFIG.endpoint?.replace('https://', '').replace('http://', '')}/${key}`;

      // Clean up local temp file if it exists
      if (file.path && fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }

      return { url, key };
    } catch (error) {
      console.error('S3 upload error:', error);
      // Fallback to local storage on error
      if (file.path && fs.existsSync(file.path)) {
        return uploadFileLocal(file, filename);
      } else {
        // Save buffer to temp file for local fallback
        const tempPath = path.join(UPLOADS_DIR, filename);
        fs.writeFileSync(tempPath, fileBuffer);
        (file as any).path = tempPath;
        return uploadFileLocal(file, filename);
      }
    }
  } else {
    // Upload to local storage
    return uploadFileLocal(file, filename);
  }
}

/**
 * Upload file to local storage
 */
function uploadFileLocal(file: Express.Multer.File, filename: string): UploadResult {
  const destPath = path.join(UPLOADS_DIR, filename);
  
  // Handle both memory and disk storage
  if (file.buffer) {
    // Write buffer to file
    fs.writeFileSync(destPath, file.buffer);
  } else if (file.path && fs.existsSync(file.path)) {
    // Move file from temp location to uploads directory
    fs.renameSync(file.path, destPath);
  } else {
    throw new Error('File buffer or path not found for local storage');
  }
  
  const url = `/uploads/${filename}`;
  return { url, key: filename };
}

/**
 * Delete a file from storage
 */
export async function deleteFile(fileUrl: string): Promise<void> {
  if (STORAGE_TYPE === 's3' && s3Client && S3_BUCKET) {
    // Extract key from URL
    const key = fileUrl.includes('/uploads/') 
      ? fileUrl.split('/uploads/')[1] 
      : `uploads/${path.basename(fileUrl)}`;

    try {
      await s3Client.send(new DeleteObjectCommand({
        Bucket: S3_BUCKET,
        Key: key,
      }));
    } catch (error) {
      console.error('S3 delete error:', error);
      throw error;
    }
  } else {
    // Delete from local storage
    const filename = path.basename(fileUrl);
    const filePath = path.join(UPLOADS_DIR, filename);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }
}

/**
 * Get public URL for a file (for S3, returns signed URL if needed)
 */
export async function getFileUrl(key: string): Promise<string> {
  if (STORAGE_TYPE === 's3' && s3Client && S3_BUCKET && S3_PUBLIC_URL) {
    return `${S3_PUBLIC_URL}/${key}`;
  } else {
    return `/uploads/${key}`;
  }
}

export { UPLOADS_DIR, STORAGE_TYPE };
