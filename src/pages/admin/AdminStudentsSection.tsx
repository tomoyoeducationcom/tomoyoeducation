import React, { useState } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Check, X, Edit3 } from 'lucide-react';
import { useApp } from '../../contexts/AppContext';
import { db } from '../../lib/firebase';
import {
  handleFirestoreError,
  OperationType,
  sanitizeFirestorePayload,
} from '../../lib/firestoreErrors';
import {
  computeDueDateForPeriod,
  formatIndonesianDate,
  formatPeriodLabel,
  formatRupiah,
  getTodayIndonesiaISO,
} from '../../lib/billing';
import type { Registration, Student } from '../../types';

export const AdminStudentsSection: React.FC<{
  mode: 'siswa' | 'orang-tua' | 'pendaftaran';
  branchFilter: string;
}> = ({ mode, branchFilter }) => {
  const { allStudents, allParents, allRegistrations, settings } = useApp();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  // Approve modal state
  const [approvingReg, setApprovingReg] = useState<Registration | null>(null);
  const [monthlyFee, setMonthlyFee] = useState('250000');
  const [startDate, setStartDate] = useState(getTodayIndonesiaISO());
  const [adminNotes, setAdminNotes] = useState('');
  const [createFirstInvoice, setCreateFirstInvoice] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Edit student state
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editFee, setEditFee] = useState('0');
  const [editAnchorDay, setEditAnchorDay] = useState('5');
  const [editActive, setEditActive] = useState(true);
  const [editNotes, setEditNotes] = useState('');

  const syncPublicStudentCount = async (nextStudents: Student[]) => {
    try {
      const count = nextStudents.filter(
        (s) => s.isActive && s.registrationStatus === 'approved'
      ).length;
      await updateDoc(doc(db, 'settings', 'main'), {
        statsOverride: {
          ...(settings.statsOverride || { useRealData: true }),
          useRealData: true,
          studentsCount: count,
        },
        updatedAt: new Date().toISOString(),
      });
    } catch {
      // Ignore if settings/main isn't seeded yet
    }
  };

  const handleApprove = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!approvingReg) return;
    setProcessing(true);
    try {
      const feeNum = Math.max(0, Number(monthlyFee) || 0);
      const anchorDay = Math.max(1, Math.min(31, Number(startDate.split('-')[2]) || 1));
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);

      batch.update(
        doc(db, 'registrations', approvingReg.id),
        sanitizeFirestorePayload({
          status: 'approved',
          adminNotes: adminNotes.trim(),
          reviewedAt: nowIso,
          updatedAt: nowIso,
        })
      );

      batch.update(
        doc(db, 'students', approvingReg.studentId),
        sanitizeFirestorePayload({
          registrationStatus: 'approved',
          isActive: true,
          monthlyFee: feeNum,
          billingAnchorDay: anchorDay,
          startDate,
          adminNotes: adminNotes.trim(),
          updatedAt: nowIso,
        })
      );

      if (createFirstInvoice && feeNum > 0) {
        const [y, m] = startDate.split('-').map(Number);
        const periodYear = y || 2026;
        const periodMonth = m || 1;
        const dueDate = computeDueDateForPeriod(periodYear, periodMonth, anchorDay);
        const invId = `inv_${approvingReg.studentId}_${periodYear}_${periodMonth}`;
        batch.set(
          doc(db, 'invoices', invId),
          sanitizeFirestorePayload({
            studentId: approvingReg.studentId,
            parentUid: approvingReg.parentUid,
            studentNameSnapshot: approvingReg.studentNameSnapshot,
            parentNameSnapshot: approvingReg.parentNameSnapshot,
            programNameSnapshot: approvingReg.programNameSnapshot,
            branchId: approvingReg.branchId,
            branchNameSnapshot: approvingReg.branchNameSnapshot,
            periodYear,
            periodMonth,
            periodLabel: formatPeriodLabel(periodYear, periodMonth),
            amount: feeNum,
            anchorDay,
            dueDate,
            status: 'unpaid',
            paidAt: '',
            paymentMethod: '',
            paymentId: '',
            notes: 'Tagihan awal pendaftaran',
            createdAt: nowIso,
            updatedAt: nowIso,
          })
        );
      }

      await batch.commit();
      await syncPublicStudentCount(
        allStudents.map((s) =>
          s.id === approvingReg.studentId
            ? { ...s, isActive: true, registrationStatus: 'approved' }
            : s
        )
      );
      setApprovingReg(null);
      setAdminNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'registrations/approve');
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (reg: Registration) => {
    const reason = window.prompt('Alasan penolakan pendaftaran (opsional):') ?? '';
    setProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);
      batch.update(doc(db, 'registrations', reg.id), {
        status: 'rejected',
        adminNotes: reason.trim(),
        reviewedAt: nowIso,
        updatedAt: nowIso,
      });
      batch.update(doc(db, 'students', reg.studentId), {
        registrationStatus: 'rejected',
        isActive: false,
        adminNotes: reason.trim(),
        updatedAt: nowIso,
      });
      await batch.commit();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'registrations/reject');
    } finally {
      setProcessing(false);
    }
  };

  const handleSaveStudentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setProcessing(true);
    try {
      const fee = Math.max(0, Number(editFee) || 0);
      const anchor = Math.max(1, Math.min(31, Number(editAnchorDay) || 1));
      await updateDoc(doc(db, 'students', editingStudent.id), {
        monthlyFee: fee,
        billingAnchorDay: anchor,
        isActive: editActive,
        adminNotes: editNotes.trim(),
        updatedAt: new Date().toISOString(),
      });
      await syncPublicStudentCount(
        allStudents.map((s) =>
          s.id === editingStudent.id ? { ...s, isActive: editActive } : s
        )
      );
      setEditingStudent(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${editingStudent.id}`);
    } finally {
      setProcessing(false);
    }
  };

  if (mode === 'orang-tua') {
    const filteredParents = allParents.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.email.toLowerCase().includes(search.toLowerCase()) ||
        p.whatsapp.includes(search)
    );
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            Data Orang Tua / Wali ({filteredParents.length})
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, email, atau WA..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-full sm:w-64"
          />
        </div>
        {filteredParents.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">Belum ada data orang tua terdaftar.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Nama</th>
                  <th className="px-3 py-2.5">Email</th>
                  <th className="px-3 py-2.5">WhatsApp</th>
                  <th className="px-3 py-2.5">Alamat</th>
                  <th className="px-3 py-2.5 text-right">Jumlah Anak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredParents.map((p) => {
                  const childCount = allStudents.filter((s) => s.parentUid === p.uid).length;
                  return (
                    <tr key={p.id}>
                      <td className="px-3 py-2.5 font-semibold">{p.name}</td>
                      <td className="px-3 py-2.5 text-slate-600">{p.email}</td>
                      <td className="px-3 py-2.5 tabular-nums">{p.whatsapp}</td>
                      <td className="px-3 py-2.5 text-slate-600">{p.address}</td>
                      <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                        {childCount}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  }

  if (mode === 'pendaftaran') {
    const filteredRegs = allRegistrations.filter((r) => {
      const bMatch = branchFilter === 'all' || r.branchId === branchFilter;
      const sMatch = statusFilter === 'all' || r.status === statusFilter;
      const qMatch =
        r.studentNameSnapshot.toLowerCase().includes(search.toLowerCase()) ||
        r.parentNameSnapshot.toLowerCase().includes(search.toLowerCase());
      return bMatch && sMatch && qMatch;
    });

    return (
      <div className="space-y-5">
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-slate-900">
              Pendaftaran Masuk ({filteredRegs.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="all">Semua Status</option>
                <option value="pending">Menunggu Persetujuan</option>
                <option value="approved">Disetujui</option>
                <option value="rejected">Ditolak</option>
              </select>
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Cari siswa/orang tua..."
                className="rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>

          {filteredRegs.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Belum ada data pendaftaran.</p>
          ) : (
            <div className="space-y-3">
              {filteredRegs.map((reg) => (
                <div
                  key={reg.id}
                  className="border border-slate-200 rounded-xl p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{reg.studentNameSnapshot}</span>
                      <span className="text-xs text-slate-500">({reg.gradeLevel})</span>
                      <span
                        className={`text-xs font-semibold ${
                          reg.status === 'approved'
                            ? 'text-emerald-700'
                            : reg.status === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }`}
                      >
                        ·{' '}
                        {reg.status === 'approved'
                          ? 'Disetujui'
                          : reg.status === 'rejected'
                          ? 'Ditolak'
                          : 'Menunggu Persetujuan'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Orang Tua: {reg.parentNameSnapshot} ({reg.parentWhatsappSnapshot}) · Cabang:{' '}
                      {reg.branchNameSnapshot}
                    </p>
                    <p className="text-xs text-slate-600">
                      Program: {reg.programNameSnapshot} · Mapel:{' '}
                      {reg.subjectNamesSnapshot.join(', ')}
                    </p>
                    {reg.notes && (
                      <p className="text-xs text-slate-500">Catatan: {reg.notes}</p>
                    )}
                  </div>
                  {reg.status === 'pending' && (
                    <div className="flex gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setApprovingReg(reg);
                          setStartDate(getTodayIndonesiaISO());
                          setMonthlyFee('250000');
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        <Check className="w-4 h-4" />
                        <span>Setujui</span>
                      </button>
                      <button
                        type="button"
                        disabled={processing}
                        onClick={() => void handleReject(reg)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-red-300 text-red-700 text-xs font-semibold hover:bg-red-50"
                      >
                        <X className="w-4 h-4" />
                        <span>Tolak</span>
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {approvingReg && (
          <div className="bg-white border border-blue-300 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">
              Setujui Pendaftaran: {approvingReg.studentNameSnapshot}
            </h3>
            <form onSubmit={handleApprove} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nominal SPP Bulanan (Rp) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={monthlyFee}
                    onChange={(e) => setMonthlyFee(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Mulai / Anchor Jatuh Tempo *
                  </label>
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={createFirstInvoice}
                  onChange={(e) => setCreateFirstInvoice(e.target.checked)}
                />
                <span>Terbitkan tagihan SPP bulan pertama secara otomatis</span>
              </label>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Catatan Admin untuk Orang Tua
                </label>
                <input
                  type="text"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Misal: Jadwal belajar dimulai hari Senin pukul 15.30"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {processing ? 'Menyetujui...' : 'Konfirmasi & Aktifkan Siswa'}
                </button>
                <button
                  type="button"
                  onClick={() => setApprovingReg(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    );
  }

  // mode === 'siswa'
  const filteredStudents = allStudents.filter((s) => {
    const bMatch = branchFilter === 'all' || s.branchId === branchFilter;
    const qMatch =
      s.fullName.toLowerCase().includes(search.toLowerCase()) ||
      s.parentName.toLowerCase().includes(search.toLowerCase());
    return bMatch && qMatch;
  });

  return (
    <div className="space-y-5">
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-slate-900">
            Data Siswa ({filteredStudents.length})
          </h2>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama siswa atau orang tua..."
            className="rounded-lg border border-slate-300 px-3 py-2 text-sm w-full sm:w-64"
          />
        </div>
        {filteredStudents.length === 0 ? (
          <p className="text-sm text-slate-500 py-4">Belum ada data siswa.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                <tr>
                  <th className="px-3 py-2.5">Nama Siswa</th>
                  <th className="px-3 py-2.5">Orang Tua</th>
                  <th className="px-3 py-2.5">Program &amp; Kelas</th>
                  <th className="px-3 py-2.5">Cabang</th>
                  <th className="px-3 py-2.5 text-right">SPP/Bulan</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((st) => (
                  <tr key={st.id}>
                    <td className="px-3 py-2.5">
                      <p className="font-semibold text-slate-900">{st.fullName}</p>
                      <p className="text-xs text-slate-500">
                        Lahir {formatIndonesianDate(st.birthDate)}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-slate-700">{st.parentName}</td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{st.programNameSnapshot}</p>
                      <p className="text-xs text-slate-500">
                        {st.gradeLevel} · {st.subjectNamesSnapshot.join(', ')}
                      </p>
                    </td>
                    <td className="px-3 py-2.5 text-xs text-slate-600">
                      {st.branchNameSnapshot}
                    </td>
                    <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                      {formatRupiah(st.monthlyFee)}
                    </td>
                    <td className="px-3 py-2.5 text-xs font-semibold">
                      <span
                        className={
                          st.isActive && st.registrationStatus === 'approved'
                            ? 'text-emerald-700'
                            : st.registrationStatus === 'rejected'
                            ? 'text-red-700'
                            : 'text-amber-700'
                        }
                      >
                        {st.isActive && st.registrationStatus === 'approved'
                          ? 'Aktif'
                          : st.registrationStatus === 'rejected'
                          ? 'Ditolak'
                          : 'Nonaktif / Menunggu'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingStudent(st);
                          setEditFee(String(st.monthlyFee || 0));
                          setEditAnchorDay(String(st.billingAnchorDay || 5));
                          setEditActive(st.isActive);
                          setEditNotes(st.adminNotes || '');
                        }}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Atur</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {editingStudent && (
        <div className="bg-white border border-blue-300 rounded-xl p-6 space-y-4">
          <h3 className="text-lg font-bold text-slate-900">
            Pengaturan Siswa &amp; SPP: {editingStudent.fullName}
          </h3>
          <form onSubmit={handleSaveStudentEdit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Nominal SPP Berikutnya (Rp)
                </label>
                <input
                  type="number"
                  min={0}
                  value={editFee}
                  onChange={(e) => setEditFee(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Anchor Tanggal Jatuh Tempo (1–31)
                </label>
                <input
                  type="number"
                  min={1}
                  max={31}
                  value={editAnchorDay}
                  onChange={(e) => setEditAnchorDay(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
                  <input
                    type="checkbox"
                    checked={editActive}
                    onChange={(e) => setEditActive(e.target.checked)}
                  />
                  <span>Siswa Aktif</span>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Catatan Admin
              </label>
              <input
                type="text"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={processing}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
              >
                {processing ? 'Menyimpan...' : 'Simpan Pengaturan'}
              </button>
              <button
                type="button"
                onClick={() => setEditingStudent(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
