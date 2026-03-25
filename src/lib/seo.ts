export type SeoJsonLdBlock = Record<string, unknown>;
export type SeoJsonLd = SeoJsonLdBlock | SeoJsonLdBlock[];

export type SeoBreadcrumbItem = {
  name: string;
  path?: string;
};

type OrganizationJsonLdOptions = {
  description?: string;
  telephone?: string;
};

type WebSiteJsonLdOptions = {
  description?: string;
};

type ArticleJsonLdOptions = {
  headline: string;
  description: string;
  path: string;
  image?: string;
  datePublished?: string;
  dateModified?: string;
  section?: string;
};

export const SITE_NAME = '마이스파트너';
export const SITE_ORIGIN = 'https://micepartner.co.kr';
export const DEFAULT_OG_IMAGE_PATH = '/logocard.jpg';
export const DEFAULT_TITLE = '마이스파트너 | MICE 행사기획·운영 전문';
export const DEFAULT_DESCRIPTION =
  '마이스파트너는 MICE 행사기획, 컨퍼런스, 포럼, 세미나, 기업행사 운영 사례와 협업 프로세스를 소개합니다.';
export const DEFAULT_IMAGE_ALT = '마이스파트너 대표 이미지';

export function buildAbsoluteUrl(value = '/') {
  const normalizedValue = String(value || '').trim();

  if (!normalizedValue) {
    return `${SITE_ORIGIN}/`;
  }

  try {
    return new URL(normalizedValue).toString();
  } catch {
    const pathname = normalizedValue.startsWith('/') ? normalizedValue : `/${normalizedValue}`;
    return new URL(pathname, `${SITE_ORIGIN}/`).toString();
  }
}

export function buildDocumentTitle(title: string) {
  const trimmed = String(title || '').trim();
  return trimmed ? `${SITE_NAME} | ${trimmed}` : DEFAULT_TITLE;
}

export function normalizeSeoDescription(description: string, fallback = DEFAULT_DESCRIPTION) {
  const normalized = String(description || '')
    .replace(/\s+/g, ' ')
    .trim();

  return normalized || fallback;
}

export function truncateText(value: string, maxLength = 160) {
  const normalized = normalizeSeoDescription(value, '');

  if (!normalized) {
    return '';
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

export function toSchemaDate(value: string) {
  const normalized = String(value || '').trim().replace(/\.$/, '');
  const matched = normalized.match(/^(\d{4})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?$/);

  if (!matched) {
    return undefined;
  }

  const [, year, month, day] = matched;

  if (!day) {
    return undefined;
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function withDefinedValues<T extends Record<string, unknown>>(value: T) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => {
      if (entryValue === undefined || entryValue === null || entryValue === '') {
        return false;
      }

      if (Array.isArray(entryValue) && entryValue.length === 0) {
        return false;
      }

      return true;
    }),
  ) as T;
}

function createPublisherReference() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
    },
  };
}

export function createBreadcrumbJsonLd(items: SeoBreadcrumbItem[]): SeoJsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) =>
      withDefinedValues({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.path ? buildAbsoluteUrl(item.path) : undefined,
      }),
    ),
  };
}

export function createOrganizationJsonLd(options: OrganizationJsonLdOptions = {}): SeoJsonLdBlock {
  const contactPoint = options.telephone
    ? [
        withDefinedValues({
          '@type': 'ContactPoint',
          telephone: options.telephone,
          contactType: 'customer support',
          availableLanguage: ['ko'],
        }),
      ]
    : undefined;

  return withDefinedValues({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH),
    description: normalizeSeoDescription(options.description || ''),
    contactPoint,
  });
}

export function createWebSiteJsonLd(options: WebSiteJsonLdOptions = {}): SeoJsonLdBlock {
  return withDefinedValues({
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    description: normalizeSeoDescription(options.description || ''),
  });
}

export function createArticleJsonLd(options: ArticleJsonLdOptions): SeoJsonLdBlock {
  return withDefinedValues({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: options.headline,
    description: normalizeSeoDescription(options.description),
    url: buildAbsoluteUrl(options.path),
    mainEntityOfPage: buildAbsoluteUrl(options.path),
    image: options.image ? [buildAbsoluteUrl(options.image)] : undefined,
    datePublished: options.datePublished,
    dateModified: options.dateModified || options.datePublished,
    articleSection: options.section,
    author: createPublisherReference(),
    publisher: createPublisherReference(),
  });
}

export function createFaqJsonLd(items: Array<{ question: string; answer: string }>): SeoJsonLdBlock {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };
}
