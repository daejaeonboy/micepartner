import { useEffect, useMemo, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
  Blocks,
  ChevronDown,
  ChevronRight,
  ChevronUp,
  CircleHelp,
  ClipboardList,
  FilePenLine,
  LayoutDashboard,
  Layers3,
  LogOut,
  MenuSquare,
  Package2,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import {
  buildSitePageLayoutsFromTemplates,
  defaultSitePageTemplates,
  getTemplateLayoutSections,
  resolveTemplateLayout,
  resolveTemplateSectionsForPage,
  templateCatalog,
  templateCatalogMap,
} from '../content/publicPageLayouts';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { clearAdminToken, getAdminToken } from '../lib/adminSession';
import {
  deleteAdminImage,
  deleteAdminSession,
  fetchCurrentAdmin,
  fetchInquiries,
  saveSiteData,
  uploadAdminImage,
  updateInquiryStatus,
} from '../lib/api';
import type { AdminUser } from '../types/admin';
import type { EditorPageId, SiteEditorConfig } from '../types/editorConfig';
import type { CustomPageContent, CustomPageSection, SitePageContent } from '../types/siteContent';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import type { PublicPageLayoutKey } from '../types/pageLayout';
import type { SitePageTemplates, SiteTemplateLayouts, TemplateCatalogId } from '../types/pageTemplate';
import type { SiteCopy } from '../types/siteCopy';
import { findCustomPageByPath, getCustomEditorPageId, isImplementedPublicPath, normalizeCustomPagePath } from '../lib/customPages';
import { buildClonedCustomPageFromSource } from '../lib/pageTemplatePresets';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

const statusLabels: Record<InquiryStatus, string> = {
  new: '신규',
  in_progress: '처리중',
  completed: '완료',
};

type EditableSectionDefinition = {
  key: EditableSectionKey;
  title: string;
  fields: Array<[string, string]>;
};

type EditableSectionKey = Exclude<keyof SitePageContent, 'customPages'>;

const editableSections: EditableSectionDefinition[] = [
  {
    key: 'home',
    title: '홈페이지',
    fields: [
      ['heroTitle', '메인 히어로 제목'],
      ['heroDescription', '메인 히어로 설명'],
      ['positioningTitle', '회사 포지셔닝 제목'],
      ['positioningDescription', '회사 포지셔닝 설명'],
      ['servicePreviewTitle', '서비스 미리보기 제목'],
      ['servicePreviewDescription', '서비스 미리보기 설명'],
      ['portfolioPreviewTitle', '포트폴리오 미리보기 제목'],
      ['portfolioPreviewDescription', '포트폴리오 미리보기 설명'],
      ['resourcesPreviewTitle', '정보센터 미리보기 제목'],
      ['resourcesPreviewDescription', '정보센터 미리보기 설명'],
      ['processTitle', '비즈니스 파트너 제목'],
      ['processDescription', '비즈니스 파트너 설명'],
      ['ctaTitle', '하단 CTA 제목'],
      ['ctaDescription', '하단 CTA 설명'],
    ],
  },
  {
    key: 'services',
    title: '서비스',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
      ['modulesTitle', '서비스 영역 제목'],
      ['modulesDescription', '서비스 영역 설명'],
      ['flowTitle', '진행 흐름 제목'],
      ['flowDescription', '진행 흐름 설명'],
    ],
  },
  {
    key: 'cases',
    title: '포트폴리오',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
      ['categoriesTitle', '카테고리 제목'],
      ['categoriesDescription', '카테고리 설명'],
      ['cardsTitle', '카드 영역 제목'],
      ['cardsDescription', '카드 영역 설명'],
      ['ownerTitle', '하단 안내 제목'],
      ['ownerDescription', '하단 안내 설명'],
    ],
  },
  {
    key: 'resources',
    title: '정보센터',
    fields: [
      ['noticesTitle', '소식 페이지 제목'],
      ['noticesDescription', '소식 페이지 설명'],
      ['downloadsTitle', '자료 페이지 제목'],
      ['downloadsDescription', '자료 페이지 설명'],
      ['sectionsDescription', '자료 목록 설명'],
      ['ownerTitle', '하단 안내 제목'],
      ['ownerDescription', '하단 안내 설명'],
    ],
  },
  {
    key: 'about',
    title: '회사소개',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
      ['identityTitle', '회사 소개 영역 제목'],
      ['identityDescription', '회사 소개 영역 설명'],
      ['identityCardTitle', '회사 소개 카드 제목'],
      ['ownerCardTitle', '메시지 카드 제목'],
      ['strengthTitle', '강점 영역 제목'],
      ['strengthDescription', '강점 영역 설명'],
      ['processTitle', '프로세스 제목'],
      ['processDescription', '프로세스 설명'],
    ],
  },
  {
    key: 'contact',
    title: '문의',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
      ['optionsTitle', '문의 옵션 제목'],
      ['optionsDescription', '문의 옵션 설명'],
      ['trustCardTitle', '신뢰 카드 제목'],
      ['trustCardDescription', '신뢰 카드 설명'],
      ['formTitle', '폼 제목'],
      ['formDescription', '폼 설명'],
      ['processCardTitle', '진행 방식 카드 제목'],
      ['checklistCardTitle', '체크리스트 카드 제목'],
      ['placeholderCardTitle', '연락처 카드 제목'],
    ],
  },
  {
    key: 'members',
    title: 'MICE 회원',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
    ],
  },
  {
    key: 'menus',
    title: '메뉴 관리',
    fields: [],
  },
  {
    key: 'footer',
    title: '푸터',
    fields: [['copy', '푸터 설명 문구']],
  },
] as const;

const defaultPageLabels: Record<EditableSectionKey, string> = {
  home: '홈페이지',
  services: '서비스',
  cases: '포트폴리오',
  resources: '정보센터',
  about: '회사소개',
  contact: '문의',
  members: 'MICE 회원',
  menus: '메뉴 관리',
  footer: '푸터',
};

type AdminView = 'overview' | 'content' | 'templates' | 'inquiries';

const menuLinkedPagePaths: Partial<Record<EditableSectionKey, string>> = {
  services: '/services',
  cases: '/cases',
  resources: '/resources',
  about: '/about',
  contact: '/contact',
  members: '/members',
};

function normalizeEditorMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

const lockedManagedPaths = new Set([
  '/',
  '/services',
  '/cases',
  '/resources',
  '/resources/notices',
  '/resources/files',
  '/about',
  '/members',
  '/contact',
]);

function isLockedManagedPath(path: string) {
  return lockedManagedPaths.has(normalizeEditorMenuPath(path));
}

type AdminNavItem = {
  key: string;
  label: string;
  description: string;
  icon: LucideIcon;
  view: AdminView;
  page?: EditableSectionKey;
};

type ImagePathSegment = string | number;

type ImageFieldDescriptor = {
  page: EditableSectionKey;
  path: ImagePathSegment[];
  label: string;
  value: string;
};

type TextFieldDescriptor = {
  page: EditableSectionKey;
  path: ImagePathSegment[];
  label: string;
  value: string;
};

type NestedEditorGroup = {
  key: string;
  label: string;
  textFields: TextFieldDescriptor[];
  imageFields: ImageFieldDescriptor[];
};

type ContentSectionGroup = {
  id: string;
  title: string;
  description: string;
  copyFields: string[];
  contentPrefixes: ImagePathSegment[][];
  imagePrefixes: ImagePathSegment[][];
};

type ArrayGroupActionConfig = {
  page: EditableSectionKey;
  arrayPath: ImagePathSegment[];
  label: string;
  createItem: () => unknown;
};

type NestedGroupItemMeta = {
  page: EditableSectionKey;
  arrayPath: ImagePathSegment[];
  index: number;
};

type TemplateOverviewItem = {
  label: string;
  path: string;
  pageKey?: PublicPageLayoutKey;
  templateId: TemplateCatalogId;
  editorPage?: EditorPageId;
};

type TemplatePendingTarget = {
  label: string;
  path: string;
  source: string;
};

type EditorPageDefinition = {
  id: EditorPageId;
  title: string;
  icon: LucideIcon;
  contentKey: EditableSectionKey;
  groupIds: string[];
  pageKey?: PublicPageLayoutKey;
  layoutGroupMap?: Record<string, string[]>;
  templatePath?: string;
  helperText?: string;
  isCommon?: boolean;
  isCustom?: boolean;
  customPath?: string;
};

const imageFieldLabels: Record<string, string> = {
  heroImageUrl: '대표 이미지',
  ctaImageUrl: 'CTA 이미지',
  coverImageUrl: '커버 이미지',
  imageUrl: '이미지',
  logoUrl: '로고 이미지',
  bankLogoUrl: '은행 로고',
};

const imageGroupLabels: Record<string, string> = {
  positioningCards: '브랜드 소개 카드',
  modules: '서비스 카드',
  entries: '포트폴리오',
  companies: '회원사',
  gallery: '갤러리',
  notices: '공지',
  items: '자료',
  partnerLogos: '협력업체 로고',
  highlights: '강점 카드',
  options: '문의 옵션',
};

const textFieldLabels: Record<string, string> = {
  heroEyebrow: '상단 라벨',
  servicePreviewEyebrow: '섹션 라벨',
  heroBadge: '배지 문구',
  positioningCards: '브랜드 소개 카드',
  processSteps: '프로세스 단계',
  partnerLogos: '협력업체 로고',
  modules: '서비스 카드',
  entries: '포트폴리오 사례',
  notices: '공지 항목',
  items: '자료 항목',
  highlights: '강점 카드',
  options: '문의 옵션',
  categories: '카테고리',
  identityPoints: '핵심 문장',
  trustBullets: '신뢰 포인트',
  responseSteps: '응답 단계',
  checklist: '체크리스트',
  contactInfo: '연락처',
  quickLinks: '빠른 링크',
  headerItems: '헤더 메뉴',
  footerQuickLinks: '푸터 바로가기',
  children: '하위 메뉴',
  companies: '회원사',
  scope: '수행 범위',
  gallery: '갤러리 이미지',
  heroPanelStatus: '패널 상태',
  heroPanelTitle: '패널 제목',
  label: '라벨',
  value: '값',
  detail: '세부 설명',
  title: '제목',
  description: '설명',
  step: '단계',
  primaryCtaLabel: '기본 버튼 문구',
  primaryCtaHref: '기본 버튼 링크',
  secondaryCtaLabel: '보조 버튼 문구',
  secondaryCtaHref: '보조 버튼 링크',
  ctaButtonLabel: 'CTA 버튼 문구',
  filterAllLabel: '전체 옵션 문구',
  searchPlaceholder: '검색창 플레이스홀더',
  searchButtonLabel: '검색 버튼 문구',
  totalLabel: '총 개수 라벨',
  currentPageLabel: '페이지 안내 라벨',
  introEyebrow: '상단 라벨',
  modulesEyebrow: '섹션 라벨',
  flowEyebrow: '섹션 라벨',
  categoriesEyebrow: '섹션 라벨',
  allCategoryLabel: '전체 카테고리 문구',
  cardsEyebrow: '섹션 라벨',
  detailLinkLabel: '상세 링크 문구',
  emptyStateMessage: '빈 상태 안내 문구',
  sectionsEyebrow: '섹션 라벨',
  noticesEyebrow: '섹션 라벨',
  downloadsEyebrow: '섹션 라벨',
  noticeLinkLabel: '공지 링크 문구',
  resourceLinkLabel: '자료 링크 문구',
  identityEyebrow: '섹션 라벨',
  strengthEyebrow: '섹션 라벨',
  processEyebrow: '섹션 라벨',
  messageTitle: '메시지 제목',
  messageBody: '메시지 본문',
  organizationLabel: '기관명 라벨',
  organizationPlaceholder: '기관명 플레이스홀더',
  contactNameLabel: '담당자명 라벨',
  contactNamePlaceholder: '담당자명 플레이스홀더',
  emailLabel: '이메일 라벨',
  emailPlaceholder: '이메일 플레이스홀더',
  eventDateLabel: '행사 예정일 라벨',
  eventDatePlaceholder: '행사 예정일 플레이스홀더',
  messageLabel: '문의 내용 라벨',
  messagePlaceholder: '문의 내용 플레이스홀더',
  submitButtonLabel: '제출 버튼 문구',
  submitPendingLabel: '제출 진행 문구',
  submitSuccessMessage: '제출 완료 문구',
  headerCtaLabel: '헤더 문의 버튼',
  customerServiceTitle: '고객센터 제목',
  customerServicePhone: '고객센터 전화',
  customerServiceHours: '운영 시간',
  bankSectionTitle: '계좌 섹션 제목',
  bankName: '은행명',
  bankAccountNumber: '계좌번호',
  bankAccountHolder: '예금주',
  bankLogoUrl: '은행 로고 URL',
  companyName: '회사명',
  name: '업체명',
  secondaryCategory: '세부 구분',
  phone: '전화번호',
  path: '이동 경로',
  href: '링크',
  to: '이동 경로',
  date: '게시일',
  body: '본문',
  summary: '요약',
  downloadLabel: '다운로드 문구',
  downloadUrl: '다운로드 링크',
  fileName: '파일명',
  version: '버전',
  updatedAt: '업데이트 일자',
  type: '자료 유형',
  category: '카테고리',
  cardDescription: '카드 설명',
  outcome: '성과 문구',
  client: '고객명',
  period: '진행 시기',
  summaryTitle: '개요 제목',
  challenge: '과제',
  approach: '접근 방식',
  result: '결과',
  caption: '캡션',
  legalLines: '사업자 정보',
  copyright: '저작권 문구',
};

