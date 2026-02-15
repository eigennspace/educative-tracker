function parseDateInput(date) {
  if (typeof date === 'string') {
    const [year, month, day] = date.split('-').map(Number);
    if (year && month && day) {
      return new Date(year, month - 1, day);
    }
  }
  return new Date(date);
}

export function startOfDay(date) {
  const d = parseDateInput(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

export function toDateKey(date) {
  const d = parseDateInput(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function daysBetween(a, b) {
  const dayMs = 24 * 60 * 60 * 1000;
  const diff = Math.abs(startOfDay(a) - startOfDay(b));
  return Math.floor(diff / dayMs);
}
