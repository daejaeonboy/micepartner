import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import dotenv from 'dotenv';
import { deleteApp, getApps, initializeApp } from 'firebase/app';
import { doc, getDoc, getFirestore } from 'firebase/firestore/lite';
import { defaultSiteData } from '../server/defaultSiteData.js';

const SITE_NAME = '마이스파트너';
const SITE_ORIGIN = 'https://micepartner.co.kr';
const DEFAULT_TITLE = `${SITE_NAME} | MICE 행사기획·운영 전문`;
const DEFAULT_DESCRIPTION =
  '마이스파트너는 MICE 행사기획, 컨퍼런스, 포럼, 세미나, 기업행사 운영 사례와 협업 프로세스를 소개합니다.';
const DEFAULT_IMAGE = `${SITE_ORIGIN}/logocard.jpg`;
const DEFAULT_IMAGE_ALT = '마이스파트너 대표 이미지';
const DIST_DIR = path.resolve(process.cwd(), 'dist');
const DIST_INDEX_PATH = path.join(DIST_DIR, 'index.html');

dotenv.config();

const DB_PATH = path.resolve(process.cwd(), process.env.DB_PATH || 'data/micepartner.sqlite');

if (!fs.existsSync(DIST_INDEX_PATH)) {
  console.warn('[seo-prerender] dist/index.html not found. Skipping prerender.');
  process.exit(0);
}

const templateHtml = fs.readFileSync(DIST_INDEX_PATH, 'utf8');
const siteData = await loadSiteData();
const routes = buildRoutes(siteData);

for (const route of routes) {
  if (route.path === '/' || route.noIndex) {
    continue;
  }

  const routeHtml = renderHtml(templateHtml, route);
  const outputPath = path.join(DIST_DIR, ...route.path.split('/').filter(Boolean), 'index.html');
  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, routeHtml, 'utf8');
}

fs.writeFileSync(path.join(DIST_DIR, 'sitemap.xml'), buildSitemapXml(routes), 'utf8');

console.log(`[seo-prerender] generated ${routes.filter((route) => !route.noIndex).length} sitemap routes`);
console.log(
  `[seo-prerender] prerendered ${routes.filter((route) => route.path !== '/' && !route.noIndex).length} route html files`,
);

async function loadSiteData() {
  const firestoreSiteData = await loadSiteDataFromFirestore();

  if (firestoreSiteData) {
    return firestoreSiteData;
  }

  if (!fs.existsSync(DB_PATH)) {
    return defaultSiteData;
  }

  try {
    const db = new Database(DB_PATH, { readonly: true, fileMustExist: true });
    const row = db.prepare("SELECT value FROM site_settings WHERE key = 'site_data'").get();
    db.close();

    if (!row?.value) {
      return defaultSiteData;
    }

    const parsed = JSON.parse(row.value);
    return deepMerge(defaultSiteData, parsed);
  } catch (error) {
    console.warn('[seo-prerender] failed to read local site data, using defaults');
    return defaultSiteData;
  }
}

async function loadSiteDataFromFirestore() {
  const firebaseConfig = {
    apiKey: normalizeText(process.env.VITE_FIREBASE_API_KEY),
    authDomain: normalizeText(process.env.VITE_FIREBASE_AUTH_DOMAIN),
    projectId: normalizeText(process.env.VITE_FIREBASE_PROJECT_ID),
    storageBucket: normalizeText(process.env.VITE_FIREBASE_STORAGE_BUCKET),
    messagingSenderId: normalizeText(process.env.VITE_FIREBASE_MESSAGING_SENDER_ID),
    appId: normalizeText(process.env.VITE_FIREBASE_APP_ID),
  };

  if (!firebaseConfig.apiKey || !firebaseConfig.authDomain || !firebaseConfig.projectId || !firebaseConfig.appId) {
    return null;
  }

  const appName = 'seo-prerender-build';
  let app = null;

  try {
    app =
      getApps().find((item) => item.name === appName) ||
      initializeApp(firebaseConfig, appName);
    const db = getFirestore(app);
    const snapshot = await withTimeout(getDoc(doc(db, 'siteData', 'current')), 4000);

    if (!snapshot.exists()) {
      return null;
    }

    return deepMerge(defaultSiteData, snapshot.data());
  } catch (error) {
    console.warn('[seo-prerender] failed to read Firestore site data, falling back to local snapshot');
    return null;
  } finally {
    if (app) {
      await deleteApp(app).catch(() => {});
    }
  }
}

