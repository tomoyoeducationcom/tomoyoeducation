import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2 } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';

export const AboutPage: React.FC = () => {
  const { settings, seoSettings, sitePages } = useApp();
  const seo = seoSettings.find((s) => s.pageKey === 'tentang');
  const cmsPage = sitePages.find((p) => p.slug === 'tentang' && p.status === 'published');

  return (
    <>
      <SeoHead
        title={seo?.title || `Tentang Kami – ${settings.institutionName}`}
        description={seo?.description || settings.shortDescription}
        path="/tentang"
      />
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-blue-700">Profil Lembaga</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            {cmsPage?.title || settings.aboutTitle}
          </h1>
          <p className="text-base text-slate-600 leading-relaxed whitespace-pre-line">
            {cmsPage?.body || settings.aboutContent}
          </p>
          <div className="pt-2 text-sm text-slate-600">
            <strong className="text-slate-900">Tanggal Berdiri:</strong>{' '}
            {settings.foundedDate ? settings.foundedDate : 'Belum ditentukan (dapat diatur melalui Dashboard Admin)'}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Visi</h2>
            <p className="text-sm text-slate-700 leading-relaxed">{settings.vision}</p>
          </div>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 space-y-3">
            <h2 className="text-xl font-bold text-slate-900">Misi</h2>
            <ul className="space-y-2.5 text-sm text-slate-700">
              {settings.mission.map((m, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <CheckCircle2
                    className="w-4 h-4 text-blue-700 shrink-0 mt-0.5"
                    aria-hidden="true"
                  />
                  <span>{m}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Filosofi Brand TOMOYO</h2>
            <p className="mt-1 text-sm text-slate-600">"{settings.brandMeaning}"</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {settings.philosophy.map((item, idx) => (
              <div key={idx} className="bg-white border border-slate-200 rounded-xl p-5">
                <div className="flex items-center gap-3 mb-2">
                  <span className="w-9 h-9 rounded-lg bg-amber-300 text-slate-900 font-extrabold flex items-center justify-center">
                    {item.letter}
                  </span>
                  <h3 className="text-base font-bold text-slate-900">{item.word}</h3>
                </div>
                <p className="text-sm text-slate-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900">
              Mengenal Founder &amp; CEO
            </h2>
            <p className="text-sm text-slate-600">
              JALALUDIN NUROHMAN, S.I.Kom., S.Pd., Gr.
            </p>
          </div>
          <Link
            to="/founder"
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
          >
            Lihat Profil Founder
          </Link>
        </div>
      </div>
    </>
  );
};