const contentSectionGroups: Record<EditableSectionKey, ContentSectionGroup[]> = {
  home: [
    { id: 'hero', title: '히어로', description: '메인 첫 화면 카피와 대표 이미지를 관리합니다.', copyFields: ['heroTitle', 'heroDescription'], contentPrefixes: [['heroEyebrow'], ['heroBadge']], imagePrefixes: [['heroImageUrl']] },
    { id: 'service-preview', title: '서비스 프리뷰', description: '서비스 프리뷰 제목, 버튼 문구와 카드 이미지를 관리합니다.', copyFields: ['servicePreviewTitle', 'servicePreviewDescription'], contentPrefixes: [['servicePreviewEyebrow'], ['primaryCtaLabel']], imagePrefixes: [['modules']] },
    { id: 'positioning', title: '브랜드 소개', description: '브랜드 포지셔닝 문구와 소개 카드 이미지를 관리합니다.', copyFields: ['positioningTitle', 'positioningDescription'], contentPrefixes: [['positioningCards']], imagePrefixes: [['positioningCards']] },
    { id: 'portfolio-preview', title: '포트폴리오 프리뷰', description: '포트폴리오 소개 문구와 메인 카드 이미지를 관리합니다.', copyFields: ['portfolioPreviewTitle', 'portfolioPreviewDescription'], contentPrefixes: [['secondaryCtaLabel']], imagePrefixes: [['entries']] },
    { id: 'resources-preview', title: '정보센터 프리뷰', description: '메인에 노출되는 정보센터 소개 문구와 카드 이미지, 카드 텍스트를 관리합니다.', copyFields: ['resourcesPreviewTitle', 'resourcesPreviewDescription'], contentPrefixes: [['items']], imagePrefixes: [['items']] },
    { id: 'process', title: '비즈니스 파트너', description: '협력업체 소개 문구와 로고 이미지를 관리합니다.', copyFields: ['processTitle', 'processDescription'], contentPrefixes: [['partnerLogos']], imagePrefixes: [['partnerLogos']] },
    { id: 'cta', title: 'CTA', description: '마지막 전환 섹션 문구와 배너 이미지를 관리합니다.', copyFields: ['ctaTitle', 'ctaDescription'], contentPrefixes: [['ctaButtonLabel']], imagePrefixes: [['ctaImageUrl']] },
  ],
  services: [
    { id: 'intro', title: '상단 소개', description: '서비스 페이지 상단 카피를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'visual', title: '대표 이미지', description: '서비스 페이지 대표 이미지를 관리합니다.', copyFields: [], contentPrefixes: [], imagePrefixes: [['heroImageUrl']] },
    { id: 'modules', title: '서비스 모듈', description: '서비스 카드 소개 문구와 카드 이미지를 관리합니다.', copyFields: ['modulesTitle', 'modulesDescription'], contentPrefixes: [['modulesEyebrow'], ['modules']], imagePrefixes: [['modules']] },
    { id: 'flow', title: '진행 흐름', description: '서비스 진행 흐름 문구를 관리합니다.', copyFields: ['flowTitle', 'flowDescription'], contentPrefixes: [['flowEyebrow'], ['flowSteps']], imagePrefixes: [] },
  ],
  cases: [
    { id: 'intro', title: '상단 소개', description: '포트폴리오 페이지 소개 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'categories', title: '카테고리', description: '포트폴리오 카테고리 소개 문구를 관리합니다.', copyFields: ['categoriesTitle', 'categoriesDescription'], contentPrefixes: [['categoriesEyebrow'], ['allCategoryLabel'], ['categories']], imagePrefixes: [] },
    { id: 'cards', title: '사례 카드', description: '사례 소개 문구와 대표 이미지를 관리합니다.', copyFields: ['cardsTitle', 'cardsDescription'], contentPrefixes: [['cardsEyebrow'], ['detailLinkLabel'], ['emptyStateMessage'], ['entries']], imagePrefixes: [['entries']] },
    { id: 'owner', title: '하단 안내', description: '하단 안내 문구를 관리합니다.', copyFields: ['ownerTitle', 'ownerDescription'], contentPrefixes: [], imagePrefixes: [] },
  ],
  resources: [
    { id: 'notices', title: '소식 페이지', description: '정보센터 > 소식 페이지 문구와 공지 상세 이미지를 관리합니다.', copyFields: ['noticesTitle', 'noticesDescription'], contentPrefixes: [['notices']], imagePrefixes: [['notices']] },
    { id: 'downloads', title: '자료 페이지', description: '정보센터 > 자료 페이지 문구와 자료 상세 이미지를 관리합니다.', copyFields: ['downloadsTitle', 'downloadsDescription', 'sectionsDescription'], contentPrefixes: [['downloadsEyebrow'], ['items']], imagePrefixes: [['items']] },
    { id: 'owner', title: '하단 안내', description: '정보센터 하단 안내 문구를 관리합니다.', copyFields: ['ownerTitle', 'ownerDescription'], contentPrefixes: [], imagePrefixes: [] },
  ],
  about: [
    { id: 'intro', title: '상단 소개', description: '회사소개 상단 문구와 대표 이미지를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [['heroImageUrl']] },
    { id: 'identity', title: '정체성', description: '회사 정체성과 메시지 관련 문구를 관리합니다.', copyFields: ['identityTitle', 'identityDescription', 'identityCardTitle', 'ownerCardTitle'], contentPrefixes: [['identityEyebrow'], ['messageTitle'], ['messageBody'], ['identityPoints']], imagePrefixes: [] },
    { id: 'strength', title: '강점', description: '강점 소개 문구와 강점 카드 이미지를 관리합니다.', copyFields: ['strengthTitle', 'strengthDescription'], contentPrefixes: [['strengthEyebrow'], ['highlights']], imagePrefixes: [['highlights']] },
    { id: 'process', title: '프로세스', description: '회사소개 하단 프로세스 문구를 관리합니다.', copyFields: ['processTitle', 'processDescription'], contentPrefixes: [['processEyebrow'], ['processSteps']], imagePrefixes: [] },
  ],
  contact: [
    { id: 'intro', title: '상단 소개', description: '문의 페이지 상단 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'visual', title: '대표 이미지', description: '문의 페이지 대표 이미지를 관리합니다.', copyFields: [], contentPrefixes: [], imagePrefixes: [['heroImageUrl']] },
    { id: 'options', title: '문의 옵션', description: '문의 옵션 소개 문구와 옵션 이미지를 관리합니다.', copyFields: ['optionsTitle', 'optionsDescription'], contentPrefixes: [['optionsEyebrow'], ['options'], ['trustBullets']], imagePrefixes: [['options']] },
    { id: 'trust-form', title: '신뢰 및 폼', description: '신뢰 카드와 문의 폼 소개 문구를 관리합니다.', copyFields: ['trustCardTitle', 'trustCardDescription', 'formTitle', 'formDescription'], contentPrefixes: [['formEyebrow'], ['organizationLabel'], ['organizationPlaceholder'], ['contactNameLabel'], ['contactNamePlaceholder'], ['emailLabel'], ['emailPlaceholder'], ['eventDateLabel'], ['eventDatePlaceholder'], ['messageLabel'], ['messagePlaceholder'], ['submitButtonLabel'], ['submitPendingLabel'], ['submitSuccessMessage']], imagePrefixes: [] },
    { id: 'guide-cards', title: '안내 카드', description: '진행 방식과 체크리스트 카드 제목을 관리합니다.', copyFields: ['processCardTitle', 'checklistCardTitle', 'placeholderCardTitle'], contentPrefixes: [['responseSteps'], ['checklist'], ['contactInfo']], imagePrefixes: [] },
  ],
  members: [
    { id: 'intro', title: '상단 소개', description: '회원사 소개 페이지 상단 문구와 검색 영역 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow'], ['filterAllLabel'], ['searchPlaceholder'], ['searchButtonLabel'], ['totalLabel'], ['currentPageLabel']], imagePrefixes: [] },
    { id: 'companies', title: '회원사 목록', description: '회원사 카드 문구와 로고 이미지를 관리합니다.', copyFields: [], contentPrefixes: [['companies']], imagePrefixes: [['companies']] },
  ],
  menus: [
    { id: 'header-menu', title: '헤더 메뉴', description: '상단 네비게이션과 메가 메뉴 구조를 관리합니다.', copyFields: [], contentPrefixes: [['headerItems']], imagePrefixes: [] },
    { id: 'footer-links', title: '푸터 바로가기', description: '푸터 링크 메뉴를 관리합니다.', copyFields: [], contentPrefixes: [['footerQuickLinks']], imagePrefixes: [] },
  ],
  footer: [
    { id: 'footer-copy', title: '푸터 및 헤더 문구', description: '헤더 문의 버튼과 푸터 운영 정보를 관리합니다.', copyFields: ['copy'], contentPrefixes: [['headerCtaLabel'], ['customerServiceTitle'], ['customerServicePhone'], ['customerServiceHours'], ['bankSectionTitle'], ['bankName'], ['bankAccountNumber'], ['bankAccountHolder'], ['legalLines'], ['copyright'], ['companyName'], ['contactInfo']], imagePrefixes: [['bankLogoUrl']] },
  ],
};

function resolveEditorPageGroupOrder(
  page: EditorPageDefinition,
  templates: SitePageTemplates,
  templateLayouts: SiteTemplateLayouts,
) {
  if (!page.pageKey || !page.templatePath) {
    return [...page.groupIds];
  }

  const templateId = (templates[page.templatePath] || defaultSitePageTemplates[page.templatePath]) as TemplateCatalogId;
  const runtimeSections = resolveTemplateSectionsForPage(page.pageKey, templateId, templateLayouts).filter((section) => section.visible);
  const allowedGroups = new Set(page.groupIds);
  const orderedGroupIds: string[] = [];

  runtimeSections.forEach((section) => {
    const mappedGroups = page.layoutGroupMap?.[section.id] || [section.id];

    mappedGroups.forEach((groupId) => {
      if (!allowedGroups.has(groupId) || orderedGroupIds.includes(groupId)) {
        return;
      }

      orderedGroupIds.push(groupId);
    });
  });

  page.groupIds.forEach((groupId) => {
    if (!orderedGroupIds.includes(groupId)) {
      orderedGroupIds.push(groupId);
    }
  });

  return orderedGroupIds;
}

function getArrayItemLabel(value: unknown, index: number) {
  return getGroupedArrayItemLabel(undefined, value, index);
}

function getGroupedArrayItemLabel(parentLabel: string | undefined, value: unknown, index: number) {
  if (value && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    if (parentLabel) {
      const step = String(record.step || '').trim();
      if (step) {
        return `${parentLabel} ${step}`;
      }

      return `${parentLabel} ${index + 1}`;
    }

    const title = String(record.title || record.label || record.slug || '').trim();
    if (title) {
      return title;
    }

    const step = String(record.step || '').trim();
    if (step) {
      return `단계 ${step}`;
    }
  }

  return `항목 ${index + 1}`;
}

const customSectionSettingLabels: Record<string, string> = {
  variant: '섹션 표시 방식',
  actionLabel: '상단 이동 버튼 문구',
  actionHref: '상단 이동 버튼 링크',
  allCategoryLabel: '전체 카테고리 문구',
  searchPlaceholder: '검색창 플레이스홀더',
  searchButtonLabel: '검색 버튼 문구',
  searchOpenLabel: '검색창 열기 문구',
  searchCloseLabel: '검색창 닫기 문구',
  clearSearchLabel: '검색어 지우기 문구',
  loadMoreLabel: '더 보기 버튼 문구',
  emptyMessage: '빈 목록 안내 문구',
  emptyTitle: '빈 목록 제목',
  emptyDescription: '빈 목록 설명',
  filterAllLabel: '전체 필터 문구',
  totalLabel: '전체 건수 문구',
  currentPageLabel: '현재 페이지 문구',
  listTitle: '왼쪽 카드 제목',
  messageEyebrow: '오른쪽 카드 상단 라벨',
  messageTitle: '오른쪽 카드 제목',
  messageBody: '오른쪽 카드 본문',
  organizationLabel: '회사명 라벨',
  organizationPlaceholder: '회사명 플레이스홀더',
  contactNameLabel: '담당자명 라벨',
  contactNamePlaceholder: '담당자명 플레이스홀더',
  emailLabel: '이메일 라벨',
  emailPlaceholder: '이메일 플레이스홀더',
  eventDateLabel: '행사 일정 라벨',
  eventDatePlaceholder: '행사 일정 플레이스홀더',
  messageLabel: '문의 내용 라벨',
  messagePlaceholder: '문의 내용 플레이스홀더',
  submitButtonLabel: '문의 버튼 문구',
  submitPendingLabel: '문의 진행중 문구',
  submitSuccessMessage: '문의 완료 문구',
  processCardTitle: '진행 안내 카드 제목',
  checklistCardTitle: '체크리스트 카드 제목',
  placeholderCardTitle: '연락 정보 카드 제목',
};

function formatCustomSettingLabel(key: string) {
  if (customSectionSettingLabels[key]) {
    return customSectionSettingLabels[key];
  }

  return key
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .replace(/[-_]/g, ' ')
    .trim();
}

function getTextFieldLabel(segment: string) {
  return textFieldLabels[segment] || segment;
}

function getLabelSegments(label: string) {
  return label.split(' / ').map((item) => item.trim()).filter(Boolean);
}

function getNestedLabelMeta(label: string, path: ImagePathSegment[]) {
  if (!path.some((segment) => typeof segment === 'number')) {
    return null;
  }

  const segments = getLabelSegments(label);
  if (segments.length < 2) {
    return null;
  }

  return {
    groupLabel: segments.slice(0, -1).join(' / '),
    fieldLabel: segments[segments.length - 1],
  };
}

function buildNestedEditorGroups(
  textFields: TextFieldDescriptor[],
  imageFields: ImageFieldDescriptor[],
) {
  const nestedGroups = new Map<string, NestedEditorGroup>();
  const standaloneTextFields: TextFieldDescriptor[] = [];
  const standaloneImageFields: ImageFieldDescriptor[] = [];

  textFields.forEach((field) => {
    const meta = getNestedLabelMeta(field.label, field.path);

    if (!meta) {
      standaloneTextFields.push(field);
      return;
    }

    const current =
      nestedGroups.get(meta.groupLabel) || {
        key: meta.groupLabel,
        label: meta.groupLabel,
        textFields: [],
        imageFields: [],
      };

    current.textFields.push({
      ...field,
      label: meta.fieldLabel,
    });
    nestedGroups.set(meta.groupLabel, current);
  });

  imageFields.forEach((field) => {
    const meta = getNestedLabelMeta(field.label, field.path);

    if (!meta) {
      standaloneImageFields.push(field);
      return;
    }

    const current =
      nestedGroups.get(meta.groupLabel) || {
        key: meta.groupLabel,
        label: meta.groupLabel,
        textFields: [],
        imageFields: [],
      };

    current.imageFields.push({
      ...field,
      label: meta.fieldLabel,
    });
    nestedGroups.set(meta.groupLabel, current);
  });

  return {
    nestedGroups: Array.from(nestedGroups.values()),
    standaloneTextFields,
    standaloneImageFields,
  };
}

function collectImageFields(
  page: EditableSectionKey,
  value: unknown,
  path: ImagePathSegment[] = [],
  labelParts: string[] = [],
): ImageFieldDescriptor[] {
  if (Array.isArray(value)) {
    const parentLabel = labelParts[labelParts.length - 1];
    const nextLabelPartsBase = parentLabel ? labelParts.slice(0, -1) : labelParts;

    return value.flatMap((item, index) =>
      collectImageFields(page, item, [...path, index], [
        ...nextLabelPartsBase,
        getGroupedArrayItemLabel(parentLabel, item, index),
      ]),
    );
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    if (typeof child === 'string' && key in imageFieldLabels) {
      return [
        {
          page,
          path: [...path, key],
          label: [...labelParts, imageFieldLabels[key]].join(' / '),
          value: child,
        },
      ];
    }

    const nextLabelParts = key in imageGroupLabels ? [...labelParts, imageGroupLabels[key]] : labelParts;
    return collectImageFields(page, child, [...path, key], nextLabelParts);
  });
}

function collectTextFields(
  page: EditableSectionKey,
  value: unknown,
  path: ImagePathSegment[] = [],
  labelParts: string[] = [],
): TextFieldDescriptor[] {
  if (typeof value === 'string') {
    const lastSegment = path[path.length - 1];

    if (typeof lastSegment === 'string' && lastSegment in imageFieldLabels) {
      return [];
    }

    const label =
      typeof lastSegment === 'number'
        ? labelParts.join(' / ')
        : [...labelParts, getTextFieldLabel(String(lastSegment))].join(' / ');

    return [{ page, path, label: label || '텍스트', value }];
  }

  if (Array.isArray(value)) {
    const parentLabel = labelParts[labelParts.length - 1];
    const nextLabelPartsBase = parentLabel ? labelParts.slice(0, -1) : labelParts;

    return value.flatMap((item, index) =>
      collectTextFields(page, item, [...path, index], [
        ...nextLabelPartsBase,
        getGroupedArrayItemLabel(parentLabel, item, index),
      ]),
    );
  }

  if (!value || typeof value !== 'object') {
    return [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, child]) => {
    if (
      key === 'slug' ||
      key === 'iconKey' ||
      key === 'href' ||
      key === 'to' ||
      key === 'primaryCtaHref' ||
      key === 'secondaryCtaHref' ||
      key === 'downloadUrl' ||
      key === 'seoTitle' ||
      key === 'seoDescription' ||
      key === 'heroPanelStatus' ||
      key === 'heroPanelTitle' ||
      key === 'heroPanelMetrics' ||
      key === 'heroStats' ||
      key === 'proofItems'
    ) {
      return [];
    }

    const nextLabelParts = Array.isArray(child) ? [...labelParts, getTextFieldLabel(key)] : labelParts;
    return collectTextFields(page, child, [...path, key], nextLabelParts);
  });
}

function updateNestedValue<T>(target: T, path: ImagePathSegment[], nextValue: unknown): T {
  const [head, ...rest] = path;

  if (head === undefined) {
    return target;
  }

  if (Array.isArray(target)) {
    return target.map((item, index) => {
      if (index !== head) {
        return item;
      }

      return rest.length === 0 ? nextValue : updateNestedValue(item, rest, nextValue);
    }) as T;
  }

  const record = target as Record<string, unknown>;
  return {
    ...record,
    [head]: rest.length === 0 ? nextValue : updateNestedValue(record[String(head)], rest, nextValue),
  } as T;
}

function getNestedValue(target: unknown, path: ImagePathSegment[]) {
  return path.reduce<unknown>((current, segment) => {
    if (current == null) {
      return undefined;
    }

    if (Array.isArray(current)) {
      return current[Number(segment)];
    }

    if (typeof current === 'object') {
      return (current as Record<string, unknown>)[String(segment)];
    }

    return undefined;
  }, target);
}

function pathsEqual(left: ImagePathSegment[], right: ImagePathSegment[]) {
  return left.length === right.length && left.every((segment, index) => segment === right[index]);
}

function createEmptyMemberCompany() {
  return {
    name: '새 회원사',
    category: '분과',
    secondaryCategory: '구분',
    address: '주소를 입력해 주세요.',
    phone: '전화번호를 입력해 주세요.',
    logoUrl: '',
  };
}

function createEmptyHeaderMenuItem() {
  return {
    label: '새 메뉴',
    path: '/new-page',
    children: [
      {
        label: '하위 메뉴',
        path: '/new-page',
      },
    ],
  };
}

function createEmptyHeaderMenuChild() {
  return {
    label: '하위 메뉴',
    path: '/new-page',
  };
}

function createEmptyFooterQuickLink() {
  return {
    label: '새 링크',
    path: '/new-link',
  };
}

function createEmptyCustomSectionItem() {
  return {
    kind: 'default',
    title: '새 항목',
    description: '설명을 입력해 주세요.',
    details: '',
    meta: '',
    badge: '',
    imageUrl: '',
    href: '',
  };
}

function updateCustomPageCollection(
  customPages: CustomPageContent[],
  path: string,
  updater: (page: CustomPageContent) => CustomPageContent,
) {
  return customPages.map((page) => (page.path === path ? updater(page) : page));
}

function upsertCustomPage(customPages: CustomPageContent[], nextPage: CustomPageContent) {
  const normalizedPath = normalizeCustomPagePath(nextPage.path);
  const existingIndex = customPages.findIndex((page) => normalizeCustomPagePath(page.path) === normalizedPath);

  if (existingIndex === -1) {
    return [...customPages, nextPage];
  }

  return customPages.map((page, index) => (index === existingIndex ? nextPage : page));
}

function removeCustomPageByPath(customPages: CustomPageContent[], path: string) {
  const normalizedPath = normalizeCustomPagePath(path);
  return customPages.filter((page) => normalizeCustomPagePath(page.path) !== normalizedPath);
}

function getGroupArrayActionConfig(page: EditableSectionKey, groupId: string): ArrayGroupActionConfig | null {
  if (page === 'members' && groupId === 'companies') {
    return {
      page: 'members',
      arrayPath: ['companies'],
      label: '회원사 추가',
      createItem: createEmptyMemberCompany,
    };
  }

  if (page === 'menus' && groupId === 'header-menu') {
    return {
      page: 'menus',
      arrayPath: ['headerItems'],
      label: '헤더 메뉴 추가',
      createItem: createEmptyHeaderMenuItem,
    };
  }

  if (page === 'menus' && groupId === 'footer-links') {
    return {
      page: 'menus',
      arrayPath: ['footerQuickLinks'],
      label: '푸터 링크 추가',
      createItem: createEmptyFooterQuickLink,
    };
  }

  return null;
}

