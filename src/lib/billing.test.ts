import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeDueDateForPeriod,
  computeFirstNextInvoiceFromStartDate,
  formatIndonesianDate,
  formatPeriodLabel,
  formatRupiah,
  getInvoiceStatusInfo,
  getNextBillingPeriod,
} from './billing';

test('standard fixed due date: Jan 5 -> Feb 5 -> Mar 5', () => {
  const first = computeFirstNextInvoiceFromStartDate('2026-01-05');
  assert.equal(first.anchorDay, 5);
  assert.equal(first.periodYear, 2026);
  assert.equal(first.periodMonth, 2);
  assert.equal(first.dueDate, '2026-02-05');

  const mar = getNextBillingPeriod(first.periodYear, first.periodMonth);
  assert.equal(computeDueDateForPeriod(mar.periodYear, mar.periodMonth, first.anchorDay), '2026-03-05');
});

test('anchorDay 31 moves to March 1 in Feb 2026 and returns to March 31 in March 2026', () => {
  const febDue = computeDueDateForPeriod(2026, 2, 31);
  assert.equal(febDue, '2026-03-01');

  // Anchor day 31 is preserved, so March period uses day 31
  const marDue = computeDueDateForPeriod(2026, 3, 31);
  assert.equal(marDue, '2026-03-31');

  // April has 30 days, so anchorDay 31 moves to May 1
  const aprDue = computeDueDateForPeriod(2026, 4, 31);
  assert.equal(aprDue, '2026-05-01');
});

test('anchorDay 30 moves to March 1 in Feb 2026 and works in leap year Feb 2024 for day 29', () => {
  assert.equal(computeDueDateForPeriod(2026, 2, 30), '2026-03-01');
  assert.equal(computeDueDateForPeriod(2024, 2, 29), '2024-02-29');
  assert.equal(computeDueDateForPeriod(2026, 2, 29), '2026-03-01');
});

test('December wraps cleanly into January of next year', () => {
  const next = getNextBillingPeriod(2026, 12);
  assert.equal(next.periodYear, 2027);
  assert.equal(next.periodMonth, 1);
  assert.equal(next.periodLabel, 'Januari 2027');
});

test('Invoice status & H-3 warning logic evaluates accurately', () => {
  const paid = getInvoiceStatusInfo({ status: 'paid', dueDate: '2026-02-01' }, '2026-02-10');
  assert.equal(paid.label, 'Lunas');
  assert.equal(paid.isH3Warning, false);

  const h3 = getInvoiceStatusInfo({ status: 'unpaid', dueDate: '2026-02-13' }, '2026-02-10');
  assert.equal(h3.label, 'Akan jatuh tempo');
  assert.equal(h3.isH3Warning, true);
  assert.equal(h3.daysUntilDue, 3);

  const h4 = getInvoiceStatusInfo({ status: 'unpaid', dueDate: '2026-02-14' }, '2026-02-10');
  assert.equal(h4.label, 'Akan jatuh tempo');
  assert.equal(h4.isH3Warning, false);

  const dueToday = getInvoiceStatusInfo({ status: 'unpaid', dueDate: '2026-02-10' }, '2026-02-10');
  assert.equal(dueToday.label, 'Jatuh tempo hari ini');
  assert.equal(dueToday.isDueToday, true);
  assert.equal(dueToday.isH3Warning, true);

  const overdue = getInvoiceStatusInfo({ status: 'unpaid', dueDate: '2026-02-09' }, '2026-02-10');
  assert.equal(overdue.label, 'Terlambat');
  assert.equal(overdue.isOverdue, true);
});

test('Indonesian currency and date formatting', () => {
  assert.equal(formatPeriodLabel(2026, 3), 'Maret 2026');
  assert.equal(formatIndonesianDate('2026-03-05'), '5 Maret 2026');
  assert.match(formatRupiah(250000), /250\.000/);
});
