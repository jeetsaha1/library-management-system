
export const LOAN_DAYS = 7;
export const FINE_PER_DAY = 5; // ₹5 per overdue calendar day

const DAY_MS = 24 * 60 * 60 * 1000;

// Convert a date to midnight in the server's local timezone.
export function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Add calendar days while preserving the local time.
export function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// Count overdue calendar days, never returning a negative value.
export function daysLate(dueDate, returnDate = new Date()) {
  const difference =
    startOfDay(returnDate).getTime() -
    startOfDay(dueDate).getTime();

  return Math.max(0, Math.round(difference / DAY_MS));
}

export function calculateFine(dueDate, returnDate = new Date()) {
  return daysLate(dueDate, returnDate) * FINE_PER_DAY;
}
