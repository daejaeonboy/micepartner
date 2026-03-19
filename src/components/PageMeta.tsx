import { useEffect } from 'react';

type PageMetaProps = {
  title: string;
  description: string;
};

const defaultTitle = '마이스파트너 | MICE 운영 파트너';
const defaultDescription = '마이스파트너의 회사 소개, 서비스, 포트폴리오, 자료실, 문의 구조를 담은 기업 홈페이지입니다.';
const defaultImage = 'https://micepartner.web.app/logocard.jpg';

export function PageMeta({ title, description }: PageMetaProps) {
  useEffect(() => {
    document.title = `${title} | 마이스파트너`;

    const descriptionTag = getOrCreateMeta('description');
    descriptionTag.setAttribute('content', description);

    const ogTitle = getOrCreatePropertyMeta('og:title');
    ogTitle.setAttribute('content', `${title} | 마이스파트너`);

    const ogDescription = getOrCreatePropertyMeta('og:description');
    ogDescription.setAttribute('content', description);

    const ogImage = getOrCreatePropertyMeta('og:image');
    ogImage.setAttribute('content', defaultImage);

    const twitterTitle = getOrCreateMeta('twitter:title');
    twitterTitle.setAttribute('content', `${title} | 마이스파트너`);

    const twitterDescription = getOrCreateMeta('twitter:description');
    twitterDescription.setAttribute('content', description);

    const twitterImage = getOrCreateMeta('twitter:image');
    twitterImage.setAttribute('content', defaultImage);

    return () => {
      document.title = defaultTitle;
      descriptionTag.setAttribute('content', defaultDescription);
      ogTitle.setAttribute('content', defaultTitle);
      ogDescription.setAttribute('content', defaultDescription);
      ogImage.setAttribute('content', defaultImage);
      twitterTitle.setAttribute('content', defaultTitle);
      twitterDescription.setAttribute('content', defaultDescription);
      twitterImage.setAttribute('content', defaultImage);
    };
  }, [description, title]);

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