function deepMerge(baseValue, nextValue) {
  if (Array.isArray(baseValue) || Array.isArray(nextValue)) {
    return Array.isArray(nextValue) ? nextValue : baseValue;
  }

  if (!isObject(baseValue) || !isObject(nextValue)) {
    return nextValue ?? baseValue;
  }

  const merged = { ...baseValue };

  for (const [key, value] of Object.entries(nextValue)) {
    merged[key] = key in baseValue ? deepMerge(baseValue[key], value) : value;
  }

  return merged;
}

function isObject(value) {
  return value !== null && typeof value === 'object';
}

function buildRoutes(data) {
  const routes = [];
  const homeImage =
    data.content?.home?.heroSlides?.[0]?.imageUrl ||
    data.content?.home?.heroImageUrl ||
    DEFAULT_IMAGE;
  const aboutMenu = findHeaderMenu(data.content?.menus?.headerItems || [], '/about');
  const aboutLabel = normalizeText(aboutMenu?.label) || '회사소개';
  const aboutChildren = Array.isArray(aboutMenu?.children) ? aboutMenu.children : [];
  const supportPhone = normalizeText(data.content?.support?.phone);
  const faqItems = Array.isArray(data.content?.support?.faqs) ? data.content.support.faqs : [];
  const faqJsonLd = createFaqJsonLd(faqItems);

  routes.push({
    path: '/',
    title: 'MICE 행사기획·운영 전문',
    description: DEFAULT_DESCRIPTION,
    image: homeImage,
  });
  routes.push({
    path: '/cases',
    title: 'MICE 행사 운영 포트폴리오',
    description:
      '컨퍼런스, 포럼, 세미나, 기업행사 등 마이스파트너의 MICE 행사 운영 사례와 포트폴리오를 확인할 수 있습니다.',
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: '포트폴리오', path: '/cases' },
      ]),
    ],
  });
  routes.push({
    path: '/about',
    title: '회사소개',
    description: normalizeText(data.copy?.about?.introDescription) || DEFAULT_DESCRIPTION,
    image: data.content?.about?.heroImageUrl || homeImage,
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: aboutLabel, path: '/about' },
      ]),
    ],
  });
  routes.push({
    path: '/about/overview',
    title: `${normalizeText(aboutChildren[0]?.label) || '회사 개요'} · 회사소개`,
    description: normalizeText(data.copy?.about?.identityDescription) || DEFAULT_DESCRIPTION,
    image: data.content?.about?.identityImageUrl || data.content?.about?.heroImageUrl || homeImage,
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: aboutLabel, path: '/about' },
        { name: normalizeText(aboutChildren[0]?.label) || '회사 개요', path: '/about/overview' },
      ]),
    ],
  });
  routes.push({
    path: '/about/business',
    title: `${normalizeText(aboutChildren[1]?.label) || '사업영역'} · 회사소개`,
    description: normalizeText(data.copy?.about?.strengthDescription) || DEFAULT_DESCRIPTION,
    image: data.content?.about?.strengthImageUrl || data.content?.about?.heroImageUrl || homeImage,
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: aboutLabel, path: '/about' },
        { name: normalizeText(aboutChildren[1]?.label) || '사업영역', path: '/about/business' },
      ]),
    ],
  });
  routes.push({
    path: '/about/process',
    title: `${normalizeText(aboutChildren[2]?.label) || '운영 프로세스'} · 회사소개`,
    description: normalizeText(data.copy?.about?.processDescription) || DEFAULT_DESCRIPTION,
    image: data.content?.about?.processImageUrl || data.content?.about?.heroImageUrl || homeImage,
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: aboutLabel, path: '/about' },
        { name: normalizeText(aboutChildren[2]?.label) || '운영 프로세스', path: '/about/process' },
      ]),
    ],
  });
  routes.push({
    path: '/members',
    title: '협력업체 네트워크',
    description: '마이스파트너와 함께하는 협력업체 네트워크와 분야별 파트너 정보를 확인할 수 있습니다.',
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: '협력업체', path: '/members' },
      ]),
    ],
  });
  routes.push({
    path: '/resources/notices',
    title: '공지사항',
    description: '마이스파트너의 공지사항, 운영 소식, 업데이트 내용을 확인할 수 있는 정보센터 페이지입니다.',
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: '공지사항', path: '/resources/notices' },
      ]),
    ],
  });
  routes.push({
    path: '/resources/files',
    title: '자료실',
    description: '회사소개서, 서비스 소개서, 포트폴리오 자료 등 마이스파트너의 다운로드 자료를 모아둔 자료실입니다.',
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: '자료실', path: '/resources/files' },
      ]),
    ],
  });
  routes.push({
    path: '/faq',
    title: '자주 묻는 질문',
    description: 'MICE 행사 운영, 견적, 상담, 준비 절차와 관련해 자주 묻는 질문을 정리한 고객센터 페이지입니다.',
    jsonLd: [
      createBreadcrumbJsonLd([
        { name: '홈', path: '/' },
        { name: '자주 묻는 질문', path: '/faq' },
      ]),
      ...(faqJsonLd ? [faqJsonLd] : []),
      ...(supportPhone
        ? [
            createOrganizationJsonLd({
              description: DEFAULT_DESCRIPTION,
              telephone: supportPhone,
            }),
          ]
        : []),
    ],
  });

  for (const entry of data.content?.cases?.entries || []) {
    const fallbackDescription = normalizeText(entry.seoDescription || entry.cardDescription || stripHtml(entry.summary));
    const routePath = `/cases/${entry.slug}`;
    routes.push({
      path: routePath,
      title:
        normalizeText(entry.seoTitle) && normalizeText(entry.seoTitle) !== normalizeText(entry.title)
          ? normalizeText(entry.seoTitle)
          : buildCaseSeoTitle(normalizeText(entry.title)),
      description: fallbackDescription,
      image: entry.coverImageUrl || homeImage,
      imageAlt: normalizeText(entry.title),
      type: 'article',
      publishedTime: toSchemaDate(entry.updatedAt || entry.period),
      modifiedTime: toSchemaDate(entry.updatedAt || entry.period),
      section: normalizeText(entry.category),
      jsonLd: [
        createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '포트폴리오', path: '/cases' },
          { name: normalizeText(entry.title), path: routePath },
        ]),
        createArticleJsonLd({
          headline: normalizeText(entry.title),
          description: fallbackDescription,
          path: routePath,
          image: entry.coverImageUrl || homeImage,
          datePublished: toSchemaDate(entry.updatedAt || entry.period),
          dateModified: toSchemaDate(entry.updatedAt || entry.period),
          section: normalizeText(entry.category),
        }),
      ],
    });
  }

  for (const notice of data.content?.resources?.notices || []) {
    const routePath = `/resources/notices/${notice.slug}`;
    const description = normalizeText(notice.summary);
    routes.push({
      path: routePath,
      title: `${normalizeText(notice.title)} 공지사항`,
      description,
      image: notice.coverImageUrl || homeImage,
      imageAlt: normalizeText(notice.title),
      type: 'article',
      publishedTime: toSchemaDate(notice.date),
      modifiedTime: toSchemaDate(notice.date),
      section: normalizeText(notice.category),
      jsonLd: [
        createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '공지사항', path: '/resources/notices' },
          { name: normalizeText(notice.title), path: routePath },
        ]),
        createArticleJsonLd({
          headline: normalizeText(notice.title),
          description,
          path: routePath,
          image: notice.coverImageUrl || homeImage,
          datePublished: toSchemaDate(notice.date),
          dateModified: toSchemaDate(notice.date),
          section: normalizeText(notice.category),
        }),
      ],
    });
  }

  for (const resource of data.content?.resources?.items || []) {
    const routePath = `/resources/files/${resource.slug}`;
    const description = normalizeText(resource.description);
    routes.push({
      path: routePath,
      title: `${normalizeText(resource.title)} 자료`,
      description,
      image: resource.coverImageUrl || homeImage,
      imageAlt: normalizeText(resource.title),
      type: 'article',
      publishedTime: toSchemaDate(resource.updatedAt),
      modifiedTime: toSchemaDate(resource.updatedAt),
      section: normalizeText(resource.type),
      jsonLd: [
        createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '자료실', path: '/resources/files' },
          { name: normalizeText(resource.title), path: routePath },
        ]),
        createArticleJsonLd({
          headline: normalizeText(resource.title),
          description,
          path: routePath,
          image: resource.coverImageUrl || homeImage,
          datePublished: toSchemaDate(resource.updatedAt),
          dateModified: toSchemaDate(resource.updatedAt),
          section: normalizeText(resource.type),
        }),
      ],
    });
  }

  for (const company of data.content?.members?.companies || []) {
    const slug = resolveMemberCompanySlug(company);
    if (!slug) {
      continue;
    }

    routes.push({
      path: `/members/${slug}`,
      title: `${normalizeText(company.name)} 협력업체`,
      description: normalizeText(
        [company.category, company.secondaryCategory, company.address, company.phone].filter(Boolean).join(' · '),
      ),
      image: company.logoUrl || homeImage,
      imageAlt: normalizeText(company.name),
      jsonLd: [
        createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '협력업체', path: '/members' },
          { name: normalizeText(company.name), path: `/members/${slug}` },
        ]),
      ],
    });
  }

  return dedupeRoutes(routes);
}

