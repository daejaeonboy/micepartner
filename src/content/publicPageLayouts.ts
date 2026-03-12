import type { PublicPageLayoutKey, SitePageLayout, SitePageLayouts } from '../types/pageLayout';
import type { SitePageTemplates, SiteTemplateLayout, SiteTemplateLayouts, TemplateCatalogId } from '../types/pageTemplate';

export type PublicPageSectionDefinition = {
  id: string;
  label: string;
  description?: string;
};

type PublicPageLayoutDefinition = {
  label: string;
  sections: PublicPageSectionDefinition[];
};

type TemplateLayoutDefinition = {
  label: string;
  sections: PublicPageSectionDefinition[];
};

export type TemplateCatalogItem = {
  id: TemplateCatalogId;
  title: string;
  description: string;
  pages: PublicPageLayoutKey[];
  exampleRows: string[][];
  notes: string[];
};

export type PublicPageRouteDefinition = {
  path: string;
  page: PublicPageLayoutKey;
};

export const publicPageLayoutDefinitions: Record<PublicPageLayoutKey, PublicPageLayoutDefinition> = {
  home: {
    label: '메인 홈',
    sections: [
      { id: 'hero', label: '히어로' },
      { id: 'service-preview', label: '서비스 프리뷰' },
      { id: 'positioning', label: '브랜드 소개' },
      { id: 'portfolio-preview', label: '포트폴리오 프리뷰' },
      { id: 'resources-preview', label: '정보센터 프리뷰' },
      { id: 'partners', label: '비즈니스 파트너' },
      { id: 'cta', label: 'CTA' },
    ],
  },
  services: {
    label: '서비스',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'visual', label: '대표 이미지' },
      { id: 'modules', label: '서비스 모듈' },
      { id: 'flow', label: '진행 흐름' },
    ],
  },
  cases: {
    label: '포트폴리오',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'categories', label: '카테고리' },
      { id: 'cards', label: '사례 카드' },
      { id: 'owner-note', label: '하단 안내' },
    ],
  },
  about: {
    label: '회사소개',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'identity', label: '브랜드 소개' },
      { id: 'strengths', label: '강점 소개' },
      { id: 'process', label: '프로세스' },
    ],
  },
  contact: {
    label: '문의',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'visual', label: '대표 이미지' },
      { id: 'options', label: '문의 옵션' },
      { id: 'form', label: '문의 폼' },
    ],
  },
  members: {
    label: 'MICE 회원',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'directory', label: '회원사 목록' },
    ],
  },
  resourcesNotices: {
    label: '정보센터 소식',
    sections: [
      { id: 'header', label: '상단 소개' },
      { id: 'board', label: '소식 목록' },
      { id: 'owner-note', label: '하단 안내' },
    ],
  },
  resourcesFiles: {
    label: '정보센터 자료',
    sections: [
      { id: 'header', label: '상단 소개' },
      { id: 'archive', label: '자료 목록' },
      { id: 'owner-note', label: '하단 안내' },
    ],
  },
  portfolioDetail: {
    label: '포트폴리오 상세',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'visual', label: '대표 이미지' },
      { id: 'overview', label: '개요' },
      { id: 'narrative', label: '프로젝트 설명' },
      { id: 'gallery', label: '갤러리' },
    ],
  },
  noticeDetail: {
    label: '소식 상세',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'visual', label: '대표 이미지' },
      { id: 'body', label: '본문' },
      { id: 'attachments', label: '첨부 링크' },
    ],
  },
  resourceDetail: {
    label: '자료 상세',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'visual', label: '대표 이미지' },
      { id: 'info', label: '자료 정보' },
      { id: 'download', label: '다운로드' },
    ],
  },
  menuPending: {
    label: '준비중 페이지',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'status', label: '상태 안내' },
    ],
  },
};

export const defaultSitePageLayouts: SitePageLayouts = Object.fromEntries(
  Object.entries(publicPageLayoutDefinitions).map(([pageKey, definition]) => [
    pageKey,
    {
      sections: definition.sections.map((section) => ({
        id: section.id,
        visible: true,
      })),
    },
  ]),
) as SitePageLayouts;

function cloneLayout(layout: SitePageLayout): SitePageLayout {
  return {
    sections: layout.sections.map((section) => ({
      id: section.id,
      visible: section.visible,
    })),
  };
}

