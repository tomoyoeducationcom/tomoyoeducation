import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { ImageWithFallback } from '../components/ImageWithFallback';
import { formatIndonesianDate } from '../lib/billing';

export const AnnouncementsPage: React.FC = () => {
  const { slug } = useParams<{ slug?: string }>();
  const navigate = useNavigate();
  const { settings, announcements } = useApp();
  const published = announcements.filter((a) => a.status === 'published');
  const ann = slug ? published.find((a) => a.slug === slug) : undefined;
  const redirectTarget =
    slug && !ann
      ? published.find((a) => (a.previousSlugs || []).includes(slug))
      : undefined;

  useEffect(() => {
    if (redirectTarget) {
      navigate(`/pengumuman/${redirectTarget.slug}`, { replace: true });
    }
  }, [redirectTarget, navigate]);

  if (slug) {

    if (redirectTarget) {
      return (
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
          Mengalihkan ke pengumuman terbaru...
        </div>
      );
    }

    if (!ann) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-4">
          <h1 className="text-2xl font-bold text-slate-900">Pengumuman Tidak Ditemukan</h1>
          <Link
            to="/pengumuman"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Kembali ke Pengumuman</span>
          </Link>
        </div>
      );
    }

    return (
      <>
        <SeoHead
          title={ann.seoTitle || `${ann.title} – ${settings.institutionName}`}
          description={ann.seoDescription || ann.excerpt || ann.content.slice(0, 155)}
          path={`/pengumuman/${ann.slug}`}
          ogImage={ann.imageUrl || undefined}
        />
        <article className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-6">
          <Link
            to="/pengumuman"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:underline"
          >
            <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            <span>Semua Pengumuman</span>
          </Link>
          <div className="space-y-3">
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-700" aria-hidden="true" />
              <span>{formatIndonesianDate(ann.publishedAt)}</span>
            </p>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
              {ann.title}
            </h1>
          </div>
          {ann.imageUrl && (
            <ImageWithFallback
              src={ann.imageUrl}
              alt={ann.title}
              className="w-full max-h-96 object-cover rounded-xl"
            />
          )}
          <div className="prose max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
            {ann.content}
          </div>
        </article>
      </>
    );
  }

  return (
    <>
      <SeoHead
        title={`Pengumuman – ${settings.institutionName}`}
        description={`Informasi resmi dan pengumuman terbaru dari ${settings.institutionName}.`}
        path="/pengumuman"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Informasi Resmi</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Pengumuman {settings.institutionName}
          </h1>
        </div>

        {published.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800">
              Belum Ada Pengumuman yang Dipublikasikan
            </p>
            <p className="text-sm text-slate-600">
              Pengumuman resmi akan tampil di sini setelah dipublikasikan melalui Dashboard Admin.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {published.map((ann) => (
              <Link
                key={ann.id}
                to={`/pengumuman/${ann.slug}`}
                className="bg-white border border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 transition-colors flex flex-col"
              >
                {ann.imageUrl && (
                  <ImageWithFallback
                    src={ann.imageUrl}
                    alt={ann.title}
                    className="w-full h-48 object-cover"
                  />
                )}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <p className="text-xs text-slate-500">
                      {formatIndonesianDate(ann.publishedAt)}
                    </p>
                    <h2 className="mt-1.5 text-lg font-bold text-slate-900">{ann.title}</h2>
                    <p className="mt-2 text-sm text-slate-600 line-clamp-3">
                      {ann.excerpt || ann.content}
                    </p>
                  </div>
                  <span className="text-xs font-semibold text-blue-700">
                    Baca Selengkapnya &rarr;
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
