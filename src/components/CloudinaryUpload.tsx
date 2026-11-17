import React, { useRef, useState } from 'react';
import { Loader2, Upload } from 'lucide-react';
import { uploadImageToCloudinary, type AssetCategory } from '../lib/cloudinary';

interface CloudinaryUploadProps {
  category: AssetCategory;
  currentUrl?: string;
  label?: string;
  onUploaded: (url: string) => void;
}

export const CloudinaryUpload: React.FC<CloudinaryUploadProps> = ({
  category,
  currentUrl,
  label = 'Unggah Foto (JPG/PNG/WebP, maks 5 MB)',
  onUploaded,
}) => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await uploadImageToCloudinary(file, category);
      onUploaded(res.secureUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal mengunggah gambar.');
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">{label}</label>
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60 transition-colors whitespace-nowrap shrink-0"
        >
          {uploading ? (
            <Loader2 className="w-4 h-4 animate-spin text-blue-700" aria-hidden="true" />
          ) : (
            <Upload className="w-4 h-4 text-blue-700" aria-hidden="true" />
          )}
          <span>{uploading ? 'Mengunggah...' : 'Pilih & Unggah Gambar'}</span>
        </button>
        {currentUrl && (
          <img
            src={currentUrl}
            alt="Pratinjau gambar"
            referrerPolicy="no-referrer"
            className="w-12 h-12 rounded-lg object-cover border border-slate-200"
          />
        )}
      </div>
      {error && <p className="text-xs text-red-600 font-medium">{error}</p>}
    </div>
  );
};
