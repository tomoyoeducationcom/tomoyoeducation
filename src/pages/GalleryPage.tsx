import React, { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { formatIndonesianDate } from '../lib/billing';

export const GalleryPage: React.FC = () => {
  const { settings, galleries } = useApp();
  const published = galleries.filter((g) => g.status === 'published');
  const categories = ['Semua', ...Array.from(new Set(published.map((g) => g.category).filter(Boolean)))];
  const [selectedCategory, setSelectedCategory] = useState('Semua');

  const filtered =
    selectedCategory === 'Semua'
      ? published
      : published.filter((g) => g.category === selectedCategory);

  return (
    <>
      <SeoHead
        title={`Galeri Kegiatan – ${settings.institutionName}`}
        description={`Dokumentasi kegiatan belajar dan aktivitas siswa di ${settings.institutionName}.`}
        path="/galeri"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Dokumentasi</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Galeri Kegiatan Belajar
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Momen pembelajaran, pendampingan kelas, serta kegiatan edukatif di {settings.institutionName}.
          </p>
        </div>

        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800">
              Belum Ada Foto Kegiatan yang Dipublikasikan
            </p>
            <p className="text-sm text-slate-600">
              Dokumentasi kegiatan dapat diunggah melalui Dashboard Admin menggunakan Cloudinary.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden"
              >
                <ImageWithFallback
                  src={item.imageUrl}
                  alt={item.title}
                  className="w-full h-56 object-cover"
                />
                <div className="p-5 space-y-1.5">
                  <h2 className="text-base font-bold text-slate-900">{item.title}</h2>
                  <p className="text-xs text-slate-500">
                    {[
                      item.category,
                      item.activityDate ? formatIndonesianDate(item.activityDate) : '',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                  {item.description && (
                    <p className="text-sm text-slate-600 pt-1">{item.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
