import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildParentPaymentWhatsAppUrl,
  mapFirebaseAuthErrorIndonesian,
  slugify,
  validateCloudinaryFile,
  validateRegistrationInput,
} from './validation';

test('slugify formats Indonesian teacher names cleanly', () => {
  assert.equal(slugify('ALFIYANI, S.Pd'), 'alfiyani-spd');
  assert.equal(slugify('JALALUDIN NUROHMAN'), 'jalaludin-nurohman');
});

test('validateCloudinaryFile allows valid JPG/PNG/WebP under 5MB and rejects invalid types or oversized files', () => {
  assert.equal(validateCloudinaryFile({ type: 'image/jpeg', size: 1024 * 500 }).valid, true);
  assert.equal(validateCloudinaryFile({ type: 'image/png', size: 1024 * 500 }).valid, true);
  assert.equal(validateCloudinaryFile({ type: 'application/pdf', size: 1024 }).valid, false);
  assert.equal(validateCloudinaryFile({ type: 'image/jpeg', size: 6 * 1024 * 1024 }).valid, false);
});

test('buildParentPaymentWhatsAppUrl includes only the target child details', () => {
  const url = buildParentPaymentWhatsAppUrl({
    parentName: 'Budi Santoso',
    studentName: 'Alya Putri',
    programName: 'CALISTUNG (TK – Kelas 1)',
    periodLabel: 'Februari 2026',
    amount: 250000,
    dueDate: '2026-02-05',
  });
  assert.ok(url.startsWith('https://wa.me/6282119770700?text='));
  const decoded = decodeURIComponent(url.split('text=')[1]);
  assert.match(decoded, /Budi Santoso/);
  assert.match(decoded, /Alya Putri/);
  assert.match(decoded, /Februari 2026/);
  assert.match(decoded, /250\.000/);
  assert.match(decoded, /5 Februari 2026/);
});

test('validateRegistrationInput enforces single vs multiple subject selection rules', () => {
  const singleFail = validateRegistrationInput({
    parentName: 'Ibu Sari',
    parentWhatsapp: '081234567890',
    parentAddress: 'Indramayu',
    studentName: 'Raka Pratama',
    birthDate: '2019-04-10',
    gender: 'Laki-laki',
    gradeLevel: 'TK B',
    programId: 'tk-kelas-1',
    selectionMode: 'single',
    subjectIds: ['sub-1', 'sub-2'],
    branchId: 'indramayu',
    studentAddress: 'Indramayu',
  });
  assert.equal(singleFail.valid, false);
  assert.ok(singleFail.errors.subjectIds);

  const multiPass = validateRegistrationInput({
    parentName: 'Ibu Sari',
    parentWhatsapp: '081234567890',
    parentAddress: 'Indramayu',
    studentName: 'Raka Pratama',
    birthDate: '2016-04-10',
    gender: 'Laki-laki',
    gradeLevel: 'Kelas 4 SD',
    programId: 'kelas-2-5',
    selectionMode: 'multiple',
    subjectIds: ['sub-mtk', 'sub-ipas'],
    branchId: 'terisi',
    studentAddress: 'Terisi Indramayu',
  });
  assert.equal(multiPass.valid, true);
});

test('mapFirebaseAuthErrorIndonesian returns Indonesian messages', () => {
  assert.match(mapFirebaseAuthErrorIndonesian('auth/wrong-password'), /tidak sesuai/i);
  assert.match(mapFirebaseAuthErrorIndonesian('auth/email-already-in-use'), /sudah terdaftar/i);
});
