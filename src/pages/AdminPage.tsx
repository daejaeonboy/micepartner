import { useEffect, useMemo, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  ArrowLeft,
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
  MessagesSquare,
  Plus,
  Save,
  Search,
  Trash2,
  Users,
} from 'lucide-react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { clearAdminToken, getAdminToken } from '../lib/adminSession';
import {
  deleteAdminImage,
  deleteAdminSession,
  fetchAdminUsers,
  fetchCurrentAdmin,
  fetchInquiries,
  saveSiteDataWithTransform,
  updateAdminApproval,
  uploadAdminImage,
  updateInquiryStatus,
} from '../lib/api';
import {
  isManagedHeaderChildAutoPath,
  isManagedHeaderCategoryParentPath,
  resolveManagedHeaderChildPath,
  shouldAutoGenerateManagedHeaderChildPath,
} from '../lib/menuCategories';
import type { AdminUser } from '../types/admin';
import type { EditorPageId, SiteEditorConfig } from '../types/editorConfig';
import type { HeaderMenuItem, SitePageContent } from '../types/siteContent';
import type { Inquiry, InquiryStatus } from '../types/inquiry';
import type { SiteCopy } from '../types/siteCopy';

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

type EditableSectionKey = keyof SitePageContent;

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
    key: 'support',
    title: '고객센터',
    fields: [
      ['introTitle', '상단 제목'],
      ['introDescription', '상단 설명'],
      ['faqSectionTitle', '자주 묻는 질문 제목'],
      ['faqSectionDescription', '자주 묻는 질문 설명'],
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
  members: 'MICE 회원',
  support: '고객센터',
  contact: '문의',
  menus: '메뉴 관리',
  footer: '푸터',
};

type AdminView = 'overview' | 'content' | 'faq' | 'inquiries' | 'admins';
type AdminApprovalFilter = 'all' | 'pending' | 'approved';

const menuLinkedPagePaths: Partial<Record<EditableSectionKey, string>> = {
  cases: '/cases',
  resources: '/resources',
  about: '/about',
  members: '/members',
  support: '/faq',
};

function normalizeEditorMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function normalizeComparableMenuPath(path: string) {
  return String(path || '').trim();
}

