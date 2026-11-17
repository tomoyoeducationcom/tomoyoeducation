import React, { useState } from 'react';
import { Clock, MapPin } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';

export const SchedulePage: React.FC = () => {
  const { settings, schedules, branches, programs } = useApp();
  const [branchFilter, setBranchFilter] = useState('all');
  const [programFilter, setProgramFilter] = useState('all');

  const activeSchedules = schedules.filter((s) => s.isActive);
  const filtered = activeSchedules.filter((s) => {
    const matchBranch = branchFilter === 'all' || s.branchId === branchFilter;
    const matchProg = programFilter === 'all' || s.programId === programFilter;
    return matchBranch && matchProg;
  });

  return (
    <>
      <SeoHead
        title={`Jadwal Belajar – ${settings.institutionName}`}
        description={`Jadwal kegiatan bimbingan belajar ${settings.institutionName} per cabang dan program.`}
        path="/jadwal"
      />
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="max-w-3xl space-y-3">
          <p className="text-sm font-semibold text-blue-700">Agenda Pembelajaran</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Jadwal Belajar
          </h1>
          <p className="text-slate-600 leading-relaxed">
            Jadwal kelas reguler dan bimbingan belajar di seluruh cabang {settings.institutionName}.
          </p>
        </div>

        <div className="flex flex-wrap gap-4 bg-slate-50 border border-slate-200 rounded-xl p-4">
          <div className="min-w-[200px] flex-1">
            <label htmlFor="jadwal-cabang" className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Cabang
            </label>
            <select
              id="jadwal-cabang"
              value={branchFilter}
              onChange={(e) => setBranchFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Semua Cabang</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
          <div className="min-w-[200px] flex-1">
            <label htmlFor="jadwal-program" className="block text-xs font-semibold text-slate-700 mb-1">
              Filter Program
            </label>
            <select
              id="jadwal-program"
              value={programFilter}
              onChange={(e) => setProgramFilter(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Semua Program</option>
              {programs.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-10 text-center space-y-2">
            <p className="text-base font-semibold text-slate-800">
              Belum Ada Jadwal Aktif yang Ditampilkan
            </p>
            <p className="text-sm text-slate-600">
              Admin dapat menambahkan dan mengaktifkan jadwal belajar melalui Dashboard Admin.
            </p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600 uppercase">
                <tr>
                  <th className="px-4 py-3">Hari &amp; Jam</th>
                  <th className="px-4 py-3">Program &amp; Kelas</th>
                  <th className="px-4 py-3">Mata Pelajaran</th>
                  <th className="px-4 py-3">Pengajar</th>
                  <th className="px-4 py-3">Cabang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <p className="font-semibold text-slate-900">{s.dayOfWeek}</p>
                      <p className="text-xs text-slate-500 flex items-center gap-1 tabular-nums">
                        <Clock className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>
                          {s.startTime} – {s.endTime}
                        </span>
                      </p>
                    </td>
                    <td className="px-4 py-3.5">
                      <p className="font-semibold text-slate-900">{s.programName}</p>
                      <p className="text-xs text-slate-500">{s.className}</p>
                    </td>
                    <td className="px-4 py-3.5 text-slate-700">{s.subjectName || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-700">{s.teacherName || '-'}</td>
                    <td className="px-4 py-3.5 text-slate-700">
                      <span className="inline-flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-blue-700 shrink-0" aria-hidden="true" />
                        <span>{s.branchName}</span>
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
};
