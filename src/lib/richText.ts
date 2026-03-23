function escapeHtml(value: string) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeRichTextHtml(value: string) {
  const raw = String(value || '').trim();

  if (!raw) {
    return '';
  }

  if (/<[a-z][\s\S]*>/i.test(raw)) {
    return raw;
  }

  return raw
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean)
    .map((paragraph) => {
      const imageMatch = paragraph.match(/^!\[(.*?)\]\((.*?)\)$/);
      if (imageMatch) {
        const [, altText, imageUrl] = imageMatch;
        return `<p><img src="${escapeHtml(imageUrl.trim())}" alt="${escapeHtml(altText.trim())}" /></p>`;
      }

      return `<p>${escapeHtml(paragraph).replace(/\n/g, '<br />')}</p>`;
    })
    .join('');
}

export function stripHtmlTags(value: string) {
  return String(value || '')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<[^>]+>/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
