import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const TeachersPage: React.FC = () => {
  const { settings, seoSettings, teachers } = useApp();
  const seo = seoSettings.find((s) => s.pageKey === 'pengajar');
  const activeTeachers = teachers.filter((t) => t.status === 'published' && t.isActive);

  return (
    <>
      <SeoHead
        title={seo?.title || `Daftar Pengajar – ${settings.institutionName}`}
        description={seo?.description || `Tenaga pengajar profesional ${settings.institutionName}.`}
        path="/pengajar"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Tenaga Pendidik</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Pengajar {settings.institutionName}
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Kenali profil pengajar kami yang mendampingi peserta didik secara sabar, sistematis, dan profesional.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {activeTeachers.map((teacher) => (
            <Link
              key={teacher.id}
              to={`/pengajar/${teacher.slug}`}
              className="group bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 transition-colors flex flex-col"
            >
              <ImageWithFallback
                src={teacher.photoUrl}
                alt={teacher.name}
                fallbackLabel={teacher.name}
                className="w-full h-56 object-cover"
              />
              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {teacher.name}
                  </h2>
                  {teacher.education && (
                    <p className="mt-1 text-xs font-medium text-blue-700">
                      {teacher.education}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-slate-600 line-clamp-3">
                    {teacher.bio || 'Profil lengkap dan biodata pengajar dapat dilengkapi melalui Dashboard Admin.'}
                  </p>
                </div>
                <span className="mt-4 inline-block text-xs font-semibold text-blue-700">
                  Lihat Profil &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
};