function getNestedGroupItemMeta(group: NestedEditorGroup): NestedGroupItemMeta | null {
  const field = group.textFields[0] || group.imageFields[0];

  if (!field) {
    return null;
  }

  for (let index = field.path.length - 1; index >= 0; index -= 1) {
    const segment = field.path[index];

    if (typeof segment === 'number') {
      return {
        page: field.page,
        arrayPath: field.path.slice(0, index),
        index: segment,
      };
    }
  }

  return null;
}

function pathStartsWith(path: ImagePathSegment[], prefix: ImagePathSegment[]) {
  if (prefix.length > path.length) {
    return false;
  }

  return prefix.every((segment, index) => path[index] === segment);
}

function getImageAspectRatioHint(page: EditableSectionKey, path: ImagePathSegment[]) {
  const pathKey = path.join('.');

  if (pathKey.includes('logoUrl') || pathKey.includes('bankLogoUrl')) {
    return '권장 비율 3:1, 최소 900x300';
  }

  if (pathKey.includes('heroImageUrl') || pathKey.includes('ctaImageUrl')) {
    return '권장 비율 16:9, 최소 1600x900';
  }

  if (pathKey.includes('gallery')) {
    return '권장 비율 16:9, 최소 1200x675';
  }

  if (
    page === 'cases' ||
    pathKey.includes('positioningCards') ||
    pathKey.includes('modules') ||
    pathKey.includes('highlights') ||
    pathKey.includes('options') ||
    pathKey.includes('items') ||
    pathKey.includes('notices')
  ) {
    return '권장 비율 4:3, 최소 1200x900';
  }

  return '권장 비율 4:3, 최소 1200x900';
}

function isLongTextField(label: string, value: string) {
  const normalized = label.toLowerCase();
  return (
    value.length > 80 ||
    normalized.includes('설명') ||
    normalized.includes('본문') ||
    normalized.includes('메시지') ||
    normalized.includes('요약') ||
    normalized.includes('문구') ||
    normalized.includes('플레이스홀더') ||
    normalized.includes('정보')
  );
}