function dedupeRoutes(routes) {
  const map = new Map();

  for (const route of routes) {
    if (!route.path) {
      continue;
    }

    map.set(route.path, route);
  }

  return Array.from(map.values());
}

function renderHtml(html, route) {
  const fullTitle = buildDocumentTitle(route.title);
  const description = truncateText(route.description || DEFAULT_DESCRIPTION);
  const canonicalUrl = buildAbsoluteUrl(route.path);
  const image = buildAbsoluteUrl(route.image || DEFAULT_IMAGE);
  const imageAlt = normalizeText(route.imageAlt) || DEFAULT_IMAGE_ALT;
  const robots = route.noIndex
    ? 'noindex,nofollow,max-image-preview:large'
    : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
  const jsonLdScripts = Array.isArray(route.jsonLd)
    ? route.jsonLd.filter(Boolean).map((entry) => buildJsonLdScript(entry)).join('\n')
    : '';

  let nextHtml = html;
  nextHtml = replaceTitle(nextHtml, fullTitle);
  nextHtml = upsertMeta(nextHtml, 'name', 'description', description);
  nextHtml = upsertMeta(nextHtml, 'name', 'robots', robots);
  nextHtml = upsertMeta(nextHtml, 'name', 'googlebot', robots);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:type', route.type === 'article' ? 'article' : 'website');
  nextHtml = upsertMeta(nextHtml, 'property', 'og:site_name', SITE_NAME);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:url', canonicalUrl);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:title', fullTitle);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:description', description);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:image', image);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:image:secure_url', image);
  nextHtml = upsertMeta(nextHtml, 'property', 'og:image:alt', imageAlt);
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:card', 'summary_large_image');
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:title', fullTitle);
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:description', description);
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:image', image);
  nextHtml = upsertMeta(nextHtml, 'name', 'twitter:image:alt', imageAlt);
  nextHtml = upsertLink(nextHtml, 'canonical', canonicalUrl);
  nextHtml = removeManagedScripts(nextHtml);

  if (route.type === 'article') {
    nextHtml = upsertMeta(nextHtml, 'property', 'article:published_time', route.publishedTime || '');
    nextHtml = upsertMeta(nextHtml, 'property', 'article:modified_time', route.modifiedTime || route.publishedTime || '');
    nextHtml = upsertMeta(nextHtml, 'property', 'article:section', route.section || '');
  }

  if (jsonLdScripts) {
    nextHtml = nextHtml.replace('</head>', `${jsonLdScripts}\n  </head>`);
  }

  return nextHtml;
}

