import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatIndonesianDate, formatRupiah, getTodayIndonesiaISO } from './billing';
import type { Payment } from '../types';

async function loadLogoDataUrl(logoUrl: string): Promise<string | null> {
  try {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error('Logo gagal dimuat'));
      img.src = logoUrl;
    });
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || 128;
    canvas.height = img.naturalHeight || 128;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL('image/png');
  } catch {
    return null;
  }
}

export interface PdfReportOptions {
  title: string;
  periodLabel: string;
  institutionName?: string;
  logoUrl?: string;
  columns: string[];
  rows: (string | number)[][];
  summaryLines?: string[];
  filename: string;
  orientation?: 'portrait' | 'landscape';
}

export async function exportAdminReportPdf(options: PdfReportOptions): Promise<void> {
  const orientation = options.orientation || (options.columns.length > 6 ? 'landscape' : 'portrait');
  const doc = new jsPDF({ orientation, unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const institutionName = options.institutionName || 'TOMOYO PRIVAT & BIMBEL EDUCATION';
  const logoData = await loadLogoDataUrl(options.logoUrl || '/assets/aistudio/favicon_67ba3fe5.png');

  if (logoData) {
    doc.addImage(logoData, 'PNG', 14, 11, 16, 16);
  }

  const textStartX = logoData ? 34 : 14;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(15, 23, 42);
  doc.text(institutionName, textStartX, 17);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text('LEARN • GROW • SUCCEED  |  Indramayu Kota & Kecamatan Terisi', textStartX, 23);

  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.7);
  doc.line(14, 30, pageWidth - 14, 30);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(options.title, 14, 38);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  const generatedDate = formatIndonesianDate(getTodayIndonesiaISO());
  doc.text(`Periode / Filter: ${options.periodLabel}`, 14, 44);
  doc.text(`Tanggal Cetak: ${generatedDate}`, pageWidth - 14, 44, { align: 'right' });

  autoTable(doc, {
    startY: 49,
    head: [options.columns],
    body: options.rows,
    theme: 'grid',
    styles: {
      font: 'helvetica',
      fontSize: 8.5,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    headStyles: {
      fillColor: [29, 78, 216],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    margin: { left: 14, right: 14, bottom: 20 },
  });

  if (options.summaryLines && options.summaryLines.length > 0) {
    const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 60;
    let y = finalY + 8;
    if (y > pageHeight - 25) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42);
    for (const line of options.summaryLines) {
      doc.text(line, 14, y);
      y += 5.5;
    }
  }

  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139);
    doc.text(
      `${institutionName} — Dokumen Administrasi Resmi`,
      14,
      pageHeight - 10
    );
    doc.text(
      `Halaman ${i} dari ${totalPages}`,
      pageWidth - 14,
      pageHeight - 10,
      { align: 'right' }
    );
  }

  doc.save(options.filename.endsWith('.pdf') ? options.filename : `${options.filename}.pdf`);
}

export async function exportPaymentReceiptPdf(
  payment: Payment,
  institutionName = 'TOMOYO PRIVAT & BIMBEL EDUCATION',
  logoUrl = '/assets/aistudio/favicon_67ba3fe5.png'
): Promise<void> {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a5' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const logoData = await loadLogoDataUrl(logoUrl);

  if (logoData) {
    doc.addImage(logoData, 'PNG', 12, 10, 15, 15);
  }

  const x = logoData ? 30 : 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text(institutionName, x, 15);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(71, 85, 105);
  doc.text('BUKTI PEMBAYARAN SPP RESMI', x, 20.5);

  doc.setDrawColor(29, 78, 216);
  doc.setLineWidth(0.6);
  doc.line(12, 28, pageWidth - 12, 28);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(29, 78, 216);
  doc.text(`No. Kwitansi: ${payment.receiptNumber}`, 12, 35);

  autoTable(doc, {
    startY: 40,
    theme: 'plain',
    styles: { fontSize: 9.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    columnStyles: { 0: { fontStyle: 'bold', cellWidth: 44 } },
    body: [
      ['Nama Siswa', `: ${payment.studentNameSnapshot}`],
      ['Nama Orang Tua/Wali', `: ${payment.parentNameSnapshot}`],
      ['Program Belajar', `: ${payment.programNameSnapshot}`],
      ['Cabang', `: ${payment.branchNameSnapshot}`],
      ['Periode Tagihan', `: ${payment.periodLabel}`],
      ['Tanggal Bayar', `: ${formatIndonesianDate(payment.paymentDate)}`],
      ['Metode Pembayaran', `: ${payment.paymentMethod}`],
      ['Nominal Dibayar', `: ${formatRupiah(payment.amountSnapshot)}`],
      ['Status', ': LUNAS'],
      ['Catatan', `: ${payment.notes || '-'}`],
    ],
    margin: { left: 12, right: 12 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY || 120;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(100, 116, 139);
  doc.text(
    `Dicetak pada ${formatIndonesianDate(getTodayIndonesiaISO())} melalui Sistem Administrasi ${institutionName}.`,
    12,
    finalY + 14
  );

  doc.save(`Kwitansi-${payment.receiptNumber}.pdf`);
}