export function AdminPage() {
  const navigate = useNavigate();
  const { siteData, siteCopy, updateSiteData } = useSiteContent();
  const [items, setItems] = useState<Inquiry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [savingId, setSavingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | InquiryStatus>('all');
  const [adminToken, setAdminToken] = useState<string>(() => getAdminToken());
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [draftSiteCopy, setDraftSiteCopy] = useState<SiteCopy>(siteCopy);
  const [draftSiteContent, setDraftSiteContent] = useState<SitePageContent>(siteData.content);
  const [draftSiteTemplates, setDraftSiteTemplates] = useState<SitePageTemplates>(siteData.templates);
  const [draftTemplateLayouts, setDraftTemplateLayouts] = useState<SiteTemplateLayouts>(siteData.templateLayouts);
  const [draftSiteEditor, setDraftSiteEditor] = useState<SiteEditorConfig>(siteData.editor);
  const [selectedEditorPage, setSelectedEditorPage] = useState<EditorPageId>('home');
  const [selectedCmsSectionId, setSelectedCmsSectionId] = useState<string>('');
  const [contentError, setContentError] = useState('');
  const [contentMessage, setContentMessage] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [savingScopeKey, setSavingScopeKey] = useState('');
  const [pendingTemplateSourceSelections, setPendingTemplateSourceSelections] = useState<Record<string, string>>({});
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [activeNavKey, setActiveNavKey] = useState('dashboard');
  const [uploadingFieldKey, setUploadingFieldKey] = useState('');
  const [deletingFieldKey, setDeletingFieldKey] = useState('');

  useEffect(() => {
    setDraftSiteCopy(siteCopy);
    setDraftSiteContent(siteData.content);
    setDraftSiteTemplates(siteData.templates);
    setDraftTemplateLayouts(siteData.templateLayouts);
    setDraftSiteEditor(siteData.editor);
    setPendingTemplateSourceSelections({});
  }, [siteCopy, siteData.content, siteData.templates, siteData.templateLayouts, siteData.editor]);

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login', { replace: true });
      setAdminUser(null);
      setItems([]);
      return;
    }

    let active = true;

    const bootstrap = async () => {
      try {
        const user = await fetchCurrentAdmin(adminToken);
        if (!active) {
          return;
        }

        setAdminUser(user);
        await loadInquiries(adminToken);
      } catch {
        if (!active) {
          return;
        }

        clearAdminToken();
        setAdminToken('');
        setAdminUser(null);
        setItems([]);
        navigate('/admin/login', { replace: true });
      }
    };

    void bootstrap();

    return () => {
      active = false;
    };
  }, [adminToken, navigate]);

  const resolvedPageLabels = useMemo<Record<EditableSectionKey, string>>(() => {
    const headerLabelByPath = new Map<string, string>(
      draftSiteContent.menus.headerItems.map((item) => [normalizeEditorMenuPath(item.path), String(item.label || '').trim()]),
    );

    return editableSections.reduce((accumulator, section) => {
      const linkedPath = menuLinkedPagePaths[section.key];
      accumulator[section.key] = linkedPath
        ? headerLabelByPath.get(linkedPath) || defaultPageLabels[section.key]
        : defaultPageLabels[section.key];
      return accumulator;
    }, {} as Record<EditableSectionKey, string>);
  }, [draftSiteContent.menus.headerItems]);

  const resolvedEditableSections = useMemo(
    () => editableSections.map((section) => ({ ...section, title: resolvedPageLabels[section.key] })),
    [resolvedPageLabels],
  );

  const resolvedEditorPageTitles = useMemo<Record<string, string>>(() => {
    const resourcesMenu = draftSiteContent.menus.headerItems.find((item) => normalizeEditorMenuPath(item.path) === '/resources');
    const noticesLabel =
      resourcesMenu?.children.find((item) => normalizeEditorMenuPath(item.path) === '/resources/notices')?.label || '소식';
    const filesLabel =
      resourcesMenu?.children.find((item) => normalizeEditorMenuPath(item.path) === '/resources/files')?.label || '자료';

    return {
      home: '메인 홈',
      services: resolvedPageLabels.services,
      cases: resolvedPageLabels.cases,
      portfolioDetail: `${resolvedPageLabels.cases} 상세`,
      resourcesNotices: `${resolvedPageLabels.resources} ${noticesLabel}`,
      noticeDetail: `${resolvedPageLabels.resources} ${noticesLabel} 상세`,
      resourcesFiles: `${resolvedPageLabels.resources} ${filesLabel}`,
      resourceDetail: `${resolvedPageLabels.resources} ${filesLabel} 상세`,
      about: resolvedPageLabels.about,
      members: resolvedPageLabels.members,
      contact: resolvedPageLabels.contact,
      footer: '푸터',
      menus: '메뉴 관리',
    };
  }, [draftSiteContent.menus.headerItems, resolvedPageLabels]);

  const editorPages = useMemo<EditorPageDefinition[]>(
    () => {
      const builtInPages: EditorPageDefinition[] = [
        {
          id: 'home',
          title: resolvedEditorPageTitles.home,
        icon: FilePenLine,
        contentKey: 'home',
        groupIds: ['hero', 'service-preview', 'positioning', 'portfolio-preview', 'resources-preview', 'process', 'cta'],
        pageKey: 'home',
        layoutGroupMap: {
          hero: ['hero'],
          'service-preview': ['service-preview'],
          positioning: ['positioning'],
          'portfolio-preview': ['portfolio-preview'],
          'resources-preview': ['resources-preview'],
          partners: ['process'],
          cta: ['cta'],
        },
        templatePath: '/',
        helperText: '메인 화면 섹션을 수정합니다.',
      },
        {
        id: 'services',
        title: resolvedEditorPageTitles.services,
        icon: Package2,
        contentKey: 'services',
        groupIds: ['intro', 'visual', 'modules', 'flow'],
        pageKey: 'services',
        layoutGroupMap: {
          intro: ['intro'],
          visual: ['visual'],
          modules: ['modules'],
          flow: ['flow'],
        },
        templatePath: '/services',
        helperText: '서비스 소개 페이지를 수정합니다.',
      },
        {
          id: 'cases',
        title: resolvedEditorPageTitles.cases,
        icon: Layers3,
        contentKey: 'cases',
        groupIds: ['intro', 'categories', 'cards', 'owner'],
        pageKey: 'cases',
        layoutGroupMap: {
          intro: ['intro'],
          categories: ['categories'],
          cards: ['cards'],
          'owner-note': ['owner'],
        },
        templatePath: '/cases',
        helperText: '포트폴리오 목록 페이지를 수정합니다.',
      },
        {
          id: 'portfolioDetail',
        title: resolvedEditorPageTitles.portfolioDetail,
        icon: Layers3,
        contentKey: 'cases',
        groupIds: ['cards'],
        pageKey: 'portfolioDetail',
        layoutGroupMap: {
          intro: ['cards'],
          visual: ['cards'],
          overview: ['cards'],
          narrative: ['cards'],
          gallery: ['cards'],
        },
        templatePath: '/cases/:slug',
        helperText: '포트폴리오 상세 페이지에서 사용하는 사례 정보와 갤러리를 수정합니다.',
      },
        {
          id: 'resourcesNotices',
        title: resolvedEditorPageTitles.resourcesNotices,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['notices', 'owner'],
        pageKey: 'resourcesNotices',
        layoutGroupMap: {
          header: ['notices'],
          board: ['notices'],
          'owner-note': ['owner'],
        },
        templatePath: '/resources/notices',
        helperText: '정보센터 소식 페이지를 수정합니다.',
      },
        {
          id: 'noticeDetail',
        title: resolvedEditorPageTitles.noticeDetail,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['notices'],
        pageKey: 'noticeDetail',
        layoutGroupMap: {
          intro: ['notices'],
          visual: ['notices'],
          body: ['notices'],
          attachments: ['notices'],
        },
        templatePath: '/resources/notices/:slug',
        helperText: '소식 상세 페이지에서 사용하는 공지 본문, 이미지, 첨부 링크를 수정합니다.',
      },
        {
          id: 'resourcesFiles',
        title: resolvedEditorPageTitles.resourcesFiles,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['downloads', 'owner'],
        pageKey: 'resourcesFiles',
        layoutGroupMap: {
          header: ['downloads'],
          archive: ['downloads'],
          'owner-note': ['owner'],
        },
        templatePath: '/resources/files',
        helperText: '정보센터 자료 페이지를 수정합니다.',
      },
        {
          id: 'resourceDetail',
        title: resolvedEditorPageTitles.resourceDetail,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['downloads'],
        pageKey: 'resourceDetail',
        layoutGroupMap: {
          intro: ['downloads'],
          visual: ['downloads'],
          info: ['downloads'],
          download: ['downloads'],
        },
        templatePath: '/resources/files/:slug',
        helperText: '자료 상세 페이지에서 사용하는 설명, 다운로드 링크, 대표 이미지를 수정합니다.',
      },
        {
          id: 'about',
        title: resolvedEditorPageTitles.about,
        icon: Users,
        contentKey: 'about',
        groupIds: ['intro', 'identity', 'strength', 'process'],
        pageKey: 'about',
        layoutGroupMap: {
          intro: ['intro'],
          visual: ['intro'],
          identity: ['identity'],
          strengths: ['strength'],
          process: ['process'],
        },
        templatePath: '/about',
        helperText: '회사소개 페이지를 수정합니다.',
      },
        {
          id: 'members',
        title: resolvedEditorPageTitles.members,
        icon: Users,
        contentKey: 'members',
        groupIds: ['intro', 'companies'],
        pageKey: 'members',
        layoutGroupMap: {
          intro: ['intro'],
          directory: ['companies'],
        },
        templatePath: '/members',
        helperText: 'MICE 회원 페이지를 수정합니다.',
      },
        {
        id: 'contact',
        title: resolvedEditorPageTitles.contact,
        icon: ClipboardList,
        contentKey: 'contact',
        groupIds: ['intro', 'visual', 'options', 'trust-form', 'guide-cards'],
        pageKey: 'contact',
        layoutGroupMap: {
          intro: ['intro'],
          visual: ['visual'],
          options: ['options'],
          form: ['trust-form', 'guide-cards'],
        },
        templatePath: '/contact',
        helperText: '문의 페이지를 수정합니다.',
      },
        {
          id: 'footer',
        title: resolvedEditorPageTitles.footer,
        icon: ChevronDown,
        contentKey: 'footer',
        groupIds: ['footer-copy'],
        helperText: '공통 푸터 정보를 수정합니다.',
        isCommon: true,
      },
        {
          id: 'menus',
        title: resolvedEditorPageTitles.menus,
        icon: MenuSquare,
        contentKey: 'menus',
        groupIds: ['header-menu', 'footer-links'],
        isCommon: true,
        },
      ];
      const customPages: EditorPageDefinition[] = draftSiteContent.customPages
        .filter((page) => !isImplementedPublicPath(page.path))
        .map((page) => ({
        id: getCustomEditorPageId(page.path),
        title: page.label,
        icon: FilePenLine,
        contentKey: 'home',
        groupIds: page.sections.map((section) => section.id),
        templatePath: page.path,
        helperText: '커스텀 페이지 문구와 이미지를 섹션별로 수정합니다.',
        isCustom: true,
        customPath: page.path,
      }));

      return [...builtInPages, ...customPages];
    },
    [draftSiteContent.customPages, resolvedEditorPageTitles],
  );

  const templateOverviewItems = useMemo<TemplateOverviewItem[]>(
    () => {
      const resourcesMenu = draftSiteContent.menus.headerItems.find((item) => normalizeEditorMenuPath(item.path) === '/resources');
      const noticesLabel =
        resourcesMenu?.children.find((item) => normalizeEditorMenuPath(item.path) === '/resources/notices')?.label || '소식';
      const filesLabel =
        resourcesMenu?.children.find((item) => normalizeEditorMenuPath(item.path) === '/resources/files')?.label || '자료';

      const builtInItems: TemplateOverviewItem[] = [
        {
          label: '메인 홈',
          path: '/',
          pageKey: 'home',
          templateId: draftSiteTemplates['/'] || defaultSitePageTemplates['/'],
          editorPage: 'home',
        },
        {
          label: resolvedPageLabels.services,
          path: '/services',
          pageKey: 'services',
          templateId: draftSiteTemplates['/services'] || defaultSitePageTemplates['/services'],
          editorPage: 'services',
        },
        {
          label: resolvedPageLabels.cases,
          path: '/cases',
          pageKey: 'cases',
          templateId: draftSiteTemplates['/cases'] || defaultSitePageTemplates['/cases'],
          editorPage: 'cases',
        },
        {
          label: `${resolvedPageLabels.cases} 상세`,
          path: '/cases/:slug',
          pageKey: 'portfolioDetail',
          templateId: draftSiteTemplates['/cases/:slug'] || defaultSitePageTemplates['/cases/:slug'],
          editorPage: 'portfolioDetail',
        },
        {
          label: `${resolvedPageLabels.resources} > ${noticesLabel}`,
          path: '/resources/notices',
          pageKey: 'resourcesNotices',
          templateId: draftSiteTemplates['/resources/notices'] || defaultSitePageTemplates['/resources/notices'],
          editorPage: 'resourcesNotices',
        },
        {
          label: `${resolvedPageLabels.resources} > ${noticesLabel} 상세`,
          path: '/resources/notices/:slug',
          pageKey: 'noticeDetail',
          templateId: draftSiteTemplates['/resources/notices/:slug'] || defaultSitePageTemplates['/resources/notices/:slug'],
          editorPage: 'noticeDetail',
        },
        {
          label: `${resolvedPageLabels.resources} > ${filesLabel}`,
          path: '/resources/files',
          pageKey: 'resourcesFiles',
          templateId: draftSiteTemplates['/resources/files'] || defaultSitePageTemplates['/resources/files'],
          editorPage: 'resourcesFiles',
        },
        {
          label: `${resolvedPageLabels.resources} > ${filesLabel} 상세`,
          path: '/resources/files/:slug',
          pageKey: 'resourceDetail',
          templateId: draftSiteTemplates['/resources/files/:slug'] || defaultSitePageTemplates['/resources/files/:slug'],
          editorPage: 'resourceDetail',
        },
        {
          label: resolvedPageLabels.about,
          path: '/about',
          pageKey: 'about',
          templateId: draftSiteTemplates['/about'] || defaultSitePageTemplates['/about'],
          editorPage: 'about',
        },
        {
          label: resolvedPageLabels.members,
          path: '/members',
          pageKey: 'members',
          templateId: draftSiteTemplates['/members'] || defaultSitePageTemplates['/members'],
          editorPage: 'members',
        },
        {
          label: resolvedPageLabels.contact,
          path: '/contact',
          pageKey: 'contact',
          templateId: draftSiteTemplates['/contact'] || defaultSitePageTemplates['/contact'],
          editorPage: 'contact',
        },
      ];
      const customItems: TemplateOverviewItem[] = draftSiteContent.customPages
        .filter((page) => !isImplementedPublicPath(page.path))
        .map((page) => ({
          label: page.label,
          path: page.path,
          templateId: page.templateId,
          editorPage: getCustomEditorPageId(page.path),
        }));

      return [...builtInItems, ...customItems];
    },
    [draftSiteContent.customPages, draftSiteContent.menus.headerItems, draftSiteTemplates, resolvedPageLabels],
  );

  const assignableTemplateTargets = useMemo<TemplatePendingTarget[]>(() => {
    const implementedPaths = new Set(templateOverviewItems.map((item) => item.path));
    const seenPaths = new Set<string>();
    const targets: TemplatePendingTarget[] = [];

    const pushTarget = (label: string, path: string, source: string) => {
      const normalizedPath = normalizeEditorMenuPath(path);

      if (!normalizedPath || normalizedPath === '/' || implementedPaths.has(normalizedPath) || seenPaths.has(normalizedPath)) {
        return;
      }

      seenPaths.add(normalizedPath);
      targets.push({
        label: String(label || '새 메뉴').trim() || '새 메뉴',
        path: normalizedPath,
        source,
      });
    };

    draftSiteContent.menus.headerItems.forEach((item) => {
      if (!item.children.length) {
        pushTarget(item.label, item.path, '헤더 메뉴');
      }

      item.children.forEach((child) => {
        pushTarget(child.label, child.path, `${item.label} 하위 메뉴`);
      });
    });

    draftSiteContent.menus.footerQuickLinks.forEach((item) => {
      pushTarget(item.label, item.path, '푸터 바로가기');
    });

    return targets;
  }, [draftSiteContent.menus.footerQuickLinks, draftSiteContent.menus.headerItems, templateOverviewItems]);

  const loadInquiries = async (currentAdminToken: string) => {
    setLoading(true);
    setError('');

    try {
      const data = await fetchInquiries(currentAdminToken);
      setItems(data);
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '문의 목록을 불러오지 못했습니다.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (adminToken) {
      try {
        await deleteAdminSession(adminToken);
      } catch {
        // Ignore logout API failures and clear local session regardless.
      }
    }

    clearAdminToken();
    setAdminToken('');
    setAdminUser(null);
    setItems([]);
    setError('');
    setContentError('');
    setContentMessage('');
    navigate('/admin/login', { replace: true });
  };

  const handleStatusChange = async (id: string, status: InquiryStatus, notes: string) => {
    if (!adminToken) {
      return;
    }

    setSavingId(id);

    try {
      const updated = await updateInquiryStatus(id, status, notes, adminToken);
      setItems((current) => current.map((item) => (item.id === id ? updated : item)));
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '상태 저장에 실패했습니다.';
      setError(message);
    } finally {
      setSavingId(null);
    }
  };

  const handleCopyFieldChange = (section: EditableSectionKey, field: string, value: string) => {
    setDraftSiteCopy((current) => ({
      ...current,
      [section]: {
        ...(current[section] as Record<string, string>),
        [field]: value,
      },
    }));
  };

  const buildNextSiteData = (
    nextContent = draftSiteContent,
    nextTemplates = draftSiteTemplates,
    nextTemplateLayouts = draftTemplateLayouts,
    nextEditor = draftSiteEditor,
    nextCopy = draftSiteCopy,
  ) => ({
    copy: nextCopy,
    content: nextContent,
    layouts: buildSitePageLayoutsFromTemplates(nextTemplates, nextTemplateLayouts),
    templates: nextTemplates,
    templateLayouts: nextTemplateLayouts,
    editor: nextEditor,
  });

  const handleSaveContent = async (scopeLabel = resolvedPageLabels[selectedEditorPage], scopeKey = `page:${selectedEditorPage}`) => {
    if (!adminToken) {
      return;
    }

    setIsSavingContent(true);
    setSavingScopeKey(scopeKey);
    setContentError('');
    setContentMessage('');

    try {
      const saved = await saveSiteData(buildNextSiteData(), adminToken);
      updateSiteData(saved);
      setDraftSiteCopy(saved.copy);
      setDraftSiteContent(saved.content);
      setDraftSiteTemplates(saved.templates);
      setDraftTemplateLayouts(saved.templateLayouts);
      setDraftSiteEditor(saved.editor);
      setContentMessage(`${scopeLabel} 저장이 완료되었습니다.`);
    } catch (saveError) {
      const message =
        saveError instanceof Error ? saveError.message : '사이트 데이터 저장에 실패했습니다.';
      setContentError(message);
    } finally {
      setIsSavingContent(false);
      setSavingScopeKey('');
    }
  };

  const handleTemplateSourceChange = async (
    targetPath: string,
    sourcePath: string,
    targetLabel: string,
    targetParentLabel = '',
  ) => {
    if (!adminToken) {
      return;
    }

    const normalizedTargetPath = normalizeEditorMenuPath(targetPath);
    const normalizedSourcePath = normalizeEditorMenuPath(sourcePath);
    const clonedPage = buildClonedCustomPageFromSource(
      {
        copy: draftSiteCopy,
        content: draftSiteContent,
        templates: draftSiteTemplates,
        templateLayouts: draftTemplateLayouts,
      },
      normalizedSourcePath,
      normalizedTargetPath,
      targetLabel,
      targetParentLabel,
    );

    if (!clonedPage) {
      return;
    }

    setIsSavingContent(true);
    setSavingScopeKey(`template-source:${normalizedTargetPath}`);
    setContentError('');
    setContentMessage('');

    const nextTemplates = {
      ...draftSiteTemplates,
      [normalizedTargetPath]: clonedPage.templateId,
    };
    const shouldRestoreBuiltInPage =
      isImplementedPublicPath(normalizedTargetPath) && normalizedSourcePath === normalizedTargetPath;
    const nextContent = {
      ...draftSiteContent,
      customPages: shouldRestoreBuiltInPage
        ? removeCustomPageByPath(draftSiteContent.customPages, normalizedTargetPath)
        : upsertCustomPage(draftSiteContent.customPages, clonedPage),
    };

    try {
      const saved = await saveSiteData(buildNextSiteData(nextContent, nextTemplates), adminToken);
      updateSiteData(saved);
      setDraftSiteCopy(saved.copy);
      setDraftSiteContent(saved.content);
      setDraftSiteTemplates(saved.templates);
      setDraftTemplateLayouts(saved.templateLayouts);
      setDraftSiteEditor(saved.editor);
      setContentMessage('원본 페이지 복제가 적용되고 저장되었습니다.');
      setPendingTemplateSourceSelections((current) => {
        const next = { ...current };
        delete next[normalizedTargetPath];
        return next;
      });
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '원본 페이지 복제 적용에 실패했습니다.';
      setContentError(message);
    } finally {
      setIsSavingContent(false);
      setSavingScopeKey('');
    }
  };

  const handleTemplateSectionMove = (templateId: TemplateCatalogId, index: number, direction: 'up' | 'down') => {
    setDraftTemplateLayouts((current) => {
      const sections = [...getTemplateLayoutSections(templateId, current).map((section) => ({
        id: section.id,
        visible: section.visible,
      }))];
      const nextIndex = direction === 'up' ? index - 1 : index + 1;

      if (nextIndex < 0 || nextIndex >= sections.length) {
        return current;
      }

      const [moved] = sections.splice(index, 1);
      sections.splice(nextIndex, 0, moved);

      return {
        ...current,
        [templateId]: {
          sections,
        },
      };
    });
  };

  const handleTemplateSectionVisibilityChange = (templateId: TemplateCatalogId, sectionId: string) => {
    setDraftTemplateLayouts((current) => ({
      ...current,
      [templateId]: {
        sections: getTemplateLayoutSections(templateId, current).map((section) => ({
          id: section.id,
          visible: section.id === sectionId ? !section.visible : section.visible,
        })),
      },
    }));
  };

  const handleCustomPageSettingChange = (pagePath: string, sectionId: string, key: string, value: string) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                settings: {
                  ...(section.settings || {}),
                  [key]: value,
                },
              }
            : section,
        ),
      })),
    }));
  };

  const handleSectionLabelChange = (page: EditorPageId, sectionId: string, value: string) => {
    setDraftSiteEditor((current) => ({
      ...current,
      sectionLabels: {
        ...current.sectionLabels,
        [page]: {
          ...current.sectionLabels[page],
          [sectionId]: value,
        },
      },
    }));
  };

  const handleCustomPageFieldChange = (
    pagePath: string,
    sectionId: string,
    field: keyof Omit<CustomPageSection, 'id' | 'items'>,
    value: string,
  ) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                [field]: value,
              }
            : section,
        ),
      })),
    }));
  };

  const handleCustomPageItemChange = (
    pagePath: string,
    sectionId: string,
    itemIndex: number,
    field: keyof CustomPageSection['items'][number],
    value: string,
  ) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.map((item, index) =>
                  index === itemIndex
                    ? {
                        ...item,
                        [field]: value,
                      }
                    : item,
                ),
              }
            : section,
        ),
      })),
    }));
  };

  const handleAddCustomPageItem = (pagePath: string, sectionId: string) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: [...section.items, createEmptyCustomSectionItem()],
              }
            : section,
        ),
      })),
    }));
  };

  const handleDeleteCustomPageItem = (pagePath: string, sectionId: string, itemIndex: number) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) =>
          section.id === sectionId
            ? {
                ...section,
                items: section.items.filter((_, index) => index !== itemIndex),
              }
            : section,
        ),
      })),
    }));
  };

  const handleMoveCustomPageItem = (
    pagePath: string,
    sectionId: string,
    itemIndex: number,
    direction: 'up' | 'down',
  ) => {
    setDraftSiteContent((current) => ({
      ...current,
      customPages: updateCustomPageCollection(current.customPages, pagePath, (page) => ({
        ...page,
        sections: page.sections.map((section) => {
          if (section.id !== sectionId) {
            return section;
          }

          const targetIndex = direction === 'up' ? itemIndex - 1 : itemIndex + 1;

          if (targetIndex < 0 || targetIndex >= section.items.length) {
            return section;
          }

          const nextItems = [...section.items];
          const [movedItem] = nextItems.splice(itemIndex, 1);
          nextItems.splice(targetIndex, 0, movedItem);

          return {
            ...section,
            items: nextItems,
          };
        }),
      })),
    }));
  };

  const handleCustomPageImageUpload = (
    pagePath: string,
    sectionId: string,
    file: File | null,
    itemIndex?: number,
  ) => {
    if (!adminToken || !file) {
      return;
    }

    const fieldKey = `custom:${pagePath}:${sectionId}:${itemIndex ?? 'section'}`;
    setUploadingFieldKey(fieldKey);
    setContentError('');
    setContentMessage('');

    void (async () => {
      try {
        const imageUrl = await uploadAdminImage(file, 'custom-pages', adminToken);
        const nextContent = {
          ...draftSiteContent,
          customPages: updateCustomPageCollection(draftSiteContent.customPages, pagePath, (page) => ({
            ...page,
            sections: page.sections.map((section) => {
              if (section.id !== sectionId) {
                return section;
              }

              if (itemIndex === undefined) {
                return {
                  ...section,
                  imageUrl,
                };
              }

              return {
                ...section,
                items: section.items.map((item, index) =>
                  index === itemIndex
                    ? {
                        ...item,
                        imageUrl,
                      }
                    : item,
                ),
              };
            }),
          })),
        };
        const saved = await saveSiteData(buildNextSiteData(nextContent), adminToken);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
        setDraftSiteTemplates(saved.templates);
        setDraftTemplateLayouts(saved.templateLayouts);
        setDraftSiteEditor(saved.editor);
        setContentMessage('이미지가 업로드되고 바로 저장되었습니다.');
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.';
        setContentError(message);
      } finally {
        setUploadingFieldKey('');
      }
    })();
  };

  const handleCustomPageImageDelete = (
    pagePath: string,
    sectionId: string,
    currentValue: string,
    itemIndex?: number,
  ) => {
    if (!adminToken) {
      return;
    }

    const fieldKey = `custom:${pagePath}:${sectionId}:${itemIndex ?? 'section'}`;
    setDeletingFieldKey(fieldKey);
    setContentError('');
    setContentMessage('');

    void (async () => {
      try {
        if (currentValue) {
          await deleteAdminImage(currentValue, adminToken);
        }

        const nextContent = {
          ...draftSiteContent,
          customPages: updateCustomPageCollection(draftSiteContent.customPages, pagePath, (page) => ({
            ...page,
            sections: page.sections.map((section) => {
              if (section.id !== sectionId) {
                return section;
              }

              if (itemIndex === undefined) {
                return {
                  ...section,
                  imageUrl: '',
                };
              }

              return {
                ...section,
                items: section.items.map((item, index) =>
                  index === itemIndex
                    ? {
                        ...item,
                        imageUrl: '',
                      }
                    : item,
                ),
              };
            }),
          })),
        };
        const saved = await saveSiteData(buildNextSiteData(nextContent), adminToken);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
        setDraftSiteTemplates(saved.templates);
        setDraftTemplateLayouts(saved.templateLayouts);
        setDraftSiteEditor(saved.editor);
        setContentMessage('이미지를 삭제하고 저장했습니다.');
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : '이미지 삭제에 실패했습니다.';
        setContentError(message);
      } finally {
        setDeletingFieldKey('');
      }
    })();
  };

  const handleSaveTemplateAssignments = async () => {
    if (!adminToken) {
      return;
    }

    setIsSavingContent(true);
    setSavingScopeKey('templates');
    setContentError('');
    setContentMessage('');

    try {
      const saved = await saveSiteData(buildNextSiteData(), adminToken);
      updateSiteData(saved);
      setDraftSiteCopy(saved.copy);
      setDraftSiteContent(saved.content);
      setDraftSiteTemplates(saved.templates);
      setDraftTemplateLayouts(saved.templateLayouts);
      setDraftSiteEditor(saved.editor);
      setContentMessage('템플릿 구조와 지정이 저장되었습니다.');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : '템플릿 저장에 실패했습니다.';
      setContentError(message);
    } finally {
      setIsSavingContent(false);
      setSavingScopeKey('');
    }
  };

  const handleContentTextFieldChange = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    value: string,
  ) => {
    setDraftSiteContent((current) => ({
      ...current,
      [page]: updateNestedValue(current[page], path, value),
    }));
  };

  const handleImageFieldChange = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    value: string,
  ) => {
    setDraftSiteContent((current) => ({
      ...current,
      [page]: updateNestedValue(current[page], path, value),
    }));
  };

  const handleImageUpload = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    file: File | null,
  ) => {
    if (!adminToken || !file) {
      return;
    }

    const fieldKey = `${page}:${path.join('.')}`;
    setUploadingFieldKey(fieldKey);
    setContentError('');
    setContentMessage('');

    void (async () => {
      try {
        const imageUrl = await uploadAdminImage(file, page, adminToken);
        const nextContent = {
          ...draftSiteContent,
          [page]: updateNestedValue(draftSiteContent[page], path, imageUrl),
        };
        const saved = await saveSiteData(buildNextSiteData(nextContent), adminToken);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
        setDraftSiteTemplates(saved.templates);
        setDraftTemplateLayouts(saved.templateLayouts);
        setDraftSiteEditor(saved.editor);
        setContentMessage('이미지가 업로드되고 바로 저장되었습니다.');
      } catch (uploadError) {
        const message = uploadError instanceof Error ? uploadError.message : '이미지 업로드에 실패했습니다.';
        setContentError(message);
      } finally {
        setUploadingFieldKey('');
      }
    })();
  };

  const handleImageDelete = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    currentValue: string,
  ) => {
    if (!adminToken) {
      return;
    }

    const fieldKey = `${page}:${path.join('.')}`;
    setDeletingFieldKey(fieldKey);
    setContentError('');
    setContentMessage('');

    void (async () => {
      try {
        await deleteAdminImage(currentValue, adminToken);

        const nextContent = {
          ...draftSiteContent,
          [page]: updateNestedValue(draftSiteContent[page], path, ''),
        };
        const saved = await saveSiteData(buildNextSiteData(nextContent), adminToken);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
        setDraftSiteTemplates(saved.templates);
        setDraftTemplateLayouts(saved.templateLayouts);
        setDraftSiteEditor(saved.editor);
        setContentMessage('이미지가 삭제되고 저장되었습니다.');
      } catch (deleteError) {
        const message = deleteError instanceof Error ? deleteError.message : '이미지 삭제에 실패했습니다.';
        setContentError(message);
      } finally {
        setDeletingFieldKey('');
      }
    })();
  };

  const handleAddArrayItem = (
    page: EditableSectionKey,
    arrayPath: ImagePathSegment[],
    createItem: () => unknown,
  ) => {
    setDraftSiteContent((current) => {
      const currentItems = getNestedValue(current[page], arrayPath);
      const nextItems = Array.isArray(currentItems) ? [...currentItems, createItem()] : [createItem()];

      return {
        ...current,
        [page]: updateNestedValue(current[page], arrayPath, nextItems),
      };
    });
  };

  const handleDeleteArrayItem = (
    page: EditableSectionKey,
    arrayPath: ImagePathSegment[],
    index: number,
  ) => {
    setDraftSiteContent((current) => {
      const currentItems = getNestedValue(current[page], arrayPath);

      if (!Array.isArray(currentItems)) {
        return current;
      }

      return {
        ...current,
        [page]: updateNestedValue(
          current[page],
          arrayPath,
          currentItems.filter((_, itemIndex) => itemIndex !== index),
        ),
      };
    });
  };

  const handleMoveArrayItem = (
    page: EditableSectionKey,
    arrayPath: ImagePathSegment[],
    index: number,
    direction: 'up' | 'down',
  ) => {
    setDraftSiteContent((current) => {
      const currentItems = getNestedValue(current[page], arrayPath);

      if (!Array.isArray(currentItems)) {
        return current;
      }

      const targetIndex = direction === 'up' ? index - 1 : index + 1;

      if (targetIndex < 0 || targetIndex >= currentItems.length) {
        return current;
      }

      const nextItems = [...currentItems];
      const [movedItem] = nextItems.splice(index, 1);
      nextItems.splice(targetIndex, 0, movedItem);

      return {
        ...current,
        [page]: updateNestedValue(current[page], arrayPath, nextItems),
      };
    });
  };

  const countByStatus = (status: InquiryStatus) => items.filter((item) => item.status === status).length;

  const [selectedHeaderMenuIndex, setSelectedHeaderMenuIndex] = useState(0);

  const renderMenuManager = () => {
    const headerItems = draftSiteContent.menus.headerItems;
    const footerLinks = draftSiteContent.menus.footerQuickLinks;
    const selectedHeaderMenu = headerItems[selectedHeaderMenuIndex];

    return (
      <div className="admin-menu-manager-container">
        <div className="admin-panel__header admin-panel__header--stack">
          <div>
            <p className="admin-panel__eyebrow">전체 메뉴 관리</p>
            <h2>전체 메뉴 관리</h2>
            <p className="admin-panel__description">웹사이트 전체 메뉴(사이트맵) 구조를 관리합니다.</p>
          </div>
          <button
            type="button"
            className="button button--primary"
            onClick={() => void handleSaveContent('메뉴 관리', 'page:menus')}
            disabled={isSavingContent}
          >
            <Save size={16} />
            {isSavingContent ? '저장 중...' : '전체 메뉴 저장'}
          </button>
        </div>

        <div className="admin-menu-manager">
          <div className="admin-menu-column">
            <div className="admin-menu-column__header">
              <span className="admin-menu-column__title">
                <Layers3 size={18} />
                1차 메뉴 (그룹)
              </span>
              <button
                type="button"
                className="button button--primary"
                style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }}
                onClick={() => handleAddArrayItem('menus', ['headerItems'], createEmptyHeaderMenuItem)}
              >
                <Plus size={14} />
                그룹 추가
              </button>
            </div>
            <div className="admin-menu-group-list">
              {headerItems.map((item, index) => (
                <div
                  key={index}
                  className={`admin-menu-group-item ${selectedHeaderMenuIndex === index ? 'is-active' : ''}`}
                  onClick={() => setSelectedHeaderMenuIndex(index)}
                >
                  <span className="admin-menu-group-item__index">{index}</span>
                  <input
                    type="text"
                    className="admin-menu-group-item__label"
                    value={item.label}
                    onClick={(e) => e.stopPropagation()}
                    onChange={(e) => handleContentTextFieldChange('menus', ['headerItems', index, 'label'], e.target.value)}
                  />
                  <div className="admin-menu-group-item__actions">
                    <button
                      type="button"
                      className="admin-menu-action-button"
                      onClick={(e) => { e.stopPropagation(); handleMoveArrayItem('menus', ['headerItems'], index, 'up'); }}
                      disabled={index === 0}
                    >
                      <ChevronUp size={14} />
                    </button>
                    <button
                      type="button"
                      className="admin-menu-action-button"
                      onClick={(e) => { e.stopPropagation(); handleMoveArrayItem('menus', ['headerItems'], index, 'down'); }}
                      disabled={index === headerItems.length - 1}
                    >
                      <ChevronDown size={14} />
                    </button>
                    <button
                      type="button"
                      className="admin-menu-action-button admin-menu-action-button--delete"
                      onClick={(e) => { e.stopPropagation(); handleDeleteArrayItem('menus', ['headerItems'], index); }}
                    >
                      <Trash2 size={14} />
                    </button>
                    <ChevronRight size={16} color="#94a3b8" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-menu-column">
            <div className="admin-menu-column__header">
              <span className="admin-menu-column__title">
                <ClipboardList size={18} />
                2차 메뉴 (하위 항목) <small>- {selectedHeaderMenu?.label || '미선택'}</small>
              </span>
              <button
                type="button"
                className="button button--primary"
                style={{ minHeight: '36px', padding: '0 12px', fontSize: '13px' }}
                onClick={() => {
                  if (selectedHeaderMenu) {
                    handleAddArrayItem('menus', ['headerItems', selectedHeaderMenuIndex, 'children'], createEmptyHeaderMenuChild);
                  }
                }}
                disabled={!selectedHeaderMenu}
              >
                <Plus size={14} />
                메뉴 추가
              </button>
            </div>
            {selectedHeaderMenu ? (
              <div className="admin-field-grid" style={{ marginBottom: '16px' }}>
                <div className="admin-field-grid--full">
                  <label className="form-field">
                    <span>1차 메뉴 기본 경로</span>
                    <input
                      type="text"
                      value={selectedHeaderMenu.path}
                      onChange={(event) =>
                        handleContentTextFieldChange('menus', ['headerItems', selectedHeaderMenuIndex, 'path'], event.target.value)
                      }
                      disabled={isLockedManagedPath(selectedHeaderMenu.path)}
                      title={isLockedManagedPath(selectedHeaderMenu.path) ? '현재 구현된 페이지와 연결된 경로라서 고정되어 있습니다.' : undefined}
                    />
                  </label>
                  <p className="admin-helper-text">
                    하위 메뉴가 있는 경우 상위 메뉴 클릭 시 첫 하위 메뉴로 이동합니다. 단독 메뉴나 새 페이지는 여기서 기본 경로를 정하면 됩니다.
                  </p>
                  {isLockedManagedPath(selectedHeaderMenu.path) ? (
                    <p className="admin-helper-text">현재 구현된 페이지와 연결돼 있어 기본 경로는 고정됩니다.</p>
                  ) : null}
                </div>
              </div>
            ) : null}
            <div className="admin-menu-table-wrap">
              <table className="admin-menu-table">
                <thead>
                  <tr>
                    <th style={{ width: '80px' }}>순서</th>
                    <th>메뉴명</th>
                    <th>이동 링크</th>
                    <th style={{ width: '120px' }}>관리</th>
                  </tr>
                </thead>
                <tbody>
                  {!selectedHeaderMenu || !selectedHeaderMenu.children || selectedHeaderMenu.children.length === 0 ? (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
                        하위 메뉴가 없습니다.
                      </td>
                    </tr>
                  ) : (
                    selectedHeaderMenu.children.map((child, childIndex) => (
                      <tr key={childIndex}>
                        <td className="admin-menu-group-item__index">{childIndex}</td>
                        <td>
                          <input
                            type="text"
                            value={child.label}
                            onChange={(e) => handleContentTextFieldChange('menus', ['headerItems', selectedHeaderMenuIndex, 'children', childIndex, 'label'], e.target.value)}
                          />
                        </td>
                        <td>
                          {(() => {
                            const isLockedPath = isLockedManagedPath(child.path);
                            return (
                              <>
                          <input
                            type="text"
                            value={child.path}
                            onChange={(e) => handleContentTextFieldChange('menus', ['headerItems', selectedHeaderMenuIndex, 'children', childIndex, 'path'], e.target.value)}
                            disabled={isLockedPath}
                            title={isLockedPath ? '현재 구현된 페이지와 연결된 경로라서 고정되어 있습니다.' : undefined}
                          />
                                {isLockedPath ? <small className="admin-helper-text">현재 구현된 페이지와 연결돼 있어 경로는 고정됩니다.</small> : null}
                              </>
                            );
                          })()}
                        </td>
                        <td>
                          <div className="admin-menu-item__actions" style={{ justifyContent: 'flex-start' }}>
                            <button
                              type="button"
                              className="admin-menu-action-button"
                              onClick={() => handleMoveArrayItem('menus', ['headerItems', selectedHeaderMenuIndex, 'children'], childIndex, 'up')}
                              disabled={childIndex === 0}
                            >
                              <ChevronUp size={14} />
                            </button>
                            <button
                              type="button"
                              className="admin-menu-action-button"
                              onClick={() => handleMoveArrayItem('menus', ['headerItems', selectedHeaderMenuIndex, 'children'], childIndex, 'down')}
                              disabled={childIndex === selectedHeaderMenu.children.length - 1}
                            >
                              <ChevronDown size={14} />
                            </button>
                            <button
                              type="button"
                              className="admin-menu-action-button admin-menu-action-button--delete"
                              onClick={() => handleDeleteArrayItem('menus', ['headerItems', selectedHeaderMenuIndex, 'children'], childIndex)}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="admin-section-group-card" style={{ marginTop: '24px' }}>
          <div className="admin-section-group-card__header">
            <div>
              <p className="admin-panel__eyebrow">푸터 메뉴 관리</p>
              <h3>푸터 바로가기 링크</h3>
            </div>
            <button
              type="button"
              className="button button--light"
              onClick={() => handleAddArrayItem('menus', ['footerQuickLinks'], createEmptyFooterQuickLink)}
            >
              <Plus size={16} />
              링크 추가
            </button>
          </div>
          <div className="admin-menu-table-wrap">
            <table className="admin-menu-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>순서</th>
                  <th>링크명</th>
                  <th>이동 경로</th>
                  <th style={{ width: '120px' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {footerLinks.map((link, index) => (
                  <tr key={index}>
                    <td className="admin-menu-group-item__index">{index}</td>
                    <td>
                      <input
                        type="text"
                        value={link.label}
                        onChange={(e) => handleContentTextFieldChange('menus', ['footerQuickLinks', index, 'label'], e.target.value)}
                      />
                    </td>
                    <td>
                      {(() => {
                        const isLockedPath = isLockedManagedPath(link.path);
                        return (
                          <>
                      <input
                        type="text"
                        value={link.path}
                        onChange={(e) => handleContentTextFieldChange('menus', ['footerQuickLinks', index, 'path'], e.target.value)}
                        disabled={isLockedPath}
                        title={isLockedPath ? '현재 구현된 페이지와 연결된 경로라서 고정되어 있습니다.' : undefined}
                      />
                            {isLockedPath ? <small className="admin-helper-text">현재 구현된 페이지와 연결돼 있어 경로는 고정됩니다.</small> : null}
                          </>
                        );
                      })()}
                    </td>
                    <td>
                      <div className="admin-menu-item__actions" style={{ justifyContent: 'flex-start' }}>
                        <button
                          type="button"
                          className="admin-menu-action-button"
                          onClick={() => handleMoveArrayItem('menus', ['footerQuickLinks'], index, 'up')}
                          disabled={index === 0}
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-menu-action-button"
                          onClick={() => handleMoveArrayItem('menus', ['footerQuickLinks'], index, 'down')}
                          disabled={index === footerLinks.length - 1}
                        >
                          <ChevronDown size={14} />
                        </button>
                        <button
                          type="button"
                          className="admin-menu-action-button admin-menu-action-button--delete"
                          onClick={() => handleDeleteArrayItem('menus', ['footerQuickLinks'], index)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderTemplateManager = () => {
    return (
      <div className="admin-template-manager">
        <div className="admin-panel__header admin-panel__header--stack">
          <div>
            <p className="admin-panel__eyebrow">템플릿 라이브러리</p>
            <h2>템플릿 관리</h2>
            <p className="admin-panel__description">템플릿은 구조를 관리하고, 페이지 편집은 문구와 이미지를 관리합니다. 여기서 구조를 바꾸면 같은 템플릿을 쓰는 페이지에 같이 반영됩니다.</p>
          </div>
        </div>

        {contentMessage ? <p className="form-feedback form-feedback--success">{contentMessage}</p> : null}
        {contentError ? <p className="form-feedback form-feedback--error">{contentError}</p> : null}

        <section className="admin-panel">
          <div className="admin-guide-list">
            <div>
              <strong>현재 페이지 원본 템플릿</strong>
              <p>운영 중인 페이지도 다른 페이지를 원본으로 복제해서 구조와 내용을 함께 가져올 수 있습니다.</p>
            </div>
            <div>
              <strong>미구현 메뉴 템플릿 지정</strong>
              <p>메뉴는 만들었지만 아직 페이지가 없는 경우에도, 기존 페이지를 원본으로 복제해 바로 편집 가능한 페이지로 확장할 수 있습니다.</p>
            </div>
            <div>
              <strong>실제 화면 수정 위치</strong>
              <p>원본 페이지는 여기서 바꾸고, 복제된 뒤의 문구와 이미지는 홈페이지 관리에서 섹션별로 수정합니다.</p>
            </div>
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header admin-panel__header--stack">
            <div>
              <p className="admin-panel__eyebrow">페이지별 현황</p>
              <h2>현재 페이지에 적용된 원본 페이지</h2>
              <p className="admin-panel__description">운영 중인 페이지가 어느 페이지를 원본으로 복제했는지 확인하고, 다른 페이지 원본으로 바꿀 수 있습니다.</p>
            </div>
          </div>

          <div className="admin-template-assignment-list">
            {templateOverviewItems.map((item) => {
              const currentSourcePath = findCustomPageByPath(draftSiteContent.customPages, item.path)?.sourcePath || item.path;
              const selectedSourcePath = pendingTemplateSourceSelections[item.path] || currentSourcePath;
              const hasPendingSourceChange =
                normalizeEditorMenuPath(selectedSourcePath) !== normalizeEditorMenuPath(currentSourcePath);
              const isApplyingSource =
                isSavingContent && savingScopeKey === `template-source:${normalizeEditorMenuPath(item.path)}`;
              const sourceMap = new Map<string, TemplateOverviewItem>(
                templateOverviewItems.filter((option) => !option.path.includes(':')).map((option) => [option.path, option]),
              );
              const sourceOptions: TemplateOverviewItem[] = [...sourceMap.values()];

              if (!sourceMap.has(currentSourcePath)) {
                sourceOptions.push({
                  path: currentSourcePath,
                  label: item.label,
                  templateId: item.templateId,
                  pageKey: item.pageKey,
                  editorPage: item.editorPage,
                });
              }

              return (
                <motion.article key={item.path} {...fadeUp} className="admin-template-assignment-card">
                  <div className="admin-template-assignment-card__copy">
                    <strong>{item.label}</strong>
                    <p>{item.path}</p>
                    <span>구조 템플릿: {(draftSiteTemplates[item.path] || item.templateId) && templateCatalogMap[(draftSiteTemplates[item.path] || item.templateId) as TemplateCatalogId]?.title}</span>
                  </div>
                  <div className="admin-template-assignment-card__controls admin-template-assignment-card__controls--select">
                    <label className="form-field">
                      <span>복사할 페이지 선택</span>
                      <select
                        value={selectedSourcePath}
                        onChange={(event) =>
                          setPendingTemplateSourceSelections((current) => ({
                            ...current,
                            [item.path]: event.target.value,
                          }))
                        }
                      >
                        {sourceOptions.map((option) => (
                          <option key={option.path} value={option.path}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      type="button"
                      className="button button--primary"
                      onClick={() => void handleTemplateSourceChange(item.path, selectedSourcePath, item.label)}
                      disabled={!hasPendingSourceChange || isApplyingSource}
                    >
                      {isApplyingSource ? '적용 중...' : '이 템플릿 적용'}
                    </button>
                    {item.editorPage ? (
                      <button
                        type="button"
                        className="button button--light"
                        onClick={() => {
                          setActiveNavKey('content');
                          setSelectedEditorPage(item.editorPage);
                          setActiveView('content');
                        }}
                      >
                        페이지 관리 열기
                      </button>
                    ) : null}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header admin-panel__header--stack">
            <div>
              <p className="admin-panel__eyebrow">공용 구조</p>
              <h2>템플릿 구조 편집</h2>
              <p className="admin-panel__description">섹션 순서와 노출만 관리합니다. 원본 페이지 복제는 위 카드의 적용 버튼을 누르면 즉시 저장됩니다.</p>
            </div>
            <button
              type="button"
              className="button button--light"
              onClick={() => void handleSaveTemplateAssignments()}
              disabled={isSavingContent && savingScopeKey === 'templates'}
            >
              {isSavingContent && savingScopeKey === 'templates' ? '구조 저장 중...' : '템플릿 구조 저장'}
            </button>
          </div>

          <div style={{ display: 'grid', gap: '16px' }}>
            {templateCatalog.map((template) => {
              const sections = getTemplateLayoutSections(template.id, draftTemplateLayouts);
              const affectedPages = templateOverviewItems.filter(
                (item) => (draftSiteTemplates[item.path] || item.templateId) === template.id,
              );

              return (
                <motion.article key={template.id} {...fadeUp} className="admin-template-assignment-card">
                  <div className="admin-template-assignment-card__copy">
                    <strong>{template.title}</strong>
                    <p>{template.description}</p>
                    <span>
                      적용 페이지: {affectedPages.length > 0 ? affectedPages.map((item) => item.label).join(' / ') : '현재 연결된 페이지 없음'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {sections.map((section, index) => (
                      <div
                        key={`${template.id}:${section.id}`}
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) auto',
                          gap: '12px',
                          alignItems: 'center',
                          padding: '14px 16px',
                          border: '1px solid rgba(148, 163, 184, 0.22)',
                          borderRadius: '18px',
                          background: '#fff',
                        }}
                      >
                        <div>
                          <strong style={{ display: 'block', color: 'var(--text-strong)' }}>
                            Section {index + 1}
                          </strong>
                          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>
                            {section.label}
                          </p>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'flex-end' }}>
                          <button
                            type="button"
                            className="button button--light admin-array-action-button"
                            onClick={() => handleTemplateSectionMove(template.id, index, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp size={16} />
                            위로
                          </button>
                          <button
                            type="button"
                            className="button button--light admin-array-action-button"
                            onClick={() => handleTemplateSectionMove(template.id, index, 'down')}
                            disabled={index === sections.length - 1}
                          >
                            <ChevronDown size={16} />
                            아래로
                          </button>
                          <button
                            type="button"
                            className="button button--light admin-array-action-button"
                            onClick={() => handleTemplateSectionVisibilityChange(template.id, section.id)}
                          >
                            {section.visible ? '노출 중' : '숨김'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.article>
              );
            })}
          </div>
        </section>

        <section className="admin-panel">
          <div className="admin-panel__header admin-panel__header--stack">
            <div>
              <p className="admin-panel__eyebrow">미구현 메뉴</p>
              <h2>페이지가 없는 메뉴 원본 페이지 지정</h2>
              <p className="admin-panel__description">아직 화면이 없는 메뉴도 기존 페이지를 원본으로 복제해 바로 편집 가능한 페이지로 만들 수 있습니다.</p>
            </div>
          </div>

          {assignableTemplateTargets.length === 0 ? (
            <p className="admin-empty">현재 메뉴 중 별도 템플릿 지정이 필요한 미구현 페이지는 없습니다.</p>
          ) : (
            <div className="admin-template-assignment-list">
              {assignableTemplateTargets.map((item) => {
                const sourceOptions = templateOverviewItems.filter((option) => !option.path.includes(':'));
                const currentSourcePath = findCustomPageByPath(draftSiteContent.customPages, item.path)?.sourcePath || sourceOptions[0]?.path || '/';
                const selectedSourcePath = pendingTemplateSourceSelections[item.path] || currentSourcePath;
                const hasPendingSourceChange =
                  normalizeEditorMenuPath(selectedSourcePath) !== normalizeEditorMenuPath(currentSourcePath);
                const isApplyingSource =
                  isSavingContent && savingScopeKey === `template-source:${normalizeEditorMenuPath(item.path)}`;

                return (
                  <motion.article key={item.path} {...fadeUp} className="admin-template-assignment-card">
                    <div className="admin-template-assignment-card__copy">
                      <strong>{item.label}</strong>
                      <p>{item.path}</p>
                      <span>{item.source}</span>
                    </div>
                    <div className="admin-template-assignment-card__controls admin-template-assignment-card__controls--select">
                      <label className="form-field">
                        <span>복사할 페이지 선택</span>
                        <select
                          value={selectedSourcePath}
                          onChange={(event) =>
                            setPendingTemplateSourceSelections((current) => ({
                              ...current,
                              [item.path]: event.target.value,
                            }))
                          }
                        >
                          {sourceOptions.map((option) => (
                            <option key={option.path} value={option.path}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => void handleTemplateSourceChange(item.path, selectedSourcePath, item.label, item.parentLabel)}
                        disabled={!hasPendingSourceChange || isApplyingSource}
                      >
                        {isApplyingSource ? '적용 중...' : '이 템플릿 적용'}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    );
  };

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const matchesStatus = statusFilter === 'all' ? true : item.status === statusFilter;
        const keyword = search.trim().toLowerCase();

        if (!keyword) {
          return matchesStatus;
        }

        const matchesSearch = [
          item.organizationName,
          item.contactName,
          item.email,
          item.eventDate,
          item.message,
          item.notes,
        ]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

        return matchesStatus && matchesSearch;
      }),
    [items, search, statusFilter],
  );

  const selectedEditorPageMeta = editorPages.find((page) => page.id === selectedEditorPage) || editorPages[0];
  const selectedContentKey = selectedEditorPageMeta.contentKey;
  const selectedCopyDefinition =
    resolvedEditableSections.find((section) => section.key === selectedContentKey) || resolvedEditableSections[0];
  const selectedCustomPage = selectedEditorPageMeta.templatePath
    ? findCustomPageByPath(draftSiteContent.customPages, selectedEditorPageMeta.templatePath) || null
    : null;
  const selectedTemplateId =
    selectedEditorPageMeta.templatePath
      ? draftSiteTemplates[selectedEditorPageMeta.templatePath] ||
        defaultSitePageTemplates[selectedEditorPageMeta.templatePath] ||
        (selectedCustomPage ? selectedCustomPage.templateId : undefined)
      : undefined;
  const selectedTemplate = selectedTemplateId ? templateCatalogMap[selectedTemplateId] : null;
  const selectedSectionLabels = draftSiteEditor.sectionLabels[selectedEditorPage] || {};
  const selectedContentGroupIds = useMemo(
    () =>
      selectedCustomPage
        ? resolveTemplateLayout(selectedCustomPage.templateId, draftTemplateLayouts).sections
            .filter(
              (section) => section.visible && selectedCustomPage.sections.some((customSection) => customSection.id === section.id),
            )
            .map((section) => section.id)
        : resolveEditorPageGroupOrder(selectedEditorPageMeta, draftSiteTemplates, draftTemplateLayouts),
    [draftSiteTemplates, draftTemplateLayouts, selectedCustomPage, selectedEditorPageMeta],
  );
  const selectedImageFields = useMemo(
    () => {
      if (selectedEditorPageMeta.isCustom) {
        return [];
      }

      const currentPageFields = collectImageFields(selectedContentKey, draftSiteContent[selectedContentKey]);

      if (selectedContentKey !== 'home') {
        return currentPageFields;
      }

      const servicePreviewFields = draftSiteContent.services.modules
        .slice(0, 4)
        .map((item, index) => ({
          page: 'services' as EditableSectionKey,
          path: ['modules', index, 'imageUrl'] as ImagePathSegment[],
          label: `서비스 프리뷰 이미지 / ${getArrayItemLabel(item, index)} / 이미지`,
          value: item.imageUrl,
        }));

      const portfolioPreviewFields = draftSiteContent.cases.entries
        .slice(0, 3)
        .map((item, index) => ({
          page: 'cases' as EditableSectionKey,
          path: ['entries', index, 'coverImageUrl'] as ImagePathSegment[],
          label: `포트폴리오 프리뷰 이미지 / ${getArrayItemLabel(item, index)} / 커버 이미지`,
          value: item.coverImageUrl,
        }));

      const resourcePreviewFields = draftSiteContent.resources.items
        .slice(0, 3)
        .map((item, index) => ({
          page: 'resources' as EditableSectionKey,
          path: ['items', index, 'coverImageUrl'] as ImagePathSegment[],
          label: `자료 프리뷰 이미지 / ${getArrayItemLabel(item, index)} / 커버 이미지`,
          value: item.coverImageUrl,
        }));

      return [...currentPageFields, ...servicePreviewFields, ...portfolioPreviewFields, ...resourcePreviewFields];
    },
    [draftSiteContent, selectedContentKey],
  );
  const selectedTextFields = useMemo(() => {
    if (selectedEditorPageMeta.isCustom) {
      return [];
    }

    const currentPageFields = collectTextFields(selectedContentKey, draftSiteContent[selectedContentKey]);

    if (selectedContentKey !== 'home') {
      return currentPageFields;
    }

    const resourcePreviewTextFields: TextFieldDescriptor[] = draftSiteContent.resources.items
      .slice(0, 3)
      .flatMap((item, index) => [
        {
          page: 'resources',
          path: ['items', index, 'title'],
          label: `자료 프리뷰 이미지 / ${getArrayItemLabel(item, index)} / 제목`,
          value: item.title,
        },
        {
          page: 'resources',
          path: ['items', index, 'description'],
          label: `자료 프리뷰 이미지 / ${getArrayItemLabel(item, index)} / 설명`,
          value: item.description,
        },
      ]);

    return [...currentPageFields, ...resourcePreviewTextFields];
  }, [draftSiteContent, selectedContentKey]);
  const selectedContentGroups = useMemo(() => {
    if (selectedEditorPageMeta.isCustom || selectedCustomPage) {
      return [];
    }

    const groupMap = new Map(contentSectionGroups[selectedContentKey].map((group) => [group.id, group]));
    return selectedContentGroupIds
      .map((groupId) => groupMap.get(groupId))
      .filter(Boolean) as ContentSectionGroup[];
  }, [selectedContentGroupIds, selectedContentKey, selectedCustomPage, selectedEditorPageMeta.isCustom]);
  const pendingCount = countByStatus('new') + countByStatus('in_progress');
  const recentItems = items.slice(0, 3);
  const adminInitial = adminUser?.name.trim().charAt(0) || 'M';

  useEffect(() => {
    if (selectedCustomPage) {
      if (selectedContentGroupIds.length === 0) {
        setSelectedCmsSectionId('');
        return;
      }

      if (!selectedContentGroupIds.includes(selectedCmsSectionId)) {
        setSelectedCmsSectionId(selectedContentGroupIds[0]);
      }
      return;
    }

    if (selectedContentGroups.length === 0) {
      setSelectedCmsSectionId('');
      return;
    }

    if (!selectedContentGroups.some((group) => group.id === selectedCmsSectionId)) {
      setSelectedCmsSectionId(selectedContentGroups[0].id);
    }
  }, [selectedCmsSectionId, selectedContentGroupIds, selectedContentGroups, selectedCustomPage]);

  const renderCustomPageEditor = () => {
    if (!selectedCustomPage || !selectedTemplate) {
      return null;
    }

    const visibleSections = resolveTemplateLayout(selectedCustomPage.templateId, draftTemplateLayouts).sections.filter(
      (section) => section.visible && selectedCustomPage.sections.some((customSection) => customSection.id === section.id),
    );
    const currentSection =
      selectedCustomPage.sections.find((section) => section.id === selectedCmsSectionId) ||
      selectedCustomPage.sections.find((section) => section.id === visibleSections[0]?.id) ||
      null;

    if (!currentSection) {
      return null;
    }

    const visibleSectionIndex = visibleSections.findIndex((section) => section.id === currentSection.id);
    const currentSectionLabel =
      selectedSectionLabels[currentSection.id]?.trim() || `Section ${Math.max(visibleSectionIndex, 0) + 1}`;
    const customSaveKey = `custom:${selectedCustomPage.path}:${currentSection.id}`;
    const isSavingCustomPage = isSavingContent && savingScopeKey === customSaveKey;

    return (
      <>
        <motion.article {...fadeUp} className="admin-cms-section-card" style={{ marginBottom: '24px' }}>
          <div className="admin-cms-section-card__header">
            <div>
              <h3>{selectedEditorPageMeta.title}</h3>
              <p>{selectedEditorPageMeta.helperText || '선택한 페이지를 섹션별 탭으로 수정합니다.'}</p>
            </div>
          </div>
          <div className="admin-guide-list" style={{ marginTop: '16px' }}>
            <div>
              <strong>적용 구조 템플릿</strong>
              <p>{selectedTemplate?.title || '직접 관리 페이지'}</p>
              <p className="admin-helper-text" style={{ marginTop: '8px' }}>
                원본 페이지 변경은 템플릿 관리에서 합니다. 현재 화면에서는 복제된 뒤의 문구와 이미지만 수정합니다.
              </p>
            </div>
            <div>
              <strong>페이지 경로</strong>
              <p>{selectedCustomPage.path}</p>
            </div>
          </div>
        </motion.article>

        <div className="admin-cms-tabs">
          {visibleSections.map((section, index) => (
            <button
              key={section.id}
              type="button"
              className={selectedCmsSectionId === section.id ? 'admin-cms-tab is-active' : 'admin-cms-tab'}
              onClick={() => setSelectedCmsSectionId(section.id)}
            >
              {selectedSectionLabels[section.id]?.trim() || `Section ${index + 1}`}
            </button>
          ))}
        </div>

        {contentMessage ? <p className="form-feedback form-feedback--success">{contentMessage}</p> : null}
        {contentError ? <p className="form-feedback form-feedback--error">{contentError}</p> : null}

        <motion.article {...fadeUp} className="admin-cms-section-card">
          <div className="admin-cms-section-card__header">
            <div>
              <h3>{currentSectionLabel}</h3>
              <p>선택한 템플릿 섹션의 문구, 버튼, 이미지, 반복 항목을 수정합니다.</p>
            </div>
          </div>

          <div className="admin-field-grid" style={{ marginBottom: '24px' }}>
            <div className="admin-field-grid--full">
              <label className="form-field admin-section-name-field">
                <span>섹션명</span>
                <input
                  type="text"
                  value={selectedSectionLabels[currentSection.id] || ''}
                  placeholder={`Section ${Math.max(visibleSectionIndex, 0) + 1}`}
                  onChange={(event) => handleSectionLabelChange(selectedEditorPage, currentSection.id, event.target.value)}
                />
              </label>
              <p className="admin-helper-text">
                비워두면 기본값으로 Section {Math.max(visibleSectionIndex, 0) + 1} 이 표시됩니다.
              </p>
            </div>
          </div>

          <div className="admin-field-grid">
            <div className="admin-field-grid--full" style={{ marginBottom: '24px' }}>
              <strong className="admin-section-group-card__label">기본 텍스트(카피) 편집</strong>
              <div className="admin-field-grid" style={{ marginTop: '12px' }}>
                {[
                  ['eyebrow', '상단 라벨'],
                  ['title', '제목'],
                  ['description', '설명'],
                  ['primaryButtonLabel', '기본 버튼 문구'],
                  ['primaryButtonHref', '기본 버튼 링크'],
                  ['secondaryButtonLabel', '보조 버튼 문구'],
                  ['secondaryButtonHref', '보조 버튼 링크'],
                ].map(([field, label]) => (
                  <label key={field} className="form-field">
                    <span>{label}</span>
                    {field === 'description' ? (
                      <textarea
                        rows={4}
                        value={currentSection[field as keyof CustomPageSection] as string}
                        onChange={(event) =>
                          handleCustomPageFieldChange(
                            selectedCustomPage.path,
                            currentSection.id,
                            field as keyof Omit<CustomPageSection, 'id' | 'items'>,
                            event.target.value,
                          )
                        }
                      />
                    ) : (
                      <input
                        type={field.toLowerCase().includes('href') ? 'text' : 'text'}
                        value={currentSection[field as keyof CustomPageSection] as string}
                        onChange={(event) =>
                          handleCustomPageFieldChange(
                            selectedCustomPage.path,
                            currentSection.id,
                            field as keyof Omit<CustomPageSection, 'id' | 'items'>,
                            event.target.value,
                          )
                        }
                      />
                    )}
                  </label>
                ))}
              </div>
            </div>

            {Object.keys(currentSection.settings || {}).length > 0 ? (
              <div className="admin-field-grid--full" style={{ marginBottom: '24px' }}>
                <strong className="admin-section-group-card__label">세부 UI 텍스트 편집</strong>
                <div className="admin-field-grid" style={{ marginTop: '12px' }}>
                  {Object.entries(currentSection.settings)
                    .filter(([key]) => key !== 'variant')
                    .map(([key, value]) => (
                      <label key={key} className="form-field">
                        <span>{formatCustomSettingLabel(key)}</span>
                        {key.toLowerCase().includes('messagebody') || key.toLowerCase().includes('description') ? (
                          <textarea
                            rows={4}
                            value={value}
                            onChange={(event) =>
                              handleCustomPageSettingChange(selectedCustomPage.path, currentSection.id, key, event.target.value)
                            }
                          />
                        ) : (
                          <input
                            type="text"
                            value={value}
                            onChange={(event) =>
                              handleCustomPageSettingChange(selectedCustomPage.path, currentSection.id, key, event.target.value)
                            }
                          />
                        )}
                      </label>
                    ))}
                </div>
              </div>
            ) : null}

            <div className="admin-field-grid--full" style={{ marginBottom: '24px' }}>
              <strong className="admin-section-group-card__label">대표 이미지 관리</strong>
              <div className="admin-image-grid" style={{ marginTop: '16px' }}>
                <article className="admin-image-card">
                  <div className="admin-image-card__preview">
                    {currentSection.imageUrl ? <img src={currentSection.imageUrl} alt={currentSection.title} /> : <span>이미지 없음</span>}
                  </div>
                  <div className="admin-image-card__body">
                    <strong>{currentSectionLabel} 이미지</strong>
                    <label className="form-field">
                      <span>이미지 URL</span>
                      <input
                        type="url"
                        value={currentSection.imageUrl}
                        onChange={(event) =>
                          handleCustomPageFieldChange(selectedCustomPage.path, currentSection.id, 'imageUrl', event.target.value)
                        }
                        placeholder="https://..."
                      />
                    </label>
                    <label className="form-field">
                      <span>새 이미지 업로드</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(event) => {
                          handleCustomPageImageUpload(
                            selectedCustomPage.path,
                            currentSection.id,
                            event.target.files?.[0] || null,
                          );
                          event.currentTarget.value = '';
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      className="button admin-image-card__delete"
                      onClick={() =>
                        handleCustomPageImageDelete(selectedCustomPage.path, currentSection.id, currentSection.imageUrl)
                      }
                      disabled={!currentSection.imageUrl}
                    >
                      이미지 삭제
                    </button>
                    <p className="admin-helper-text">권장 형식: JPG, PNG, WEBP / 권장 비율 16:9</p>
                  </div>
                </article>
              </div>
            </div>

            <div className="admin-section-group-card__block" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
              <div className="admin-section-group-card__block-header">
                <strong className="admin-section-group-card__label">반복 항목 편집</strong>
                <button
                  type="button"
                  className="button button--light admin-array-action-button"
                  onClick={() => handleAddCustomPageItem(selectedCustomPage.path, currentSection.id)}
                >
                  <Plus size={16} />
                  항목 추가
                </button>
              </div>
              <div className="admin-nested-group-list">
                {currentSection.items.map((item, itemIndex) => {
                  const fieldKey = `custom:${selectedCustomPage.path}:${currentSection.id}:${itemIndex}`;
                  const isUploading = uploadingFieldKey === fieldKey;
                  const isDeleting = deletingFieldKey === fieldKey;

                  return (
                    <details key={`${currentSection.id}:${itemIndex}`} className="admin-nested-group" open>
                      <summary className="admin-nested-group__summary">{item.title || `항목 ${itemIndex + 1}`}</summary>
                      <div className="admin-nested-group__body">
                        <div className="admin-array-item-actions">
                          <div className="admin-array-item-actions__primary">
                            <button
                              type="button"
                              className="button button--light admin-array-action-button"
                              onClick={() => handleMoveCustomPageItem(selectedCustomPage.path, currentSection.id, itemIndex, 'up')}
                              disabled={itemIndex === 0}
                            >
                              <ChevronUp size={16} />
                              위로
                            </button>
                            <button
                              type="button"
                              className="button button--light admin-array-action-button"
                              onClick={() => handleMoveCustomPageItem(selectedCustomPage.path, currentSection.id, itemIndex, 'down')}
                              disabled={itemIndex >= currentSection.items.length - 1}
                            >
                              <ChevronDown size={16} />
                              아래로
                            </button>
                          </div>
                          <button
                            type="button"
                            className="button admin-array-delete-button"
                            onClick={() => handleDeleteCustomPageItem(selectedCustomPage.path, currentSection.id, itemIndex)}
                          >
                            <Trash2 size={16} />
                            삭제
                          </button>
                        </div>

                        <div className="admin-field-grid">
                          {([
                            ['title', '제목'],
                            ['description', '설명'],
                            ['details', '추가 텍스트'],
                            ['meta', '보조 정보'],
                            ['badge', '배지'],
                            ['href', '링크'],
                          ] as Array<[keyof CustomPageSection['items'][number], string]>).map(([field, label]) => (
                            <label key={field} className="form-field">
                              <span>{label}</span>
                              {field === 'description' || field === 'details' ? (
                                <textarea
                                  rows={4}
                                  value={item[field] as string}
                                  onChange={(event) =>
                                    handleCustomPageItemChange(
                                      selectedCustomPage.path,
                                      currentSection.id,
                                      itemIndex,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                />
                              ) : (
                                <input
                                  type="text"
                                  value={item[field] as string}
                                  onChange={(event) =>
                                    handleCustomPageItemChange(
                                      selectedCustomPage.path,
                                      currentSection.id,
                                      itemIndex,
                                      field,
                                      event.target.value,
                                    )
                                  }
                                />
                              )}
                            </label>
                          ))}
                        </div>

                        <div className="admin-image-grid" style={{ marginTop: '16px', gridTemplateColumns: '1fr' }}>
                          <article className="admin-image-card">
                            <div className="admin-image-card__preview">
                              {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span>이미지 없음</span>}
                            </div>
                            <div className="admin-image-card__body">
                              <strong>{item.title || `항목 ${itemIndex + 1}`} 이미지</strong>
                              <label className="form-field">
                                <span>이미지 URL</span>
                                <input
                                  type="url"
                                  value={item.imageUrl}
                                  onChange={(event) =>
                                    handleCustomPageItemChange(
                                      selectedCustomPage.path,
                                      currentSection.id,
                                      itemIndex,
                                      'imageUrl',
                                      event.target.value,
                                    )
                                  }
                                  placeholder="https://..."
                                  disabled={isUploading || isDeleting}
                                />
                              </label>
                              <label className="form-field">
                                <span>새 이미지 업로드</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(event) => {
                                    handleCustomPageImageUpload(
                                      selectedCustomPage.path,
                                      currentSection.id,
                                      event.target.files?.[0] || null,
                                      itemIndex,
                                    );
                                    event.currentTarget.value = '';
                                  }}
                                  disabled={isUploading || isDeleting}
                                />
                              </label>
                              <button
                                type="button"
                                className="button admin-image-card__delete"
                                onClick={() =>
                                  handleCustomPageImageDelete(
                                    selectedCustomPage.path,
                                    currentSection.id,
                                    item.imageUrl,
                                    itemIndex,
                                  )
                                }
                                disabled={isUploading || isDeleting || !item.imageUrl}
                              >
                                {isDeleting ? '삭제 중...' : '이미지 삭제'}
                              </button>
                              <p className="admin-helper-text">
                                {isUploading
                                  ? '업로드 중입니다...'
                                  : isDeleting
                                    ? '이미지를 삭제하는 중입니다...'
                                    : '권장 형식: JPG, PNG, WEBP / 권장 비율 4:3'}
                              </p>
                            </div>
                          </article>
                        </div>
                      </div>
                    </details>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="admin-section-group-card__footer" style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid #f1f5f9' }}>
            <button
              type="button"
              className="button button--primary"
              style={{ width: '100%', minHeight: '60px', fontSize: '16px' }}
              onClick={() => void handleSaveContent(`${selectedEditorPageMeta.title} > ${currentSectionLabel}`, customSaveKey)}
              disabled={isSavingContent}
            >
              <Save size={20} />
              {isSavingCustomPage ? `${currentSectionLabel} 저장 중...` : `${currentSectionLabel} 데이터만 저장하기`}
            </button>
            <p style={{ textAlign: 'center', marginTop: '12px', color: '#94a3b8', fontSize: '13px' }}>
              상기 버튼을 누르면 이 섹션의 변경사항이 즉시 서버에 저장됩니다.
            </p>
          </div>
        </motion.article>
      </>
    );
  };

  const renderNavItem = (item: {
    key: string;
    label: string;
    icon: LucideIcon;
    view: AdminView;
    page?: EditorPageId;
  }) => {
    const Icon = item.icon;
    const isActive =
      item.key === 'content'
        ? activeView === 'content' && selectedEditorPage !== 'menus'
        : item.key === 'menus'
          ? activeView === 'content' && selectedEditorPage === 'menus'
          : activeView === item.view;

    return (
      <button
        key={item.key}
        type="button"
        className={isActive ? 'admin-sidebar__item is-active' : 'admin-sidebar__item'}
        onClick={() => {
          setActiveView(item.view);
          if (item.page) {
            setSelectedEditorPage(item.page);
          }
          setActiveNavKey(item.key);
        }}
      >
        <Icon size={18} />
        <strong>{item.label}</strong>
      </button>
    );
  };

  const quickLinks = [
    {
      title: '홈페이지 관리',
      description: '메인 히어로, CTA, 브랜드 소개 문구를 수정합니다.',
      metric: `${editableSections[0].fields.length}개 필드`,
      icon: FilePenLine,
      action: () => {
        setActiveNavKey('content');
        setSelectedEditorPage('home');
        setActiveView('content');
      },
    },
    {
      title: '페이지 편집',
      description: '실제 공개 페이지 기준으로 문구와 이미지를 섹션별로 수정합니다.',
      metric: `${editorPages.filter((page) => !page.isCommon && page.id !== 'menus').length}개 페이지`,
      icon: Layers3,
      action: () => {
        setActiveNavKey('content');
        setSelectedEditorPage('services');
        setActiveView('content');
      },
    },
    {
      title: '메뉴 관리',
      description: '헤더 메뉴와 푸터 바로가기 링크를 별도 섹션에서 수정합니다.',
      metric: '헤더/푸터 메뉴',
      icon: MenuSquare,
      action: () => {
        setActiveNavKey('menus');
        setSelectedEditorPage('menus');
        setActiveView('content');
      },
    },
    {
      title: '템플릿 관리',
      description: '페이지별 템플릿 현황을 보고, 아직 없는 메뉴에 어떤 템플릿을 쓸지 지정합니다.',
      metric: `${templateCatalog.length}개 템플릿`,
      icon: Blocks,
      action: () => {
        setActiveNavKey('templates');
        setActiveView('templates');
      },
    },
    {
      title: '문의 처리',
      description: '신규 문의 확인, 상태 변경, 내부 메모 저장을 한 번에 처리합니다.',
      metric: `${pendingCount}건 진행 중`,
      icon: ClipboardList,
      action: () => {
        setActiveNavKey('requests');
        setActiveView('inquiries');
      },
    },
  ];

  return (
    <>
      <PageMeta title="마이스파트너 관리자" description="마이스파트너 홈페이지와 문의를 관리하는 관리자 대시보드입니다." />
      {!adminToken || !adminUser ? null : (
        <main className="admin-dashboard">
          <aside className="admin-sidebar">
            <div className="admin-sidebar__brand">
              <p className="admin-sidebar__eyebrow">MICEPARTNER</p>
              <strong>관리자 대시보드</strong>
              <span>사이트 운영 관리</span>
            </div>

            <nav className="admin-sidebar__nav" aria-label="관리 메뉴">
              <div className="admin-sidebar__section">
                {renderNavItem({
                  key: 'dashboard',
                  label: '대시보드',
                  icon: LayoutDashboard,
                  view: 'overview',
                })}
                {renderNavItem({
                  key: 'content',
                  label: '홈페이지 관리',
                  icon: FilePenLine,
                  view: 'content',
                  page: 'home',
                })}
                {renderNavItem({
                  key: 'menus',
                  label: '메뉴 관리',
                  icon: MenuSquare,
                  view: 'content',
                  page: 'menus',
                })}
                {renderNavItem({
                  key: 'templates',
                  label: '템플릿 관리',
                  icon: Blocks,
                  view: 'templates',
                })}
                {renderNavItem({
                  key: 'requests',
                  label: '문의 관리',
                  icon: ClipboardList,
                  view: 'inquiries',
                })}
              </div>
            </nav>

            <div className="admin-sidebar__footer">
              <button
                type="button"
                className="admin-sidebar__item admin-sidebar__item--logout"
                onClick={() => void handleLogout()}
              >
                <strong>로그아웃</strong>
              </button>
            </div>
          </aside>

          <div className="admin-main">
            <header className="admin-topbar">
              <div className="admin-topbar__title">
                <Link to="/" className="admin-topbar__back">
                  <ArrowLeft size={16} />
                  홈으로
                </Link>
                <div>
                  <strong>관리자 대시보드</strong>
                  <span>
                    {activeView === 'overview'
                      ? '운영 현황'
                      : activeView === 'templates'
                        ? '템플릿 관리'
                      : activeView === 'content'
                        ? `${selectedEditorPageMeta.title} 편집`
                        : '문의 관리'}
                  </span>
                </div>
              </div>

              <div className="admin-topbar__actions">
                <div className="admin-user-chip">
                  <span className="admin-user-chip__avatar">{adminInitial}</span>
                  <span className="admin-user-chip__meta">
                    <strong>{adminUser.name}</strong>
                    <small>{adminUser.email}</small>
                  </span>
                </div>
              </div>
            </header>

            <div className="admin-main__content">
              {activeView === 'overview' ? (
                <>
                  <motion.section {...fadeUp} className="admin-hero-card">
                    <div>
                      <p className="admin-hero-card__eyebrow">운영 현황</p>
                      <h1>안녕하세요, {adminUser.name}님.</h1>
                      <p>홈페이지 관리, 섹션 데이터 저장, 문의 운영을 대시보드 형식으로 정리했습니다.</p>
                    </div>
                    <div className="admin-hero-card__actions">
                        <button
                          type="button"
                          className="button button--primary"
                          onClick={() => {
                            setActiveNavKey('content');
                            setSelectedEditorPage('home');
                            setActiveView('content');
                          }}
                      >
                        홈페이지 관리
                      </button>
                      <button
                        type="button"
                        className="button button--light"
                        onClick={() => {
                          setActiveNavKey('requests');
                          setActiveView('inquiries');
                        }}
                      >
                        문의 확인
                      </button>
                    </div>
                  </motion.section>

                  <section className="admin-overview-stats">
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>편집 가능 페이지</span>
                      <strong>{editorPages.filter((page) => !page.isCommon && page.id !== 'menus').length}</strong>
                      <p>실제 공개 페이지 기준으로 편집 가능</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>전체 문의</span>
                      <strong>{items.length}</strong>
                      <p>실시간 저장된 문의 누적 수</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>처리 대기</span>
                      <strong>{pendingCount}</strong>
                      <p>신규 및 처리중 문의</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>현재 편집 대상</span>
                      <strong>{selectedEditorPageMeta.title}</strong>
                      <p>선택된 실제 페이지 기준으로 바로 편집 가능</p>
                    </motion.article>
                  </section>

                  <section className="admin-shortcut-grid">
                    {quickLinks.map((item) => {
                      const Icon = item.icon;

                      return (
                        <motion.article key={item.title} {...fadeUp} className="admin-shortcut-card">
                          <div className="admin-shortcut-card__icon">
                            <Icon size={20} />
                          </div>
                          <div className="admin-shortcut-card__body">
                            <div>
                              <h2>{item.title}</h2>
                              <p>{item.description}</p>
                            </div>
                            <span>{item.metric}</span>
                          </div>
                          <button type="button" className="button button--light" onClick={item.action}>
                            열기
                          </button>
                        </motion.article>
                      );
                    })}
                  </section>

                  <section className="admin-overview-grid">
                    <motion.article {...fadeUp} className="admin-panel">
                      <div className="admin-panel__header">
                        <div>
                          <p className="admin-panel__eyebrow">최근 문의</p>
                          <h2>최근 문의</h2>
                        </div>
                        <button type="button" className="admin-inline-button" onClick={() => { setActiveNavKey('requests'); setActiveView('inquiries'); }}>
                          전체 보기
                        </button>
                      </div>

                      {recentItems.length === 0 ? (
                        <p className="admin-empty">아직 접수된 문의가 없습니다.</p>
                      ) : (
                        <div className="admin-compact-list">
                          {recentItems.map((item) => (
                            <article key={item.id} className="admin-compact-card">
                              <div>
                                <strong>{item.organizationName}</strong>
                                <p>{item.contactName} · {item.email}</p>
                              </div>
                              <span className={`status-badge status-badge--${item.status}`}>{statusLabels[item.status]}</span>
                            </article>
                          ))}
                        </div>
                      )}
                    </motion.article>

                    <motion.article {...fadeUp} className="admin-panel">
                      <div className="admin-panel__header">
                        <div>
                          <p className="admin-panel__eyebrow">편집 가이드</p>
                          <h2>편집 가이드</h2>
                        </div>
                      </div>
                      <div className="admin-guide-list">
                        <div>
                          <strong>홈페이지 관리</strong>
                          <p>브랜드 문구, 히어로 이미지, CTA와 메인 섹션 구성을 수정합니다.</p>
                        </div>
                        <div>
                          <strong>섹션 단위 편집</strong>
                          <p>페이지 안의 각 섹션별로 카피와 이미지를 함께 관리할 수 있도록 정리했습니다.</p>
                        </div>
                        <div>
                          <strong>문의 운영</strong>
                          <p>고객 문의 상태를 바꾸고 메모를 남겨 내부 처리 흐름을 관리합니다.</p>
                        </div>
                      </div>
                    </motion.article>
                  </section>
                </>
              ) : null}

              {activeView === 'content' ? (
                <div className="admin-cms-container" style={selectedEditorPage === 'menus' ? { gridTemplateColumns: '1fr' } : undefined}>
                  {selectedEditorPage !== 'menus' && (
                    <aside className="admin-page-sidebar">
                      <div className="admin-page-sidebar__title">페이지 편집</div>
                      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {editorPages
                          .filter((page) => !page.isCommon && page.id !== 'menus')
                          .map((page) => {
                            const Icon = page.icon;
                            return (
                              <button
                                key={page.id}
                                type="button"
                                className={`admin-page-item ${selectedEditorPage === page.id ? 'is-active' : ''}`}
                                onClick={() => setSelectedEditorPage(page.id)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Icon size={16} />
                                  <span>{page.title}</span>
                                </div>
                              </button>
                            );
                          })}
                      </nav>
                      <div className="admin-page-sidebar__title" style={{ marginTop: '20px' }}>공통 영역</div>
                      <nav style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        {editorPages
                          .filter((page) => page.isCommon && page.id !== 'menus')
                          .map((page) => {
                            const Icon = page.icon;
                            return (
                              <button
                                key={page.id}
                                type="button"
                                className={`admin-page-item ${selectedEditorPage === page.id ? 'is-active' : ''}`}
                                onClick={() => setSelectedEditorPage(page.id)}
                              >
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                  <Icon size={16} />
                                  <span>{page.title}</span>
                                </div>
                              </button>
                            );
                          })}
                      </nav>
                    </aside>
                  )}

                  <div className="admin-cms-editor">
                    {selectedEditorPage === 'menus' ? (
                      renderMenuManager()
                    ) : selectedCustomPage ? (
                      renderCustomPageEditor()
                    ) : (
                      <>
                        <motion.article {...fadeUp} className="admin-cms-section-card" style={{ marginBottom: '24px' }}>
                          <div className="admin-cms-section-card__header">
                            <div>
                              <h3>{selectedEditorPageMeta.title}</h3>
                              <p>{selectedEditorPageMeta.helperText || '선택한 페이지를 섹션별 탭으로 수정합니다.'}</p>
                            </div>
                          </div>
                          <div className="admin-guide-list" style={{ marginTop: '16px' }}>
                            <div>
                              <strong>적용 구조 템플릿</strong>
                              <p>{selectedTemplate ? selectedTemplate.title : '직접 관리 페이지'}</p>
                              <p className="admin-helper-text" style={{ marginTop: '8px' }}>
                                원본 페이지 변경은 템플릿 관리에서 합니다. 현재 화면에서는 이 페이지 전용 문구와 이미지 편집만 다룹니다.
                              </p>
                            </div>
                            <div>
                              <strong>페이지 경로</strong>
                              <p>{selectedEditorPageMeta.templatePath || '공통 운영 영역'}</p>
                            </div>
                          </div>
                        </motion.article>

                        <div className="admin-cms-tabs">
                          {selectedContentGroups.map((group, index) => (
                            <button
                              key={group.id}
                              type="button"
                              className={selectedCmsSectionId === group.id ? 'admin-cms-tab is-active' : 'admin-cms-tab'}
                              onClick={() => setSelectedCmsSectionId(group.id)}
                            >
                              {selectedSectionLabels[group.id]?.trim() || `Section ${index + 1}`}
                            </button>
                          ))}
                        </div>

                        {contentMessage ? <p className="form-feedback form-feedback--success">{contentMessage}</p> : null}
                        {contentError ? <p className="form-feedback form-feedback--error">{contentError}</p> : null}

                        {selectedContentGroups.map((group, index) => {
                          if (group.id !== selectedCmsSectionId) {
                            return null;
                          }

                      const groupFields = selectedCopyDefinition.fields.filter(([field]) => group.copyFields.includes(field));
                      const groupTextFields = selectedTextFields.filter((field) =>
                        group.contentPrefixes.some((prefix) => pathStartsWith(field.path, prefix)),
                      );
                      const groupImages = selectedImageFields.filter((field) =>
                        group.imagePrefixes.some((prefix) => pathStartsWith(field.path, prefix)),
                      );
                      const { nestedGroups, standaloneTextFields, standaloneImageFields } =
                        buildNestedEditorGroups(groupTextFields, groupImages);
                      const groupSaveKey = `group:${selectedEditorPage}:${group.id}`;
                      const isSavingGroup = isSavingContent && savingScopeKey === groupSaveKey;
                      const groupArrayAction = getGroupArrayActionConfig(selectedContentKey, group.id);

                      return (
                        <motion.article key={group.id} {...fadeUp} className="admin-cms-section-card">
                          <div className="admin-cms-section-card__header">
                            <div>
                              <h3>{selectedSectionLabels[group.id]?.trim() || `Section ${index + 1}`}</h3>
                              <p>{group.description}</p>
                            </div>
                          </div>

                          <div className="admin-field-grid" style={{ marginBottom: '24px' }}>
                            <div className="admin-field-grid--full">
                              <label className="form-field admin-section-name-field">
                                <span>섹션명</span>
                                <input
                                  type="text"
                                  value={selectedSectionLabels[group.id] || ''}
                                  placeholder={`Section ${index + 1}`}
                                  onChange={(event) => handleSectionLabelChange(selectedEditorPage, group.id, event.target.value)}
                                />
                              </label>
                              <p className="admin-helper-text">비워두면 기본값으로 Section {index + 1} 이 표시됩니다.</p>
                            </div>
                          </div>

                          <div className="admin-field-grid">
                            {groupFields.length > 0 ? (
                              <div className="admin-field-grid--full" style={{ marginBottom: '24px' }}>
                                <strong className="admin-section-group-card__label">기본 텍스트(카피) 편집</strong>
                                <div className="admin-field-grid" style={{ marginTop: '12px' }}>
                                  {groupFields.map(([field, label]) => (
                                    <label key={field} className="form-field">
                                      <span>{label}</span>
                                      <textarea
                                        rows={field.toLowerCase().includes('description') ? 4 : 2}
                                        value={(draftSiteCopy[selectedContentKey] as Record<string, string>)[field] || ''}
                                        onChange={(event) => handleCopyFieldChange(selectedContentKey, field, event.target.value)}
                                      />
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {standaloneTextFields.length > 0 ? (
                              <div className="admin-field-grid--full" style={{ marginBottom: '24px' }}>
                                <strong className="admin-section-group-card__label">상세 콘텐츠 편집</strong>
                                <div className="admin-field-grid" style={{ marginTop: '12px' }}>
                                  {standaloneTextFields.map((field) => (
                                    <label key={field.path.join('.')} className="form-field">
                                      <span>{field.label}</span>
                                      {isLongTextField(field.label, field.value) ? (
                                        <textarea
                                          rows={4}
                                          value={field.value}
                                          onChange={(event) => handleContentTextFieldChange(field.page, field.path, event.target.value)}
                                        />
                                      ) : (
                                        <input
                                          type="text"
                                          value={field.value}
                                          onChange={(event) => handleContentTextFieldChange(field.page, field.path, event.target.value)}
                                        />
                                      )}
                                    </label>
                                  ))}
                                </div>
                              </div>
                            ) : null}
                          </div>

                          {nestedGroups.length > 0 ? (
                            <div className="admin-section-group-card__block" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                              <div className="admin-section-group-card__block-header">
                                <strong className="admin-section-group-card__label">반복 항목 편집</strong>
                                {groupArrayAction ? (
                                  <button
                                    type="button"
                                    className="button button--light admin-array-action-button"
                                    onClick={() =>
                                      handleAddArrayItem(
                                        groupArrayAction.page,
                                        groupArrayAction.arrayPath,
                                        groupArrayAction.createItem,
                                      )
                                    }
                                  >
                                    <Plus size={16} />
                                    {groupArrayAction.label}
                                  </button>
                                ) : null}
                              </div>
                              <div className="admin-nested-group-list">
                                {nestedGroups.map((nestedGroup) => {
                                  const nestedGroupMeta = getNestedGroupItemMeta(nestedGroup);
                                  const currentItems =
                                    nestedGroupMeta ? getNestedValue(draftSiteContent[nestedGroupMeta.page], nestedGroupMeta.arrayPath) : [];
                                  const currentItemCount = Array.isArray(currentItems) ? currentItems.length : 0;
                                  const canManageArrayItem =
                                    nestedGroupMeta &&
                                    selectedEditorPage === 'members';

                                  return (
                                  <details key={nestedGroup.key} className="admin-nested-group" open>
                                    <summary className="admin-nested-group__summary">{nestedGroup.label}</summary>
                                    <div className="admin-nested-group__body">
                                      {canManageArrayItem ? (
                                        <div className="admin-array-item-actions">
                                          <div className="admin-array-item-actions__primary">
                                            <button
                                              type="button"
                                              className="button button--light admin-array-action-button"
                                              onClick={() =>
                                                handleMoveArrayItem(
                                                  nestedGroupMeta.page,
                                                  nestedGroupMeta.arrayPath,
                                                  nestedGroupMeta.index,
                                                  'up',
                                                )
                                              }
                                              disabled={nestedGroupMeta.index === 0}
                                            >
                                              <ChevronUp size={16} />
                                              위로
                                            </button>
                                            <button
                                              type="button"
                                              className="button button--light admin-array-action-button"
                                              onClick={() =>
                                                handleMoveArrayItem(
                                                  nestedGroupMeta.page,
                                                  nestedGroupMeta.arrayPath,
                                                  nestedGroupMeta.index,
                                                  'down',
                                                )
                                              }
                                              disabled={nestedGroupMeta.index >= currentItemCount - 1}
                                            >
                                              <ChevronDown size={16} />
                                              아래로
                                            </button>
                                          </div>
                                          <button
                                            type="button"
                                            className="button admin-array-delete-button"
                                            onClick={() =>
                                              handleDeleteArrayItem(
                                                nestedGroupMeta.page,
                                                nestedGroupMeta.arrayPath,
                                                nestedGroupMeta.index,
                                              )
                                            }
                                          >
                                            <Trash2 size={16} />
                                            삭제
                                          </button>
                                        </div>
                                      ) : null}
                                      
                                      <div className="admin-field-grid">
                                        {nestedGroup.textFields.length > 0 ? (
                                          <div className="admin-field-grid--full">
                                            <div className="admin-field-grid">
                                              {nestedGroup.textFields.map((field) => (
                                                <label key={field.path.join('.')} className="form-field">
                                                  <span>{field.label}</span>
                                                  {isLongTextField(field.label, field.value) ? (
                                                    <textarea
                                                      rows={4}
                                                      value={field.value}
                                                      onChange={(event) => handleContentTextFieldChange(field.page, field.path, event.target.value)}
                                                    />
                                                  ) : (
                                                    <input
                                                      type="text"
                                                      value={field.value}
                                                      onChange={(event) => handleContentTextFieldChange(field.page, field.path, event.target.value)}
                                                    />
                                                  )}
                                                </label>
                                              ))}
                                            </div>
                                          </div>
                                        ) : null}

                                        {nestedGroup.imageFields.length > 0 ? (
                                          <div className="admin-field-grid--full">
                                            <div className="admin-image-grid" style={{ gridTemplateColumns: '1fr' }}>
                                              {nestedGroup.imageFields.map((field) => {
                                                const fieldKey = `${field.page}:${field.path.join('.')}`;
                                                const isUploading = uploadingFieldKey === fieldKey;
                                                const isDeleting = deletingFieldKey === fieldKey;

                                                return (
                                                  <article key={fieldKey} className="admin-image-card">
                                                    <div className="admin-image-card__preview">
                                                      {field.value ? <img src={field.value} alt={field.label} /> : <span>이미지 없음</span>}
                                                    </div>
                                                    <div className="admin-image-card__body">
                                                      <strong>{field.label}</strong>
                                                      <label className="form-field">
                                                        <span>이미지 URL</span>
                                                        <input
                                                          type="url"
                                                          value={field.value}
                                                          onChange={(event) => handleImageFieldChange(field.page, field.path, event.target.value)}
                                                          placeholder="https://..."
                                                          disabled={isUploading || isDeleting}
                                                        />
                                                      </label>
                                                      <label className="form-field">
                                                        <span>새 이미지 업로드</span>
                                                        <input
                                                          type="file"
                                                          accept="image/*"
                                                          onChange={(event) => {
                                                            handleImageUpload(field.page, field.path, event.target.files?.[0] || null);
                                                            event.currentTarget.value = '';
                                                          }}
                                                          disabled={isUploading || isDeleting}
                                                        />
                                                      </label>
                                                      <button
                                                        type="button"
                                                        className="button admin-image-card__delete"
                                                        onClick={() => handleImageDelete(field.page, field.path, field.value)}
                                                        disabled={isUploading || isDeleting || !field.value}
                                                      >
                                                        {isDeleting ? '삭제 중...' : '이미지 삭제'}
                                                      </button>
                                                      <p className="admin-helper-text">
                                                        {isUploading
                                                          ? '업로드 중입니다...'
                                                          : isDeleting
                                                            ? '이미지를 삭제하는 중입니다...'
                                                            : `권장 형식: JPG, PNG, WEBP / ${getImageAspectRatioHint(field.page, field.path)}`}
                                                      </p>
                                                    </div>
                                                  </article>
                                                );
                                              })}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    </div>
                                  </details>
                                )})}
                              </div>
                            </div>
                          ) : null}

                          {standaloneImageFields.length > 0 ? (
                            <div className="admin-section-group-card__block" style={{ borderTop: '1px solid #f1f5f9', paddingTop: '24px' }}>
                              <strong className="admin-section-group-card__label">대표 이미지 관리</strong>
                              <div className="admin-image-grid" style={{ marginTop: '16px' }}>
                                {standaloneImageFields.map((field) => {
                                  const fieldKey = `${field.page}:${field.path.join('.')}`;
                                  const isUploading = uploadingFieldKey === fieldKey;
                                  const isDeleting = deletingFieldKey === fieldKey;

                                  return (
                                    <article key={fieldKey} className="admin-image-card">
                                      <div className="admin-image-card__preview">
                                        {field.value ? <img src={field.value} alt={field.label} /> : <span>이미지 없음</span>}
                                      </div>
                                      <div className="admin-image-card__body">
                                        <strong>{field.label}</strong>
                                        <label className="form-field">
                                          <span>이미지 URL</span>
                                          <input
                                            type="url"
                                            value={field.value}
                                            onChange={(event) => handleImageFieldChange(field.page, field.path, event.target.value)}
                                            placeholder="https://..."
                                            disabled={isUploading || isDeleting}
                                          />
                                        </label>
                                        <label className="form-field">
                                          <span>새 이미지 업로드</span>
                                          <input
                                            type="file"
                                            accept="image/*"
                                            onChange={(event) => {
                                              handleImageUpload(field.page, field.path, event.target.files?.[0] || null);
                                              event.currentTarget.value = '';
                                            }}
                                            disabled={isUploading || isDeleting}
                                          />
                                        </label>
                                        <button
                                          type="button"
                                          className="button admin-image-card__delete"
                                          onClick={() => handleImageDelete(field.page, field.path, field.value)}
                                          disabled={isUploading || isDeleting || !field.value}
                                        >
                                          {isDeleting ? '삭제 중...' : '이미지 삭제'}
                                        </button>
                                        <p className="admin-helper-text">
                                          {isUploading
                                            ? '업로드 중입니다...'
                                            : isDeleting
                                              ? '이미지를 삭제하는 중입니다...'
                                              : `권장 형식: JPG, PNG, WEBP / ${getImageAspectRatioHint(field.page, field.path)}`}
                                        </p>
                                      </div>
                                    </article>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          <div className="admin-section-group-card__footer" style={{ marginTop: '40px', paddingTop: '32px', borderTop: '2px solid #f1f5f9' }}>
                            <button
                              type="button"
                              className="button button--primary"
                              style={{ width: '100%', minHeight: '60px', fontSize: '16px' }}
                              onClick={() =>
                                void handleSaveContent(
                                  `${selectedEditorPageMeta.title} > ${group.title}`,
                                  groupSaveKey,
                                )
                              }
                              disabled={isSavingContent}
                            >
                              <Save size={20} />
                              {isSavingGroup ? `${group.title} 저장 중...` : `${group.title} 데이터만 저장하기`}
                            </button>
                            <p style={{ textAlign: 'center', marginTop: '12px', color: '#94a3b8', fontSize: '13px' }}>
                              상기 버튼을 누르면 이 섹션의 변경사항이 즉시 서버에 저장됩니다.
                            </p>
                          </div>
                        </motion.article>
                      );
                    })}
                      </>
                    )}
                  </div>
                </div>
              ) : null}

              {activeView === 'templates' ? renderTemplateManager() : null}

              {activeView === 'inquiries' ? (
                <>
                  <section className="admin-overview-stats admin-overview-stats--inquiries">
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>전체 문의</span>
                      <strong>{items.length}</strong>
                      <p>누적 저장된 전체 문의</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>신규</span>
                      <strong>{countByStatus('new')}</strong>
                      <p>아직 확인하지 않은 문의</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>처리중</span>
                      <strong>{countByStatus('in_progress')}</strong>
                      <p>답변 또는 내부 검토 진행 중</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>완료</span>
                      <strong>{countByStatus('completed')}</strong>
                      <p>처리 완료된 문의</p>
                    </motion.article>
                  </section>

                  <section className="admin-panel">
                    <div className="admin-panel__header admin-panel__header--stack">
                      <div>
                        <p className="admin-panel__eyebrow">문의 운영</p>
                        <h2>문의 관리</h2>
                        <p className="admin-panel__description">검색, 상태 필터, 메모 저장까지 한 흐름으로 정리했습니다.</p>
                      </div>
                    </div>

                    <div className="content-grid-2">
                      <label className="form-field">
                        <span>검색</span>
                        <div className="admin-search-field">
                          <Search size={16} />
                          <input
                            type="text"
                            value={search}
                            onChange={(event) => setSearch(event.target.value)}
                            placeholder="기관명, 담당자명, 이메일, 문의 내용 검색"
                          />
                        </div>
                      </label>
                      <label className="form-field">
                        <span>상태 필터</span>
                        <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as 'all' | InquiryStatus)}>
                          <option value="all">전체</option>
                          <option value="new">신규</option>
                          <option value="in_progress">처리중</option>
                          <option value="completed">완료</option>
                        </select>
                      </label>
                    </div>

                    {loading ? <p className="admin-empty">문의 목록을 불러오는 중입니다.</p> : null}
                    {!loading && error ? <p className="admin-empty admin-empty--error">{error}</p> : null}
                    {!loading && !error && items.length === 0 ? (
                      <p className="admin-empty">아직 저장된 문의가 없습니다. 문의 페이지에서 테스트 등록 후 여기서 바로 확인할 수 있습니다.</p>
                    ) : null}
                    {!loading && !error && items.length > 0 && filteredItems.length === 0 ? (
                      <p className="admin-empty">현재 검색 조건에 맞는 문의가 없습니다.</p>
                    ) : null}

                    <div className="admin-list">
                      {filteredItems.map((item) => (
                        <motion.article key={item.id} {...fadeUp} className="admin-inquiry-card">
                          <div className="admin-inquiry-card__top">
                            <div>
                              <p className="admin-inquiry-card__org">{item.organizationName}</p>
                              <h3>{item.contactName}</h3>
                            </div>
                            <span className={`status-badge status-badge--${item.status}`}>{statusLabels[item.status]}</span>
                          </div>
                          <div className="admin-inquiry-card__meta">
                            <span>{item.email}</span>
                            <span>{item.eventDate || '행사 예정일 미입력'}</span>
                            <span>{new Date(item.createdAt).toLocaleString('ko-KR')}</span>
                          </div>
                          <p className="admin-inquiry-card__message">{item.message}</p>
                          <div className="admin-inquiry-card__controls">
                            <label className="form-field">
                              <span>상태</span>
                              <select
                                value={item.status}
                                onChange={(event) => {
                                  void handleStatusChange(item.id, event.target.value as InquiryStatus, item.notes);
                                }}
                                disabled={savingId === item.id}
                              >
                                <option value="new">신규</option>
                                <option value="in_progress">처리중</option>
                                <option value="completed">완료</option>
                              </select>
                            </label>
                            <label className="form-field">
                              <span>메모</span>
                              <textarea
                                rows={3}
                                value={item.notes}
                                onChange={(event) => {
                                  const value = event.target.value;
                                  setItems((current) =>
                                    current.map((currentItem) =>
                                      currentItem.id === item.id ? { ...currentItem, notes: value } : currentItem,
                                    ),
                                  );
                                }}
                              />
                            </label>
                            <button
                              type="button"
                              className="button button--light admin-save-button"
                              onClick={() => void handleStatusChange(item.id, item.status, item.notes)}
                              disabled={savingId === item.id}
                            >
                              {savingId === item.id ? '저장 중...' : '상태 저장'}
                            </button>
                          </div>
                        </motion.article>
                      ))}
                    </div>
                  </section>
                </>
              ) : null}
            </div>
          </div>
        </main>
      )}
    </>
  );
}
