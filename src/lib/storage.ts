import { supabase } from './supabase';

/**
 * Upload an image file to Supabase Storage (attachments bucket).
 * Files are stored under the user's folder: {userId}/{timestamp}_{filename}
 * Returns the public URL or null on failure.
 */
export async function uploadAttachment(
  file: File,
  userId: string
): Promise<string | null> {
  const timestamp = Date.now();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${timestamp}_${safeName}`;

  const { error } = await supabase.storage
    .from('attachments')
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) {
    console.error('Upload error:', error);
    return null;
  }

  // Get signed URL (valid 1 year) since bucket is private
  const { data: urlData } = await supabase.storage
    .from('attachments')
    .createSignedUrl(path, 60 * 60 * 24 * 365);

  return urlData?.signedUrl || null;
}

/**
 * Convert a base64 data URL to a File object.
 */
export function dataUrlToFile(dataUrl: string, filename = 'image.png'): File {
  const [header, base64] = dataUrl.split(',');
  const mimeMatch = header.match(/:(.*?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/png';
  const binary = atob(base64);
  const array = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  const ext = mime.split('/')[1] || 'png';
  return new File([array], filename || `image.${ext}`, { type: mime });
}
