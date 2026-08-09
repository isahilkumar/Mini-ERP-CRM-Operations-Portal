import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export const isS3Configured = !!(
  process.env.AWS_REGION &&
  process.env.AWS_ACCESS_KEY_ID &&
  process.env.AWS_SECRET_ACCESS_KEY &&
  process.env.AWS_S3_BUCKET_NAME
);

export const s3 = isS3Configured
  ? new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
      },
    })
  : null;

/**
 * Converts a stored S3 URL to a presigned URL if it is an AWS S3 URL,
 * otherwise returns the original URL (e.g. local upload path).
 */
export async function getPresignedUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  if (!s3 || !process.env.AWS_S3_BUCKET_NAME) return url;

  // Check if it is an S3 URL
  if (url.includes('amazonaws.com')) {
    try {
      // Parse key after amazonaws.com/
      const match = url.match(/amazonaws\.com\/(.+)$/);
      if (match && match[1]) {
        const key = decodeURIComponent(match[1]);
        const command = new GetObjectCommand({
          Bucket: process.env.AWS_S3_BUCKET_NAME,
          Key: key,
        });
        // Generate presigned URL valid for 24 hours
        return await getSignedUrl(s3, command, { expiresIn: 86400 });
      }
    } catch (err) {
      console.error('Error generating presigned URL:', err);
    }
  }

  return url;
}