function replaceTitle(html, title) {
  return html.replace(/<title>[\s\S]*?<\/title>/i, `<title>${escapeHtml(title)}</title>`);
}

function upsertMeta(html, attr, key, value) {
  const normalizedValue = String(value || '').trim();
  const pattern = new RegExp(`\\s*<meta[^>]*${attr}="${escapeRegex(key)}"[^>]*>\\s*`, 'i');

  if (!normalizedValue) {
    return html.replace(pattern, '\n');
  }

  const safeValue = escapeHtml(normalizedValue);
  const tag = `    <meta ${attr}="${key}" content="${safeValue}" />`;

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace('</head>', `${tag}\n  </head>`);
}

function upsertLink(html, rel, href) {
  const tag = `    <link rel="${rel}" href="${escapeHtml(href)}" />`;
  const pattern = new RegExp(`<link[^>]*rel="${escapeRegex(rel)}"[^>]*>`, 'i');

  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace('</head>', `${tag}\n  </head>`);
}

function removeManagedScripts(html) {
  return html.replace(/\n?\s*<script type="application\/ld\+json" data-prerender-seo="true">[\s\S]*?<\/script>/gi, '');
}

function buildJsonLdScript(value) {
  return `    <script type="application/ld+json" data-prerender-seo="true">${safeJsonForHtml(value)}</script>`;
}

