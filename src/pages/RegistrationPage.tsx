import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { doc, writeBatch } from 'firebase/firestore';
import { CheckCircle2, AlertCircle, UserPlus } from 'lucide-react';
import { useApp } from '../contexts/AppContext';
import { SeoHead } from '../components/SeoHead';
import { CloudinaryUpload } from '../components/CloudinaryUpload';
import { EmailVerificationGate } from './AuthPages';
import { db } from '../lib/firebase';
import { handleFirestoreError, OperationType, sanitizeFirestorePayload } from '../lib/firestoreErrors';
import { validateRegistrationInput } from '../lib/validation';
import { getTodayIndonesiaISO } from '../lib/billing';

export const RegistrationPage: React.FC = () => {
  const {
    user,
    authReady,
    isVerifiedUser,
    settings,
    parentProfile,
    programs,
    subjects,
    branches,
    loginWithGoogle,
  } = useApp();
  const navigate = useNavigate();

  const activePrograms = programs.filter((p) => p.status === 'published' && p.isActive);
  const activeBranches = branches.filter((b) => b.isActive);

  const [parentName, setParentName] = useState('');
  const [parentWhatsapp, setParentWhatsapp] = useState('');
  const [parentAddress, setParentAddress] = useState('');

  const [studentName, setStudentName] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoConsent, setPhotoConsent] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [gender, setGender] = useState<'Laki-laki' | 'Perempuan'>('Laki-laki');
  const [gradeLevel, setGradeLevel] = useState('');
  const [programId, setProgramId] = useState('');
  const [selectedSubjectIds, setSelectedSubjectIds] = useState<string[]>([]);
  const [branchId, setBranchId] = useState('');
  const [studentAddress, setStudentAddress] = useState('');
  const [sameAddress, setSameAddress] = useState(true);
  const [notes, setNotes] = useState('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitError, setSubmitError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submittedStudentName, setSubmittedStudentName] = useState('');

  useEffect(() => {
    if (parentProfile) {
      setParentName((prev) => prev || parentProfile.name);
      setParentWhatsapp((prev) => prev || parentProfile.whatsapp);
      setParentAddress((prev) => prev || parentProfile.address);
    } else if (user?.displayName) {
      setParentName((prev) => prev || user.displayName || '');
    }
  }, [parentProfile, user]);

  useEffect(() => {
    if (sameAddress) {
      setStudentAddress(parentAddress);
    }
  }, [sameAddress, parentAddress]);

  const selectedProgram = activePrograms.find((p) => p.id === programId);
  const programSubjects = subjects.filter(
    (s) => s.programId === programId && s.isActive
  );

  const handleProgramChange = (newProgId: string) => {
    setProgramId(newProgId);
    const prog = activePrograms.find((p) => p.id === newProgId);
    const subs = subjects.filter((s) => s.programId === newProgId && s.isActive);
    if (prog?.selectionMode === 'single' && subs.length === 1) {
      setSelectedSubjectIds([subs[0].id]);
    } else {
      setSelectedSubjectIds([]);
    }
  };

  const toggleSubject = (subId: string) => {
    if (selectedProgram?.selectionMode === 'single') {
      setSelectedSubjectIds([subId]);
      return;
    }
    setSelectedSubjectIds((prev) =>
      prev.includes(subId) ? prev.filter((id) => id !== subId) : [...prev, subId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !isVerifiedUser) return;
    setSubmitError('');

    const resolvedAddress = sameAddress ? parentAddress : studentAddress;
    const validation = validateRegistrationInput({
      parentName,
      parentWhatsapp,
      parentAddress,
      studentName,
      birthDate,
      gender,
      gradeLevel,
      programId,
      selectionMode: selectedProgram?.selectionMode,
      subjectIds: selectedSubjectIds,
      branchId,
      studentAddress: resolvedAddress,
    });

    setErrors(validation.errors);
    if (!validation.valid) return;

    const chosenProgram = activePrograms.find((p) => p.id === programId);
    const chosenBranch = activeBranches.find((b) => b.id === branchId);
    if (!chosenProgram || !chosenBranch) {
      setSubmitError('Program atau cabang yang dipilih tidak valid.');
      return;
    }

    const chosenSubjectNames = programSubjects
      .filter((s) => selectedSubjectIds.includes(s.id))
      .map((s) => s.name);

    setSubmitting(true);
    try {
      const nowIso = new Date().toISOString();
      const studentId = `std_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const regId = `reg_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
      const todayIso = getTodayIndonesiaISO();
      const anchorDay = Number(todayIso.split('-')[2]) || 1;

      const batch = writeBatch(db);

      batch.set(
        doc(db, 'parents', user.uid),
        sanitizeFirestorePayload({
          uid: user.uid,
          name: parentName.trim(),
          email: user.email || '',
          whatsapp: parentWhatsapp.trim(),
          address: parentAddress.trim(),
          createdAt: parentProfile?.createdAt || nowIso,
          updatedAt: nowIso,
        })
      );

      batch.set(
        doc(db, 'students', studentId),
        sanitizeFirestorePayload({
          parentUid: user.uid,
          parentName: parentName.trim(),
          fullName: studentName.trim(),
          photoUrl: photoUrl || '',
          photoConsent: Boolean(photoConsent),
          birthDate,
          gender,
          gradeLevel: gradeLevel.trim(),
          programId: chosenProgram.id,
          programNameSnapshot: chosenProgram.name,
          subjectIds: selectedSubjectIds,
          subjectNamesSnapshot: chosenSubjectNames,
          branchId: chosenBranch.id,
          branchNameSnapshot: chosenBranch.name,
          address: resolvedAddress.trim(),
          notes: notes.trim(),
          registrationStatus: 'pending',
          isActive: false,
          monthlyFee: 0,
          billingAnchorDay: anchorDay,
          startDate: todayIso,
          adminNotes: '',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      batch.set(
        doc(db, 'registrations', regId),
        sanitizeFirestorePayload({
          parentUid: user.uid,
          studentId,
          parentNameSnapshot: parentName.trim(),
          parentEmailSnapshot: user.email || '',
          parentWhatsappSnapshot: parentWhatsapp.trim(),
          studentNameSnapshot: studentName.trim(),
          gradeLevel: gradeLevel.trim(),
          programId: chosenProgram.id,
          programNameSnapshot: chosenProgram.name,
          subjectNamesSnapshot: chosenSubjectNames,
          branchId: chosenBranch.id,
          branchNameSnapshot: chosenBranch.name,
          notes: notes.trim(),
          status: 'pending',
          adminNotes: '',
          reviewedAt: '',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      await batch.commit();
      setSubmittedStudentName(studentName.trim());
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'registrations');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SeoHead
        title={`Pendaftaran Siswa Baru – ${settings.institutionName}`}
        description={`Formulir pendaftaran peserta didik baru di ${settings.institutionName}.`}
        path="/pendaftaran"
      />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 space-y-8">
        <div className="space-y-2">
          <p className="text-sm font-semibold text-blue-700">Penerimaan Peserta Didik</p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900">
            Pendaftaran Siswa Baru
          </h1>
          <p className="text-slate-600">
            Orang tua/wali membuat atau masuk ke akun terlebih dahulu sebelum mengisi formulir anak. Satu akun dapat mendaftarkan lebih dari satu anak.
          </p>
        </div>

        {!authReady ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-600">
            Memeriksa status akun...
          </div>
        ) : !user ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-6 sm:p-8 space-y-5">
            <h2 className="text-xl font-bold text-slate-900">
              Langkah 1: Buat atau Masuk ke Akun Orang Tua
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Untuk menjaga keamanan data anak dan memantau persetujuan pendaftaran serta tagihan SPP, orang tua wajib login terlebih dahulu menggunakan Email/Password (dengan verifikasi email) atau Akun Google.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link
                to="/register"
                className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                Buat Akun Orang Tua
              </Link>
              <Link
                to="/login"
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Sudah Punya Akun (Masuk)
              </Link>
              <button
                type="button"
                onClick={() => void loginWithGoogle()}
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Masuk Cepat dengan Google
              </button>
            </div>
          </div>
        ) : !isVerifiedUser ? (
          <EmailVerificationGate />
        ) : submittedStudentName ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-8 space-y-4">
            <div className="flex items-center gap-3 text-emerald-800">
              <CheckCircle2 className="w-7 h-7 shrink-0" aria-hidden="true" />
              <h2 className="text-xl font-bold">Pendaftaran Berhasil Dikirim</h2>
            </div>
            <p className="text-sm text-emerald-900 leading-relaxed">
              Data pendaftaran untuk <strong>{submittedStudentName}</strong> telah masuk ke sistem kami dengan status <strong>Menunggu Persetujuan Admin</strong>. Siswa akan aktif setelah diperiksa dan disetujui oleh admin.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button
                type="button"
                onClick={() => navigate('/akun')}
                className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 transition-colors"
              >
                Lihat Status di Dashboard Akun
              </button>
              <button
                type="button"
                onClick={() => {
                  setSubmittedStudentName('');
                  setStudentName('');
                  setBirthDate('');
                  setGradeLevel('');
                  setPhotoUrl('');
                  setNotes('');
                }}
                className="px-5 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-sm font-semibold hover:bg-slate-50 transition-colors"
              >
                Daftarkan Anak Lainnya
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-8"
          >
            {submitError && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-4 flex items-start gap-2 text-sm text-red-700">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Data Orang Tua */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
                Data Orang Tua / Wali
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="p-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Orang Tua / Wali *
                  </label>
                  <input
                    id="p-name"
                    type="text"
                    value={parentName}
                    onChange={(e) => setParentName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                  {errors.parentName && (
                    <p className="mt-1 text-xs text-red-600">{errors.parentName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="p-email" className="block text-sm font-medium text-slate-700 mb-1">
                    Email Akun
                  </label>
                  <input
                    id="p-email"
                    type="email"
                    disabled
                    value={user.email || ''}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-sm text-slate-600"
                  />
                </div>
                <div>
                  <label htmlFor="p-wa" className="block text-sm font-medium text-slate-700 mb-1">
                    Nomor WhatsApp Orang Tua *
                  </label>
                  <input
                    id="p-wa"
                    type="tel"
                    value={parentWhatsapp}
                    onChange={(e) => setParentWhatsapp(e.target.value)}
                    placeholder="08xxxxxxxxxx"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                  {errors.parentWhatsapp && (
                    <p className="mt-1 text-xs text-red-600">{errors.parentWhatsapp}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="p-addr" className="block text-sm font-medium text-slate-700 mb-1">
                    Alamat Orang Tua *
                  </label>
                  <input
                    id="p-addr"
                    type="text"
                    value={parentAddress}
                    onChange={(e) => setParentAddress(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                    placeholder="Desa/Kelurahan, Kecamatan, Kab. Indramayu"
                  />
                  {errors.parentAddress && (
                    <p className="mt-1 text-xs text-red-600">{errors.parentAddress}</p>
                  )}
                </div>
              </div>
            </section>

            {/* Data Siswa */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
                Data Peserta Didik (Anak)
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="s-name" className="block text-sm font-medium text-slate-700 mb-1">
                    Nama Lengkap Siswa *
                  </label>
                  <input
                    id="s-name"
                    type="text"
                    value={studentName}
                    onChange={(e) => setStudentName(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                  {errors.studentName && (
                    <p className="mt-1 text-xs text-red-600">{errors.studentName}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="s-dob" className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Lahir *
                  </label>
                  <input
                    id="s-dob"
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                  {errors.birthDate && (
                    <p className="mt-1 text-xs text-red-600">{errors.birthDate}</p>
                  )}
                </div>
                <div>
                  <label htmlFor="s-gender" className="block text-sm font-medium text-slate-700 mb-1">
                    Jenis Kelamin *
                  </label>
                  <select
                    id="s-gender"
                    value={gender}
                    onChange={(e) => setGender(e.target.value as 'Laki-laki' | 'Perempuan')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  >
                    <option value="Laki-laki">Laki-laki</option>
                    <option value="Perempuan">Perempuan</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="s-grade" className="block text-sm font-medium text-slate-700 mb-1">
                    Kelas / Jenjang Saat Ini *
                  </label>
                  <input
                    id="s-grade"
                    type="text"
                    value={gradeLevel}
                    onChange={(e) => setGradeLevel(e.target.value)}
                    placeholder="Contoh: TK B, Kelas 1 SD, Kelas 4 SD, Kelas 6 SD"
                    className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  />
                  {errors.gradeLevel && (
                    <p className="mt-1 text-xs text-red-600">{errors.gradeLevel}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <CloudinaryUpload
                  category="student"
                  currentUrl={photoUrl}
                  label="Foto Siswa (Opsional)"
                  onUploaded={setPhotoUrl}
                />
                {photoUrl && (
                  <label className="flex items-start gap-2 text-xs text-slate-600">
                    <input
                      type="checkbox"
                      checked={photoConsent}
                      onChange={(e) => setPhotoConsent(e.target.checked)}
                      className="mt-0.5 rounded border-slate-300"
                    />
                    <span>
                      Saya sebagai orang tua/wali menyetujui penyimpanan foto siswa untuk keperluan identitas administrasi lembaga (tidak dipublikasikan tanpa izin tambahan).
                    </span>
                  </label>
                )}
              </div>

              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={sameAddress}
                    onChange={(e) => setSameAddress(e.target.checked)}
                    className="rounded border-slate-300"
                  />
                  <span>Alamat siswa sama dengan alamat orang tua</span>
                </label>
                {!sameAddress && (
                  <div>
                    <label htmlFor="s-addr" className="block text-sm font-medium text-slate-700 mb-1">
                      Alamat Siswa *
                    </label>
                    <input
                      id="s-addr"
                      type="text"
                      value={studentAddress}
                      onChange={(e) => setStudentAddress(e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                    />
                    {errors.studentAddress && (
                      <p className="mt-1 text-xs text-red-600">{errors.studentAddress}</p>
                    )}
                  </div>
                )}
              </div>
            </section>

            {/* Pilihan Program, Mata Pelajaran & Cabang */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-slate-900 pb-2 border-b border-slate-200">
                Pilihan Program, Mata Pelajaran &amp; Cabang
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="s-program" className="block text-sm font-medium text-slate-700 mb-1">
                    Program Belajar *
                  </label>
                  <select
                    id="s-program"
                    value={programId}
                    onChange={(e) => handleProgramChange(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  >
                    <option value="">-- Pilih Program --</option>
                    {activePrograms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.levelLabel})
                      </option>
                    ))}
                  </select>
                  {errors.programId && (
                    <p className="mt-1 text-xs text-red-600">{errors.programId}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="s-branch" className="block text-sm font-medium text-slate-700 mb-1">
                    Cabang Belajar *
                  </label>
                  <select
                    id="s-branch"
                    value={branchId}
                    onChange={(e) => setBranchId(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3.5 py-2 text-sm"
                  >
                    <option value="">-- Pilih Cabang --</option>
                    {activeBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name}
                      </option>
                    ))}
                  </select>
                  {errors.branchId && (
                    <p className="mt-1 text-xs text-red-600">{errors.branchId}</p>
                  )}
                </div>
              </div>

              {selectedProgram && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      Pilih Mata Pelajaran ({selectedProgram.name}) *
                    </p>
                    <p className="text-xs text-slate-600">
                      {selectedProgram.selectionMode === 'single'
                        ? 'Pilih 1 mata pelajaran sesuai paket program ini.'
                        : 'Anda dapat memilih satu atau beberapa mata pelajaran aktif.'}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {programSubjects.map((sub) => {
                      const checked = selectedSubjectIds.includes(sub.id);
                      return (
                        <label
                          key={sub.id}
                          className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                            checked
                              ? 'border-blue-600 bg-blue-50 text-blue-900'
                              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type={
                              selectedProgram.selectionMode === 'single' ? 'radio' : 'checkbox'
                            }
                            name="subject-choice"
                            checked={checked}
                            onChange={() => toggleSubject(sub.id)}
                          />
                          <span className="text-sm font-medium">{sub.name}</span>
                        </label>
                      );
                    })}
                  </div>
                  {errors.subjectIds && (
                    <p className="text-xs text-red-600">{errors.subjectIds}</p>
                  )}
                </div>
              )}

              <div>
                <label htmlFor="s-notes" className="block text-sm font-medium text-slate-700 mb-1">
                  Catatan Tambahan (Opsional)
                </label>
                <textarea
                  id="s-notes"
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3.5 py-2 text-sm"
                  placeholder="Preferensi hari belajar, catatan kebutuhan khusus belajar, dll."
                />
              </div>
            </section>

            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-60 transition-colors"
            >
              <UserPlus className="w-4 h-4" aria-hidden="true" />
              <span>{submitting ? 'Mengirim Pendaftaran...' : 'Kirim Formulir Pendaftaran'}</span>
            </button>
          </form>
        )}
      </div>
    </>
  );
};
