import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';

export const ProgramsPage: React.FC = () => {
  const { settings, seoSettings, programs, subjects } = useApp();
  const seo = seoSettings.find((s) => s.pageKey === 'program');
  const activePrograms = programs.filter((p) => p.status === 'published' && p.isActive);

  return (
    <>
      <SeoHead
        title={seo?.title || `Program Belajar – ${settings.institutionName}`}
        description={
          seo?.description ||
          'Daftar program belajar dan mata pelajaran aktif di TOMOYO PRIVAT & BIMBEL EDUCATION.'
        }
        path="/program"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Kurikulum Dinamis</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Program Belajar &amp; Mata Pelajaran
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Setiap program dirancang bertahap menyesuaikan jenjang usia dan kebutuhan akademik peserta didik.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {activePrograms.map((prog) => {
            const progSubjects = subjects.filter(
              (s) => s.programId === prog.id && s.isActive
            );
            return (
              <div
                key={prog.id}
                className="bg-slate-50 border border-slate-200 rounded-xl p-6 flex flex-col justify-between"
              >
                <div>
                  <p className="text-xs font-semibold text-blue-700">{prog.levelLabel}</p>
                  <h2 className="mt-1 text-xl font-bold text-slate-900">{prog.name}</h2>
                  <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                    {prog.description}
                  </p>
                  <div className="mt-5 pt-4 border-t border-slate-200">
                    <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wide mb-3">
                      Mata Pelajaran Aktif
                    </h3>
                    {progSubjects.length === 0 ? (
                      <p className="text-xs text-slate-500">Belum ada mata pelajaran aktif.</p>
                    ) : (
                      <ul className="space-y-2.5">
                        {progSubjects.map((sub) => (
                          <li key={sub.id} className="text-sm text-slate-800">
                            <div className="flex items-start gap-2">
                              <CheckCircle2
                                className="w-4 h-4 text-blue-700 shrink-0 mt-0.5"
                                aria-hidden="true"
                              />
                              <div>
                                <p className="font-semibold">{sub.name}</p>
                                {sub.description && (
                                  <p className="text-xs text-slate-500">{sub.description}</p>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                <div className="mt-6 pt-4 border-t border-slate-200 space-y-3">
                  <p className="text-xs text-slate-500">
                    Aturan pilih mapel:{' '}
                    <strong className="text-slate-700">
                      {prog.selectionMode === 'single'
                        ? '1 mata pelajaran'
                        : 'Boleh memilih satu atau beberapa mata pelajaran'}
                    </strong>
                  </p>
                  <Link
                    to="/pendaftaran"
                    className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
                  >
                    <span>Daftar Program Ini</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
};
