import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Phone } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';

export const BranchesPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const { settings, seoSettings, branches } = useApp();
  const activeBranches = branches.filter((b) => b.isActive);

  if (slug) {
    const branch = activeBranches.find((b) => b.slug === slug);
    if (!branch) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Cabang Tidak Ditemukan</h1>
          <Link
            to="/cabang"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Lihat Semua Cabang</span>
          </Link>
        </div>
      );
    }

    return (
      <>
        <SeoHead
          title={`${branch.name} – ${settings.institutionName}`}
          description={branch.description || `Informasi cabang ${branch.name}.`}
          path={`/cabang/${branch.slug}`}
          ogImage={branch.photoUrl || undefined}
        />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
          <Link
            to="/cabang"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Semua Lokasi Cabang</span>
          </Link>

          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            {branch.photoUrl && (
              <ImageWithFallback
                src={branch.photoUrl}
                alt={branch.name}
                className="w-full h-64 object-cover"
              />
            )}
            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <p className="text-xs font-semibold text-blue-700">
                  {branch.isCenter ? 'Kantor Pusat' : 'Cabang Resmi'}
                </p>
                <h1 className="mt-1 text-2xl sm:text-3xl font-extrabold text-slate-900">
                  {branch.name}
                </h1>
                <p className="mt-3 text-slate-600 leading-relaxed">{branch.description}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-slate-200 text-sm">
                <div className="flex items-start gap-2.5">
                  <MapPin className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-slate-900">Alamat Lengkap</p>
                    <p className="text-slate-600 mt-0.5">
                      {branch.address || 'Belum dilengkapi oleh admin.'}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Phone className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-slate-900">Nomor WhatsApp</p>
                    <p className="text-slate-600 mt-0.5 tabular-nums">
                      {branch.whatsapp || settings.whatsappNumber}
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-2.5">
                  <Clock className="w-5 h-5 text-blue-700 shrink-0 mt-0.5" aria-hidden="true" />
                  <div>
                    <p className="font-bold text-slate-900">Jam Operasional</p>
                    <p className="text-slate-600 mt-0.5">
                      {branch.operatingHours || 'Belum dilengkapi oleh admin.'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-200">
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>Buka Petunjuk Arah Google Maps</span>
                </a>
                <Link
                  to="/pendaftaran"
                  className="inline-flex items-center px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Daftar di Cabang Ini
                </Link>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  const seo = seoSettings.find((s) => s.pageKey === 'cabang');
  return (
    <>
      <SeoHead
        title={seo?.title || `Lokasi Cabang – ${settings.institutionName}`}
        description={
          seo?.description ||
          'Informasi lokasi TOMOYO Indramayu Kota (Pusat) dan Cabang Kecamatan Terisi Indramayu.'
        }
        path="/cabang"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Lokasi Layanan Pendidikan</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Cabang {settings.institutionName}
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Kunjungi pusat belajar kami di Indramayu Kota maupun cabang Kecamatan Terisi untuk konsultasi program belajar dan pendaftaran siswa.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {activeBranches.map((branch) => (
            <div
              key={branch.id}
              className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between"
            >
              <div>
                {branch.photoUrl && (
                  <ImageWithFallback
                    src={branch.photoUrl}
                    alt={branch.name}
                    className="w-full h-52 object-cover"
                  />
                )}
                <div className="p-6 space-y-4">
                  <div>
                    <p className="text-xs font-semibold text-blue-700">
                      {branch.isCenter ? 'Pusat' : 'Cabang'}
                    </p>
                    <h2 className="mt-1 text-xl font-bold text-slate-900">
                      {branch.name}
                    </h2>
                    <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                      {branch.description}
                    </p>
                  </div>
                  <div className="space-y-1.5 text-sm text-slate-700 pt-2 border-t border-slate-100">
                    <p>
                      <strong className="text-slate-900">Alamat:</strong>{' '}
                      {branch.address || 'Belum dilengkapi oleh admin.'}
                    </p>
                    <p>
                      <strong className="text-slate-900">WhatsApp:</strong>{' '}
                      <span className="tabular-nums">
                        {branch.whatsapp || settings.whatsappNumber}
                      </span>
                    </p>
                    <p>
                      <strong className="text-slate-900">Jam Operasional:</strong>{' '}
                      {branch.operatingHours || 'Belum dilengkapi oleh admin.'}
                    </p>
                  </div>
                </div>
              </div>
              <div className="p-6 pt-0 flex flex-wrap gap-3">
                <a
                  href={branch.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                >
                  <MapPin className="w-4 h-4" aria-hidden="true" />
                  <span>Petunjuk Arah</span>
                </a>
                <Link
                  to={`/cabang/${branch.slug}`}
                  className="inline-flex items-center px-4 py-2 rounded-lg border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
                >
                  Detail Cabang
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};