export function resolvePageLayoutSections(page: PublicPageLayoutKey, layout?: SitePageLayout) {
  const definitions = publicPageLayoutDefinitions[page].sections;
  const definitionMap = new Map(definitions.map((section) => [section.id, section]));
  const storedSections = layout?.sections ?? [];
  const orderedIds = storedSections
    .map((section) => section.id)
    .filter((sectionId) => definitionMap.has(sectionId));

  const mergedOrder = [
    ...orderedIds,
    ...definitions.map((section) => section.id).filter((sectionId) => !orderedIds.includes(sectionId)),
  ];

  const visibilityMap = new Map(storedSections.map((section) => [section.id, section.visible]));

  return mergedOrder.map((sectionId) => ({
    ...definitionMap.get(sectionId)!,
    visible: visibilityMap.get(sectionId) ?? true,
  }));
}

export const templateLayoutDefinitions: Record<TemplateCatalogId, TemplateLayoutDefinition> = {
  'home-story': {
    label: '메인 랜딩 템플릿',
    sections: [
      { id: 'hero', label: '히어로' },
      { id: 'service-preview', label: 'Section 1' },
      { id: 'positioning', label: 'Section 2' },
      { id: 'portfolio-preview', label: 'Section 3' },
      { id: 'resources-preview', label: 'Section 4' },
      { id: 'partners', label: 'Section 5' },
      { id: 'cta', label: 'Section 6' },
    ],
  },
  'visual-landing': {
    label: '비주얼 랜딩 템플릿',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'section-1', label: 'Section 1' },
      { id: 'section-2', label: 'Section 2' },
      { id: 'section-3', label: 'Section 3' },
    ],
  },
  'showcase-grid': {
    label: '그리드 쇼케이스 템플릿',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'section-1', label: 'Section 1' },
      { id: 'section-2', label: 'Section 2' },
      { id: 'section-3', label: 'Section 3' },
    ],
  },
  'board-index': {
    label: '보드형 정보 템플릿',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'section-1', label: 'Section 1' },
      { id: 'section-2', label: 'Section 2' },
    ],
  },
  directory: {
    label: '검색형 디렉토리 템플릿',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'section-1', label: 'Section 1' },
    ],
  },
  'detail-story': {
    label: '상세 스토리 템플릿',
    sections: [
      { id: 'intro', label: '상단 소개' },
      { id: 'section-1', label: 'Section 1' },
      { id: 'section-2', label: 'Section 2' },
      { id: 'section-3', label: 'Section 3' },
      { id: 'section-4', label: 'Section 4' },
    ],
  },
};

export const defaultSiteTemplateLayouts: SiteTemplateLayouts = Object.fromEntries(
  Object.entries(templateLayoutDefinitions).map(([templateId, definition]) => [
    templateId,
    {
      sections: definition.sections.map((section) => ({
        id: section.id,
        visible: true,
      })),
    },
  ]),
) as SiteTemplateLayouts;

function cloneTemplateLayout(layout: SiteTemplateLayout): SiteTemplateLayout {
  return {
    sections: layout.sections.map((section) => ({
      id: section.id,
      visible: section.visible,
    })),
  };
}

function mergeTemplateLayout(templateId: TemplateCatalogId, layout?: SiteTemplateLayout): SiteTemplateLayout {
  const definitions = templateLayoutDefinitions[templateId].sections;
  const definitionIds = definitions.map((section) => section.id);
  const storedSections = layout?.sections ?? [];
  const orderedIds = storedSections
    .map((section) => section.id)
    .filter((sectionId) => definitionIds.includes(sectionId));
  const mergedOrder = [...orderedIds, ...definitionIds.filter((sectionId) => !orderedIds.includes(sectionId))];
  const visibilityMap = new Map(storedSections.map((section) => [section.id, section.visible]));

  return {
    sections: mergedOrder.map((sectionId) => ({
      id: sectionId,
      visible: visibilityMap.get(sectionId) ?? true,
    })),
  };
}

export function normalizeTemplatePath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

