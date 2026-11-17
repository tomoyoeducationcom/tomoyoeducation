import React from 'react';
import { Award, BookOpen, Briefcase, Quote } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const FounderPage: React.FC = () => {
  const { settings, seoSettings, founder } = useApp();
  const seo = seoSettings.find((s) => s.pageKey === 'founder');

  return (
    <>
      <SeoHead
        title={seo?.title || `Profil Founder – ${founder.name}`}
        description={
          seo?.description ||
          `Profil ${founder.name}, ${founder.role} ${settings.institutionName}.`
        }
        path="/founder"
        ogImage={founder.photoUrl || undefined}
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-10 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <ImageWithFallback
              src={founder.photoUrl}
              alt={founder.name}
              fallbackLabel="Foto Founder (dapat diunggah via Admin)"
              className="w-full h-80 object-cover rounded-xl"
            />
          </div>
          <div className="md:col-span-8 space-y-4">
            <p className="text-sm font-semibold text-blue-700">{founder.role}</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              {founder.name}
            </h1>
            <p className="text-sm text-slate-600">
              <strong className="text-slate-900">Tanggal Lahir:</strong> {founder.birthDate}
            </p>
            <div className="pt-4 border-t border-slate-200 space-y-2">
              <h2 className="text-base font-bold text-slate-900">Biografi</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {founder.bio ||
                  'Biografi lengkap Founder belum dilengkapi. Profil ini dikelola secara resmi melalui Dashboard Admin.'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">Riwayat Pendidikan</h2>
            </div>
            {founder.education.length === 0 ? (
              <p className="text-sm text-slate-500">
                Riwayat pendidikan akan tampil setelah dilengkapi melalui Dashboard Admin.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                {founder.education.map((edu, idx) => (
                  <li key={idx}>{edu}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">Pengalaman</h2>
            </div>
            {founder.experience.length === 0 ? (
              <p className="text-sm text-slate-500">
                Riwayat pengalaman akan tampil setelah dilengkapi melalui Dashboard Admin.
              </p>
            ) : (
              <ul className="space-y-2 text-sm text-slate-700 list-disc pl-5">
                {founder.experience.map((exp, idx) => (
                  <li key={idx}>{exp}</li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Award className="w-5 h-5 text-blue-700" aria-hidden="true" />
              <h2 className="text-lg font-bold text-slate-900">Visi Pendidikan</h2>
            </div>
            <p className="text-sm text-slate-700 leading-relaxed">
              {founder.vision || 'Visi pendidikan dapat dilengkapi melalui Dashboard Admin.'}
            </p>
          </div>

          <div className="bg-blue-900 text-white rounded-xl p-6 space-y-3">
            <div className="flex items-center gap-2">
              <Quote className="w-5 h-5 text-amber-400" aria-hidden="true" />
              <h2 className="text-lg font-bold">Pesan Founder</h2>
            </div>
            <p className="text-sm text-blue-100 leading-relaxed whitespace-pre-line">
              {founder.message ||
                'Pesan Founder kepada orang tua dan peserta didik dapat dilengkapi melalui Dashboard Admin.'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
