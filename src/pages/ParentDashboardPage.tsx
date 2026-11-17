import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CreditCard,
  Edit3,
  LogOut,
  MessageCircle,
  Plus,
  User,
  Users,
} from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { EmailVerificationGate } from './AuthPages';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../lib/firestoreErrors';
import { formatIndonesianDate, formatRupiah, getInvoiceStatusInfo } from '../lib/billing';
import { buildParentPaymentWhatsAppUrl } from '../lib/validation';
import type { Student } from '../types';

export const ParentDashboardPage: React.FC = () => {
  const {
    user,
    authReady,
    isAdmin,
    isVerifiedUser,
    settings,
    parentProfile,
    myStudents,
    myInvoices,
    myPayments,
    schedules,
    announcements,
    logout,
  } = useApp();
  const navigate = useNavigate();

  const [tab, setTab] = useState<'anak' | 'akademik' | 'pembayaran' | 'profil'>('anak');
  const [selectedChildId, setSelectedChildId] = useState<string>('all');

  // Edit parent profile state
  const [pName, setPName] = useState('');
  const [pWhatsapp, setPWhatsapp] = useState('');
  const [pAddress, setPAddress] = useState('');
  const [savingParent, setSavingParent] = useState(false);
  const [parentSavedMsg, setParentSavedMsg] = useState('');

  // Edit child allowed fields modal/inline state
  const [editingChild, setEditingChild] = useState<Student | null>(null);
  const [cFullName, setCFullName] = useState('');
  const [cBirthDate, setCBirthDate] = useState('');
  const [cGender, setCGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [cAddress, setCAddress] = useState('');
  const [cNotes, setCNotes] = useState('');
  const [cPhotoUrl, setCPhotoUrl] = useState('');
  const [cPhotoConsent, setCPhotoConsent] = useState(false);
  const [savingChild, setSavingChild] = useState(false);

  useEffect(() => {
    if (parentProfile) {
      setPName(parentProfile.name);
      setPWhatsapp(parentProfile.whatsapp);
      setPAddress(parentProfile.address);
    } else if (user) {
      setPName(user.displayName || '');
    }
  }, [parentProfile, user]);

  useEffect(() => {
    if (authReady && isAdmin) {
      navigate('/admin', { replace: true });
    }
  }, [authReady, isAdmin, navigate]);

  if (!authReady) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center text-sm text-slate-600">
        Memuat sesi akun Anda...
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <SeoHead
          title={`Dashboard Akun Orang Tua – ${settings.institutionName}`}
          description="Portal orang tua dan siswa TOMOYO PRIVAT & BIMBEL EDUCATION."
          path="/akun"
          noIndex
        />
        <div className="max-w-lg mx-auto px-4 py-16 text-center space-y-5">
          <h1 className="text-2xl font-extrabold text-slate-900">
            Silakan Masuk Terlebih Dahulu
          </h1>
          <p className="text-sm text-slate-600">
            Dashboard orang tua hanya dapat diakses setelah Anda masuk ke akun resmi Anda.
          </p>
          <div className="flex justify-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              Masuk Akun
            </Link>
            <Link
              to="/register"
              className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50"
            >
              Buat Akun Baru
            </Link>
          </div>
        </div>
      </>
    );
  }

  if (!isVerifiedUser) {
    return (
      <>
        <SeoHead
          title={`Verifikasi Email – ${settings.institutionName}`}
          description="Verifikasi alamat email Anda untuk membuka dashboard orang tua."
          path="/akun"
          noIndex
        />
        <div className="min-h-[70vh] bg-slate-50 py-12 px-4">
          <EmailVerificationGate />
        </div>
      </>
    );
  }

  const urgentInvoices = myInvoices.filter((inv) => {
    const info = getInvoiceStatusInfo(inv);
    return info.isH3Warning || info.isDueToday || info.isOverdue;
  });

  const visibleStudents =
    selectedChildId === 'all'
      ? myStudents
      : myStudents.filter((s) => s.id === selectedChildId);

  const visibleInvoices =
    selectedChildId === 'all'
      ? myInvoices
      : myInvoices.filter((inv) => inv.studentId === selectedChildId);

  const visiblePayments =
    selectedChildId === 'all'
      ? myPayments
      : myPayments.filter((p) => p.studentId === selectedChildId);

  const handleSaveParent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingParent(true);
    setParentSavedMsg('');
    try {
      const nowIso = new Date().toISOString();
      if (parentProfile) {
        await updateDoc(
          doc(db, 'parents', user.uid),
          sanitizeFirestorePayload({
            name: pName.trim(),
            whatsapp: pWhatsapp.trim(),
            address: pAddress.trim(),
            updatedAt: nowIso,
          })
        );
      } else {
        await setDoc(
          doc(db, 'parents', user.uid),
          sanitizeFirestorePayload({
            uid: user.uid,
            name: pName.trim(),
            email: user.email || '',
            whatsapp: pWhatsapp.trim(),
            address: pAddress.trim(),
            createdAt: nowIso,
            updatedAt: nowIso,
          })
        );
      }
      setParentSavedMsg('Profil orang tua berhasil diperbarui.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `parents/${user.uid}`);
    } finally {
      setSavingParent(false);
    }
  };

  const openEditChild = (child: Student) => {
    setEditingChild(child);
    setCFullName(child.fullName);
    setCBirthDate(child.birthDate);
    setCGender(child.gender);
    setCAddress(child.address);
    setCNotes(child.notes || '');
    setCPhotoUrl(child.photoUrl || '');
    setCPhotoConsent(Boolean(child.photoConsent));
  };

  const handleSaveChild = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    setSavingChild(true);
    try {
      await updateDoc(
        doc(db, 'students', editingChild.id),
        sanitizeFirestorePayload({
          fullName: cFullName.trim(),
          birthDate: cBirthDate,
          gender: cGender,
          address: cAddress.trim(),
          notes: cNotes.trim(),
          photoUrl: cPhotoUrl,
          photoConsent: Boolean(cPhotoConsent),
          updatedAt: new Date().toISOString(),
        })
      );
      setEditingChild(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${editingChild.id}`);
    } finally {
      setSavingChild(false);
    }
  };

  const statusBadgeText = (status: Student['registrationStatus']) => {
    if (status === 'approved') return 'Disetujui (Aktif)';
    if (status === 'rejected') return 'Ditolak';
    return 'Menunggu Persetujuan';
  };

  return (
    <>
      <SeoHead
        title={`Dashboard Orang Tua – ${settings.institutionName}`}
        description="Kelola profil anak, jadwal akademik, dan pembayaran SPP."
        path="/akun"
        noIndex
      />
      <div className="bg-slate-50 min-h-[80vh] py-8 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-blue-700">Portal Orang Tua &amp; Siswa</p>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                Halo, {parentProfile?.name || user.displayName || user.email}
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                {user.email} · {myStudents.length} anak terhubung
              </p>
            </div>
            <div className="flex flex-wrap gap-2.5">
              <Link
                to="/pendaftaran"
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                <Plus className="w-4 h-4" aria-hidden="true" />
                <span>Daftarkan Anak</span>
              </Link>
              <button
                type="button"
                onClick={() => void logout()}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                <LogOut className="w-4 h-4" aria-hidden="true" />
                <span>Keluar</span>
              </button>
            </div>
          </div>

          {/* H-3 / Due Today / Overdue Warning */}
          {urgentInvoices.length > 0 && (
            <div
              role="alert"
              className="bg-red-50 border border-red-300 rounded-xl p-4 sm:p-5 space-y-2"
            >
              <div className="flex items-center gap-2 text-red-800 font-bold text-sm">
                <AlertTriangle className="w-5 h-5 shrink-0" aria-hidden="true" />
                <span>Peringatan Tagihan SPP ({urgentInvoices.length} tagihan memerlukan perhatian)</span>
              </div>
              <ul className="space-y-1.5 text-xs sm:text-sm text-red-900">
                {urgentInvoices.map((inv) => {
                  const info = getInvoiceStatusInfo(inv);
                  return (
                    <li key={inv.id}>
                      <strong>{inv.studentNameSnapshot}</strong> ({inv.periodLabel}):{' '}
                      {formatRupiah(inv.amount)} —{' '}
                      <strong>
                        {info.isOverdue
                          ? `Terlambat (Jatuh tempo ${formatIndonesianDate(inv.dueDate)})`
                          : info.isDueToday
                          ? 'Jatuh tempo HARI INI — harap segera dibayar'
                          : `Akan jatuh tempo dalam ${info.daysUntilDue} hari (${formatIndonesianDate(inv.dueDate)})`}
                      </strong>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Child Filter & Navigation Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-wrap gap-1.5 bg-white border border-slate-200 rounded-xl p-1.5">
              {[
                { id: 'anak', label: 'Data Anak', icon: Users },
                { id: 'akademik', label: 'Akademik & Jadwal', icon: BookOpen },
                { id: 'pembayaran', label: 'Tagihan SPP', icon: CreditCard },
                { id: 'profil', label: 'Profil Orang Tua', icon: User },
              ].map((t) => {
                const Icon = t.icon;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTab(t.id as typeof tab)}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors whitespace-nowrap shrink-0 ${
                      tab === t.id
                        ? 'bg-blue-700 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" aria-hidden="true" />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>

            {myStudents.length > 1 && tab !== 'profil' && (
              <div className="flex items-center gap-2">
                <label htmlFor="child-filter" className="text-xs font-semibold text-slate-600">
                  Anak:
                </label>
                <select
                  id="child-filter"
                  value={selectedChildId}
                  onChange={(e) => setSelectedChildId(e.target.value)}
                  className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                >
                  <option value="all">Semua Anak ({myStudents.length})</option>
                  {myStudents.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.fullName}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Tab: Data Anak */}
          {tab === 'anak' && (
            <div className="space-y-4">
              {visibleStudents.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-8 text-center space-y-3">
                  <p className="text-base font-bold text-slate-900">
                    Belum Ada Anak Terdaftar di Akun Ini
                  </p>
                  <p className="text-sm text-slate-600 max-w-md mx-auto">
                    Akun Anda sudah aktif. Silakan isi formulir pendaftaran siswa untuk mendaftarkan satu atau beberapa anak.
                  </p>
                  <Link
                    to="/pendaftaran"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Isi Formulir Pendaftaran Siswa</span>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {visibleStudents.map((child) => (
                    <div
                      key={child.id}
                      className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-semibold text-blue-700">
                            {statusBadgeText(child.registrationStatus)}
                          </p>
                          <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                            {child.fullName}
                          </h2>
                          <p className="text-xs text-slate-500">
                            {child.gradeLevel} · {child.gender} · Lahir{' '}
                            {formatIndonesianDate(child.birthDate)}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => openEditChild(child)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                        >
                          <Edit3 className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Edit</span>
                        </button>
                      </div>

                      <div className="text-sm space-y-1.5 pt-3 border-t border-slate-100">
                        <p>
                          <strong className="text-slate-900">Program:</strong>{' '}
                          {child.programNameSnapshot}
                        </p>
                        <p>
                          <strong className="text-slate-900">Mata Pelajaran:</strong>{' '}
                          {child.subjectNamesSnapshot.join(', ')}
                        </p>
                        <p>
                          <strong className="text-slate-900">Cabang:</strong>{' '}
                          {child.branchNameSnapshot}
                        </p>
                        <p>
                          <strong className="text-slate-900">Nominal SPP Bulanan:</strong>{' '}
                          <span className="tabular-nums">
                            {child.monthlyFee > 0
                              ? formatRupiah(child.monthlyFee)
                              : 'Menunggu penetapan admin'}
                          </span>
                        </p>
                        {child.adminNotes && (
                          <p className="text-xs bg-slate-50 border border-slate-200 rounded-lg p-2.5 text-slate-700">
                            <strong>Catatan Admin:</strong> {child.adminNotes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {editingChild && (
                <div className="bg-white border border-blue-300 rounded-xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-slate-900">
                      Edit Data Anak: {editingChild.fullName}
                    </h3>
                    <button
                      type="button"
                      onClick={() => setEditingChild(null)}
                      className="text-xs font-semibold text-slate-500 hover:text-slate-800"
                    >
                      Tutup
                    </button>
                  </div>
                  <form onSubmit={handleSaveChild} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Nama Lengkap
                        </label>
                        <input
                          type="text"
                          required
                          value={cFullName}
                          onChange={(e) => setCFullName(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Tanggal Lahir
                        </label>
                        <input
                          type="date"
                          required
                          value={cBirthDate}
                          onChange={(e) => setCBirthDate(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Jenis Kelamin
                        </label>
                        <select
                          value={cGender}
                          onChange={(e) =>
                            setCGender(e.target.value as 'Laki-laki' | 'Perempuan')
                          }
                          className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                        >
                          <option value="Laki-laki">Laki-laki</option>
                          <option value="Perempuan">Perempuan</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-1">
                          Alamat
                        </label>
                        <input
                          type="text"
                          required
                          value={cAddress}
                          onChange={(e) => setCAddress(e.target.value)}
                          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                        />
                      </div>
                    </div>
                    <CloudinaryUpload
                      category="student"
                      currentUrl={cPhotoUrl}
                      label="Perbarui Foto Siswa (Opsional)"
                      onUploaded={setCPhotoUrl}
                    />
                    {cPhotoUrl && (
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input
                          type="checkbox"
                          checked={cPhotoConsent}
                          onChange={(e) => setCPhotoConsent(e.target.checked)}
                        />
                        <span>Persetujuan orang tua/wali untuk penggunaan foto siswa.</span>
                      </label>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Catatan Orang Tua
                      </label>
                      <textarea
                        rows={2}
                        value={cNotes}
                        onChange={(e) => setCNotes(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={savingChild}
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
                      >
                        {savingChild ? 'Menyimpan...' : 'Simpan Perubahan'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingChild(null)}
                        className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700"
                      >
                        Batal
                      </button>
                    </div>
                  </form>
                </div>
              )}
            </div>
          )}

          {/* Tab: Akademik & Jadwal */}
          {tab === 'akademik' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Jadwal Belajar Sesuai Program Anak
                </h2>
                {visibleStudents.length === 0 ? (
                  <p className="text-sm text-slate-600">Belum ada anak terdaftar.</p>
                ) : (
                  <div className="space-y-4">
                    {visibleStudents.map((child) => {
                      const matchingSchedules = schedules.filter(
                        (sch) =>
                          sch.isActive &&
                          sch.programId === child.programId &&
                          sch.branchId === child.branchId
                      );
                      return (
                        <div key={child.id} className="border border-slate-200 rounded-lg p-4 space-y-2">
                          <p className="text-sm font-bold text-slate-900">
                            {child.fullName} — {child.programNameSnapshot}
                          </p>
                          <p className="text-xs text-slate-500">
                            Mapel: {child.subjectNamesSnapshot.join(', ')} · {child.branchNameSnapshot}
                          </p>
                          {matchingSchedules.length === 0 ? (
                            <p className="text-xs text-slate-500 pt-1">
                              Jadwal kelas khusus anak akan ditampilkan di sini setelah diatur oleh admin.
                            </p>
                          ) : (
                            <ul className="pt-2 space-y-1.5 text-sm">
                              {matchingSchedules.map((sch) => (
                                <li
                                  key={sch.id}
                                  className="flex items-center justify-between text-xs bg-slate-50 p-2 rounded"
                                >
                                  <span>
                                    <strong>{sch.dayOfWeek}</strong> ({sch.startTime}–{sch.endTime}) ·{' '}
                                    {sch.subjectName || sch.className}
                                  </span>
                                  <span className="text-slate-500">{sch.teacherName}</span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Pengumuman Terbaru</h2>
                {announcements.filter((a) => a.status === 'published').length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada pengumuman terbaru.</p>
                ) : (
                  <div className="space-y-3">
                    {announcements
                      .filter((a) => a.status === 'published')
                      .slice(0, 4)
                      .map((ann) => (
                        <Link
                          key={ann.id}
                          to={`/pengumuman/${ann.slug}`}
                          className="block border border-slate-200 rounded-lg p-3 hover:border-blue-300"
                        >
                          <p className="text-xs text-slate-500 flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{formatIndonesianDate(ann.publishedAt)}</span>
                          </p>
                          <p className="text-sm font-bold text-slate-900 mt-1">{ann.title}</p>
                        </Link>
                      ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Tagihan & Pembayaran SPP */}
          {tab === 'pembayaran' && (
            <div className="space-y-6">
              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">
                      Tagihan SPP Bulanan
                    </h2>
                    <p className="text-xs text-slate-500">
                      Pembayaran dicatat langsung oleh Admin. Gunakan tombol WhatsApp di setiap tagihan untuk konfirmasi.
                    </p>
                  </div>
                </div>

                {visibleInvoices.length === 0 ? (
                  <p className="text-sm text-slate-600 py-4">
                    Belum ada tagihan SPP yang diterbitkan untuk anak Anda.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {visibleInvoices.map((inv) => {
                      const info = getInvoiceStatusInfo(inv);
                      const waUrl = buildParentPaymentWhatsAppUrl({
                        parentName: inv.parentNameSnapshot || parentProfile?.name || '',
                        studentName: inv.studentNameSnapshot,
                        programName: inv.programNameSnapshot,
                        periodLabel: inv.periodLabel,
                        amount: inv.amount,
                        dueDate: inv.dueDate,
                        baseWhatsappUrl: settings.whatsappUrl,
                      });
                      return (
                        <div
                          key={inv.id}
                          className={`border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                            info.isOverdue || info.isDueToday
                              ? 'border-red-300 bg-red-50/40'
                              : info.isH3Warning
                              ? 'border-amber-300 bg-amber-50/40'
                              : 'border-slate-200 bg-white'
                          }`}
                        >
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-slate-500">
                              {inv.studentNameSnapshot} · {inv.programNameSnapshot}
                            </p>
                            <p className="text-base font-bold text-slate-900">
                              Periode {inv.periodLabel} —{' '}
                              <span className="tabular-nums">{formatRupiah(inv.amount)}</span>
                            </p>
                            <p className="text-xs text-slate-600">
                              Jatuh tempo: {formatIndonesianDate(inv.dueDate)} · Status:{' '}
                              <strong
                                className={
                                  info.code === 'paid'
                                    ? 'text-emerald-700'
                                    : info.isOverdue || info.isDueToday
                                    ? 'text-red-700'
                                    : 'text-amber-700'
                                }
                              >
                                {info.label}
                              </strong>
                            </p>
                          </div>

                          {inv.status === 'unpaid' ? (
                            <a
                              href={waUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors whitespace-nowrap shrink-0"
                            >
                              <MessageCircle className="w-4 h-4" aria-hidden="true" />
                              <span>Konfirmasi WhatsApp Admin</span>
                            </a>
                          ) : (
                            <span className="text-xs font-semibold text-emerald-700 whitespace-nowrap">
                              Lunas ({inv.paymentMethod} · {formatIndonesianDate(inv.paidAt)})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-bold text-slate-900">Riwayat Transaksi Lunas</h2>
                {visiblePayments.length === 0 ? (
                  <p className="text-sm text-slate-500">Belum ada riwayat pembayaran SPP.</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                        <tr>
                          <th className="px-3 py-2.5">No. Kwitansi</th>
                          <th className="px-3 py-2.5">Siswa</th>
                          <th className="px-3 py-2.5">Periode</th>
                          <th className="px-3 py-2.5">Tanggal Bayar</th>
                          <th className="px-3 py-2.5">Metode</th>
                          <th className="px-3 py-2.5 text-right">Nominal</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {visiblePayments.map((p) => (
                          <tr key={p.id}>
                            <td className="px-3 py-2.5 font-mono text-xs">{p.receiptNumber}</td>
                            <td className="px-3 py-2.5 font-medium">{p.studentNameSnapshot}</td>
                            <td className="px-3 py-2.5">{p.periodLabel}</td>
                            <td className="px-3 py-2.5">{formatIndonesianDate(p.paymentDate)}</td>
                            <td className="px-3 py-2.5">{p.paymentMethod}</td>
                            <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                              {formatRupiah(p.amountSnapshot)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Tab: Profil Orang Tua */}
          {tab === 'profil' && (
            <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 max-w-2xl space-y-5">
              <h2 className="text-lg font-bold text-slate-900">Edit Profil Orang Tua / Wali</h2>
              {parentSavedMsg && (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800">
                  {parentSavedMsg}
                </div>
              )}
              <form onSubmit={handleSaveParent} className="space-y-4">
                <div>
                  <label htmlFor="prof-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap
                  </label>
                  <input
                    id="prof-name"
                    type="text"
                    required
                    value={pName}
                    onChange={(e) => setPName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prof-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Akun
                  </label>
                  <input
                    id="prof-email"
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label htmlFor="prof-wa" className="block text-sm font-medium text-slate-700 mb-1">
                    Nomor WhatsApp
                  </label>
                  <input
                    id="prof-wa"
                    type="tel"
                    required
                    value={pWhatsapp}
                    onChange={(e) => setPWhatsapp(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <div>
                  <label htmlFor="prof-addr" className="block text-sm font-medium text-slate-700 mb-1">
                    Alamat Lengkap
                  </label>
                  <textarea
                    id="prof-addr"
                    rows={3}
                    required
                    value={pAddress}
                    onChange={(e) => setPAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                </div>
                <button
                  type="submit"
                  disabled={savingParent}
                  className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60"
                >
                  {savingParent ? 'Menyimpan...' : 'Simpan Profil'}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
