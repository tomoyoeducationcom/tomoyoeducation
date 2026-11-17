import { formatIndonesianDate, formatRupiah } from './billing';

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

const ALLOWED_IMAGE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5 MB

export function validateCloudinaryFile(file: {
  type: string;
  size: number;
}): { valid: boolean; error?: string } {
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return {
      valid: false,
      error: 'Format file tidak didukung. Gunakan JPG, PNG, atau WebP.',
    };
  }
  if (file.size <= 0) {
    return {
      valid: false,
      error: 'Ukuran file tidak valid.',
    };
  }
  if (file.size > MAX_IMAGE_BYTES) {
    return {
      valid: false,
      error: 'Ukuran file maksimal 5 MB.',
    };
  }
  return { valid: true };
}

export function buildParentPaymentWhatsAppUrl(params: {
  parentName: string;
  studentName: string;
  programName: string;
  periodLabel: string;
  amount: number;
  dueDate: string;
  baseWhatsappUrl?: string;
}): string {
  const base = (params.baseWhatsappUrl || 'https://wa.me/6282119770700').split('?')[0];
  const lines = [
    'Halo Admin TOMOYO PRIVAT & BIMBEL EDUCATION,',
    'Saya ingin menanyakan / mengonfirmasi pembayaran SPP dengan rincian berikut:',
    `- Nama Orang Tua: ${params.parentName}`,
    `- Nama Siswa: ${params.studentName}`,
    `- Program: ${params.programName}`,
    `- Periode Tagihan: ${params.periodLabel}`,
    `- Nominal: ${formatRupiah(params.amount)}`,
    `- Jatuh Tempo: ${formatIndonesianDate(params.dueDate)}`,
    'Terima kasih.',
  ];
  return `${base}?text=${encodeURIComponent(lines.join('\n'))}`;
}

export interface RegistrationValidationInput {
  parentName: string;
  parentWhatsapp: string;
  parentAddress: string;
  studentName: string;
  birthDate: string;
  gender: string;
  gradeLevel: string;
  programId: string;
  selectionMode?: 'single' | 'multiple';
  subjectIds: string[];
  branchId: string;
  studentAddress: string;
}

export function validateRegistrationInput(
  input: RegistrationValidationInput
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  if (!input.parentName || input.parentName.trim().length < 2) {
    errors.parentName = 'Nama orang tua/wali wajib diisi (minimal 2 karakter).';
  }
  if (!input.parentWhatsapp || input.parentWhatsapp.replace(/\D/g, '').length < 9) {
    errors.parentWhatsapp = 'Nomor WhatsApp orang tua wajib diisi dengan benar.';
  }
  if (!input.parentAddress || input.parentAddress.trim().length < 5) {
    errors.parentAddress = 'Alamat orang tua wajib diisi.';
  }
  if (!input.studentName || input.studentName.trim().length < 2) {
    errors.studentName = 'Nama lengkap siswa wajib diisi.';
  }
  if (!input.birthDate || !/^\d{4}-\d{2}-\d{2}$/.test(input.birthDate)) {
    errors.birthDate = 'Tanggal lahir siswa wajib diisi.';
  }
  if (input.gender !== 'Laki-laki' && input.gender !== 'Perempuan') {
    errors.gender = 'Pilih jenis kelamin siswa.';
  }
  if (!input.gradeLevel || input.gradeLevel.trim().length < 1) {
    errors.gradeLevel = 'Jenjang / kelas siswa wajib diisi.';
  }
  if (!input.programId) {
    errors.programId = 'Pilih program belajar terlebih dahulu.';
  }
  if (!input.subjectIds || input.subjectIds.length === 0) {
    errors.subjectIds = 'Pilih minimal 1 mata pelajaran.';
  } else if (input.selectionMode === 'single' && input.subjectIds.length > 1) {
    errors.subjectIds = 'Program ini hanya memperbolehkan memilih 1 mata pelajaran.';
  }
  if (!input.branchId) {
    errors.branchId = 'Pilih cabang belajar terlebih dahulu.';
  }
  if (!input.studentAddress || input.studentAddress.trim().length < 5) {
    errors.studentAddress = 'Alamat siswa wajib diisi.';
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function mapFirebaseAuthErrorIndonesian(errorCode: string): string {
  switch (errorCode) {
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini telah dinonaktifkan. Silakan hubungi admin.';
    case 'auth/user-not-found':
      return 'Akun dengan email tersebut belum terdaftar.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return 'Email atau kata sandi tidak sesuai.';
    case 'auth/email-already-in-use':
      return 'Alamat email ini sudah terdaftar. Silakan masuk atau gunakan email lain.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan. Silakan tunggu beberapa menit lalu coba lagi.';
    case 'auth/popup-closed-by-user':
      return 'Jendela login Google ditutup sebelum selesai.';
    case 'auth/popup-blocked':
      return 'Popup diblokir oleh browser. Mengalihkan ke login Google...';
    case 'auth/network-request-failed':
      return 'Koneksi internet terganggu. Periksa jaringan Anda dan coba lagi.';
    case 'auth/requires-recent-login':
      return 'Demi keamanan, silakan login ulang terlebih dahulu.';
    default:
      return 'Terjadi kendala saat autentikasi. Silakan coba kembali.';
  }
}
