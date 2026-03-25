import { useEffect } from 'react';
import {
  buildAbsoluteUrl,
  buildDocumentTitle,
  DEFAULT_DESCRIPTION,
  DEFAULT_IMAGE_ALT,
  DEFAULT_OG_IMAGE_PATH,
  DEFAULT_TITLE,
  normalizeSeoDescription,
  SITE_NAME,
  SITE_ORIGIN,
  type SeoJsonLd,
} from '../lib/seo';

type PageMetaProps = {
  title: string;
  description: string;
  canonicalPath?: string;
  image?: string;
  imageAlt?: string;
  type?: 'website' | 'article';
  noIndex?: boolean;
  jsonLd?: SeoJsonLd;
};

export function PageMeta({
  title,
  description,
  canonicalPath,
  image,
  imageAlt,
  type = 'website',
  noIndex = false,
  jsonLd,
}: PageMetaProps) {
  const normalizedJsonLdBlocks = Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : [];
  const jsonLdSignature = JSON.stringify(normalizedJsonLdBlocks);

  useEffect(() => {
    const defaultImage = getDefaultImageUrl();
    const defaultUrl = `${getSiteOrigin()}/`;
    const resolvedTitle = buildDocumentTitle(title);
    const resolvedDescription = normalizeSeoDescription(description);
    const resolvedCanonicalUrl = buildAbsoluteUrl(canonicalPath || getCurrentPageUrl());
    const resolvedImage = image ? buildAbsoluteUrl(image) : defaultImage;
    const resolvedImageAlt = String(imageAlt || '').trim() || DEFAULT_IMAGE_ALT;
    const resolvedRobots = noIndex
      ? 'noindex,nofollow,max-image-preview:large'
      : 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1';
    document.title = resolvedTitle;

    const descriptionTag = getOrCreateMeta('description');
    descriptionTag.setAttribute('content', resolvedDescription);

    const robotsTag = getOrCreateMeta('robots');
    robotsTag.setAttribute('content', resolvedRobots);

    const googleBotTag = getOrCreateMeta('googlebot');
    googleBotTag.setAttribute('content', resolvedRobots);

    const canonicalLink = getOrCreateLink('canonical');
    canonicalLink.setAttribute('href', resolvedCanonicalUrl);

    const ogTitle = getOrCreatePropertyMeta('og:title');
    ogTitle.setAttribute('content', resolvedTitle);

    const ogType = getOrCreatePropertyMeta('og:type');
    ogType.setAttribute('content', type);

    const ogSiteName = getOrCreatePropertyMeta('og:site_name');
    ogSiteName.setAttribute('content', SITE_NAME);

    const ogDescription = getOrCreatePropertyMeta('og:description');
    ogDescription.setAttribute('content', resolvedDescription);

    const ogUrl = getOrCreatePropertyMeta('og:url');
    ogUrl.setAttribute('content', resolvedCanonicalUrl);

    const ogImage = getOrCreatePropertyMeta('og:image');
    ogImage.setAttribute('content', resolvedImage);

    const ogImageSecureUrl = getOrCreatePropertyMeta('og:image:secure_url');
    ogImageSecureUrl.setAttribute('content', resolvedImage);

    const ogImageAlt = getOrCreatePropertyMeta('og:image:alt');
    ogImageAlt.setAttribute('content', resolvedImageAlt);

    const twitterTitle = getOrCreateMeta('twitter:title');
    twitterTitle.setAttribute('content', resolvedTitle);

    const twitterCard = getOrCreateMeta('twitter:card');
    twitterCard.setAttribute('content', 'summary_large_image');

    const twitterDescription = getOrCreateMeta('twitter:description');
    twitterDescription.setAttribute('content', resolvedDescription);

    const twitterImage = getOrCreateMeta('twitter:image');
    twitterImage.setAttribute('content', resolvedImage);

    const twitterImageAlt = getOrCreateMeta('twitter:image:alt');
    twitterImageAlt.setAttribute('content', resolvedImageAlt);

    removeManagedJsonLdScripts();
    normalizedJsonLdBlocks.forEach((block, index) => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.pageMetaJsonld = 'true';
      script.dataset.pageMetaJsonldIndex = String(index);
      script.textContent = JSON.stringify(block);
      document.head.appendChild(script);
    });

    return () => {
      document.title = DEFAULT_TITLE;
      descriptionTag.setAttribute('content', DEFAULT_DESCRIPTION);
      robotsTag.setAttribute('content', 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
      googleBotTag.setAttribute('content', 'index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1');
      canonicalLink.setAttribute('href', defaultUrl);
      ogTitle.setAttribute('content', DEFAULT_TITLE);
      ogType.setAttribute('content', 'website');
      ogSiteName.setAttribute('content', SITE_NAME);
      ogDescription.setAttribute('content', DEFAULT_DESCRIPTION);
      ogUrl.setAttribute('content', defaultUrl);
      ogImage.setAttribute('content', defaultImage);
      ogImageSecureUrl.setAttribute('content', defaultImage);
      ogImageAlt.setAttribute('content', DEFAULT_IMAGE_ALT);
      twitterTitle.setAttribute('content', DEFAULT_TITLE);
      twitterCard.setAttribute('content', 'summary_large_image');
      twitterDescription.setAttribute('content', DEFAULT_DESCRIPTION);
      twitterImage.setAttribute('content', defaultImage);
      twitterImageAlt.setAttribute('content', DEFAULT_IMAGE_ALT);
      removeManagedJsonLdScripts();
    };
  }, [canonicalPath, description, image, imageAlt, jsonLdSignature, noIndex, title, type]);

  return null;
}

function getOrCreateMeta(name: string) {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);

  if (existing) {
    return existing;
  }

  const meta = document.createElement('meta');
  meta.setAttribute('name', name);
  document.head.appendChild(meta);
  return meta;
}

function getOrCreatePropertyMeta(property: string) {
  const existing = document.head.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);

  if (existing) {
    return existing;
  }

  const meta = document.createElement('meta');
  meta.setAttribute('property', property);
  document.head.appendChild(meta);
  return meta;
}

function getOrCreateLink(rel: string) {
  const existing = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);

  if (existing) {
    return existing;
  }

  const link = document.createElement('link');
  link.setAttribute('rel', rel);
  document.head.appendChild(link);
  return link;
}

function getSiteOrigin() {
  if (typeof window === 'undefined') {
    return SITE_ORIGIN;
  }

  return window.location.origin || SITE_ORIGIN;
}

function getCurrentPageUrl() {
  if (typeof window === 'undefined') {
    return `${SITE_ORIGIN}/`;
  }

  return window.location.href || `${getSiteOrigin()}/`;
}

function getDefaultImageUrl() {
  return buildAbsoluteUrl(DEFAULT_OG_IMAGE_PATH);
}

function removeManagedJsonLdScripts() {
  document.head
    .querySelectorAll<HTMLScriptElement>('script[data-page-meta-jsonld="true"]')
    .forEach((script) => script.remove());
}
