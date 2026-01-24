# File Storage Configuration

This application supports two storage backends:
1. **Local Storage** (default) - Files stored on the server filesystem
2. **Tebi.io / S3-Compatible Storage** - Files stored in cloud storage

## Local Storage (Default)

By default, files are stored locally in the `uploads/` directory. No configuration needed.

## Tebi.io / S3-Compatible Storage

To use Tebi.io or any S3-compatible storage service, set the following environment variables in your `.env` file:

```env
# Set storage type to S3
STORAGE_TYPE=s3

# Tebi.io endpoint (or your S3-compatible service endpoint)
TEBI_ENDPOINT=https://s3.tebi.io
# OR use generic S3_ENDPOINT
S3_ENDPOINT=https://s3.tebi.io

# Region (usually us-east-1 for Tebi.io)
S3_REGION=us-east-1

# Access credentials
TEBI_ACCESS_KEY_ID=your-access-key-id
TEBI_SECRET_ACCESS_KEY=your-secret-access-key
# OR use generic S3_ variables
S3_ACCESS_KEY_ID=your-access-key-id
S3_SECRET_ACCESS_KEY=your-secret-access-key

# Bucket name
TEBI_BUCKET=your-bucket-name
# OR use generic S3_BUCKET
S3_BUCKET=your-bucket-name

# Public URL for accessing files (important!)
TEBI_PUBLIC_URL=https://your-bucket.s3.tebi.io
# OR use generic S3_PUBLIC_URL
S3_PUBLIC_URL=https://your-bucket.s3.tebi.io
```

## How It Works

- **Local Storage**: Files are saved to `apps/server/uploads/` and served via `/uploads/` route
- **S3 Storage**: Files are uploaded to your Tebi.io/S3 bucket and accessed via the public URL you configure

## Migration

You can switch between storage types at any time. Existing files in local storage won't be automatically migrated to S3, but new uploads will use the configured storage type.

## Tebi.io Setup

1. Create an account at [Tebi.io](https://tebi.io)
2. Create a bucket
3. Get your access credentials
4. Set the environment variables above
5. Restart the server

The application will automatically detect if S3 storage is configured and use it, otherwise it falls back to local storage.
