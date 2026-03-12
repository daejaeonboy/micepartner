import {
  getTemplateLayoutSections,
  publicPageRouteDefinitions,
  templateCatalogMap,
} from '../content/publicPageLayouts';
import type { SitePageTemplates, SiteTemplateLayouts, TemplateCatalogId } from '../types/pageTemplate';
import type {
  CustomPageContent,
  CustomPageSection,
  CustomPageSectionItem,
  FooterLinkItem,
  HeaderMenuItem,
  SitePageContent,
} from '../types/siteContent';

export type CustomPageTarget = {
  label: string;
  path: string;
  parentLabel: string;
  source: string;
};

export function normalizeCustomPagePath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

export function isImplementedPublicPath(path: string) {
  const normalizedPath = normalizeCustomPagePath(path);

  return publicPageRouteDefinitions.some(
    (route) => !route.path.includes(':') && normalizeCustomPagePath(route.path) === normalizedPath,
  );
}

function createDefaultSectionItems(sectionLabel: string): CustomPageSectionItem[] {
  return Array.from({ length: 3 }).map((_, index) => ({
    kind: 'default',
    title: `${sectionLabel} 항목 ${index + 1}`,
    description: `${sectionLabel} 영역에 들어갈 설명을 입력해 주세요.`,
    details: '',
    meta: '',
    badge: '',
    imageUrl: '',
    href: '',
  }));
}

function createDefaultSection(sectionId: string, sectionLabel: string, index: number): CustomPageSection {
  return {
    id: sectionId,
    eyebrow: '',
    title: sectionLabel === '상단 소개' ? '새 페이지 제목' : `${sectionLabel} 제목`,
    description:
      sectionLabel === '상단 소개'
        ? '이 페이지의 핵심 소개 문구를 입력해 주세요.'
        : `${sectionLabel} 영역 설명을 입력해 주세요.`,
    imageUrl: '',
    settings: {},
    primaryButtonLabel: index === 0 ? '문의하기' : '',
    primaryButtonHref: index === 0 ? '/contact' : '',
    secondaryButtonLabel: '',
    secondaryButtonHref: '',
    items: createDefaultSectionItems(sectionLabel),
  };
}

function mergeCustomPageSections(
  existingSections: CustomPageSection[],
  templateId: TemplateCatalogId,
  templateLayouts: SiteTemplateLayouts,
) {
  const existingSectionMap = new Map(existingSections.map((section) => [section.id, section]));

  return getTemplateLayoutSections(templateId, templateLayouts).map((section, index) => {
    const existing = existingSectionMap.get(section.id);

    if (existing) {
      return {
        ...existing,
        id: section.id,
        settings: {
          ...(existing.settings || {}),
        },
        items: existing.items.map((item) => ({
          ...item,
          kind: item.kind || 'default',
          details: item.details || '',
        })),
      };
    }

    return createDefaultSection(section.id, section.label, index);
  });
}

export function collectCustomPageTargets(headerItems: HeaderMenuItem[], footerQuickLinks: FooterLinkItem[]) {
  const seenPaths = new Set<string>();
  const targets: CustomPageTarget[] = [];

  const pushTarget = (label: string, path: string, parentLabel: string, source: string) => {
    const normalizedPath = normalizeCustomPagePath(path);

    if (!normalizedPath || normalizedPath === '/' || isImplementedPublicPath(normalizedPath) || seenPaths.has(normalizedPath)) {
      return;
    }

    seenPaths.add(normalizedPath);
    targets.push({
      label: String(label || '새 페이지').trim() || '새 페이지',
      path: normalizedPath,
      parentLabel: String(parentLabel || '').trim(),
      source,
    });
  };

  headerItems.forEach((item) => {
    if (!item.children.length) {
      pushTarget(item.label, item.path, '', '헤더 메뉴');
    }

    item.children.forEach((child) => {
      pushTarget(child.label, child.path, item.label, `${item.label} 하위 메뉴`);
    });
  });

  footerQuickLinks.forEach((item) => {
    pushTarget(item.label, item.path, '', '푸터 바로가기');
  });

  return targets;
}

export function createDefaultCustomPage(
  target: CustomPageTarget,
  templateId: TemplateCatalogId,
  templateLayouts: SiteTemplateLayouts,
): CustomPageContent {
  return {
    path: target.path,
    label: target.label,
    parentLabel: target.parentLabel,
    sourcePath: target.path,
    templateId,
    seoTitle: target.label,
    seoDescription: `${target.label} 페이지 소개를 입력해 주세요.`,
    sections: mergeCustomPageSections([], templateId, templateLayouts),
  };
}

export function syncCustomPages(
  content: SitePageContent,
  templates: SitePageTemplates,
  templateLayouts: SiteTemplateLayouts,
) {
  const targets = collectCustomPageTargets(content.menus.headerItems, content.menus.footerQuickLinks);
  const existingMap = new Map(
    (content.customPages || []).map((page) => [normalizeCustomPagePath(page.path), page]),
  );
  const preservedImplementedOverrides = (content.customPages || [])
    .filter((page) => isImplementedPublicPath(page.path))
    .flatMap((page) => {
      const normalizedPath = normalizeCustomPagePath(page.path);
      const templateId = templates[normalizedPath] || page.templateId;

      if (!templateId || !(templateId in templateCatalogMap)) {
        return [];
      }

      return [
        {
          ...page,
          path: normalizedPath,
          label: String(page.label || '').trim() || page.label,
          parentLabel: String(page.parentLabel || '').trim(),
          sourcePath: normalizeCustomPagePath(page.sourcePath || normalizedPath),
          templateId,
          seoTitle: String(page.seoTitle || page.label || '').trim() || page.label,
          seoDescription: String(page.seoDescription || `${page.label} 페이지 소개를 입력해 주세요.`).trim() || `${page.label} 페이지 소개를 입력해 주세요.`,
          sections: mergeCustomPageSections(page.sections || [], templateId, templateLayouts),
        },
      ];
    });
  const preservedImplementedPaths = new Set(preservedImplementedOverrides.map((page) => normalizeCustomPagePath(page.path)));

  const customPages = targets.flatMap((target) => {
    const templateId = templates[target.path];

    if (!templateId || !(templateId in templateCatalogMap)) {
      return [];
    }

    const existing = existingMap.get(target.path);
    const basePage = existing || createDefaultCustomPage(target, templateId, templateLayouts);

    return [
      {
        ...basePage,
        path: target.path,
        label: target.label,
        parentLabel: target.parentLabel,
        sourcePath: normalizeCustomPagePath(basePage.sourcePath || target.path),
        templateId,
        seoTitle: String(basePage.seoTitle || target.label).trim() || target.label,
        seoDescription:
          String(basePage.seoDescription || `${target.label} 페이지 소개를 입력해 주세요.`).trim() ||
          `${target.label} 페이지 소개를 입력해 주세요.`,
        sections: mergeCustomPageSections(basePage.sections || [], templateId, templateLayouts),
      },
    ];
  });

  return {
    ...content,
    customPages: [
      ...preservedImplementedOverrides,
      ...customPages.filter((page) => !preservedImplementedPaths.has(normalizeCustomPagePath(page.path))),
    ],
  };
}

export function findCustomPageByPath(customPages: CustomPageContent[], path: string) {
  const normalizedPath = normalizeCustomPagePath(path);
  return customPages.find((page) => normalizeCustomPagePath(page.path) === normalizedPath);
}

export function getCustomEditorPageId(path: string) {
  return `custom:${normalizeCustomPagePath(path)}` as const;
}