const lockedManagedPaths = new Set([
  '/',
  '/cases',
  '/cases/:slug',
  '/resources',
  '/resources/notices',
  '/resources/notices/:slug',
  '/resources/files',
  '/resources/files/:slug',
  '/about',
  '/members',
  '/faq',
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

type EditorPageDefinition = {
  id: EditorPageId;
  title: string;
  icon: LucideIcon;
  contentKey: EditableSectionKey;
  groupIds: string[];
  path?: string;
  helperText?: string;
  isCommon?: boolean;
};

const imageFieldLabels: Record<string, string> = {
  heroImageUrl: '대표 이미지',
  servicePreviewImageUrl: '섹션 이미지',
  ctaImageUrl: 'CTA 이미지',
  coverImageUrl: '커버 이미지',
  imageUrl: '이미지',
  logoUrl: '로고 이미지',
  bankLogoUrl: '은행 로고',
};

const imageGroupLabels: Record<string, string> = {
  heroSlides: '히어로 슬라이드',
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
  heroSlides: '히어로 슬라이드',
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
  positioningCtaHref: '자세히 보기 링크',
  secondaryCtaLabel: '보조 버튼 문구',
  secondaryCtaHref: '보조 버튼 링크',
  resourcesCtaHref: '자세히 보기 링크',
  partnersCtaHref: '자세히 보기 링크',
  ctaButtonLabel: 'CTA 버튼 문구',
  ctaButtonHref: 'CTA 버튼 링크',
  filterAllLabel: '전체 옵션 문구',
  searchPlaceholder: '검색창 플레이스홀더',
  searchButtonLabel: '검색 버튼 문구',
  totalLabel: '총 개수 라벨',
  currentPageLabel: '페이지 안내 라벨',
  emptyStateTitle: '빈 상태 제목',
  emptyStateDescription: '빈 상태 설명',
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
    { id: 'hero', title: '히어로', description: '메인 첫 화면 슬라이드와 공통 히어로 문구를 관리합니다.', copyFields: [], contentPrefixes: [['heroEyebrow'], ['heroBadge'], ['heroSlides']], imagePrefixes: [['heroSlides']] },
    { id: 'service-preview', title: '서비스 프리뷰', description: '서비스 프리뷰 문구, 버튼 문구, 버튼 링크와 대표 이미지를 관리합니다.', copyFields: ['servicePreviewTitle', 'servicePreviewDescription'], contentPrefixes: [['servicePreviewEyebrow'], ['primaryCtaLabel'], ['primaryCtaHref']], imagePrefixes: [['servicePreviewImageUrl']] },
    { id: 'positioning', title: '브랜드 소개', description: '브랜드 포지셔닝 문구, 자세히 보기 링크와 소개 카드 이미지를 관리합니다.', copyFields: ['positioningTitle', 'positioningDescription'], contentPrefixes: [['positioningCtaHref'], ['positioningCards']], imagePrefixes: [['positioningCards']] },
    { id: 'portfolio-preview', title: '포트폴리오 프리뷰', description: '포트폴리오 소개 문구, 버튼 문구, 버튼 링크와 메인 카드 이미지를 관리합니다.', copyFields: ['portfolioPreviewTitle', 'portfolioPreviewDescription'], contentPrefixes: [['secondaryCtaLabel'], ['secondaryCtaHref']], imagePrefixes: [['entries']] },
    { id: 'resources-preview', title: '정보센터 프리뷰', description: '메인에 노출되는 정보센터 소개 문구, 자세히 보기 링크와 카드 이미지, 카드 텍스트를 관리합니다.', copyFields: ['resourcesPreviewTitle', 'resourcesPreviewDescription'], contentPrefixes: [['resourcesCtaHref'], ['items']], imagePrefixes: [['items']] },
    { id: 'process', title: '비즈니스 파트너', description: '협력업체 소개 문구, 자세히 보기 링크와 로고 이미지를 관리합니다.', copyFields: ['processTitle', 'processDescription'], contentPrefixes: [['partnersCtaHref'], ['partnerLogos']], imagePrefixes: [['partnerLogos']] },
    { id: 'cta', title: 'CTA', description: '마지막 전환 섹션 문구, 버튼 문구, 버튼 링크와 배너 이미지를 관리합니다.', copyFields: ['ctaTitle', 'ctaDescription'], contentPrefixes: [['ctaButtonLabel'], ['ctaButtonHref']], imagePrefixes: [['ctaImageUrl']] },
  ],
  services: [
    { id: 'intro', title: '상단 소개', description: '서비스 페이지 상단 카피를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'visual', title: '대표 이미지', description: '서비스 페이지 대표 이미지를 관리합니다.', copyFields: [], contentPrefixes: [], imagePrefixes: [['heroImageUrl']] },
    { id: 'modules', title: '서비스 모듈', description: '서비스 카드 소개 문구와 카드 이미지를 관리합니다.', copyFields: ['modulesTitle', 'modulesDescription'], contentPrefixes: [['modulesEyebrow'], ['modules']], imagePrefixes: [['modules']] },
    { id: 'flow', title: '진행 흐름', description: '서비스 진행 흐름 문구를 관리합니다.', copyFields: ['flowTitle', 'flowDescription'], contentPrefixes: [['flowEyebrow'], ['flowSteps']], imagePrefixes: [] },
  ],
  cases: [
    { id: 'intro', title: '상단 소개', description: '포트폴리오 페이지 소개 문구와 검색 영역 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['searchPlaceholder'], ['searchButtonLabel'], ['totalLabel'], ['currentPageLabel']], imagePrefixes: [] },
    { id: 'categories', title: '카테고리', description: '포트폴리오 카테고리 구조를 관리합니다.', copyFields: [], contentPrefixes: [['allCategoryLabel'], ['categories']], imagePrefixes: [] },
    { id: 'cards', title: '목록 설정', description: '운영사례 목록에서 사용하는 빈 상태 안내만 관리합니다. 개별 게시글은 프론트 편집에서 직접 작성합니다.', copyFields: [], contentPrefixes: [['emptyStateMessage'], ['emptyStateDescription']], imagePrefixes: [] },
  ],
  resources: [
    { id: 'notices', title: '소식 페이지', description: '정보센터 > 소식 목록 페이지의 제목과 설명만 관리합니다. 개별 게시글은 프론트 편집에서 직접 작성합니다.', copyFields: ['noticesTitle', 'noticesDescription'], contentPrefixes: [], imagePrefixes: [] },
    { id: 'downloads', title: '자료 페이지', description: '정보센터 > 자료 목록 페이지의 제목과 설명만 관리합니다. 개별 자료는 프론트 편집에서 직접 작성합니다.', copyFields: ['downloadsTitle', 'downloadsDescription'], contentPrefixes: [], imagePrefixes: [] },
  ],
  about: [
    { id: 'intro', title: '상단 소개', description: '회사소개 상단 제목, 본문, 대표 이미지를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [], imagePrefixes: [['heroImageUrl']] },
    { id: 'identity', title: 'Section 1', description: '첫 번째 회사소개 섹션의 제목, 본문, 이미지를 관리합니다. 카테고리명은 메뉴 관리 또는 프론트 편집에서 수정합니다.', copyFields: ['identityTitle', 'identityDescription'], contentPrefixes: [], imagePrefixes: [['identityImageUrl']] },
    { id: 'strength', title: 'Section 2', description: '두 번째 회사소개 섹션의 제목, 본문, 이미지를 관리합니다. 카테고리명은 메뉴 관리 또는 프론트 편집에서 수정합니다.', copyFields: ['strengthTitle', 'strengthDescription'], contentPrefixes: [], imagePrefixes: [['strengthImageUrl']] },
    { id: 'process', title: 'Section 3', description: '세 번째 회사소개 섹션의 제목, 본문, 이미지를 관리합니다. 카테고리명은 메뉴 관리 또는 프론트 편집에서 수정합니다.', copyFields: ['processTitle', 'processDescription'], contentPrefixes: [], imagePrefixes: [['processImageUrl']] },
  ],
  support: [
    { id: 'intro', title: '상단 소개', description: '고객센터 페이지 상단 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'contact', title: '연락 안내', description: '고객센터 연락처와 채팅 연결 문구를 관리합니다.', copyFields: [], contentPrefixes: [['phone'], ['hours'], ['chatLabel'], ['chatHref']], imagePrefixes: [] },
    { id: 'faq', title: 'FAQ', description: 'FAQ 소개 문구와 카테고리, 질문/답변 목록을 관리합니다.', copyFields: ['faqSectionTitle', 'faqSectionDescription'], contentPrefixes: [['faqCategories'], ['faqs']], imagePrefixes: [] },
  ],
  contact: [
    { id: 'intro', title: '상단 소개', description: '문의 페이지 상단 문구를 관리합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['introEyebrow']], imagePrefixes: [] },
    { id: 'visual', title: '대표 이미지', description: '문의 페이지 대표 이미지를 관리합니다.', copyFields: [], contentPrefixes: [], imagePrefixes: [['heroImageUrl']] },
    { id: 'options', title: '문의 옵션', description: '문의 옵션 소개 문구와 옵션 이미지를 관리합니다.', copyFields: ['optionsTitle', 'optionsDescription'], contentPrefixes: [['optionsEyebrow'], ['options'], ['trustBullets']], imagePrefixes: [['options']] },
    { id: 'trust-form', title: '신뢰 및 폼', description: '신뢰 카드와 문의 폼 소개 문구를 관리합니다.', copyFields: ['trustCardTitle', 'trustCardDescription', 'formTitle', 'formDescription'], contentPrefixes: [['formEyebrow'], ['organizationLabel'], ['organizationPlaceholder'], ['contactNameLabel'], ['contactNamePlaceholder'], ['emailLabel'], ['emailPlaceholder'], ['eventDateLabel'], ['eventDatePlaceholder'], ['messageLabel'], ['messagePlaceholder'], ['submitButtonLabel'], ['submitPendingLabel'], ['submitSuccessMessage']], imagePrefixes: [] },
    { id: 'guide-cards', title: '안내 카드', description: '진행 방식과 체크리스트 카드 제목을 관리합니다.', copyFields: ['processCardTitle', 'checklistCardTitle', 'placeholderCardTitle'], contentPrefixes: [['responseSteps'], ['checklist'], ['contactInfo']], imagePrefixes: [] },
  ],
  members: [
    { id: 'intro', title: '상단 소개', description: '협력업체 페이지 상단 문구와 검색 영역 문구를 관리합니다. 개별 협력업체는 프론트 편집에서 직접 작성합니다.', copyFields: ['introTitle', 'introDescription'], contentPrefixes: [['filterAllLabel'], ['searchPlaceholder'], ['searchButtonLabel'], ['totalLabel'], ['currentPageLabel'], ['emptyStateTitle'], ['emptyStateDescription']], imagePrefixes: [] },
  ],
  menus: [
    { id: 'header-menu', title: '헤더 메뉴', description: '상단 네비게이션과 메가 메뉴 구조를 관리합니다.', copyFields: [], contentPrefixes: [['headerItems']], imagePrefixes: [] },
    { id: 'footer-links', title: '푸터 바로가기', description: '푸터 링크 메뉴를 관리합니다.', copyFields: [], contentPrefixes: [['footerQuickLinks']], imagePrefixes: [] },
  ],
  footer: [
    { id: 'footer-copy', title: '푸터 및 헤더 문구', description: '헤더 문의 버튼과 푸터 운영 정보를 관리합니다.', copyFields: ['copy'], contentPrefixes: [['headerCtaLabel'], ['customerServiceTitle'], ['customerServicePhone'], ['customerServiceHours'], ['bankSectionTitle'], ['bankName'], ['bankAccountNumber'], ['bankAccountHolder'], ['legalLines'], ['copyright'], ['companyName'], ['contactInfo']], imagePrefixes: [['bankLogoUrl']] },
  ],
};

function resolveEditorPageGroupOrder(page: EditorPageDefinition) {
  return [...page.groupIds];
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

function createEmptyHeroSlide() {
  return {
    title: '새 히어로 슬라이드',
    description: '이 슬라이드에 노출할 설명을 입력해 주세요.',
    imageUrl: '',
  };
}

function getAllHeaderMenuPaths(headerItems: HeaderMenuItem[]) {
  return headerItems.flatMap((item) => [item.path, ...item.children.map((child) => child.path)]);
}

function createUniqueDraftMenuPath(existingPaths: string[], basePath = '/new-page') {
  const normalizedBasePath = normalizeEditorMenuPath(basePath);
  const usedPaths = new Set(existingPaths.map((path) => normalizeEditorMenuPath(path)).filter(Boolean));

  if (!usedPaths.has(normalizedBasePath)) {
    return normalizedBasePath;
  }

  let suffix = 2;
  let nextPath = `${normalizedBasePath}-${suffix}`;

  while (usedPaths.has(normalizeEditorMenuPath(nextPath))) {
    suffix += 1;
    nextPath = `${normalizedBasePath}-${suffix}`;
  }

  return nextPath;
}

function findDuplicateHeaderMenuPaths(headerItems: HeaderMenuItem[]) {
  const seenPaths = new Set<string>();
  const duplicatePaths = new Set<string>();

  headerItems.forEach((item) => {
    const parentPath = normalizeComparableMenuPath(item.path);

    if (parentPath) {
      if (seenPaths.has(parentPath)) {
        duplicatePaths.add(parentPath);
      } else {
        seenPaths.add(parentPath);
      }
    }

    item.children.forEach((child) => {
      const childPath = normalizeComparableMenuPath(child.path);

      if (!childPath) {
        return;
      }

      if (seenPaths.has(childPath)) {
        duplicatePaths.add(childPath);
      } else {
        seenPaths.add(childPath);
      }
    });
  });

  return Array.from(duplicatePaths);
}

function createEmptyHeaderMenuItem(existingPaths: string[] = []) {
  const path = createUniqueDraftMenuPath(existingPaths);
  const childPath = createUniqueDraftMenuPath([...existingPaths, path]);

  return {
    label: '새 메뉴',
    path,
    children: [
      {
        label: '하위 메뉴',
        path: childPath,
      },
    ],
  };
}

function createEmptyHeaderMenuChild(existingPaths: string[] = [], parentPath = '') {
  if (isManagedHeaderCategoryParentPath(parentPath)) {
    const usedPaths = new Set(existingPaths.map((path) => normalizeComparableMenuPath(path)).filter(Boolean));
    let suffix = 1;
    let label = '새 카테고리';
    let path = resolveManagedHeaderChildPath(parentPath, label);

    while (usedPaths.has(normalizeComparableMenuPath(path))) {
      suffix += 1;
      label = `새 카테고리 ${suffix}`;
      path = resolveManagedHeaderChildPath(parentPath, label);
    }

    return {
      label,
      path,
    };
  }

  return {
    label: '하위 메뉴',
    path: createUniqueDraftMenuPath(existingPaths),
  };
}

function createEmptyFooterQuickLink() {
  return {
    label: '새 링크',
    path: '/new-link',
  };
}

function getGroupArrayActionConfig(page: EditableSectionKey, groupId: string): ArrayGroupActionConfig | null {
  if (page === 'home' && groupId === 'hero') {
    return {
      page: 'home',
      arrayPath: ['heroSlides'],
      label: '히어로 슬라이드 추가',
      createItem: createEmptyHeroSlide,
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

  if (pathKey.includes('heroImageUrl') || pathKey.includes('heroSlides') || pathKey.includes('ctaImageUrl')) {
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

function getCopyFieldRows(page: EditableSectionKey, field: string, value: string) {
  if (
    page === 'about' &&
    ['introDescription', 'identityDescription', 'strengthDescription', 'processDescription'].includes(field)
  ) {
    return 8;
  }

  if (page === 'about' && field.toLowerCase().includes('title')) {
    return 3;
  }

  return field.toLowerCase().includes('description') || field.toLowerCase().includes('body') || value.length > 120 ? 4 : 2;
}

function sortAdminUsers(items: AdminUser[]) {
  return [...items].sort((left, right) => {
    if (left.approved !== right.approved) {
      return left.approved ? 1 : -1;
    }

    return String(right.createdAt).localeCompare(String(left.createdAt));
  });
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
  const [adminAccounts, setAdminAccounts] = useState<AdminUser[]>([]);
  const [adminAccountsLoading, setAdminAccountsLoading] = useState(false);
  const [adminAccountsError, setAdminAccountsError] = useState('');
  const [updatingAdminId, setUpdatingAdminId] = useState('');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminApprovalFilter, setAdminApprovalFilter] = useState<AdminApprovalFilter>('all');
  const [draftSiteCopy, setDraftSiteCopy] = useState<SiteCopy>(siteCopy);
  const [draftSiteContent, setDraftSiteContent] = useState<SitePageContent>(siteData.content);
  const [draftSiteEditor, setDraftSiteEditor] = useState<SiteEditorConfig>(siteData.editor);
  const draftSiteCopyRef = useRef(draftSiteCopy);
  const draftSiteContentRef = useRef(draftSiteContent);
  const draftSiteEditorRef = useRef(draftSiteEditor);
  const [selectedEditorPage, setSelectedEditorPage] = useState<EditorPageId>('home');
  const [selectedCmsSectionId, setSelectedCmsSectionId] = useState<string>('');
  const [contentError, setContentError] = useState('');
  const [contentMessage, setContentMessage] = useState('');
  const [isSavingContent, setIsSavingContent] = useState(false);
  const [savingScopeKey, setSavingScopeKey] = useState('');
  const [activeView, setActiveView] = useState<AdminView>('overview');
  const [activeNavKey, setActiveNavKey] = useState('dashboard');
  const [uploadingFieldKey, setUploadingFieldKey] = useState('');
  const [deletingFieldKey, setDeletingFieldKey] = useState('');

  // FAQ Management States
  const [isFaqModalOpen, setIsFaqModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [faqForm, setFaqForm] = useState({
    category: '',
    order: 8,
    question: '',
    answer: '',
  });

  useEffect(() => {
    if (!faqForm.category && draftSiteContent.support.faqCategories.length > 0) {
      setFaqForm(prev => ({
        ...prev,
        category: draftSiteContent.support.faqCategories.find(c => c !== '전체') || draftSiteContent.support.faqCategories[0]
      }));
    }
  }, [draftSiteContent.support.faqCategories, faqForm.category]);

  const [newCategoryName, setNewCategoryName] = useState('');

  const handleAddCategory = () => {
    if (!newCategoryName.trim()) return;
    setDraftSiteContent(current => ({
      ...current,
      support: {
        ...current.support,
        faqCategories: [...current.support.faqCategories, newCategoryName.trim()]
      }
    }));
    setNewCategoryName('');
  };

  const handleAddFaq = () => {
    if (!faqForm.question.trim() || !faqForm.answer.trim()) return;
    const newFaq = {
      category: faqForm.category,
      question: faqForm.question.trim(),
      answer: faqForm.answer.trim(),
    };
    setDraftSiteContent(current => ({
      ...current,
      support: {
        ...current.support,
        faqs: [...current.support.faqs, newFaq]
      }
    }));
    setIsFaqModalOpen(false);
    setFaqForm({
      category: '자주 묻는 질문',
      order: 8,
      question: '',
      answer: '',
    });
  };

  useEffect(() => {
    setDraftSiteCopy(siteCopy);
    setDraftSiteContent(siteData.content);
    setDraftSiteEditor(siteData.editor);
  }, [siteCopy, siteData.content, siteData.editor]);

  useEffect(() => {
    draftSiteCopyRef.current = draftSiteCopy;
  }, [draftSiteCopy]);

  useEffect(() => {
    draftSiteContentRef.current = draftSiteContent;
  }, [draftSiteContent]);

  useEffect(() => {
    draftSiteEditorRef.current = draftSiteEditor;
  }, [draftSiteEditor]);

  useEffect(() => {
    if (!adminToken) {
      navigate('/admin/login', { replace: true });
      setAdminUser(null);
      setAdminAccounts([]);
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
        await Promise.all([loadInquiries(adminToken), loadAdminAccounts(adminToken)]);
      } catch {
        if (!active) {
          return;
        }

        clearAdminToken();
        setAdminToken('');
        setAdminUser(null);
        setAdminAccounts([]);
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
      cases: resolvedPageLabels.cases,
      resourcesNotices: `${resolvedPageLabels.resources} ${noticesLabel}`,
      resourcesFiles: `${resolvedPageLabels.resources} ${filesLabel}`,
      about: resolvedPageLabels.about,
      support: resolvedPageLabels.support,
      members: resolvedPageLabels.members,
      contact: resolvedPageLabels.contact,
      footer: '푸터',
      menus: '메뉴 관리',
    };
  }, [draftSiteContent.menus.headerItems, resolvedPageLabels]);

  const editorPages = useMemo<EditorPageDefinition[]>(
    () => [
      {
        id: 'home',
        title: resolvedEditorPageTitles.home,
        icon: FilePenLine,
        contentKey: 'home',
        groupIds: ['hero', 'service-preview', 'positioning', 'portfolio-preview', 'resources-preview', 'process', 'cta'],
        path: '/',
        helperText: '메인 화면 섹션을 수정합니다.',
      },
      {
        id: 'about',
        title: resolvedEditorPageTitles.about,
        icon: Users,
        contentKey: 'about',
        groupIds: ['intro', 'identity', 'strength', 'process'],
        path: '/about',
        helperText: '회사소개 페이지를 수정합니다.',
        imageFields: [
          {
            page: 'about',
            path: ['heroImageUrl'],
            label: '상단 비주얼 이미지',
          },
        ],
      },
      {
        id: 'cases',
        title: resolvedEditorPageTitles.cases,
        icon: Layers3,
        contentKey: 'cases',
        groupIds: ['intro', 'categories', 'cards'],
        path: '/cases',
        helperText: '포트폴리오 목록 페이지를 수정합니다.',
      },
      {
        id: 'members',
        title: resolvedEditorPageTitles.members,
        icon: Users,
        contentKey: 'members',
        groupIds: ['intro'],
        path: '/members',
        helperText: 'MICE 회원 페이지를 수정합니다.',
      },
      {
        id: 'resourcesNotices',
        title: resolvedEditorPageTitles.resourcesNotices,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['notices'],
        path: '/resources/notices',
        helperText: '정보센터 소식 페이지를 수정합니다.',
      },
      {
        id: 'resourcesFiles',
        title: resolvedEditorPageTitles.resourcesFiles,
        icon: Search,
        contentKey: 'resources',
        groupIds: ['downloads'],
        path: '/resources/files',
        helperText: '정보센터 자료 페이지를 수정합니다.',
      },
      {
        id: 'support',
        title: resolvedEditorPageTitles.support,
        icon: CircleHelp,
        contentKey: 'support',
        groupIds: ['intro', 'contact', 'faq'],
        path: '/faq',
        helperText: '고객센터 페이지를 수정합니다.',
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
    ],
    [resolvedEditorPageTitles],
  );

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

  const loadAdminAccounts = async (currentAdminToken: string) => {
    setAdminAccountsLoading(true);
    setAdminAccountsError('');

    try {
      const accounts = await fetchAdminUsers(currentAdminToken);
      setAdminAccounts(sortAdminUsers(accounts));
    } catch (loadError) {
      const message = loadError instanceof Error ? loadError.message : '관리자 계정 목록을 불러오지 못했습니다.';
      setAdminAccountsError(message);
    } finally {
      setAdminAccountsLoading(false);
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
    setAdminAccounts([]);
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

  const handleAdminApprovalChange = async (targetAdmin: AdminUser, approved: boolean) => {
    if (!adminToken) {
      return;
    }

    setUpdatingAdminId(targetAdmin.id);
    setAdminAccountsError('');

    try {
      const updatedAdmin = await updateAdminApproval(targetAdmin.id, approved, adminToken);
      setAdminAccounts((current) =>
        sortAdminUsers(current.map((item) => (item.id === updatedAdmin.id ? updatedAdmin : item))),
      );

      if (adminUser?.id === updatedAdmin.id) {
        setAdminUser(updatedAdmin);
      }
    } catch (updateError) {
      const message = updateError instanceof Error ? updateError.message : '관리자 승인 상태를 변경하지 못했습니다.';
      setAdminAccountsError(message);
    } finally {
      setUpdatingAdminId('');
    }
  };

  const handleCopyFieldChange = (section: EditableSectionKey, field: string, value: string) => {
    setDraftSiteCopy((current) => {
      const next = {
        ...current,
        [section]: {
          ...(current[section] as Record<string, string>),
          [field]: value,
        },
      };
      draftSiteCopyRef.current = next;
      return next;
    });
  };

  const buildNextSiteData = (
    nextContent = draftSiteContentRef.current,
    nextEditor = draftSiteEditorRef.current,
    nextCopy = draftSiteCopyRef.current,
  ) => ({
    copy: nextCopy,
    content: nextContent,
    editor: nextEditor,
  });

  const persistDraftSiteData = (
    nextContent = draftSiteContentRef.current,
    nextEditor = draftSiteEditorRef.current,
    nextCopy = draftSiteCopyRef.current,
  ) =>
    saveSiteDataWithTransform(adminToken, (current) => {
      const draft = buildNextSiteData(nextContent, nextEditor, nextCopy);

      return {
        ...current,
        copy: draft.copy,
        editor: draft.editor,
        content: {
          ...draft.content,
          cases: {
            ...draft.content.cases,
            entries: current.content.cases.entries,
          },
          members: {
            ...draft.content.members,
            companies: current.content.members.companies,
          },
          resources: {
            ...draft.content.resources,
            notices: current.content.resources.notices,
            items: current.content.resources.items,
          },
        },
      };
    });

  const handleSaveContent = async (scopeLabel = resolvedPageLabels[selectedEditorPage], scopeKey = `page:${selectedEditorPage}`) => {
    if (!adminToken) {
      return;
    }

    if (scopeKey === 'page:menus') {
      const duplicatePaths = findDuplicateHeaderMenuPaths(draftSiteContentRef.current.menus.headerItems);

      if (duplicatePaths.length > 0) {
        setContentError(`중복된 메뉴 경로가 있어 저장할 수 없어. 겹치는 경로를 먼저 바꿔줘: ${duplicatePaths.join(', ')}`);
        setContentMessage('');
        return;
      }
    }

    setIsSavingContent(true);
    setSavingScopeKey(scopeKey);
    setContentError('');
    setContentMessage('');

    try {
      const saved = await persistDraftSiteData();
      updateSiteData(saved);
      setDraftSiteCopy(saved.copy);
      setDraftSiteContent(saved.content);
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

  const handleSectionLabelChange = (page: EditorPageId, sectionId: string, value: string) => {
    setDraftSiteEditor((current) => {
      const next = {
        ...current,
        sectionLabels: {
          ...current.sectionLabels,
          [page]: {
            ...current.sectionLabels[page],
            [sectionId]: value,
          },
        },
      };
      draftSiteEditorRef.current = next;
      return next;
    });
  };

  const handleContentTextFieldChange = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    value: string,
  ) => {
    setDraftSiteContent((current) => {
      const next = {
        ...current,
        [page]: updateNestedValue(current[page], path, value),
      };
      draftSiteContentRef.current = next;
      return next;
    });
  };

  const handleImageFieldChange = (
    page: EditableSectionKey,
    path: ImagePathSegment[],
    value: string,
  ) => {
    setDraftSiteContent((current) => {
      const next = {
        ...current,
        [page]: updateNestedValue(current[page], path, value),
      };
      draftSiteContentRef.current = next;
      return next;
    });
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
        const currentContent = draftSiteContentRef.current;
        const nextContent = {
          ...currentContent,
          [page]: updateNestedValue(currentContent[page], path, imageUrl),
        };
        const saved = await persistDraftSiteData(nextContent);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
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

        const currentContent = draftSiteContentRef.current;
        const nextContent = {
          ...currentContent,
          [page]: updateNestedValue(currentContent[page], path, ''),
        };
        const saved = await persistDraftSiteData(nextContent);
        updateSiteData(saved);
        setDraftSiteCopy(saved.copy);
        setDraftSiteContent(saved.content);
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
      const next = {
        ...current,
        [page]: updateNestedValue(current[page], arrayPath, nextItems),
      };

      draftSiteContentRef.current = next;
      return next;
    });
  };

  const handleAddHeaderMenuItem = () => {
    setDraftSiteContent((current) => {
      const existingPaths = getAllHeaderMenuPaths(current.menus.headerItems);
      const next = {
        ...current,
        menus: {
          ...current.menus,
          headerItems: [...current.menus.headerItems, createEmptyHeaderMenuItem(existingPaths)],
        },
      };

      draftSiteContentRef.current = next;
      return next;
    });
  };

  const handleAddHeaderMenuChild = (headerMenuIndex: number) => {
    setDraftSiteContent((current) => {
      const selectedMenu = current.menus.headerItems[headerMenuIndex];

      if (!selectedMenu) {
        return current;
      }

      const existingPaths = getAllHeaderMenuPaths(current.menus.headerItems);
      const nextHeaderItems = current.menus.headerItems.map((item, index) =>
        index === headerMenuIndex
          ? {
              ...item,
              children: [...item.children, createEmptyHeaderMenuChild(existingPaths, item.path)],
            }
          : item,
      );
      const next = {
        ...current,
        menus: {
          ...current.menus,
          headerItems: nextHeaderItems,
        },
      };

      draftSiteContentRef.current = next;
      return next;
    });
  };

  const handleManagedHeaderChildLabelChange = (headerMenuIndex: number, childIndex: number, nextLabel: string) => {
    setDraftSiteContent((current) => {
      const selectedMenu = current.menus.headerItems[headerMenuIndex];
      const selectedChild = selectedMenu?.children?.[childIndex];

      if (!selectedMenu || !selectedChild) {
        return current;
      }

      const shouldSyncPath = isManagedHeaderCategoryParentPath(selectedMenu.path)
        ? true
        : shouldAutoGenerateManagedHeaderChildPath(selectedMenu.path, selectedChild.path) ||
          isManagedHeaderChildAutoPath(selectedMenu.path, selectedChild.label, selectedChild.path);

      const nextHeaderItems = current.menus.headerItems.map((item, itemIndex) => {
        if (itemIndex !== headerMenuIndex) {
          return item;
        }

        return {
          ...item,
          children: item.children.map((child, nextChildIndex) => {
            if (nextChildIndex !== childIndex) {
              return child;
            }

            return {
              ...child,
              label: nextLabel,
              path: shouldSyncPath ? resolveManagedHeaderChildPath(item.path, nextLabel, child.path) : child.path,
            };
          }),
        };
      });
      const next = {
        ...current,
        menus: {
          ...current.menus,
          headerItems: nextHeaderItems,
        },
      };

      draftSiteContentRef.current = next;
      return next;
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

      const next = {
        ...current,
        [page]: updateNestedValue(
          current[page],
          arrayPath,
          currentItems.filter((_, itemIndex) => itemIndex !== index),
        ),
      };

      draftSiteContentRef.current = next;
      return next;
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

      const next = {
        ...current,
        [page]: updateNestedValue(current[page], arrayPath, nextItems),
      };

      draftSiteContentRef.current = next;
      return next;
    });
  };

  const countByStatus = (status: InquiryStatus) => items.filter((item) => item.status === status).length;

  const [selectedHeaderMenuIndex, setSelectedHeaderMenuIndex] = useState(0);

  useEffect(() => {
    setSelectedHeaderMenuIndex((current) => {
      const maxIndex = Math.max(0, draftSiteContent.menus.headerItems.length - 1);
      return Math.min(current, maxIndex);
    });
  }, [draftSiteContent.menus.headerItems.length]);

  const renderMenuManager = () => {
    const headerItems = draftSiteContent.menus.headerItems;
    const footerLinks = draftSiteContent.menus.footerQuickLinks;
    const selectedHeaderMenu = headerItems[selectedHeaderMenuIndex];
    const isAboutHeaderMenu = normalizeEditorMenuPath(selectedHeaderMenu?.path || '') === '/about';
    const canAddChildMenu = Boolean(selectedHeaderMenu) && (!isAboutHeaderMenu || selectedHeaderMenu.children.length < 3);

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
                onClick={handleAddHeaderMenuItem}
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
                    <ChevronRight size={16} color="#999" />
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
                  if (selectedHeaderMenu && canAddChildMenu) {
                    handleAddHeaderMenuChild(selectedHeaderMenuIndex);
                  }
                }}
                disabled={!canAddChildMenu}
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
                  {isAboutHeaderMenu ? (
                    <p className="admin-helper-text">회사소개 내부 메뉴와 연동되므로 하위 메뉴는 최대 3개까지 관리할 수 있습니다.</p>
                  ) : null}
                </div>

                <div className="admin-field-grid--full" style={{ marginTop: '16px' }}>
                  <div className="admin-image-card" style={{ gridTemplateColumns: '240px minmax(0, 1fr)', padding: '24px' }}>
                    <div className="admin-image-card__preview" style={{ height: '135px' }}>
                      {selectedHeaderMenu.imageUrl ? (
                        <img src={selectedHeaderMenu.imageUrl} alt="메가메뉴 미리보기" />
                      ) : (
                        <span>이미지 없음</span>
                      )}
                    </div>
                    <div className="admin-image-card__body">
                      <strong>메가메뉴 우측 이미지</strong>
                      <div className="admin-editor-grid" style={{ gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <label className="form-field">
                          <span>이미지 URL</span>
                          <input
                            type="text"
                            placeholder="https://..."
                            value={selectedHeaderMenu.imageUrl || ''}
                            onChange={(event) =>
                              handleContentTextFieldChange('menus', ['headerItems', selectedHeaderMenuIndex, 'imageUrl'], event.target.value)
                            }
                          />
                        </label>
                        <label className="form-field">
                          <span>직접 업로드</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(event) => {
                              handleImageUpload('menus', ['headerItems', selectedHeaderMenuIndex, 'imageUrl'], event.target.files?.[0] || null);
                              event.currentTarget.value = '';
                            }}
                          />
                        </label>
                      </div>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                        <button
                          type="button"
                          className="button admin-image-card__delete"
                          style={{ minHeight: '40px', padding: '0 16px' }}
                          onClick={() => {
                            if (selectedHeaderMenu.imageUrl) {
                              void handleImageDelete('menus', ['headerItems', selectedHeaderMenuIndex, 'imageUrl'], selectedHeaderMenu.imageUrl);
                            }
                          }}
                          disabled={!selectedHeaderMenu.imageUrl}
                        >
                          이미지 삭제
                        </button>
                        <p className="admin-helper-text" style={{ marginTop: 0, alignSelf: 'center' }}>
                          {uploadingFieldKey === `menus:headerItems.${selectedHeaderMenuIndex}.imageUrl`
                            ? '업로드 중...'
                            : '권장 비율 16:9 (최소 800x450px)'}
                        </p>
                      </div>
                    </div>
                  </div>
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
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: '#999' }}>
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
                            onChange={(e) => handleManagedHeaderChildLabelChange(selectedHeaderMenuIndex, childIndex, e.target.value)}
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
                                {isLockedPath ? <small className="admin-helper-text">현재 구현된 페이지와 연결돼 있어 경로는 고정됩니다. 운영사례/협력업체 카테고리 메뉴는 이름 기준으로 자동 연결돼.</small> : null}
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
  const filteredAdminAccounts = useMemo(
    () =>
      adminAccounts.filter((account) => {
        const matchesApproval =
          adminApprovalFilter === 'all'
            ? true
            : adminApprovalFilter === 'approved'
              ? account.approved
              : !account.approved;
        const keyword = adminSearch.trim().toLowerCase();

        if (!keyword) {
          return matchesApproval;
        }

        const matchesSearch = [account.name, account.email, account.provider]
          .join(' ')
          .toLowerCase()
          .includes(keyword);

        return matchesApproval && matchesSearch;
      }),
    [adminAccounts, adminApprovalFilter, adminSearch],
  );

  const selectedEditorPageMeta = editorPages.find((page) => page.id === selectedEditorPage) || editorPages[0];
  const selectedContentKey = selectedEditorPageMeta.contentKey;
  const selectedCopyDefinition =
    resolvedEditableSections.find((section) => section.key === selectedContentKey) || resolvedEditableSections[0];
  const selectedSectionLabels = draftSiteEditor.sectionLabels[selectedEditorPage] || {};
  const selectedContentGroupIds = useMemo(
    () => resolveEditorPageGroupOrder(selectedEditorPageMeta),
    [selectedEditorPageMeta],
  );
  const selectedImageFields = useMemo(
    () => {
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
    const groupMap = new Map(contentSectionGroups[selectedContentKey].map((group) => [group.id, group]));
    return selectedContentGroupIds
      .map((groupId) => groupMap.get(groupId))
      .filter(Boolean) as ContentSectionGroup[];
  }, [selectedContentGroupIds, selectedContentKey]);
  const pendingCount = countByStatus('new') + countByStatus('in_progress');
  const approvedAdminCount = adminAccounts.filter((account) => account.approved).length;
  const pendingAdminCount = adminAccounts.filter((account) => !account.approved).length;
  const googleAdminCount = adminAccounts.filter((account) => account.provider === 'google').length;
  const pendingAdminPreview = adminAccounts.filter((account) => !account.approved).slice(0, 3);
  const recentItems = items.slice(0, 3);
  const adminInitial = adminUser?.name.trim().charAt(0) || 'M';

  useEffect(() => {
    if (selectedContentGroups.length === 0) {
      setSelectedCmsSectionId('');
      return;
    }

    if (!selectedContentGroups.some((group) => group.id === selectedCmsSectionId)) {
      setSelectedCmsSectionId(selectedContentGroups[0].id);
    }
  }, [selectedCmsSectionId, selectedContentGroupIds, selectedContentGroups]);

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
        setSelectedEditorPage('cases');
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
      title: '문의 처리',
      description: '신규 문의 확인, 상태 변경, 내부 메모 저장을 한 번에 처리합니다.',
      metric: `${pendingCount}건 진행 중`,
      icon: ClipboardList,
      action: () => {
        setActiveNavKey('requests');
        setActiveView('inquiries');
      },
    },
    {
      title: '가입 승인 관리',
      description: '회원가입한 계정 상태를 보고 관리자 권한을 바로 부여하거나 해제합니다.',
      metric: `${pendingAdminCount}명 승인 대기`,
      icon: Users,
      action: () => {
        setActiveNavKey('admins');
        setActiveView('admins');
      },
    },
  ];

  return (
    <>
      <PageMeta
        title="관리자"
        description="마이스파트너 홈페이지와 문의를 관리하는 관리자 대시보드입니다."
        canonicalPath="/admin"
        noIndex
      />
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
                  key: 'admins',
                  label: '가입 승인 관리',
                  icon: Users,
                  view: 'admins',
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
                  key: 'requests',
                  label: '문의 관리',
                  icon: ClipboardList,
                  view: 'inquiries',
                })}
                {renderNavItem({
                  key: 'faq',
                  label: 'FAQ 관리',
                  icon: CircleHelp,
                  view: 'faq',
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
                      : activeView === 'admins'
                        ? '가입 상태 확인 및 관리자 권한 관리'
                      : activeView === 'content'
                        ? `${selectedEditorPageMeta.title} 편집`
                        : activeView === 'faq'
                          ? '고객센터 FAQ 관리'
                          : '문의 관리'}
                  </span>
                </div>
              </div>

              <div className="admin-topbar__actions">
                <div className="admin-user-chip">
                  <span className="admin-user-chip__avatar">{adminInitial}</span>
                  <span className="admin-user-chip__meta">
                    <strong>{adminUser.name}</strong>
                    <small>{adminUser.email} · {adminUser.approved ? '승인된 관리자' : '승인 대기'}</small>
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
                          setActiveNavKey('admins');
                          setActiveView('admins');
                        }}
                      >
                        가입 승인 관리
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
                      <span>승인 대기 관리자</span>
                      <strong>{pendingAdminCount}</strong>
                      <p>현재 승인 전 상태로 대기 중인 계정</p>
                    </motion.article>
                  </section>

                  <section className="admin-panel admin-panel--approval">
                    <div className="admin-panel__header admin-panel__header--stack">
                      <div>
                        <p className="admin-panel__eyebrow">가입 요청</p>
                        <h2>새 관리자 가입 요청</h2>
                        <p className="admin-panel__description">
                          새로 가입한 계정은 기본적으로 승인 대기 상태로 들어옵니다. 여기서 승인하면 어드민과 프론트 편집 화면 접근이 바로 열립니다.
                        </p>
                      </div>
                      <div className="admin-approval-summary">
                        <span>승인됨 {approvedAdminCount}명</span>
                        <span>대기 {pendingAdminCount}명</span>
                      </div>
                    </div>

                    {adminAccountsError ? <p className="form-feedback form-feedback--error">{adminAccountsError}</p> : null}
                    {adminAccountsLoading ? <p className="admin-empty">관리자 계정 목록을 불러오는 중입니다.</p> : null}
                    {!adminAccountsLoading && adminAccounts.length === 0 ? (
                      <p className="admin-empty">아직 등록된 관리자 계정이 없습니다.</p>
                    ) : null}
                    {!adminAccountsLoading && adminAccounts.length > 0 && pendingAdminPreview.length === 0 ? (
                      <p className="admin-empty">현재 승인 대기 중인 가입 요청은 없습니다.</p>
                    ) : null}

                    {!adminAccountsLoading && pendingAdminPreview.length > 0 ? (
                      <div className="admin-approval-list">
                        {pendingAdminPreview.map((account) => {
                          const isCurrentAdmin = adminUser?.id === account.id;
                          const isUpdating = updatingAdminId === account.id;

                          return (
                            <article key={account.id} className="admin-approval-item">
                              <div className="admin-approval-item__meta">
                                <div className="admin-approval-item__identity">
                                  <strong>{account.name}</strong>
                                  <span>{account.email}</span>
                                </div>
                                <div className="admin-approval-item__details">
                                  <span>{account.provider === 'google' ? 'Google 로그인' : '이메일 로그인'}</span>
                                  <span>{account.approved ? '승인됨' : '승인 대기'}</span>
                                  <span>{new Date(account.createdAt).toLocaleString('ko-KR')}</span>
                                  {isCurrentAdmin ? <span>현재 로그인</span> : null}
                                </div>
                              </div>

                              <div className="admin-approval-item__actions">
                                <button
                                  type="button"
                                  className={`button ${account.approved ? 'button--light' : 'button--primary'}`}
                                  onClick={() => void handleAdminApprovalChange(account, !account.approved)}
                                  disabled={isUpdating || (isCurrentAdmin && account.approved)}
                                  title={isCurrentAdmin && account.approved ? '현재 로그인한 관리자 본인은 승인 해제할 수 없습니다.' : undefined}
                                >
                                  {isUpdating
                                    ? '저장 중...'
                                    : account.approved
                                      ? isCurrentAdmin
                                        ? '현재 승인 유지'
                                        : '권한 해제'
                                      : '관리자 권한 부여'}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}

                    <div className="admin-panel__header" style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #eef2f6' }}>
                      <div>
                        <p className="admin-panel__description">전체 계정 상태 확인과 검색은 전용 메뉴에서 바로 볼 수 있어.</p>
                      </div>
                      <button
                        type="button"
                        className="admin-inline-button"
                        onClick={() => {
                          setActiveNavKey('admins');
                          setActiveView('admins');
                        }}
                      >
                        가입 승인 관리 열기
                      </button>
                    </div>
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
                              <strong>페이지 경로</strong>
                              <p>{selectedEditorPageMeta.path || '공통 운영 영역'}</p>
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
                                {selectedContentKey === 'about' ? (
                                  <p className="admin-helper-text" style={{ marginTop: '8px' }}>
                                    본문은 빈 줄을 넣어 문단을 나누면 회사소개 페이지에서도 문단 단위로 표시된다.
                                  </p>
                                ) : null}
                                <div className="admin-field-grid" style={{ marginTop: '12px' }}>
                                  {groupFields.map(([field, label]) => (
                                    <label key={field} className="form-field">
                                      <span>{label}</span>
                                      <textarea
                                        rows={getCopyFieldRows(selectedContentKey, field, (draftSiteCopy[selectedContentKey] as Record<string, string>)[field] || '')}
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
                                    groupArrayAction &&
                                    nestedGroupMeta.page === groupArrayAction.page &&
                                    pathsEqual(nestedGroupMeta.arrayPath, groupArrayAction.arrayPath);
                                  const preventDeleteLastItem =
                                    Boolean(nestedGroupMeta) &&
                                    nestedGroupMeta.page === 'home' &&
                                    pathsEqual(nestedGroupMeta.arrayPath, ['heroSlides']) &&
                                    currentItemCount <= 1;

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
                                            disabled={preventDeleteLastItem}
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
                            <p style={{ textAlign: 'center', marginTop: '12px', color: '#999', fontSize: '13px' }}>
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

              {activeView === 'admins' ? (
                <>
                  <section className="admin-overview-stats">
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>전체 계정</span>
                      <strong>{adminAccounts.length}</strong>
                      <p>가입된 관리자 계정 수</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>승인 완료</span>
                      <strong>{approvedAdminCount}</strong>
                      <p>바로 편집 가능한 계정</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>승인 대기</span>
                      <strong>{pendingAdminCount}</strong>
                      <p>권한 부여를 기다리는 계정</p>
                    </motion.article>
                    <motion.article {...fadeUp} className="admin-overview-stat">
                      <span>Google 가입</span>
                      <strong>{googleAdminCount}</strong>
                      <p>Google 로그인으로 들어온 계정</p>
                    </motion.article>
                  </section>

                  <section className="admin-panel admin-panel--approval">
                    <div className="admin-panel__header admin-panel__header--stack">
                      <div>
                        <p className="admin-panel__eyebrow">관리자 계정</p>
                        <h2>가입 승인 관리</h2>
                        <p className="admin-panel__description">
                          누가 가입했는지 바로 확인하고, 승인 대기 상태인 계정에 관리자 권한을 줄 수 있게 정리했습니다.
                        </p>
                      </div>
                      <div className="admin-approval-summary">
                        <span>승인됨 {approvedAdminCount}명</span>
                        <span>대기 {pendingAdminCount}명</span>
                      </div>
                    </div>

                    <div className="content-grid-2">
                      <label className="form-field">
                        <span>계정 검색</span>
                        <div className="admin-search-field">
                          <Search size={16} />
                          <input
                            type="text"
                            value={adminSearch}
                            onChange={(event) => setAdminSearch(event.target.value)}
                            placeholder="이름, 이메일, 로그인 방식 검색"
                          />
                        </div>
                      </label>
                      <label className="form-field">
                        <span>가입 상태</span>
                        <select
                          value={adminApprovalFilter}
                          onChange={(event) => setAdminApprovalFilter(event.target.value as AdminApprovalFilter)}
                        >
                          <option value="all">전체</option>
                          <option value="pending">승인 대기</option>
                          <option value="approved">승인 완료</option>
                        </select>
                      </label>
                    </div>

                    {adminAccountsError ? <p className="form-feedback form-feedback--error">{adminAccountsError}</p> : null}
                    {adminAccountsLoading ? <p className="admin-empty">관리자 계정 목록을 불러오는 중입니다.</p> : null}
                    {!adminAccountsLoading && adminAccounts.length === 0 ? (
                      <p className="admin-empty">아직 등록된 관리자 계정이 없습니다.</p>
                    ) : null}
                    {!adminAccountsLoading && adminAccounts.length > 0 && filteredAdminAccounts.length === 0 ? (
                      <p className="admin-empty">현재 조건에 맞는 관리자 계정이 없습니다.</p>
                    ) : null}

                    {!adminAccountsLoading && filteredAdminAccounts.length > 0 ? (
                      <div className="admin-approval-list">
                        {filteredAdminAccounts.map((account) => {
                          const isCurrentAdmin = adminUser?.id === account.id;
                          const isUpdating = updatingAdminId === account.id;

                          return (
                            <article key={account.id} className="admin-approval-item admin-approval-item--stack">
                              <div className="admin-approval-item__meta">
                                <div className="admin-approval-item__identity">
                                  <strong>{account.name}</strong>
                                  <span>{account.email}</span>
                                </div>
                                <div className="admin-approval-item__details">
                                  <span>{account.provider === 'google' ? 'Google 로그인' : '이메일 로그인'}</span>
                                  <span className={account.approved ? 'admin-access-badge admin-access-badge--approved' : 'admin-access-badge admin-access-badge--pending'}>
                                    {account.approved ? '관리자 권한 있음' : '승인 대기'}
                                  </span>
                                  <span>가입일 {new Date(account.createdAt).toLocaleString('ko-KR')}</span>
                                  {isCurrentAdmin ? <span>현재 로그인</span> : null}
                                </div>
                              </div>

                              <div className="admin-approval-item__actions">
                                <button
                                  type="button"
                                  className={`button ${account.approved ? 'button--light' : 'button--primary'}`}
                                  onClick={() => void handleAdminApprovalChange(account, !account.approved)}
                                  disabled={isUpdating || (isCurrentAdmin && account.approved)}
                                  title={isCurrentAdmin && account.approved ? '현재 로그인한 관리자 본인은 승인 해제할 수 없습니다.' : undefined}
                                >
                                  {isUpdating
                                    ? '저장 중...'
                                    : account.approved
                                      ? isCurrentAdmin
                                        ? '현재 승인 유지'
                                        : '권한 해제'
                                      : '관리자 권한 부여'}
                                </button>
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : null}
                  </section>
                </>
              ) : null}

              {activeView === 'faq' ? (
                <div className="admin-faq-container">
                  <div className="admin-faq-header">
                    <div className="admin-faq-title">
                      <h2>
                        <CircleHelp size={24} style={{ color: 'var(--brand)' }} />
                        고객센터 FAQ 관리
                      </h2>
                      <p>고객센터 페이지에 표시될 자주 묻는 질문을 관리합니다.</p>
                    </div>
                    <div className="admin-faq-actions">
                      <button
                        type="button"
                        className="button button--light"
                        onClick={() => setIsCategoryModalOpen(true)}
                        style={{ borderRadius: 0, height: '48px' }}
                      >
                        <Plus size={18} />
                        카테고리 관리
                      </button>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => setIsFaqModalOpen(true)}
                        style={{ background: 'var(--brand)', border: 'none', borderRadius: 0, height: '48px' }}
                      >
                        <Plus size={18} />
                        FAQ 추가
                      </button>
                      <button
                        type="button"
                        className="button button--primary"
                        onClick={() => void handleSaveContent('고객센터 FAQ', 'faq:items')}
                        disabled={isSavingContent}
                        style={{ borderRadius: 0, height: '48px' }}
                      >
                        <Save size={18} />
                        {isSavingContent && savingScopeKey === 'faq:items' ? '저장 중...' : '전체 저장'}
                      </button>
                    </div>
                  </div>

                  {contentMessage && savingScopeKey === 'faq:items' && (
                    <div className="form-feedback form-feedback--success" style={{ marginBottom: '24px' }}>
                      {contentMessage}
                    </div>
                  )}

                  <div className="admin-faq-list">
                    {draftSiteContent.support.faqs.map((faq, index) => (
                      <motion.article key={index} {...fadeUp} className="admin-faq-item-card">
                        <div className="admin-faq-item-badge">
                          <span className="admin-faq-id">ID: {index + 4}</span>
                          <span className="admin-faq-cat-tag" style={{ color: 'var(--brand)', background: 'var(--brand-soft)' }}>{faq.category}</span>
                        </div>
                        <button
                          type="button"
                          className="admin-modal-close"
                          style={{ top: '24px', right: '24px' }}
                          onClick={() => {
                            setDraftSiteContent(current => ({
                              ...current,
                              support: {
                                ...current.support,
                                faqs: current.support.faqs.filter((_, i) => i !== index)
                              }
                            }));
                          }}
                        >
                          <Trash2 size={18} color="#999" />
                        </button>
                        <h3 className="admin-faq-question">Q. {faq.question}</h3>
                        <p className="admin-faq-answer">A. {faq.answer}</p>
                      </motion.article>
                    ))}
                  </div>

                  {/* Category Management Modal */}
                  {isCategoryModalOpen && (
                    <div className="admin-modal-overlay">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-modal-content">
                        <button type="button" className="admin-modal-close" onClick={() => setIsCategoryModalOpen(false)}>
                          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                        <div className="admin-modal-header">
                          <Plus size={24} style={{ color: 'var(--brand)' }} />
                          <h2>FAQ 카테고리 관리</h2>
                        </div>
                        
                        <div className="admin-modal-cat-add">
                          <input
                            type="text"
                            className="admin-modal-input"
                            placeholder="새 카테고리명 입력"
                            value={newCategoryName}
                            onChange={(e) => setNewCategoryName(e.target.value)}
                          />
                          <button type="button" className="admin-btn-cat-add" onClick={handleAddCategory}>
                            + 추가
                          </button>
                        </div>

                        <div className="admin-cat-list">
                          {draftSiteContent.support.faqCategories.filter(c => c !== '전체').map((cat, idx) => (
                            <div key={idx} className="admin-cat-item">
                              <div className="admin-cat-info">
                                <span className="admin-cat-index">{idx + 1}</span>
                                <span className="admin-cat-name">{cat}</span>
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <span className="admin-cat-count">
                                  {draftSiteContent.support.faqs.filter(f => f.category === cat).length}건
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDraftSiteContent(current => ({
                                      ...current,
                                      support: {
                                        ...current.support,
                                        faqCategories: current.support.faqCategories.filter(c => c !== cat)
                                      }
                                    }));
                                  }}
                                  style={{ border: 'none', background: 'none', padding: '4px', cursor: 'pointer' }}
                                >
                                  <Trash2 size={14} color="#999" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <p className="admin-cat-footer-note">
                          카테고리명을 수정하면 해당 카테고리의 FAQ도 자동으로 업데이트됩니다.
                        </p>
                      </motion.div>
                    </div>
                  )}

                  {/* Add FAQ Modal */}
                  {isFaqModalOpen && (
                    <div className="admin-modal-overlay">
                      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="admin-modal-content">
                        <button type="button" className="admin-modal-close" onClick={() => setIsFaqModalOpen(false)}>
                          <Plus size={24} style={{ transform: 'rotate(45deg)' }} />
                        </button>
                        <div className="admin-modal-header">
                          <h2>새 FAQ 등록</h2>
                        </div>
                        
                        <div className="admin-modal-form">
                          <div className="admin-modal-grid">
                            <div className="admin-modal-field">
                              <label>카테고리</label>
                              <select
                                className="admin-modal-input"
                                value={faqForm.category}
                                onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })}
                              >
                                {draftSiteContent.support.faqCategories.filter(c => c !== '전체').map(cat => (
                                  <option key={cat} value={cat}>{cat}</option>
                                ))}
                              </select>
                            </div>
                            <div className="admin-modal-field">
                              <label>노출 순서</label>
                              <input
                                type="number"
                                className="admin-modal-input"
                                value={faqForm.order}
                                onChange={(e) => setFaqForm({ ...faqForm, order: parseInt(e.target.value) })}
                              />
                            </div>
                          </div>

                          <div className="admin-modal-field">
                            <label>질문 (Question)</label>
                            <input
                              type="text"
                              className="admin-modal-input"
                              placeholder="질문을 입력해주세요"
                              value={faqForm.question}
                              onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })}
                            />
                          </div>

                          <div className="admin-modal-field">
                            <label>답변 (Answer)</label>
                            <textarea
                              className="admin-modal-textarea"
                              placeholder="상세 답변 내용을 입력해주세요"
                              value={faqForm.answer}
                              onChange={(e) => setFaqForm({ ...faqForm, answer: e.target.value })}
                            />
                          </div>

                          <div className="admin-modal-footer">
                            <button type="button" className="admin-btn-cancel" onClick={() => setIsFaqModalOpen(false)}>
                              취소
                            </button>
                            <button type="button" className="admin-btn-submit" style={{ background: 'var(--brand)' }} onClick={handleAddFaq}>
                              <Save size={20} />
                              FAQ 등록하기
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          </div>
        </main>
      )}
    </>
  );
}