function buildSitemapXml(routes) {
  const publicRoutes = routes.filter((route) => !route.noIndex);
  const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">'];

  for (const route of publicRoutes) {
    lines.push('  <url>');
    lines.push(`    <loc>${escapeXml(buildAbsoluteUrl(route.path))}</loc>`);
    if (route.modifiedTime) {
      lines.push(`    <lastmod>${escapeXml(route.modifiedTime)}</lastmod>`);
    }
    lines.push('  </url>');
  }

  lines.push('</urlset>');
  return `${lines.join('\n')}\n`;
}

function createBreadcrumbJsonLd(items) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) =>
      compactObject({
        '@type': 'ListItem',
        position: index + 1,
        name: item.name,
        item: item.path ? buildAbsoluteUrl(item.path) : undefined,
      }),
    ),
  };
}

function createArticleJsonLd({ headline, description, path: routePath, image, datePublished, dateModified, section }) {
  return compactObject({
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline,
    description: truncateText(description),
    url: buildAbsoluteUrl(routePath),
    mainEntityOfPage: buildAbsoluteUrl(routePath),
    image: image ? [buildAbsoluteUrl(image)] : undefined,
    datePublished,
    dateModified: dateModified || datePublished,
    articleSection: section,
    author: createPublisherReference(),
    publisher: createPublisherReference(),
  });
}

function createFaqJsonLd(items) {
  const validItems = items
    .filter((item) => normalizeText(item?.question) && normalizeText(item?.answer))
    .map((item) => ({
      '@type': 'Question',
      name: normalizeText(item.question),
      acceptedAnswer: {
        '@type': 'Answer',
        text: normalizeText(item.answer),
      },
    }));

  if (validItems.length === 0) {
    return null;
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: validItems,
  };
}

function createOrganizationJsonLd({ description, telephone }) {
  return compactObject({
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: DEFAULT_IMAGE,
    description: truncateText(description || DEFAULT_DESCRIPTION),
    contactPoint: telephone
      ? [
          compactObject({
            '@type': 'ContactPoint',
            telephone,
            contactType: 'customer support',
            availableLanguage: ['ko'],
          }),
        ]
      : undefined,
  });
}

function createPublisherReference() {
  return {
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_ORIGIN,
    logo: {
      '@type': 'ImageObject',
      url: DEFAULT_IMAGE,
    },
  };
}

function compactObject(value) {
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
  );
}

function findHeaderMenu(items, targetPath) {
  return items.find((item) => normalizeMenuPath(item?.path) === targetPath);
}

function normalizeMenuPath(value) {
  const [pathname] = String(value || '').split('#');
  return pathname.split('?')[0] || '/';
}

function buildDocumentTitle(title) {
  const normalizedTitle = normalizeText(title);
  return normalizedTitle ? `${SITE_NAME} | ${normalizedTitle}` : DEFAULT_TITLE;
}

function buildAbsoluteUrl(value = '/') {
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

function truncateText(value, maxLength = 160) {
  const normalized = normalizeText(value);

  if (!normalized) {
    return DEFAULT_DESCRIPTION;
  }

  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, Math.max(0, maxLength - 1)).trim()}…`;
}

function stripHtml(value) {
  return String(value || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim();
}

function toSchemaDate(value) {
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

function resolveMemberCompanySlug(company) {
  return normalizeText(company?.slug) || createContentSlug(company?.name);
}

function buildCaseSeoTitle(title) {
  if (!title) {
    return '행사 운영 사례';
  }

  if (/사례/.test(title)) {
    return title;
  }

  if (/운영/.test(title)) {
    return `${title} 사례`;
  }

  return `${title} 행사 운영 사례`;
}

function createContentSlug(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w가-힣]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function escapeXml(value) {
  return escapeHtml(value).replace(/'/g, '&apos;');
}

function escapeRegex(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeJsonForHtml(value) {
  return JSON.stringify(value).replace(/</g, '\\u003c');
}

function withTimeout(promise, timeoutMs) {
  return Promise.race([
    promise,
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), timeoutMs);
    }),
  ]);
}
