import React, { useState } from 'react';
import { FileDown } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { exportAdminReportPdf } from '../../lib/pdfExport';
import {
  formatIndonesianDate,
  formatPeriodLabel,
  formatRupiah,
  getInvoiceStatusInfo,
  getTodayIndonesiaISO,
} from '../../lib/billing';

type ReportType =
  | 'pembayaran_bulan'
  | 'pendapatan'
  | 'tunggakan'
  | 'siswa_aktif'
  | 'siswa_cabang'
  | 'riwayat_siswa'
  | 'pendaftaran'
  | 'orang_tua'
  | 'pengajar'
  | 'program'
  | 'jadwal';

export const AdminReportsSection: React.FC<{ branchFilter: string }> = ({
  branchFilter,
}) => {
  const {
    settings,
    branches,
    allStudents,
    allParents,
    allRegistrations,
    allInvoices,
    allPayments,
    teachers,
    programs,
    schedules,
  } = useApp();

  const todayISO = getTodayIndonesiaISO();
  const [reportType, setReportType] = useState<ReportType>('pembayaran_bulan');
  const [selectedBranch, setSelectedBranch] = useState(branchFilter);
  const [selectedYear, setSelectedYear] = useState(todayISO.slice(0, 4));
  const [selectedMonth, setSelectedMonth] = useState(String(Number(todayISO.slice(5, 7))));
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [exporting, setExporting] = useState(false);

  const activeBranchLabel =
    selectedBranch === 'all'
      ? 'Semua Cabang'
      : branches.find((b) => b.id === selectedBranch)?.name || selectedBranch;

  const periodLabel = `${formatPeriodLabel(
    Number(selectedYear),
    Number(selectedMonth)
  )} · ${activeBranchLabel}`;

  const handleExport = async () => {
    setExporting(true);
    try {
      const monthPrefix = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}`;
      const matchBranch = <T extends { branchId?: string }>(list: T[]) =>
        selectedBranch === 'all'
          ? list
          : list.filter((item) => item.branchId === selectedBranch);

      switch (reportType) {
        case 'pembayaran_bulan': {
          const rowsData = matchBranch(allPayments).filter((p) =>
            p.paymentDate.startsWith(monthPrefix)
          );
          const total = rowsData.reduce((s, p) => s + p.amountSnapshot, 0);
          await exportAdminReportPdf({
            title: 'Laporan Pembayaran SPP Bulanan',
            periodLabel,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Kwitansi', 'Siswa', 'Orang Tua', 'Program', 'Tanggal', 'Metode', 'Nominal'],
            rows: rowsData.map((p) => [
              p.receiptNumber,
              p.studentNameSnapshot,
              p.parentNameSnapshot,
              p.programNameSnapshot,
              formatIndonesianDate(p.paymentDate),
              p.paymentMethod,
              formatRupiah(p.amountSnapshot),
            ]),
            summaryLines: [
              `Jumlah Transaksi: ${rowsData.length}`,
              `Total Pendapatan Tercatat: ${formatRupiah(total)}`,
            ],
            filename: `Laporan-Pembayaran-${monthPrefix}`,
          });
          break;
        }
        case 'pendapatan': {
          const rowsData = matchBranch(allPayments).filter((p) =>
            p.paymentDate.startsWith(selectedYear)
          );
          const total = rowsData.reduce((s, p) => s + p.amountSnapshot, 0);
          const tunai = rowsData
            .filter((p) => p.paymentMethod === 'Tunai')
            .reduce((s, p) => s + p.amountSnapshot, 0);
          const transfer = rowsData
            .filter((p) => p.paymentMethod === 'Transfer')
            .reduce((s, p) => s + p.amountSnapshot, 0);
          await exportAdminReportPdf({
            title: `Laporan Pendapatan Tahun ${selectedYear}`,
            periodLabel: `Tahun ${selectedYear} · ${activeBranchLabel}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Tanggal', 'Kwitansi', 'Siswa', 'Periode', 'Cabang', 'Metode', 'Nominal'],
            rows: rowsData.map((p) => [
              formatIndonesianDate(p.paymentDate),
              p.receiptNumber,
              p.studentNameSnapshot,
              p.periodLabel,
              p.branchNameSnapshot,
              p.paymentMethod,
              formatRupiah(p.amountSnapshot),
            ]),
            summaryLines: [
              `Total Pendapatan Tunai: ${formatRupiah(tunai)}`,
              `Total Pendapatan Transfer: ${formatRupiah(transfer)}`,
              `Grand Total Pendapatan: ${formatRupiah(total)}`,
            ],
            filename: `Laporan-Pendapatan-${selectedYear}`,
          });
          break;
        }
        case 'tunggakan': {
          const rowsData = matchBranch(allInvoices).filter(
            (i) => i.status === 'unpaid' && getInvoiceStatusInfo(i, todayISO).isOverdue
          );
          const total = rowsData.reduce((s, i) => s + i.amount, 0);
          await exportAdminReportPdf({
            title: 'Laporan Tunggakan SPP Siswa',
            periodLabel: `Per ${formatIndonesianDate(todayISO)} · ${activeBranchLabel}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Siswa', 'Orang Tua', 'Cabang', 'Periode', 'Jatuh Tempo', 'Nominal', 'Status'],
            rows: rowsData.map((i) => [
              i.studentNameSnapshot,
              i.parentNameSnapshot,
              i.branchNameSnapshot,
              i.periodLabel,
              formatIndonesianDate(i.dueDate),
              formatRupiah(i.amount),
              'Terlambat',
            ]),
            summaryLines: [
              `Jumlah Tagihan Terlambat: ${rowsData.length}`,
              `Total Tunggakan: ${formatRupiah(total)}`,
            ],
            filename: `Laporan-Tunggakan-${todayISO}`,
          });
          break;
        }
        case 'siswa_aktif':
        case 'siswa_cabang': {
          const rowsData = matchBranch(allStudents).filter(
            (s) => s.isActive && s.registrationStatus === 'approved'
          );
          await exportAdminReportPdf({
            title:
              reportType === 'siswa_aktif'
                ? 'Daftar Siswa Aktif'
                : `Daftar Siswa – ${activeBranchLabel}`,
            periodLabel: `Per ${formatIndonesianDate(todayISO)} · ${activeBranchLabel}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Nama Siswa', 'Kelas', 'Program', 'Mata Pelajaran', 'Cabang', 'Orang Tua', 'SPP'],
            rows: rowsData.map((s) => [
              s.fullName,
              s.gradeLevel,
              s.programNameSnapshot,
              s.subjectNamesSnapshot.join(', '),
              s.branchNameSnapshot,
              s.parentName,
              formatRupiah(s.monthlyFee),
            ]),
            summaryLines: [`Total Siswa Aktif: ${rowsData.length}`],
            filename: `Daftar-Siswa-${todayISO}`,
          });
          break;
        }
        case 'riwayat_siswa': {
          const st = allStudents.find((s) => s.id === selectedStudentId);
          const rowsData = allPayments.filter(
            (p) => !selectedStudentId || p.studentId === selectedStudentId
          );
          const total = rowsData.reduce((s, p) => s + p.amountSnapshot, 0);
          await exportAdminReportPdf({
            title: `Riwayat Pembayaran SPP${st ? ` – ${st.fullName}` : ''}`,
            periodLabel: st ? st.programNameSnapshot : 'Semua Siswa',
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Kwitansi', 'Siswa', 'Periode', 'Tanggal Bayar', 'Metode', 'Nominal'],
            rows: rowsData.map((p) => [
              p.receiptNumber,
              p.studentNameSnapshot,
              p.periodLabel,
              formatIndonesianDate(p.paymentDate),
              p.paymentMethod,
              formatRupiah(p.amountSnapshot),
            ]),
            summaryLines: [
              `Jumlah Pembayaran: ${rowsData.length}`,
              `Total Dibayarkan: ${formatRupiah(total)}`,
            ],
            filename: `Riwayat-Pembayaran-${st ? st.fullName.replace(/\s+/g, '-') : 'Semua'}`,
          });
          break;
        }
        case 'pendaftaran': {
          const rowsData = matchBranch(allRegistrations);
          await exportAdminReportPdf({
            title: 'Laporan Data Pendaftaran Siswa',
            periodLabel: activeBranchLabel,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Siswa', 'Orang Tua', 'WhatsApp', 'Program', 'Cabang', 'Status'],
            rows: rowsData.map((r) => [
              r.studentNameSnapshot,
              r.parentNameSnapshot,
              r.parentWhatsappSnapshot,
              r.programNameSnapshot,
              r.branchNameSnapshot,
              r.status,
            ]),
            summaryLines: [`Total Pengajuan Pendaftaran: ${rowsData.length}`],
            filename: `Data-Pendaftaran-${todayISO}`,
          });
          break;
        }
        case 'orang_tua': {
          await exportAdminReportPdf({
            title: 'Data Orang Tua / Wali Terdaftar',
            periodLabel: `Per ${formatIndonesianDate(todayISO)}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Nama Orang Tua', 'Email', 'WhatsApp', 'Alamat', 'Jumlah Anak'],
            rows: allParents.map((p) => [
              p.name,
              p.email,
              p.whatsapp,
              p.address,
              allStudents.filter((s) => s.parentUid === p.uid).length,
            ]),
            summaryLines: [`Total Akun Orang Tua: ${allParents.length}`],
            filename: `Data-Orang-Tua-${todayISO}`,
          });
          break;
        }
        case 'pengajar': {
          await exportAdminReportPdf({
            title: 'Data Pengajar TOMOYO Education',
            periodLabel: `Per ${formatIndonesianDate(todayISO)}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Urutan', 'Nama Pengajar', 'Pendidikan', 'Mata Pelajaran', 'Status'],
            rows: teachers.map((t) => [
              t.order,
              t.name,
              t.education || '-',
              t.subjects.join(', ') || '-',
              `${t.status} (${t.isActive ? 'Aktif' : 'Nonaktif'})`,
            ]),
            summaryLines: [`Total Pengajar: ${teachers.length}`],
            filename: `Data-Pengajar-${todayISO}`,
          });
          break;
        }
        case 'program': {
          await exportAdminReportPdf({
            title: 'Data Program Belajar',
            periodLabel: `Per ${formatIndonesianDate(todayISO)}`,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Nama Program', 'Jenjang', 'Aturan Pilih Mapel', 'Status'],
            rows: programs.map((p) => [
              p.name,
              p.levelLabel,
              p.selectionMode === 'single' ? '1 Mapel' : 'Multi Mapel',
              `${p.status} (${p.isActive ? 'Aktif' : 'Nonaktif'})`,
            ]),
            summaryLines: [`Total Program: ${programs.length}`],
            filename: `Data-Program-${todayISO}`,
          });
          break;
        }
        case 'jadwal': {
          const rowsData = matchBranch(schedules);
          await exportAdminReportPdf({
            title: 'Data Jadwal Belajar',
            periodLabel: activeBranchLabel,
            institutionName: settings.institutionName,
            logoUrl: settings.logoUrl,
            columns: ['Hari', 'Jam', 'Program', 'Kelas', 'Mapel', 'Pengajar', 'Cabang'],
            rows: rowsData.map((s) => [
              s.dayOfWeek,
              `${s.startTime}–${s.endTime}`,
              s.programName,
              s.className,
              s.subjectName || '-',
              s.teacherName || '-',
              s.branchName,
            ]),
            summaryLines: [`Total Jadwal: ${rowsData.length}`],
            filename: `Data-Jadwal-${todayISO}`,
          });
          break;
        }
      }
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-6">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Laporan Administrasi &amp; Ekspor PDF Resmi
        </h2>
        <p className="text-sm text-slate-600 mt-1">
          Pilih jenis laporan dan filter data sebelum mengunduh dokumen PDF beridentitas {settings.institutionName}.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Jenis Laporan PDF
          </label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value as ReportType)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="pembayaran_bulan">Laporan Pembayaran SPP per Bulan</option>
            <option value="pendapatan">Laporan Pendapatan Tahunan</option>
            <option value="tunggakan">Laporan Tunggakan SPP</option>
            <option value="siswa_aktif">Daftar Siswa Aktif</option>
            <option value="siswa_cabang">Daftar Siswa per Cabang</option>
            <option value="riwayat_siswa">Riwayat Pembayaran per Siswa</option>
            <option value="pendaftaran">Data Pendaftaran Siswa</option>
            <option value="orang_tua">Data Orang Tua / Wali</option>
            <option value="pengajar">Data Pengajar</option>
            <option value="program">Data Program Belajar</option>
            <option value="jadwal">Data Jadwal Belajar</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Cabang</label>
          <select
            value={selectedBranch}
            onChange={(e) => setSelectedBranch(e.target.value)}
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

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {reportType === 'pembayaran_bulan' && (
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                <option key={m} value={String(m)}>
                  {formatPeriodLabel(Number(selectedYear), m).split(' ')[0]}
                </option>
              ))}
            </select>
          </div>
        )}

        {reportType === 'riwayat_siswa' && (
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Pilih Siswa (Opsional)
            </label>
            <select
              value={selectedStudentId}
              onChange={(e) => setSelectedStudentId(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="">Semua Siswa</option>
              {allStudents.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.fullName}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <button
        type="button"
        disabled={exporting}
        onClick={() => void handleExport()}
        className="inline-flex items-center gap-2 px-6 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
      >
        <FileDown className="w-4 h-4" aria-hidden="true" />
        <span>{exporting ? 'Menyiapkan PDF...' : 'Unduh Laporan PDF'}</span>
      </button>
    </div>
  );
};
