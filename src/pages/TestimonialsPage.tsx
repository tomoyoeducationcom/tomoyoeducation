import React from 'react';
import { Quote } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const TestimonialsPage: React.FC = () => {
  const { settings, testimonials } = useApp();
  const visible = testimonials.filter((t) => t.isVisible);

  return (
    <>
      <SeoHead
        title={`Testimoni – ${settings.institutionName}`}
        description={`Kumpulan testimoni asli dari orang tua dan siswa di ${settings.institutionName}.`}
        path="/testimoni"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Kepercayaan Orang Tua</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Testimoni Orang Tua &amp; Siswa
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Pengalaman belajar nyata dari keluarga yang mempercayakan pendampingan akademik putra-putrinya bersama {settings.institutionName}.
          </p>
        </div>

        {visible.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800">
              Belum Ada Testimoni yang Dipublikasikan
            </p>
            <p className="text-sm text-slate-600">
              Admin dapat menambahkan dan mempublikasikan testimoni asli melalui Dashboard Admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {visible.map((t) => (
              <div
                key={t.id}
                className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <Quote className="w-6 h-6 text-amber-500" aria-hidden="true" />
                  <p className="text-sm text-slate-700 leading-relaxed">"{t.content}"</p>
                </div>
                <div className="flex items-center gap-3 pt-4 border-t border-slate-100">
                  <ImageWithFallback
                    src={t.photoUrl}
                    alt={t.authorName}
                    className="w-11 h-11 rounded-full object-cover shrink-0"
                  />
                  <div>
                    <p className="text-sm font-bold text-slate-900">{t.authorName}</p>
                    {t.authorRole && (
                      <p className="text-xs text-slate-500">{t.authorRole}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
