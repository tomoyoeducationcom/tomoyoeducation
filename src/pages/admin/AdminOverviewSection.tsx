import React from 'react';
import {
  AlertTriangle,
  Building2,
  CreditCard,
  Database,
  GraduationCap,
  UserCheck,
  Users,
} from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import {
  formatIndonesianDate,
  formatRupiah,
  getInvoiceStatusInfo,
  getTodayIndonesiaISO,
} from '../../lib/billing';

export type AdminMenuKey =
  | 'dashboard'
  | 'profil-lembaga'
  | 'siswa'
  | 'orang-tua'
  | 'pendaftaran'
  | 'pengajar'
  | 'program'
  | 'mapel'
  | 'pembayaran'
  | 'tagihan'
  | 'laporan'
  | 'galeri'
  | 'testimoni'
  | 'pengumuman'
  | 'jadwal'
  | 'cabang'
  | 'founder'
  | 'pengaturan-web'
  | 'seo'
  | 'kontak'
  | 'ekspor-pdf';

export const AdminOverviewSection: React.FC<{
  branchFilter: string;
  onNavigate: (menu: AdminMenuKey) => void;
}> = ({ branchFilter, onNavigate }) => {
  const {
    allStudents,
    allRegistrations,
    teachers,
    branches,
    allInvoices,
    allPayments,
    firestoreSeeded,
    seedingInProgress,
    seedInitialDataToFirestore,
  } = useApp();

  const todayISO = getTodayIndonesiaISO();
  const currentMonthPrefix = todayISO.slice(0, 7); // YYYY-MM

  const filterByBranch = <T extends { branchId?: string }>(items: T[]): T[] =>
    branchFilter === 'all' ? items : items.filter((i) => i.branchId === branchFilter);

  const activeStudents = filterByBranch(allStudents).filter(
    (s) => s.isActive && s.registrationStatus === 'approved'
  );
  const pendingRegistrations = filterByBranch(allRegistrations).filter(
    (r) => r.status === 'pending'
  );
  const activeTeachers = teachers.filter((t) => t.isActive);
  const activeBranches = branches.filter((b) => b.isActive);

  const monthPayments = filterByBranch(allPayments).filter((p) =>
    (p.paymentDate || '').startsWith(currentMonthPrefix)
  );
  const monthRevenue = monthPayments.reduce((sum, p) => sum + (p.amountSnapshot || 0), 0);

  const branchInvoices = filterByBranch(allInvoices);
  const unpaidInvoices = branchInvoices.filter((i) => i.status === 'unpaid');
  const overdueInvoices = unpaidInvoices.filter(
    (i) => getInvoiceStatusInfo(i, todayISO).isOverdue
  );
  const h3OrDueTodayInvoices = unpaidInvoices.filter((i) => {
    const info = getInvoiceStatusInfo(i, todayISO);
    return info.isH3Warning && !info.isOverdue;
  });

  const kpis = [
    {
      label: 'Total Siswa Aktif',
      value: activeStudents.length,
      icon: GraduationCap,
      action: () => onNavigate('siswa'),
    },
    {
      label: 'Pendaftaran Menunggu',
      value: pendingRegistrations.length,
      icon: UserCheck,
      action: () => onNavigate('pendaftaran'),
    },
    {
      label: 'Total Pengajar',
      value: activeTeachers.length,
      icon: Users,
      action: () => onNavigate('pengajar'),
    },
    {
      label: 'Total Cabang Aktif',
      value: activeBranches.length,
      icon: Building2,
      action: () => onNavigate('cabang'),
    },
    {
      label: 'Pembayaran Bulan Ini',
      value: monthPayments.length,
      icon: CreditCard,
      action: () => onNavigate('pembayaran'),
    },
    {
      label: 'Tagihan Belum Dibayar',
      value: unpaidInvoices.length,
      icon: CreditCard,
      action: () => onNavigate('tagihan'),
    },
    {
      label: 'Tagihan Terlambat',
      value: overdueInvoices.length,
      icon: AlertTriangle,
      action: () => onNavigate('tagihan'),
    },
    {
      label: 'Pendapatan Bulan Ini',
      value: formatRupiah(monthRevenue),
      icon: CreditCard,
      action: () => onNavigate('laporan'),
    },
  ];

  return (
    <div className="space-y-6">
      {!firestoreSeeded && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-bold text-amber-950">
              Inisialisasi Database Firestore
            </p>
            <p className="text-xs text-amber-900">
              Data awal lembaga (8 pengajar, 3 program, 8 mata pelajaran, 2 cabang, profil founder, dan pengaturan situs) belum tersimpan di Firestore. Klik tombol untuk menyinkronkan ke Cloud Firestore sekarang.
            </p>
          </div>
          <button
            type="button"
            disabled={seedingInProgress}
            onClick={() => void seedInitialDataToFirestore()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 whitespace-nowrap shrink-0"
          >
            <Database className="w-4 h-4" aria-hidden="true" />
            <span>
              {seedingInProgress ? 'Menyinkronkan...' : 'Simpan Data Awal ke Firestore'}
            </span>
          </button>
        </div>
      )}

      {/* H-3 & Overdue Red Alert Panel */}
      {(overdueInvoices.length > 0 || h3OrDueTodayInvoices.length > 0) && (
        <div className="bg-red-50 border border-red-300 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
              <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
              <span>
                Peringatan Jatuh Tempo SPP H-3 &amp; Terlambat (
                {overdueInvoices.length + h3OrDueTodayInvoices.length} tagihan)
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('tagihan')}
              className="text-xs font-semibold text-red-800 underline"
            >
              Kelola Tagihan &rarr;
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {[...overdueInvoices, ...h3OrDueTodayInvoices].slice(0, 6).map((inv) => {
              const info = getInvoiceStatusInfo(inv, todayISO);
              return (
                <div
                  key={inv.id}
                  className="bg-white border border-red-200 rounded-lg p-3 text-xs flex items-center justify-between gap-2"
                >
                  <div>
                    <p className="font-bold text-slate-900">{inv.studentNameSnapshot}</p>
                    <p className="text-slate-600">
                      {inv.periodLabel} · Jatuh tempo {formatIndonesianDate(inv.dueDate)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900 tabular-nums">
                      {formatRupiah(inv.amount)}
                    </p>
                    <p className="font-semibold text-red-700">{info.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k) => {
          const Icon = k.icon;
          return (
            <button
              key={k.label}
              type="button"
              onClick={k.action}
              className="text-left bg-white border border-slate-200 rounded-xl p-5 hover:border-blue-400 transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-slate-500">{k.label}</span>
                <Icon className="w-4 h-4 text-blue-700" aria-hidden="true" />
              </div>
              <p className="mt-2 text-2xl font-extrabold text-slate-900 tabular-nums">
                {k.value}
              </p>
            </button>
          );
        })}
      </div>

      {/* Recent Pending Registrations */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-900">
            Pendaftaran Menunggu Persetujuan
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('pendaftaran')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Lihat Semua &rarr;
          </button>
        </div>
        {pendingRegistrations.length === 0 ? (
          <p className="text-sm text-slate-500">
            Tidak ada pengajuan pendaftaran yang menunggu persetujuan saat ini.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Siswa</th>
                  <th className="px-3 py-2.5">Orang Tua</th>
                  <th className="px-3 py-2.5">Program</th>
                  <th className="px-3 py-2.5">Cabang</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {pendingRegistrations.slice(0, 5).map((r) => (
                  <tr key={r.id}>
                    <td className="px-3 py-2.5 font-semibold">{r.studentNameSnapshot}</td>
                    <td className="px-3 py-2.5">{r.parentNameSnapshot}</td>
                    <td className="px-3 py-2.5">{r.programNameSnapshot}</td>
                    <td className="px-3 py-2.5">{r.branchNameSnapshot}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
