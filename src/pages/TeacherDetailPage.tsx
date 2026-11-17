import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, Briefcase, GraduationCap } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const TeacherDetailPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { settings, teachers } = useApp();

  const publishedTeachers = teachers.filter((t) => t.status === 'published');
  const teacher = publishedTeachers.find((t) => t.slug === slug);
  const redirectTarget = !teacher
    ? publishedTeachers.find((t) => (t.previousSlugs || []).includes(slug || ''))
    : undefined;

  useEffect(() => {
    if (redirectTarget) {
      navigate(`/pengajar/${redirectTarget.slug}`, { replace: true });
    }
  }, [redirectTarget, navigate]);

  if (redirectTarget) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Mengalihkan ke alamat profil terbaru...
      </div>
    );
  }

  if (!teacher) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
        <h1 className="text-2xl font-bold text-slate-900">Profil Pengajar Tidak Ditemukan</h1>
        <p className="text-sm text-slate-600">
          Profil pengajar yang Anda cari tidak tersedia atau masih berstatus draf.
        </p>
        <Link
          to="/pengajar"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Daftar Pengajar</span>
        </Link>
      </div>
    );
  }

  return (
    <>
      <SeoHead
        title={teacher.seoTitle || `${teacher.name} – Pengajar ${settings.institutionName}`}
        description={
          teacher.seoDescription ||
          `Profil pengajar ${teacher.name} di ${settings.institutionName}.`
        }
        path={`/pengajar/${teacher.slug}`}
        ogImage={teacher.photoUrl || undefined}
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <Link
          to="/pengajar"
          className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden="true" />
          <span>Daftar Pengajar</span>
        </Link>

        <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <ImageWithFallback
              src={teacher.photoUrl}
              alt={teacher.name}
              fallbackLabel={teacher.name}
              className="w-full h-72 object-cover rounded-xl"
            />
          </div>
          <div className="md:col-span-8 space-y-5">
            <div>
              <p className="text-xs font-semibold text-blue-700">
                Pengajar {settings.institutionName}
              </p>
              <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                {teacher.name}
              </h1>
            </div>

            <div className="space-y-4 text-sm">
              <div className="flex items-start gap-3">
                <GraduationCap className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="font-bold text-slate-900">Pendidikan</h2>
                  <p className="text-slate-600 mt-0.5">
                    {teacher.education || 'Informasi pendidikan belum dilengkapi.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <BookOpen className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="font-bold text-slate-900">Mata Pelajaran</h2>
                  <p className="text-slate-600 mt-0.5">
                    {teacher.subjects.length > 0
                      ? teacher.subjects.join(' · ')
                      : 'Belum ditentukan oleh admin.'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                <div>
                  <h2 className="font-bold text-slate-900">Pengalaman Mengajar</h2>
                  <p className="text-slate-600 mt-0.5 whitespace-pre-line">
                    {teacher.experience || 'Informasi pengalaman belum dilengkapi.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-200">
              <h2 className="text-sm font-bold text-slate-900 mb-2">Biografi Singkat</h2>
              <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-line">
                {teacher.bio ||
                  'Biodata lengkap pengajar ini belum diisi dan dapat diperbarui melalui Dashboard Admin.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
