export function splitParagraphs(value: string) {
  return String(value || '')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function formatDisplayDate(value: string) {
  const normalized = String(value || '').trim().replace(/\.$/, '');

  if (!normalized) {
    return '';
  }

  const numeric = normalized.match(/^(\d{4})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?$/);

  if (numeric) {
    const [, year, month, day] = numeric;
    return day ? `${year}. ${month}. ${day}` : `${year}. ${month}`;
  }

  return normalized
    .replace(/[.\-/]\s*/g, (match) => `${match.trim()[0]} `)
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\.$/, '');
}

export function formatMonthDay(value: string) {
  const normalized = String(value || '').trim().replace(/\.$/, '');

  if (!normalized) {
    return '';
  }

  const numeric = normalized.match(/^(\d{4})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?$/);

  if (!numeric) {
    return normalized;
  }

  const [, , month, day] = numeric;

  if (!day) {
    return month.padStart(2, '0');
  }

  return `${month.padStart(2, '0')}.${day.padStart(2, '0')}`;
}

export function formatIsoLikeDate(value: string) {
  const normalized = String(value || '').trim().replace(/\.$/, '');

  if (!normalized) {
    return '';
  }

  const numeric = normalized.match(/^(\d{4})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?$/);

  if (!numeric) {
    return normalized;
  }

  const [, year, month, day] = numeric;

  if (!day) {
    return `${year}-${month.padStart(2, '0')}`;
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

export function createMemberCompanySlug(name: string) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
