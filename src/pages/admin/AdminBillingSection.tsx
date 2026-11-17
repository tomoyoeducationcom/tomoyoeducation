import React, { useState } from 'react';
import { doc, setDoc, writeBatch } from 'firebase/firestore';
import { AlertTriangle, CheckCircle2, FileDown, Plus, Receipt } from 'lucide-react';
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
  getInvoiceStatusInfo,
  getNextBillingPeriod,
  getTodayIndonesiaISO,
} from '../../lib/billing';
import { exportPaymentReceiptPdf } from '../../lib/pdfExport';
import { ADMIN_UID } from '../../data/initialData';
import type { Invoice, Payment } from '../../types';

export const AdminBillingSection: React.FC<{
  mode: 'pembayaran' | 'tagihan';
  branchFilter: string;
}> = ({ mode, branchFilter }) => {
  const { allStudents, allInvoices, allPayments, settings } = useApp();
  const todayISO = getTodayIndonesiaISO();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [monthFilter, setMonthFilter] = useState<string>('all');
  const [yearFilter, setYearFilter] = useState<string>('all');
  const [search, setSearch] = useState('');

  // Create new invoice modal/inline
  const [showCreateInv, setShowCreateInv] = useState(false);
  const [newStudentId, setNewStudentId] = useState('');
  const [newYear, setNewYear] = useState(Number(todayISO.slice(0, 4)));
  const [newMonth, setNewMonth] = useState(Number(todayISO.slice(5, 7)));
  const [newAmount, setNewAmount] = useState('');

  // Record payment modal/inline
  const [payingInvoice, setPayingInvoice] = useState<Invoice | null>(null);
  const [payMethod, setPayMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [payDate, setPayDate] = useState(todayISO);
  const [payAmount, setPayAmount] = useState('');
  const [payNotes, setPayNotes] = useState('');
  const [generateNextInvoice, setGenerateNextInvoice] = useState(true);
  const [processing, setProcessing] = useState(false);

  // Edit payment modal/inline
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPayMethod, setEditPayMethod] = useState<'Tunai' | 'Transfer'>('Tunai');
  const [editPayDate, setEditPayDate] = useState('');
  const [editPayNotes, setEditPayNotes] = useState('');

  const activeApprovedStudents = allStudents.filter(
    (s) => s.registrationStatus === 'approved'
  );

  const filteredInvoices = allInvoices.filter((inv) => {
    if (branchFilter !== 'all' && inv.branchId !== branchFilter) return false;
    if (monthFilter !== 'all' && inv.periodMonth !== Number(monthFilter)) return false;
    if (yearFilter !== 'all' && inv.periodYear !== Number(yearFilter)) return false;
    if (
      search &&
      !inv.studentNameSnapshot.toLowerCase().includes(search.toLowerCase()) &&
      !inv.parentNameSnapshot.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }

    const info = getInvoiceStatusInfo(inv, todayISO);
    if (statusFilter === 'paid') return inv.status === 'paid';
    if (statusFilter === 'unpaid') return inv.status === 'unpaid';
    if (statusFilter === 'due_soon') return inv.status === 'unpaid' && info.isH3Warning && !info.isOverdue;
    if (statusFilter === 'overdue') return inv.status === 'unpaid' && info.isOverdue;
    return true;
  });

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    const st = allStudents.find((s) => s.id === newStudentId);
    if (!st) return;
    setProcessing(true);
    try {
      const anchor = Math.max(1, Math.min(31, st.billingAnchorDay || 5));
      const dueDate = computeDueDateForPeriod(newYear, newMonth, anchor);
      const amount = Math.max(0, Number(newAmount) || st.monthlyFee || 0);
      const invId = `inv_${st.id}_${newYear}_${newMonth}_${Date.now().toString().slice(-4)}`;
      const nowIso = new Date().toISOString();

      await setDoc(
        doc(db, 'invoices', invId),
        sanitizeFirestorePayload({
          studentId: st.id,
          parentUid: st.parentUid,
          studentNameSnapshot: st.fullName,
          parentNameSnapshot: st.parentName || '',
          programNameSnapshot: st.programNameSnapshot,
          branchId: st.branchId,
          branchNameSnapshot: st.branchNameSnapshot,
          periodYear: newYear,
          periodMonth: newMonth,
          periodLabel: formatPeriodLabel(newYear, newMonth),
          amount,
          anchorDay: anchor,
          dueDate,
          status: 'unpaid',
          paidAt: '',
          paymentMethod: '',
          paymentId: '',
          notes: '',
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );
      setShowCreateInv(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'invoices');
    } finally {
      setProcessing(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingInvoice) return;
    setProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const amountSnapshot = Math.max(0, Number(payAmount) || payingInvoice.amount);
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
      const receiptNumber = `KW-${payDate.replace(/-/g, '')}-${paymentId.slice(-4).toUpperCase()}`;

      const batch = writeBatch(db);

      batch.set(
        doc(db, 'payments', paymentId),
        sanitizeFirestorePayload({
          invoiceId: payingInvoice.id,
          studentId: payingInvoice.studentId,
          parentUid: payingInvoice.parentUid,
          receiptNumber,
          studentNameSnapshot: payingInvoice.studentNameSnapshot,
          parentNameSnapshot: payingInvoice.parentNameSnapshot,
          programNameSnapshot: payingInvoice.programNameSnapshot,
          branchId: payingInvoice.branchId,
          branchNameSnapshot: payingInvoice.branchNameSnapshot,
          periodLabel: payingInvoice.periodLabel,
          amountSnapshot,
          paymentDate: payDate,
          paymentMethod: payMethod,
          notes: payNotes.trim(),
          recordedByUid: ADMIN_UID,
          createdAt: nowIso,
          updatedAt: nowIso,
        })
      );

      batch.update(
        doc(db, 'invoices', payingInvoice.id),
        sanitizeFirestorePayload({
          status: 'paid',
          paidAt: payDate,
          paymentMethod: payMethod,
          paymentId,
          notes: payNotes.trim(),
          updatedAt: nowIso,
        })
      );

      if (generateNextInvoice) {
        const studentObj = allStudents.find((s) => s.id === payingInvoice.studentId);
        const nextPeriod = getNextBillingPeriod(
          payingInvoice.periodYear,
          payingInvoice.periodMonth
        );
        const anchorDay =
          studentObj?.billingAnchorDay || payingInvoice.anchorDay || 5;
        const nextDueDate = computeDueDateForPeriod(
          nextPeriod.periodYear,
          nextPeriod.periodMonth,
          anchorDay
        );
        const nextAmount =
          studentObj && studentObj.monthlyFee > 0
            ? studentObj.monthlyFee
            : payingInvoice.amount;
        const nextInvId = `inv_${payingInvoice.studentId}_${nextPeriod.periodYear}_${nextPeriod.periodMonth}`;
        const alreadyExists = allInvoices.some(
          (x) =>
            x.studentId === payingInvoice.studentId &&
            x.periodYear === nextPeriod.periodYear &&
            x.periodMonth === nextPeriod.periodMonth
        );

        if (!alreadyExists) {
          batch.set(
            doc(db, 'invoices', nextInvId),
            sanitizeFirestorePayload({
              studentId: payingInvoice.studentId,
              parentUid: payingInvoice.parentUid,
              studentNameSnapshot: payingInvoice.studentNameSnapshot,
              parentNameSnapshot: payingInvoice.parentNameSnapshot,
              programNameSnapshot: payingInvoice.programNameSnapshot,
              branchId: payingInvoice.branchId,
              branchNameSnapshot: payingInvoice.branchNameSnapshot,
              periodYear: nextPeriod.periodYear,
              periodMonth: nextPeriod.periodMonth,
              periodLabel: nextPeriod.periodLabel,
              amount: nextAmount,
              anchorDay,
              dueDate: nextDueDate,
              status: 'unpaid',
              paidAt: '',
              paymentMethod: '',
              paymentId: '',
              notes: '',
              createdAt: nowIso,
              updatedAt: nowIso,
            })
          );
        }
      }

      await batch.commit();
      setPayingInvoice(null);
      setPayNotes('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'payments');
    } finally {
      setProcessing(false);
    }
  };

  const handleSavePaymentEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPayment) return;
    setProcessing(true);
    try {
      const nowIso = new Date().toISOString();
      const batch = writeBatch(db);
      batch.update(doc(db, 'payments', editingPayment.id), {
        paymentMethod: editPayMethod,
        paymentDate: editPayDate,
        notes: editPayNotes.trim(),
        updatedAt: nowIso,
      });
      if (editingPayment.invoiceId) {
        batch.update(doc(db, 'invoices', editingPayment.invoiceId), {
          paymentMethod: editPayMethod,
          paidAt: editPayDate,
          notes: editPayNotes.trim(),
          updatedAt: nowIso,
        });
      }
      await batch.commit();
      setEditingPayment(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, 'payments');
    } finally {
      setProcessing(false);
    }
  };

  const filteredPayments = allPayments.filter((p) => {
    if (branchFilter !== 'all' && p.branchId !== branchFilter) return false;
    if (yearFilter !== 'all' && !p.paymentDate.startsWith(yearFilter)) return false;
    if (
      monthFilter !== 'all' &&
      !p.paymentDate.startsWith(
        `${yearFilter === 'all' ? todayISO.slice(0, 4) : yearFilter}-${String(
          monthFilter
        ).padStart(2, '0')}`
      )
    ) {
      return false;
    }
    if (
      search &&
      !p.studentNameSnapshot.toLowerCase().includes(search.toLowerCase()) &&
      !p.receiptNumber.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Filter Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-wrap items-end gap-3">
        <div className="flex-1 min-w-[180px]">
          <label className="block text-xs font-semibold text-slate-600 mb-1">Cari Siswa / Kwitansi</label>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Ketik nama siswa..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
          />
        </div>
        {mode === 'tagihan' && (
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">Status Tagihan</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
            >
              <option value="all">Semua Status</option>
              <option value="unpaid">Belum Lunas</option>
              <option value="due_soon">Akan Jatuh Tempo (H-3)</option>
              <option value="overdue">Terlambat</option>
              <option value="paid">Lunas</option>
            </select>
          </div>
        )}
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Bulan</label>
          <select
            value={monthFilter}
            onChange={(e) => setMonthFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Semua Bulan</option>
            {[
              'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
              'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
            ].map((mName, idx) => (
              <option key={mName} value={String(idx + 1)}>
                {mName}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-600 mb-1">Tahun</label>
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
          >
            <option value="all">Semua Tahun</option>
            {[2025, 2026, 2027, 2028].map((y) => (
              <option key={y} value={String(y)}>
                {y}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={() => {
            setShowCreateInv(true);
            const first = activeApprovedStudents[0];
            if (first) {
              setNewStudentId(first.id);
              setNewAmount(String(first.monthlyFee || 0));
            }
          }}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
        >
          <Plus className="w-4 h-4" />
          <span>Buat Tagihan SPP</span>
        </button>
      </div>

      {/* Create Invoice Form */}
      {showCreateInv && (
        <form
          onSubmit={handleCreateInvoice}
          className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
        >
          <h3 className="text-lg font-bold text-slate-900">Terbitkan Tagihan SPP Manual</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-slate-700 mb-1">Pilih Siswa *</label>
              <select
                required
                value={newStudentId}
                onChange={(e) => {
                  setNewStudentId(e.target.value);
                  const st = activeApprovedStudents.find((x) => x.id === e.target.value);
                  if (st) setNewAmount(String(st.monthlyFee || 0));
                }}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="">-- Pilih Siswa --</option>
                {activeApprovedStudents.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} ({s.programNameSnapshot})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Bulan</label>
              <select
                value={newMonth}
                onChange={(e) => setNewMonth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                  <option key={m} value={m}>
                    {formatPeriodLabel(newYear, m).split(' ')[0]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
              <input
                type="number"
                value={newYear}
                onChange={(e) => setNewYear(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Nominal (Rp)</label>
              <input
                type="number"
                min={0}
                required
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
          </div>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={processing}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
            >
              {processing ? 'Menyimpan...' : 'Terbitkan Tagihan'}
            </button>
            <button
              type="button"
              onClick={() => setShowCreateInv(false)}
              className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Record Payment Panel */}
      {payingInvoice && (
        <form
          onSubmit={handleRecordPayment}
          className="bg-white border border-emerald-400 rounded-xl p-6 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-slate-900">
              Catat Pembayaran SPP: {payingInvoice.studentNameSnapshot} ({payingInvoice.periodLabel})
            </h3>
            <button
              type="button"
              onClick={() => setPayingInvoice(null)}
              className="text-xs font-semibold text-slate-500"
            >
              Tutup
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Nominal Dibayar (Rp)
              </label>
              <input
                type="number"
                min={0}
                required
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm tabular-nums"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Metode Pembayaran
              </label>
              <select
                value={payMethod}
                onChange={(e) => setPayMethod(e.target.value as 'Tunai' | 'Transfer')}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
              >
                <option value="Tunai">Tunai</option>
                <option value="Transfer">Transfer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Tanggal Pembayaran
              </label>
              <input
                type="date"
                required
                value={payDate}
                onChange={(e) => setPayDate(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
            <input
              type="text"
              value={payNotes}
              onChange={(e) => setPayNotes(e.target.value)}
              placeholder="Opsional (misal: transfer BRI a.n. ...)"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={generateNextInvoice}
              onChange={(e) => setGenerateNextInvoice(e.target.checked)}
            />
            <span>Otomatis buat tagihan SPP periode berikutnya (mempertahankan anchor tanggal jatuh tempo)</span>
          </label>
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={processing}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{processing ? 'Menyimpan...' : 'Simpan Pembayaran Lunas'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Tagihan & Jatuh Tempo Table */}
      {mode === 'tagihan' && (
        <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-slate-900">
            Tagihan &amp; Jatuh Tempo SPP ({filteredInvoices.length})
          </h2>
          {filteredInvoices.length === 0 ? (
            <p className="text-sm text-slate-500 py-4">Tidak ada tagihan yang sesuai filter.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                  <tr>
                    <th className="px-3 py-2.5">Siswa &amp; Orang Tua</th>
                    <th className="px-3 py-2.5">Program &amp; Cabang</th>
                    <th className="px-3 py-2.5">Periode</th>
                    <th className="px-3 py-2.5">Jatuh Tempo</th>
                    <th className="px-3 py-2.5 text-right">Nominal SPP</th>
                    <th className="px-3 py-2.5">Status</th>
                    <th className="px-3 py-2.5 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInvoices.map((inv) => {
                    const info = getInvoiceStatusInfo(inv, todayISO);
                    return (
                      <tr
                        key={inv.id}
                        className={
                          info.isOverdue || info.isH3Warning
                            ? 'bg-red-50/70'
                            : 'hover:bg-slate-50'
                        }
                      >
                        <td className="px-3 py-2.5">
                          <p className="font-semibold text-slate-900">
                            {inv.studentNameSnapshot}
                          </p>
                          <p className="text-xs text-slate-500">{inv.parentNameSnapshot}</p>
                        </td>
                        <td className="px-3 py-2.5">
                          <p className="text-xs font-medium">{inv.programNameSnapshot}</p>
                          <p className="text-xs text-slate-500">{inv.branchNameSnapshot}</p>
                        </td>
                        <td className="px-3 py-2.5 font-medium">{inv.periodLabel}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {formatIndonesianDate(inv.dueDate)}
                        </td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                          {formatRupiah(inv.amount)}
                        </td>
                        <td className="px-3 py-2.5 text-xs font-bold">
                          {info.isH3Warning && inv.status === 'unpaid' && (
                            <AlertTriangle
                              className="inline w-3.5 h-3.5 text-red-600 mr-1"
                              aria-hidden="true"
                            />
                          )}
                          <span
                            className={
                              info.code === 'paid'
                                ? 'text-emerald-700'
                                : info.isOverdue || info.isDueToday || info.isH3Warning
                                ? 'text-red-700'
                                : 'text-amber-700'
                            }
                          >
                            {info.label}
                          </span>
                        </td>
                        <td className="px-3 py-2.5 text-right">
                          {inv.status === 'unpaid' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setPayingInvoice(inv);
                                setPayAmount(String(inv.amount));
                                setPayDate(todayISO);
                                setPayMethod('Tunai');
                              }}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                            >
                              <Receipt className="w-3.5 h-3.5" />
                              <span>Catat Bayar</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-500">
                              {inv.paymentMethod} · {formatIndonesianDate(inv.paidAt)}
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Riwayat Pembayaran & Kwitansi PDF */}
      {mode === 'pembayaran' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Tagihan Menunggu Pembayaran (
              {filteredInvoices.filter((i) => i.status === 'unpaid').length})
            </h2>
            <div className="space-y-2.5">
              {filteredInvoices
                .filter((i) => i.status === 'unpaid')
                .slice(0, 10)
                .map((inv) => {
                  const info = getInvoiceStatusInfo(inv, todayISO);
                  return (
                    <div
                      key={inv.id}
                      className={`border rounded-lg p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                        info.isH3Warning || info.isOverdue
                          ? 'border-red-300 bg-red-50'
                          : 'border-slate-200'
                      }`}
                    >
                      <div className="text-sm">
                        <p className="font-bold text-slate-900">
                          {inv.studentNameSnapshot} — {inv.periodLabel}
                        </p>
                        <p className="text-xs text-slate-600">
                          Jatuh tempo {formatIndonesianDate(inv.dueDate)} · {info.label} ·{' '}
                          <strong className="tabular-nums">{formatRupiah(inv.amount)}</strong>
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setPayingInvoice(inv);
                          setPayAmount(String(inv.amount));
                          setPayDate(todayISO);
                        }}
                        className="px-3.5 py-2 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700"
                      >
                        Catat Pembayaran
                      </button>
                    </div>
                  );
                })}
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-slate-900">
              Riwayat Pembayaran Tercatat ({filteredPayments.length})
            </h2>
            {filteredPayments.length === 0 ? (
              <p className="text-sm text-slate-500">Belum ada pembayaran SPP yang tercatat.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 text-xs font-semibold text-slate-600">
                    <tr>
                      <th className="px-3 py-2.5">No. Kwitansi</th>
                      <th className="px-3 py-2.5">Siswa</th>
                      <th className="px-3 py-2.5">Periode</th>
                      <th className="px-3 py-2.5">Tanggal</th>
                      <th className="px-3 py-2.5">Metode</th>
                      <th className="px-3 py-2.5 text-right">Nominal</th>
                      <th className="px-3 py-2.5 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredPayments.map((p) => (
                      <tr key={p.id}>
                        <td className="px-3 py-2.5 font-mono text-xs">{p.receiptNumber}</td>
                        <td className="px-3 py-2.5 font-semibold">{p.studentNameSnapshot}</td>
                        <td className="px-3 py-2.5">{p.periodLabel}</td>
                        <td className="px-3 py-2.5 tabular-nums">
                          {formatIndonesianDate(p.paymentDate)}
                        </td>
                        <td className="px-3 py-2.5">{p.paymentMethod}</td>
                        <td className="px-3 py-2.5 text-right font-semibold tabular-nums">
                          {formatRupiah(p.amountSnapshot)}
                        </td>
                        <td className="px-3 py-2.5 text-right space-x-2 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() =>
                              void exportPaymentReceiptPdf(
                                p,
                                settings.institutionName,
                                settings.logoUrl
                              )
                            }
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded border border-blue-200 text-blue-700 text-xs font-semibold hover:bg-blue-50"
                          >
                            <FileDown className="w-3.5 h-3.5" />
                            <span>Kwitansi PDF</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingPayment(p);
                              setEditPayMethod(p.paymentMethod);
                              setEditPayDate(p.paymentDate);
                              setEditPayNotes(p.notes || '');
                            }}
                            className="px-2.5 py-1 rounded border border-slate-300 text-xs font-semibold"
                          >
                            Edit
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {editingPayment && (
            <form
              onSubmit={handleSavePaymentEdit}
              className="bg-white border border-blue-300 rounded-xl p-6 space-y-4"
            >
              <h3 className="text-lg font-bold text-slate-900">
                Edit Transaksi: {editingPayment.receiptNumber}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Metode</label>
                  <select
                    value={editPayMethod}
                    onChange={(e) => setEditPayMethod(e.target.value as 'Tunai' | 'Transfer')}
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"
                  >
                    <option value="Tunai">Tunai</option>
                    <option value="Transfer">Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Tanggal Bayar
                  </label>
                  <input
                    type="date"
                    value={editPayDate}
                    onChange={(e) => setEditPayDate(e.target.value)}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  value={editPayNotes}
                  onChange={(e) => setEditPayNotes(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={processing}
                  className="px-4 py-2 rounded-lg bg-blue-700 text-white text-sm font-semibold"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setEditingPayment(null)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold"
                >
                  Batal
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
