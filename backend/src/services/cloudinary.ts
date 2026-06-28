import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env';

const isCloudinaryConfigured =
  Boolean(env.CLOUDINARY_CLOUD_NAME) &&
  Boolean(env.CLOUDINARY_API_KEY) &&
  Boolean(env.CLOUDINARY_API_SECRET);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: env.CLOUDINARY_CLOUD_NAME,
    api_key: env.CLOUDINARY_API_KEY,
    api_secret: env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

export function cloudinaryEnabled(): boolean {
  return isCloudinaryConfigured;
}

export async function uploadImageBuffer(
  buffer: Buffer,
  entityType: string,
  entityId: string,
): Promise<string> {
  if (!isCloudinaryConfigured) {
    throw new Error('Cloudinary is not configured');
  }

  const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
  const result = await cloudinary.uploader.upload(dataUri, {
    folder: `tera-story/${entityType}`,
    public_id: entityId,
    overwrite: true,
    resource_type: 'image',
  });

  return result.secure_url;
}
