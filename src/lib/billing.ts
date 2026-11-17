const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

/**
 * Returns current local date in Asia/Jakarta (WIB, UTC+7) formatted as YYYY-MM-DD.
 * Avoids timezone drift when server or browser runs in UTC or non-WIB locales.
 */
export function getTodayIndonesiaISO(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/**
 * Returns number of days in a given 1-indexed month (1 = January, 12 = December).
 */
export function getDaysInMonth(year: number, month1To12: number): number {
  return new Date(Date.UTC(year, month1To12, 0)).getUTCDate();
}

/**
 * Computes the due date (YYYY-MM-DD) for a target billing period (periodYear, periodMonth)
 * using the student's fixed anchorDay (1..31).
 *
 * Rule:
 * - Due date follows the fixed anchorDay in the target billing month.
 * - If the target billing month is shorter and does NOT have anchorDay (e.g., Jan 31 -> Feb,
 *   or Jan 30 -> Feb), move the due date to the 1st of the following month (e.g., March 1).
 * - Keeping anchorDay separate from dueDate ensures subsequent months (e.g., March) return
 *   to the original anchorDay (March 31) without accidental drift.
 */
export function computeDueDateForPeriod(
  periodYear: number,
  periodMonth: number,
  anchorDay: number
): string {
  const safeAnchor = Math.max(1, Math.min(31, Math.floor(anchorDay)));
  const maxDays = getDaysInMonth(periodYear, periodMonth);

  if (safeAnchor <= maxDays) {
    return `${periodYear}-${pad2(periodMonth)}-${pad2(safeAnchor)}`;
  }

  const nextMonth = periodMonth === 12 ? 1 : periodMonth + 1;
  const nextYear = periodMonth === 12 ? periodYear + 1 : periodYear;
  return `${nextYear}-${pad2(nextMonth)}-01`;
}

export function formatPeriodLabel(periodYear: number, periodMonth: number): string {
  const monthName = INDONESIAN_MONTHS[periodMonth - 1] || 'Januari';
  return `${monthName} ${periodYear}`;
}

export function getNextBillingPeriod(
  periodYear: number,
  periodMonth: number
): { periodYear: number; periodMonth: number; periodLabel: string } {
  const nextMonth = periodMonth === 12 ? 1 : periodMonth + 1;
  const nextYear = periodMonth === 12 ? periodYear + 1 : periodYear;
  return {
    periodYear: nextYear,
    periodMonth: nextMonth,
    periodLabel: formatPeriodLabel(nextYear, nextMonth),
  };
}

/**
 * Computes initial billing period and due date from a student's startDate (YYYY-MM-DD).
 * Example: startDate = 2026-01-05 -> anchorDay = 5, first next due date = 2026-02-05 (period Feb 2026).
 */
export function computeFirstNextInvoiceFromStartDate(startDateISO: string): {
  anchorDay: number;
  periodYear: number;
  periodMonth: number;
  periodLabel: string;
  dueDate: string;
} {
  const parts = startDateISO.split('-').map(Number);
  const year = parts[0] || 2026;
  const month = parts[1] || 1;
  const day = parts[2] || 1;
  const anchorDay = Math.max(1, Math.min(31, day));
  const next = getNextBillingPeriod(year, month);
  const dueDate = computeDueDateForPeriod(next.periodYear, next.periodMonth, anchorDay);
  return {
    anchorDay,
    periodYear: next.periodYear,
    periodMonth: next.periodMonth,
    periodLabel: next.periodLabel,
    dueDate,
  };
}

function parseISODateToUtcMs(iso: string): number {
  const [y, m, d] = iso.split('-').map(Number);
  return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
}

export type InvoiceStatusCode = 'paid' | 'overdue' | 'due_today' | 'due_soon' | 'upcoming';

export interface InvoiceStatusInfo {
  code: InvoiceStatusCode;
  label: 'Lunas' | 'Terlambat' | 'Jatuh tempo hari ini' | 'Akan jatuh tempo';
  isOverdue: boolean;
  isDueToday: boolean;
  isH3Warning: boolean;
  daysUntilDue: number;
}

/**
 * Determines invoice status and H-3 / due-today / overdue warnings using Indonesian local dates.
 */
export function getInvoiceStatusInfo(
  invoice: { status: 'unpaid' | 'paid'; dueDate: string },
  todayISO: string = getTodayIndonesiaISO()
): InvoiceStatusInfo {
  if (invoice.status === 'paid') {
    return {
      code: 'paid',
      label: 'Lunas',
      isOverdue: false,
      isDueToday: false,
      isH3Warning: false,
      daysUntilDue: 0,
    };
  }

  const dueMs = parseISODateToUtcMs(invoice.dueDate);
  const todayMs = parseISODateToUtcMs(todayISO);
  const daysUntilDue = Math.round((dueMs - todayMs) / (1000 * 60 * 60 * 24));

  if (daysUntilDue < 0) {
    return {
      code: 'overdue',
      label: 'Terlambat',
      isOverdue: true,
      isDueToday: false,
      isH3Warning: true,
      daysUntilDue,
    };
  }

  if (daysUntilDue === 0) {
    return {
      code: 'due_today',
      label: 'Jatuh tempo hari ini',
      isOverdue: false,
      isDueToday: true,
      isH3Warning: true,
      daysUntilDue: 0,
    };
  }

  if (daysUntilDue <= 3) {
    return {
      code: 'due_soon',
      label: 'Akan jatuh tempo',
      isOverdue: false,
      isDueToday: false,
      isH3Warning: true,
      daysUntilDue,
    };
  }

  return {
    code: 'upcoming',
    label: 'Akan jatuh tempo',
    isOverdue: false,
    isDueToday: false,
    isH3Warning: false,
    daysUntilDue,
  };
}

export function formatRupiah(amount: number): string {
  const safe = Number.isFinite(amount) ? amount : 0;
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(safe);
}

export function formatIndonesianDate(isoDate: string): string {
  if (!isoDate || !/^\d{4}-\d{2}-\d{2}/.test(isoDate)) return isoDate || '-';
  const [y, m, d] = isoDate.slice(0, 10).split('-').map(Number);
  const monthName = INDONESIAN_MONTHS[(m || 1) - 1] || '';
  return `${d} ${monthName} ${y}`;
}
