import type { HeaderMenuItem, SitePageContent } from '../types/siteContent';
import type { SiteCopy } from '../types/siteCopy';

export type AboutPageKey = 'intro' | 'identity' | 'strength' | 'process';

export type AboutChildPageConfig = {
  key: Exclude<AboutPageKey, 'intro'>;
  defaultLabel: string;
  path: string;
  titleField: 'identityTitle' | 'strengthTitle' | 'processTitle';
  descriptionField: 'identityDescription' | 'strengthDescription' | 'processDescription';
  imageField: 'identityImageUrl' | 'strengthImageUrl' | 'processImageUrl';
};

export type AboutSidebarItem = {
  key: AboutPageKey;
  label: string;
  path: string;
};

export type AboutResolvedPage = {
  key: AboutPageKey;
  label: string;
  path: string;
  editPath: string;
  title: string;
  description: string;
  imageUrl: string;
};

export const ABOUT_PARENT_PATH = '/about';

export const ABOUT_CHILD_PAGE_CONFIGS: AboutChildPageConfig[] = [
  {
    key: 'identity',
    defaultLabel: '회사 개요',
    path: '/about/overview',
    titleField: 'identityTitle',
    descriptionField: 'identityDescription',
    imageField: 'identityImageUrl',
  },
  {
    key: 'strength',
    defaultLabel: '사업영역',
    path: '/about/business',
    titleField: 'strengthTitle',
    descriptionField: 'strengthDescription',
    imageField: 'strengthImageUrl',
  },
  {
    key: 'process',
    defaultLabel: '운영 프로세스',
    path: '/about/process',
    titleField: 'processTitle',
    descriptionField: 'processDescription',
    imageField: 'processImageUrl',
  },
] as const;

export function normalizeMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

export function getAboutHeaderItem(headerItems: HeaderMenuItem[]) {
  return headerItems.find((item) => normalizeMenuPath(item.path) === ABOUT_PARENT_PATH);
}

function normalizeAboutLabel(label: string) {
  return String(label || '').trim().replace(/\s+/g, '');
}

export function getAboutSidebarItems(headerItems: HeaderMenuItem[]): AboutSidebarItem[] {
  const aboutMenu = getAboutHeaderItem(headerItems);
  const parentLabel = String(aboutMenu?.label || '회사소개').trim() || '회사소개';
  const usedLabels = new Set([normalizeAboutLabel(parentLabel)]);

  return [
    {
      key: 'intro',
      label: parentLabel,
      path: ABOUT_PARENT_PATH,
    },
    ...ABOUT_CHILD_PAGE_CONFIGS.map((config, index) => ({
      key: config.key,
      label: (() => {
        const rawLabel = String(aboutMenu?.children?.[index]?.label || '').trim();
        const rawNormalized = normalizeAboutLabel(rawLabel);
        const fallbackNormalized = normalizeAboutLabel(config.defaultLabel);

        if (!rawNormalized || usedLabels.has(rawNormalized)) {
          usedLabels.add(fallbackNormalized);
          return config.defaultLabel;
        }

        usedLabels.add(rawNormalized);
        return rawLabel;
      })(),
      path: config.path,
    })),
  ];
}

export function getAboutBasePathname(pathname: string) {
  const normalizedPath = normalizeMenuPath(pathname);
  return normalizedPath.endsWith('/edit') ? normalizedPath.slice(0, -5) || ABOUT_PARENT_PATH : normalizedPath;
}

export function getAboutPageKeyFromPathname(pathname: string): AboutPageKey | null {
  const normalizedPath = getAboutBasePathname(pathname);

  if (normalizedPath === ABOUT_PARENT_PATH) {
    return 'intro';
  }

  const matched = ABOUT_CHILD_PAGE_CONFIGS.find((config) => normalizeMenuPath(config.path) === normalizedPath);
  return matched?.key || null;
}

export function getAboutResolvedPage(
  pathname: string,
  headerItems: HeaderMenuItem[],
  copy: SiteCopy['about'],
  content: SitePageContent['about'],
): AboutResolvedPage | null {
  const basePath = getAboutBasePathname(pathname);
  const pageKey = getAboutPageKeyFromPathname(basePath);
  const sidebarItems = getAboutSidebarItems(headerItems);

  if (!pageKey) {
    return null;
  }

  const sidebarItem = sidebarItems.find((item) => item.key === pageKey);

  if (pageKey === 'intro') {
    return {
      key: 'intro',
      label: sidebarItem?.label || '회사소개',
      path: ABOUT_PARENT_PATH,
      editPath: '/about/edit',
      title: String(copy.introTitle || '').trim(),
      description: String(copy.introDescription || ''),
      imageUrl: String(content.heroImageUrl || '').trim(),
    };
  }

  const config = ABOUT_CHILD_PAGE_CONFIGS.find((item) => item.key === pageKey);

  if (!config) {
    return null;
  }

  return {
    key: pageKey,
    label: sidebarItem?.label || config.defaultLabel,
    path: basePath,
    editPath: `${config.path}/edit`,
    title: String(copy[config.titleField] || '').trim(),
    description: String(copy[config.descriptionField] || ''),
    imageUrl: String(content[config.imageField] || content.heroImageUrl || '').trim(),
  };
}