export const publicPageRouteDefinitions: PublicPageRouteDefinition[] = [
  { path: '/', page: 'home' },
  { path: '/services', page: 'services' },
  { path: '/cases', page: 'cases' },
  { path: '/cases/:slug', page: 'portfolioDetail' },
  { path: '/resources/notices', page: 'resourcesNotices' },
  { path: '/resources/notices/:slug', page: 'noticeDetail' },
  { path: '/resources/files', page: 'resourcesFiles' },
  { path: '/resources/files/:slug', page: 'resourceDetail' },
  { path: '/about', page: 'about' },
  { path: '/members', page: 'members' },
  { path: '/contact', page: 'contact' },
];

function escapePathPattern(pattern: string) {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/:([A-Za-z0-9_]+)/g, '[^/]+');
}

function pathMatchesPattern(pattern: string, path: string) {
  if (!pattern.includes(':')) {
    return normalizeTemplatePath(pattern) === normalizeTemplatePath(path);
  }

  const regex = new RegExp(`^${escapePathPattern(normalizeTemplatePath(pattern))}$`);
  return regex.test(normalizeTemplatePath(path));
}

export const templateCatalog: TemplateCatalogItem[] = [
  {
    id: 'home-story',
    title: '메인 랜딩 템플릿',
    description: '브랜드 첫 화면, 소개, 사례 미리보기, 전환 CTA를 한 흐름으로 보여주는 메인 전용 템플릿입니다.',
    pages: ['home'],
    exampleRows: [['히어로'], ['서비스 프리뷰', '브랜드 소개'], ['포트폴리오 프리뷰', '정보센터 프리뷰'], ['비즈니스 파트너'], ['CTA']],
    notes: ['브랜드 첫인상과 전환 흐름에 최적화', '메인 홈 전용 구조'],
  },
  {
    id: 'visual-landing',
    title: '비주얼 랜딩 템플릿',
    description: '상단 소개와 대표 이미지를 먼저 보여주고, 아래에서 카드형 섹션과 설명 블록을 이어가는 템플릿입니다.',
    pages: ['services', 'about', 'contact'],
    exampleRows: [['상단 소개'], ['대표 이미지'], ['핵심 섹션'], ['보조 섹션']],
    notes: ['서비스, 회사소개, 문의 같은 소개형 페이지에 적합', '문구와 이미지 비중이 큰 페이지용'],
  },
  {
    id: 'showcase-grid',
    title: '그리드 쇼케이스 템플릿',
    description: '카테고리 선택 후 카드 그리드로 사례를 보여주고 마지막에 안내 문구를 붙이는 포트폴리오형 템플릿입니다.',
    pages: ['cases'],
    exampleRows: [['상단 소개'], ['카테고리'], ['사례 카드 그리드'], ['하단 안내']],
    notes: ['카드 이미지와 요약 중심', '포트폴리오/사례형 페이지에 적합'],
  },
  {
    id: 'board-index',
    title: '보드형 정보 템플릿',
    description: '제목과 점프 링크, 리스트 본문, 하단 안내로 구성된 정보센터형 템플릿입니다.',
    pages: ['resourcesNotices', 'resourcesFiles'],
    exampleRows: [['상단 소개', '다른 페이지 이동'], ['목록/보드 영역'], ['하단 안내']],
    notes: ['공지, 자료, 아카이브형 페이지에 적합', '리스트 중심 운영용'],
  },
  {
    id: 'directory',
    title: '검색형 디렉토리 템플릿',
    description: '상단 소개 뒤에 검색/필터와 카드 목록을 두는 디렉토리형 템플릿입니다.',
    pages: ['members'],
    exampleRows: [['상단 소개'], ['검색 / 필터'], ['카드 목록'], ['페이지네이션']],
    notes: ['회원사, 파트너, 업체 목록에 적합', '검색과 카테고리 필터를 함께 사용'],
  },
  {
    id: 'detail-story',
    title: '상세 스토리 템플릿',
    description: '상세 제목, 대표 이미지, 본문 섹션, 보조 정보 섹션을 순차적으로 보여주는 상세 페이지용 템플릿입니다.',
    pages: ['portfolioDetail', 'noticeDetail', 'resourceDetail', 'menuPending'],
    exampleRows: [['상단 소개'], ['대표 이미지'], ['상세 본문'], ['보조 정보 / 액션']],
    notes: ['상세 설명과 이미지, 링크를 함께 보여주는 구조', '포트폴리오/공지/자료 상세에 공통 적용'],
  },
];

