import {
  BadgeCheck,
  BarChart3,
  Building2,
  CalendarRange,
  FileSpreadsheet,
  Globe2,
  Handshake,
  LayoutDashboard,
  MapPinned,
  MessagesSquare,
  QrCode,
  Ticket,
  Users2,
} from 'lucide-react';
import type { NavItem, ProcessStep, ServiceCard, Stat, ValueCard } from './types';

export const navItems: NavItem[] = [
  {
    label: '서비스',
    to: '/services',
    children: [
      { label: '통합 운영 서비스', to: '/services#service-modules' },
      { label: '협업 프로세스', to: '/services#service-flow' },
    ],
  },
  {
    label: '포트폴리오',
    to: '/cases',
    children: [
      { label: '대표 프로젝트', to: '/cases#portfolio-list' },
      { label: '기업·기관 행사 사례', to: '/cases?category=포럼%20및%20설명회#portfolio-list' },
      { label: '브랜드 초청 행사 사례', to: '/cases?category=기업%20초청%20행사#portfolio-list' },
    ],
  },
  {
    label: '정보센터',
    to: '/resources',
    children: [
      { label: '소식', to: '/resources/notices' },
      { label: '자료', to: '/resources/files' },
    ],
  },
  {
    label: '문의',
    to: '/contact',
    children: [
      { label: '상담 안내', to: '/contact#contact-options' },
      { label: '문의 접수', to: '/contact#contact-form' },
    ],
  },
];

export const heroStats: Stat[] = [
  { label: '주요 고객군', value: '기업 · 기관', detail: '기업행사, 공공행사, 학회, 설명회, 포럼' },
  { label: '제공 범위', value: '기획 ~ 운영', detail: '행사 준비부터 현장 운영, 사후 정리까지 지원' },
  { label: '포트폴리오 방향', value: '설치사례 중심', detail: '실제 운영 사례와 결과 중심으로 소개 가능' },
];

export const valueCards: ValueCard[] = [
  {
    title: '실행 중심 제안',
    description: '기획만 제안하는 것이 아니라 실제 운영 가능한 범위와 절차를 같이 제시합니다.',
    icon: Building2,
  },
  {
    title: '현장 대응 경험',
    description: '등록, 안내, 체크인, 운영 인력, 협력사 조율 같은 현장 업무를 기준으로 일합니다.',
    icon: Ticket,
  },
  {
    title: '보고 가능한 결과 정리',
    description: '행사 종료 후 내부 보고나 고객 보고에 활용할 수 있는 정리 구조를 함께 만듭니다.',
    icon: BarChart3,
  },
];

export const serviceCards: ServiceCard[] = [
  {
    title: '행사 기획 및 운영',
    description: '행사 목적과 대상에 맞게 프로그램 구성, 운영 동선, 인력 계획을 정리합니다.',
    points: ['운영 시나리오 정리', '현장 동선 설계', '운영 체크리스트'],
    icon: LayoutDashboard,
  },
  {
    title: '행사 홈페이지 제작',
    description: '참가자 안내와 문의 전환에 필요한 기업형 행사 홈페이지를 구축합니다.',
    points: ['행사 소개 페이지', '연사/프로그램 안내', '문의 및 신청 연결'],
    icon: Globe2,
  },
  {
    title: '참가자 등록 및 응대',
    description: '초청 대상자, 사전등록, 현장 접수, 문의 대응 흐름을 정리합니다.',
    points: ['참가자 명단 관리', '사전 안내 메일', '현장 등록 동선'],
    icon: FileSpreadsheet,
  },
  {
    title: '현장 체크인 지원',
    description: '행사 당일 등록 데스크와 참석 확인, 현장 안내 업무를 체계적으로 운영합니다.',
    points: ['QR 체크인 보조', '배지/명찰 운영', '현장 안내 체계'],
    icon: QrCode,
  },
  {
    title: '협력사 커뮤니케이션',
    description: '장소, 장비, 인쇄물, 케이터링, 운영 인력 등 협력사와의 업무를 조율합니다.',
    points: ['협력사 일정 조율', '발주 체크', '현장 이슈 대응'],
    icon: Handshake,
  },
  {
    title: '사후 결과 정리',
    description: '행사 종료 후 사진, 결과, 이슈, 개선 포인트를 정리해 다음 행사에 반영할 수 있게 합니다.',
    points: ['결과 리포트 정리', '사진/자료 아카이빙', '다음 행사 개선 포인트'],
    icon: CalendarRange,
  },
];

export const processSteps: ProcessStep[] = [
  {
    step: '01',
    title: '요구사항 파악',
    description: '행사 목적, 대상, 일정, 규모를 기준으로 어떤 지원이 필요한지 먼저 정리합니다.',
  },
  {
    step: '02',
    title: '제안 및 준비',
    description: '운영 범위, 인력, 제작물, 홈페이지, 참가자 응대 흐름을 구체적으로 제안합니다.',
  },
  {
    step: '03',
    title: '현장 운영 및 정리',
    description: '행사 당일 운영을 실행하고 종료 후 결과 자료와 개선 포인트를 정리합니다.',
  },
];

export const partnerHighlights = [
  {
    title: '대전 지역 이해도',
    description: '행사 장소, 협력 파트너, 운영 흐름을 지역 문맥에 맞춰 설계할 수 있습니다.',
    icon: MapPinned,
  },
  {
    title: '운영 커뮤니케이션',
    description: '주최기관, 협력사, 현장 스태프가 같은 기준으로 움직이도록 구조를 정리합니다.',
    icon: MessagesSquare,
  },
  {
    title: '기업 홈페이지 관점',
    description: '회사 소개, 서비스 설명, 설치사례, 문의 전환이 자연스럽게 연결되도록 구성합니다.',
    icon: Globe2,
  },
];

export const aboutPoints = [
  '마이스파트너는 행사 기획과 운영 실무를 기반으로 움직이는 회사 소개형 홈페이지가 필요합니다.',
  '이 사이트는 회사가 어떤 서비스를 제공하는지, 어떤 식으로 일하는지, 어떤 사례가 있는지를 보여주는 용도입니다.',
  '실제 회사 정보와 포트폴리오는 추후 직접 입력할 수 있도록 placeholder 구조를 남겨두었습니다.',
];

export const contactPoints = [
  { label: '운영 문의', icon: MessagesSquare },
  { label: '제안서 요청', icon: FileSpreadsheet },
  { label: '포트폴리오 문의', icon: MapPinned },
];

export const footerPoints = [
  { label: '기업 홈페이지 구조', icon: Users2 },
  { label: '서비스 소개 + 포트폴리오 + 문의', icon: MapPinned },
];

export const proofItems = [
  { label: '회사 소개 페이지', icon: BadgeCheck },
  { label: '서비스 안내 페이지', icon: BadgeCheck },
  { label: '포트폴리오 페이지', icon: BadgeCheck },
];

export const ownerTodoPlaceholders = [
  '회사 소개 문구와 대표 메시지는 실제 정보로 교체 필요',
  '대표 연락처, 메일, 주소, 사업자 정보는 직접 입력 필요',
  '실제 설치사례, 고객사 로고, 포트폴리오 이미지는 직접 입력 필요',
  '공지사항 제목, 자료실 파일 링크, 게시 일자는 직접 입력 필요',
];
