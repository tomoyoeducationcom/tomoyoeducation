import React from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';

export const SitemapHtmlPage: React.FC = () => {
  const { settings, teachers, announcements, branches } = useApp();
  const publishedTeachers = teachers.filter((t) => t.status === 'published');
  const publishedAnnouncements = announcements.filter((a) => a.status === 'published');
  const activeBranches = branches.filter((b) => b.isActive);

  const staticPages = [
    { to: '/', label: 'Beranda' },
    { to: '/tentang', label: 'Profil & Tentang Lembaga' },
    { to: '/founder', label: 'Profil Founder' },
    { to: '/program', label: 'Program Belajar' },
    { to: '/pengajar', label: 'Daftar Pengajar' },
    { to: '/cabang', label: 'Informasi Cabang' },
    { to: '/jadwal', label: 'Jadwal Belajar' },
    { to: '/galeri', label: 'Galeri Kegiatan' },
    { to: '/testimoni', label: 'Testimoni' },
    { to: '/pengumuman', label: 'Pengumuman' },
    { to: '/pendaftaran', label: 'Pendaftaran Siswa Baru' },
    { to: '/kontak', label: 'Kontak & WhatsApp' },
  ];

  return (
    <>
      <SeoHead
        title={`Peta Situs – ${settings.institutionName}`}
        description={`Daftar lengkap halaman publik di website resmi ${settings.institutionName}.`}
        path="/peta-situs"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-700">Navigasi Website</p>
          <h1 className="text-3xl font-extrabold text-slate-900">Peta Situs</h1>
          <p className="text-sm text-slate-600">
            Seluruh halaman publik yang tersedia untuk pengunjung dan mesin pencari di {settings.institutionName}.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Halaman Utama</h2>
            <ul className="space-y-2 text-sm">
              {staticPages.map((p) => (
                <li key={p.to}>
                  <Link to={p.to} className="text-blue-700 hover:underline font-medium">
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Lokasi Cabang</h2>
            <ul className="space-y-2 text-sm">
              {activeBranches.map((b) => (
                <li key={b.id}>
                  <Link
                    to={`/cabang/${b.slug}`}
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {b.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Profil Pengajar Terpublikasi</h2>
            <ul className="space-y-2 text-sm">
              {publishedTeachers.map((t) => (
                <li key={t.id}>
                  <Link
                    to={`/pengajar/${t.slug}`}
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {t.name}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-lg font-bold text-slate-900">Pengumuman Terpublikasi</h2>
            {publishedAnnouncements.length === 0 ? (
              <p className="text-sm text-slate-500">
                Belum ada pengumuman yang dipublikasikan.
              </p>
            ) : (
              <ul className="space-y-2 text-sm">
                {publishedAnnouncements.map((a) => (
                  <li key={a.id}>
                    <Link
                      to={`/pengumuman/${a.slug}`}
                      className="text-blue-700 hover:underline font-medium"
                    >
                      {a.title}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </>
  );
};