export const defaultSitePageTemplates: SitePageTemplates = {
  '/': 'home-story',
  '/services': 'visual-landing',
  '/cases': 'showcase-grid',
  '/cases/:slug': 'detail-story',
  '/about': 'visual-landing',
  '/contact': 'visual-landing',
  '/members': 'directory',
  '/resources/notices': 'board-index',
  '/resources/notices/:slug': 'detail-story',
  '/resources/files': 'board-index',
  '/resources/files/:slug': 'detail-story',
};

export const defaultTemplateByPage: Record<PublicPageLayoutKey, TemplateCatalogId> = {
  home: 'home-story',
  services: 'visual-landing',
  cases: 'showcase-grid',
  about: 'visual-landing',
  contact: 'visual-landing',
  members: 'directory',
  resourcesNotices: 'board-index',
  resourcesFiles: 'board-index',
  portfolioDetail: 'detail-story',
  noticeDetail: 'detail-story',
  resourceDetail: 'detail-story',
  menuPending: 'detail-story',
};

export const templateCatalogMap: Record<TemplateCatalogId, TemplateCatalogItem> = Object.fromEntries(
  templateCatalog.map((item) => [item.id, item]),
) as Record<TemplateCatalogId, TemplateCatalogItem>;

const pageRuntimeBindings: Record<PublicPageLayoutKey, Record<string, string>> = {
  home: {
    hero: 'hero',
    'service-preview': 'service-preview',
    positioning: 'positioning',
    'portfolio-preview': 'portfolio-preview',
    'resources-preview': 'resources-preview',
    partners: 'partners',
    cta: 'cta',
  },
  services: {
    intro: 'intro',
    'section-1': 'visual',
    'section-2': 'modules',
    'section-3': 'flow',
  },
  cases: {
    intro: 'intro',
    'section-1': 'categories',
    'section-2': 'cards',
    'section-3': 'owner-note',
  },
  about: {
    intro: 'intro',
    'section-1': 'identity',
    'section-2': 'strengths',
    'section-3': 'process',
  },
  contact: {
    intro: 'intro',
    'section-1': 'visual',
    'section-2': 'options',
    'section-3': 'form',
  },
  members: {
    intro: 'intro',
    'section-1': 'directory',
  },
  resourcesNotices: {
    intro: 'header',
    'section-1': 'board',
    'section-2': 'owner-note',
  },
  resourcesFiles: {
    intro: 'header',
    'section-1': 'archive',
    'section-2': 'owner-note',
  },
  portfolioDetail: {
    intro: 'intro',
    'section-1': 'visual',
    'section-2': 'overview',
    'section-3': 'narrative',
    'section-4': 'gallery',
  },
  noticeDetail: {
    intro: 'intro',
    'section-1': 'visual',
    'section-2': 'body',
    'section-3': 'attachments',
  },
  resourceDetail: {
    intro: 'intro',
    'section-1': 'visual',
    'section-2': 'info',
    'section-3': 'download',
  },
  menuPending: {
    intro: 'intro',
    'section-1': 'status',
  },
};

function canTemplateMapToPage(page: PublicPageLayoutKey, templateId: TemplateCatalogId) {
  const bindings = pageRuntimeBindings[page];
  const bindingKeys = new Set(Object.keys(bindings));
  const templateSectionIds = templateLayoutDefinitions[templateId].sections.map((section) => section.id);

  return templateSectionIds.length > 0 && templateSectionIds.every((sectionId) => bindingKeys.has(sectionId));
}

export function getCompatibleTemplatesForPage(page: PublicPageLayoutKey) {
  return templateCatalog.filter((template) => canTemplateMapToPage(page, template.id));
}

export function isTemplateCompatibleWithPage(path: string, templateId: string) {
  const normalizedPath = normalizeTemplatePath(path);
  const page = publicPageRouteDefinitions.find((item) => item.path === normalizedPath)?.page;

  if (!page) {
    return templateId in templateCatalogMap;
  }

  const template = templateCatalogMap[templateId as TemplateCatalogId];
  return Boolean(template && canTemplateMapToPage(page, template.id));
}

