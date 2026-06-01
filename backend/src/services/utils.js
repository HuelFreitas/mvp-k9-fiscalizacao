export function safeTrim(value) {
  return typeof value === 'string' ? value.trim() : '';
}

export function uid(prefix = 'id') {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now().toString(36)}`;
}

export function combineDateTime(dateValue, timeValue) {
  if (!dateValue || !timeValue) return '';
  const [hours, minutes] = String(timeValue).split(':');
  if (!hours || !minutes) return '';
  const normalizedHours = hours.padStart(2, '0');
  const normalizedMinutes = minutes.padStart(2, '0');
  const isoLike = `${dateValue}T${normalizedHours}:${normalizedMinutes}:00`;
  const parsed = new Date(isoLike);
  if (Number.isNaN(parsed.getTime())) return '';
  return isoLike;
}

export function parseTags(raw) {
  if (!raw) return [];
  return String(raw)
    .split(',')
    .map((tag) => tag.trim())
    .filter(Boolean);
}
