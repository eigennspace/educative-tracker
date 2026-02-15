export function minutesToHours(minutes) {
  return (minutes / 60).toFixed(2);
}

export function toTitle(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}