export function resolveTemplateIdForPath(path: string, templates?: SitePageTemplates) {
  const normalizedPath = normalizeTemplatePath(path);
  const mergedTemplates = {
    ...defaultSitePageTemplates,
    ...(templates || {}),
  };

  if (mergedTemplates[normalizedPath]) {
    return mergedTemplates[normalizedPath];
  }

  const matchedPattern = Object.entries(mergedTemplates).find(([pattern]) => pattern.includes(':') && pathMatchesPattern(pattern, normalizedPath));
  return matchedPattern?.[1];
}

export function resolveTemplateIdForPage(page: PublicPageLayoutKey, templates?: SitePageTemplates) {
  const route = publicPageRouteDefinitions.find((item) => item.page === page);
  return (route ? resolveTemplateIdForPath(route.path, templates) : undefined) || defaultTemplateByPage[page];
}

export function resolveTemplateLayout(templateId?: TemplateCatalogId, templateLayouts?: SiteTemplateLayouts) {
  const resolvedTemplateId = templateId || 'home-story';
  const layout = mergeTemplateLayout(resolvedTemplateId, templateLayouts?.[resolvedTemplateId]);
  return cloneTemplateLayout(layout);
}

export function normalizeTemplateLayouts(templateLayouts?: Partial<SiteTemplateLayouts>) {
  return Object.fromEntries(
    (Object.keys(templateLayoutDefinitions) as TemplateCatalogId[]).map((templateId) => [
      templateId,
      resolveTemplateLayout(templateId, templateLayouts as SiteTemplateLayouts | undefined),
    ]),
  ) as SiteTemplateLayouts;
}

export function resolveTemplateSectionsForPage(
  page: PublicPageLayoutKey,
  templateId?: TemplateCatalogId,
  templateLayouts?: SiteTemplateLayouts,
) {
  const resolvedTemplateId = templateId || defaultTemplateByPage[page];
  const templateLayout = resolveTemplateLayout(resolvedTemplateId, templateLayouts);
  const templateDefinitions = templateLayoutDefinitions[resolvedTemplateId].sections;
  const templateDefinitionMap = new Map(templateDefinitions.map((section) => [section.id, section]));
  const visibilityMap = new Map(templateLayout.sections.map((section) => [section.id, section.visible]));
  const bindings = pageRuntimeBindings[page];
  const pageDefinitions = publicPageLayoutDefinitions[page].sections;
  const pageDefinitionMap = new Map(pageDefinitions.map((section) => [section.id, section]));

  return templateLayout.sections
    .map((section) => {
      const blockId = bindings[section.id];
      const pageDefinition = blockId ? pageDefinitionMap.get(blockId) : undefined;
      const templateDefinition = templateDefinitionMap.get(section.id);

      if (!blockId || !pageDefinition || !templateDefinition) {
        return null;
      }

      return {
        id: blockId,
        templateSectionId: section.id,
        label: pageDefinition.label,
        templateLabel: templateDefinition.label,
        visible: visibilityMap.get(section.id) ?? true,
      };
    })
    .filter(Boolean) as Array<{
    id: string;
    templateSectionId: string;
    label: string;
    templateLabel: string;
    visible: boolean;
  }>;
}

export function getTemplateLayoutSections(templateId: TemplateCatalogId, templateLayouts?: SiteTemplateLayouts) {
  const layout = resolveTemplateLayout(templateId, templateLayouts);
  const definitions = templateLayoutDefinitions[templateId].sections;
  const definitionMap = new Map(definitions.map((section) => [section.id, section]));

  return layout.sections.map((section) => ({
    ...definitionMap.get(section.id)!,
    visible: section.visible,
  }));
}

export function buildSitePageLayoutsFromTemplates(templates?: SitePageTemplates, templateLayouts?: SiteTemplateLayouts): SitePageLayouts {
  return Object.fromEntries(
    Object.entries(defaultSitePageLayouts).map(([pageKey]) => {
      const page = pageKey as PublicPageLayoutKey;
      const templateId = resolveTemplateIdForPage(page, templates);
      const runtimeSections = resolveTemplateSectionsForPage(page, templateId, templateLayouts);
      return [
        page,
        {
          sections: runtimeSections.map((section) => ({
            id: section.id,
            visible: section.visible,
          })),
        },
      ];
    }),
  ) as SitePageLayouts;
}
