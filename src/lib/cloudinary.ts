import { validateCloudinaryFile } from './validation';

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'fgxdx2hq';
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'tomoyo';
const ASSET_FOLDER = import.meta.env.VITE_CLOUDINARY_FOLDER || 'tomoyo/gambar';

export type AssetCategory =
  | 'founder'
  | 'teacher'
  | 'gallery'
  | 'announcement'
  | 'branch'
  | 'student'
  | 'site';

export interface CloudinaryUploadResult {
  secureUrl: string;
  publicId: string;
}

export async function uploadImageToCloudinary(
  file: File,
  category: AssetCategory
): Promise<CloudinaryUploadResult> {
  const validation = validateCloudinaryFile({ type: file.type, size: file.size });
  if (!validation.valid) {
    throw new Error(validation.error || 'File gambar tidak valid.');
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', ASSET_FOLDER);
  formData.append('tags', `tomoyo,${category}`);

  const endpoint = `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`;
  const response = await fetch(endpoint, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let message = 'Gagal mengunggah gambar ke Cloudinary.';
    try {
      const errData = await response.json();
      if (errData?.error?.message) {
        message = `Gagal mengunggah gambar: ${errData.error.message}`;
      }
    } catch {
      // ignore JSON parse error
    }
    throw new Error(message);
  }

  const data = (await response.json()) as {
    secure_url?: string;
    public_id?: string;
  };

  if (!data.secure_url) {
    throw new Error('URL gambar dari Cloudinary tidak diterima.');
  }

  return {
    secureUrl: data.secure_url,
    publicId: data.public_id || '',
  };
}
