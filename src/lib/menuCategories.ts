import type { HeaderMenuItem } from '../types/siteContent';

export type MenuLinkedCategory = {
  label: string;
  value: string;
  path: string;
};

const NON_CATEGORY_LABEL_KEYWORDS = ['소개', '검색', '대표', '바로가기', '전체'];
const DRAFT_CATEGORY_LABEL_PATTERN = /^(?:하위\s*메뉴(?:\s*\d+)?|새(?:\s*카테고리(?:\s*\d+)?)?)$/;

function normalizeMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function normalizeFullMenuPath(path: string) {
  return String(path || '').trim();
}

function parseMenuPath(path: string) {
  const trimmedPath = String(path || '').trim();
  const [pathWithoutHash] = trimmedPath.split('#');
  const [pathname = '/', search = ''] = pathWithoutHash.split('?');

  return {
    pathname: pathname || '/',
    searchParams: new URLSearchParams(search),
  };
}

function isLikelyCategoryLabel(label: string) {
  const normalizedLabel = String(label || '').trim();

  if (!normalizedLabel) {
    return false;
  }

  return !NON_CATEGORY_LABEL_KEYWORDS.some((keyword) => normalizedLabel.includes(keyword));
}

export function isDraftManagedCategoryLabel(label: string) {
  return DRAFT_CATEGORY_LABEL_PATTERN.test(String(label || '').trim());
}

export function isManagedHeaderCategoryParentPath(parentPath: string) {
  const normalizedParentPath = normalizeMenuPath(parentPath);
  return normalizedParentPath === '/cases' || normalizedParentPath === '/members';
}

export function resolveManagedHeaderChildPath(
  parentPath: string,
  childLabel: string,
  currentPath = '',
  fallbackPath = '',
) {
  const normalizedParentPath = normalizeMenuPath(parentPath);
  const normalizedChildLabel = String(childLabel || '').trim();
  const normalizedCurrentPath = normalizeFullMenuPath(currentPath);
  const normalizedFallbackPath = normalizeFullMenuPath(fallbackPath);

  if (!normalizedChildLabel || !isManagedHeaderCategoryParentPath(normalizedParentPath)) {
    return normalizedCurrentPath || normalizedFallbackPath;
  }

  if (normalizedParentPath === '/cases') {
    if (normalizedChildLabel.includes('대표') || normalizedChildLabel.includes('전체')) {
      return '/cases#portfolio-list';
    }

    return `/cases?category=${encodeURIComponent(normalizedChildLabel)}#portfolio-list`;
  }

  if (normalizedChildLabel.includes('검색')) {
    return '/members#member-search';
  }

  if (
    normalizedChildLabel.includes('소개') ||
    normalizedChildLabel.includes('전체') ||
    normalizedChildLabel.includes('목록')
  ) {
    return '/members#member-list';
  }

  return `/members?category=${encodeURIComponent(normalizedChildLabel)}#member-list`;
}

export function shouldAutoGenerateManagedHeaderChildPath(parentPath: string, path: string) {
  if (!isManagedHeaderCategoryParentPath(parentPath)) {
    return false;
  }

  const trimmedPath = normalizeFullMenuPath(path);

  if (!trimmedPath) {
    return true;
  }

  return normalizeMenuPath(trimmedPath).startsWith('/new-page');
}

export function isManagedHeaderChildAutoPath(parentPath: string, childLabel: string, currentPath: string) {
  const managedPath = resolveManagedHeaderChildPath(parentPath, childLabel);
  const trimmedCurrentPath = normalizeFullMenuPath(currentPath);

  if (!managedPath || !trimmedCurrentPath) {
    return false;
  }

  return managedPath === trimmedCurrentPath;
}

export function getMenuLinkedCategories(headerItems: HeaderMenuItem[], parentPath: string): MenuLinkedCategory[] {
  const parentMenu = headerItems.find((item) => normalizeMenuPath(item.path) === parentPath);

  if (!parentMenu) {
    return [];
  }

  const isManagedParent = isManagedHeaderCategoryParentPath(parentPath);
  const seenValues = new Set<string>();

  return parentMenu.children.flatMap((child) => {
    const label = String(child.label || '').trim();
    const path = String(child.path || '').trim();
    const { pathname, searchParams } = parseMenuPath(path);
    const hasCategoryQuery = Boolean(searchParams.get('category'));
    const queryCategoryValue = String(searchParams.get('category') || '').trim();

    if (!label) {
      return [];
    }

    if (isDraftManagedCategoryLabel(label)) {
      return [];
    }

    if (!isManagedParent && pathname !== parentPath) {
      return [];
    }

    if (isManagedParent && !hasCategoryQuery && !isLikelyCategoryLabel(label)) {
      return [];
    }

    const shouldUseLabelAsValue =
      normalizeMenuPath(parentPath) === '/members' ||
      !queryCategoryValue ||
      isDraftManagedCategoryLabel(queryCategoryValue);
    const categoryValue = shouldUseLabelAsValue ? label : queryCategoryValue;

    if (seenValues.has(categoryValue)) {
      return [];
    }

    seenValues.add(categoryValue);

    return [
      {
        label,
        value: categoryValue,
        path,
      },
    ];
  });
}
