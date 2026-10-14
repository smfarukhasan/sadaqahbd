/**
 * Unified Bengali / English Number & Date Formatting Utility
 * Uses standardized toLocaleString('bn-BD') to guarantee crisp, clean,
 * and unified Bengali numerals ('০, ১, ২, ৩, ৪, ৫, ৬, ৭, ৮, ৯') across the entire application.
 */

export function formatBengaliDate(
  dateInput?: string | number | Date | null,
  isBn = true
): string {
  if (!dateInput) return '-';
  try {
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return String(dateInput);
    if (!isBn) {
      return d.toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    }
    const day = d.getDate().toLocaleString('bn-BD', { minimumIntegerDigits: 2 });
    const month = (d.getMonth() + 1).toLocaleString('bn-BD', { minimumIntegerDigits: 2 });
    const year = d.getFullYear().toLocaleString('bn-BD', { useGrouping: false });
    return `${day}/${month}/${year}`;
  } catch {
    return String(dateInput);
  }
}

export function formatBengaliNumber(
  val: number | string | null | undefined,
  isBn = true
): string {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return isBn ? '০' : '0';
  }
  return Number(val).toLocaleString(isBn ? 'bn-BD' : 'en-US');
}

export function formatBengaliAmount(
  amount: number | string | null | undefined,
  isBn = true
): string {
  return `৳${formatBengaliNumber(amount, isBn)}`;
}
