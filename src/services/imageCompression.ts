import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

export interface ImageCompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number; // 0.1 to 1.0 (default 0.78)
  mimeType?: 'image/jpeg' | 'image/webp' | 'image/png';
}

export interface CompressionResult {
  dataUrl: string;
  blob: Blob;
  width: number;
  height: number;
  originalSizeBytes: number;
  compressedSizeBytes: number;
  savedPercentage: number;
}

/**
 * Compresses an image file, Blob, or base64 dataUrl using browser Canvas.
 * Significantly shrinks camera photos from ~8MB down to ~150KB for rapid conference upload.
 */
export async function compressImage(
  input: File | Blob | string,
  options: ImageCompressionOptions = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.78,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    // 1. Convert input to Image source URL
    let srcUrl = '';
    let originalSize = 0;

    if (typeof input === 'string') {
      srcUrl = input;
      // Approximate bytes from base64
      originalSize = Math.round((input.length * 3) / 4);
    } else {
      srcUrl = URL.createObjectURL(input);
      originalSize = input.size;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        let width = img.naturalWidth || img.width;
        let height = img.naturalHeight || img.height;

        // Calculate proportional scale down
        if (width > maxWidth || height > maxHeight) {
          const ratio = Math.min(maxWidth / width, maxHeight / height);
          width = Math.round(width * ratio);
          height = Math.round(height * ratio);
        }

        // Render on offscreen canvas with high quality image smoothing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          throw new Error('Canvas 2D context unavailable');
        }

        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';
        ctx.drawImage(img, 0, 0, width, height);

        // Export compressed Data URL
        const dataUrl = canvas.toDataURL(mimeType, quality);

        // Also convert to Blob for Supabase Storage uploads
        canvas.toBlob(
          (blob) => {
            if (typeof input !== 'string') {
              URL.revokeObjectURL(srcUrl);
            }

            const finalBlob = blob || new Blob([], { type: mimeType });
            const compressedSize = finalBlob.size || Math.round((dataUrl.length * 3) / 4);
            const savedPercentage = originalSize > 0
              ? Math.max(0, Math.round(((originalSize - compressedSize) / originalSize) * 100))
              : 0;

            resolve({
              dataUrl,
              blob: finalBlob,
              width,
              height,
              originalSizeBytes: originalSize,
              compressedSizeBytes: compressedSize,
              savedPercentage,
            });
          },
          mimeType,
          quality
        );
      } catch (err) {
        if (typeof input !== 'string') {
          URL.revokeObjectURL(srcUrl);
        }
        reject(err);
      }
    };

    img.onerror = (err) => {
      if (typeof input !== 'string') {
        URL.revokeObjectURL(srcUrl);
      }
      reject(new Error('Failed to load image for compression'));
    };

    img.src = srcUrl;
  });
}

/**
 * Compresses an image and stores it to Supabase Storage if configured,
 * or returns the compressed base64 dataUrl as a fast local fallback.
 */
export async function uploadAndCompressMedia(
  input: File | Blob | string,
  bucketName = 'moments',
  folder = 'tedx_2026'
): Promise<{ url: string; isRemote: boolean; compressionInfo?: CompressionResult }> {
  try {
    // 1. Compress image first
    const compression = await compressImage(input, {
      maxWidth: 1200,
      maxHeight: 1200,
      quality: 0.8,
      mimeType: 'image/jpeg',
    });

    // 2. Check if Supabase storage is reachable
    if (isSupabaseConfigured()) {
      const client = getSupabaseClient();
      if (client && client.storage) {
        const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(2, 8)}.jpg`;
        const { data, error } = await client.storage
          .from(bucketName)
          .upload(fileName, compression.blob, {
            contentType: 'image/jpeg',
            upsert: true,
          });

        if (!error && data?.path) {
          const { data: publicData } = client.storage.from(bucketName).getPublicUrl(data.path);
          if (publicData?.publicUrl) {
            return {
              url: publicData.publicUrl,
              isRemote: true,
              compressionInfo: compression,
            };
          }
        }
      }
    }

    // 3. Fallback to optimized local compressed Data URL (persists in offline DB & local storage seamlessly)
    return {
      url: compression.dataUrl,
      isRemote: false,
      compressionInfo: compression,
    };
  } catch (error) {
    console.warn('Image compression/upload fallback:', error);
    // Return original string if string, or empty
    return {
      url: typeof input === 'string' ? input : '',
      isRemote: false,
    };
  }
}
