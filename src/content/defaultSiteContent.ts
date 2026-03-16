import type { SitePageContent } from '../types/siteContent';

function createTextLogoDataUrl(label: string, width = 720, height = 240, fontSize = 34) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
      <rect width="100%" height="100%" fill="#f1f5f9"/>
      <text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="${fontSize}" font-weight="bold" fill="#475569">${label}</text>
    </svg>
  `;
  return `data:image/svg+xml;base64,${btoa(svg)}`;
}

export const defaultSiteContent: SitePageContent = {
  home: {
    servicePreviewEyebrow: 'Our Services',
    servicePreviewImageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
    heroEyebrow: 'Professional MICE Partner',
    heroBadge: 'Leading the future of events',
    heroImageUrl:
      'https://images.unsplash.com/photo-1540575861501-7c0351a773a5?auto=format&fit=crop&w=2000&q=80',
    heroSlides: [
      {
        title: '행사기획부터 운영까지',
        description:
          '대전과 충청권 현장 환경을 이해한 운영 파트너로서 행사 홈페이지, 등록 운영, 참가자 안내, 현장 진행까지 하나의 흐름으로 연결합니다.',
        imageUrl:
          'https://images.unsplash.com/photo-1540575861501-7c0351a773a5?auto=format&fit=crop&w=2000&q=80',
      },
      {
        title: '브랜드와 목적에 맞는 운영 구조 설계',
        description:
          '설명회, 포럼, 기업 행사, 공공 프로젝트까지 목적에 맞는 운영 범위를 먼저 정리하고 실제 실행 가능한 구조로 제안합니다.',
        imageUrl:
          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=2000&q=80',
      },
      {
        title: '현장 데이터와 결과까지 이어지는 관리',
        description:
          '참가 신청부터 체크인, 현장 응대, 결과 정리까지 운영 데이터를 남겨 다음 프로젝트에도 이어질 수 있는 기반을 만듭니다.',
        imageUrl:
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=2000&q=80',
      },
    ],
    heroPanelStatus: '운영 중인 행사',
    heroPanelTitle: '실시간 등록 현황',
    heroPanelMetrics: [
      { label: '참가 신청', value: '1,284' },
      { label: '현장 체크인', value: '856' },
    ],
    heroStats: [
      { label: '누적 행사', value: '450+', detail: '성공적인 컨퍼런스 및 포럼 운영' },
      { label: '파트너사', value: '120+', detail: '공공기관 및 글로벌 기업 협업' },
      { label: '고객 만족도', value: '98%', detail: '다시 찾는 MICE 전문 파트너' },
    ],
    positioningCards: [
      {
        title: '통합 운영 솔루션',
        description: '기획부터 현장 운영, 사후 관리까지 복잡한 행사 프로세스를 하나의 흐름으로 연결합니다.',
        iconKey: 'layers',
      },
      {
        title: '데이터 기반 의사결정',
        description: '실시간 등록 데이터와 참가자 분석을 통해 행사의 성과를 정밀하게 측정하고 보고합니다.',
        iconKey: 'bar-chart',
      },
      {
        title: '현장 중심 실행력',
        description: '수많은 현장 경험을 보유한 전문 스태프가 돌발 상황에도 유연하게 대처하며 완벽한 운영을 보장합니다.',
        iconKey: 'shield',
      },
    ],
    proofItems: [
      { label: '실시간 참가자 관리', iconKey: 'users' },
      { label: '맞춤형 등록 시스템', iconKey: 'check-square' },
      { label: '전문 현장 운영팀', iconKey: 'award' },
      { label: '정밀 성과 분석 보고', iconKey: 'trending-up' },
    ],
    partnerLogos: [
      { name: '대전광역시', imageUrl: createTextLogoDataUrl('DAEJEON') },
      { name: '세종특별자치시', imageUrl: createTextLogoDataUrl('SEJONG') },
      { name: '한국관광공사', imageUrl: createTextLogoDataUrl('KTO') },
      { name: '대전관광공사', imageUrl: createTextLogoDataUrl('DTO') },
      { name: '충청남도', imageUrl: createTextLogoDataUrl('CHUNGNAM') },
      { name: 'KAIST', imageUrl: createTextLogoDataUrl('KAIST') },
      { name: '연구개발특구진흥재단', imageUrl: createTextLogoDataUrl('INNOPOLIS') },
      { name: '국가과학기술연구회', imageUrl: createTextLogoDataUrl('NST') },
    ],
    primaryCtaLabel: '서비스 안내',
    primaryCtaHref: '/services',
    secondaryCtaLabel: '포트폴리오',
    secondaryCtaHref: '/cases',
    ctaButtonLabel: '지금 문의하기',
    ctaImageUrl:
      'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=2000&q=80',
  },
  services: {
    introEyebrow: 'What We Do',
    modulesEyebrow: 'Service Modules',
    flowEyebrow: 'Work Flow',
    heroImageUrl:
      'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=2000&q=80',
    modules: [
      {
        title: '행사 기획 및 컨설팅',
        description: '목적에 맞는 컨셉 설정부터 예산 수립, 장소 선정까지 전략적인 가이드를 제공합니다.',
        iconKey: 'briefcase',
      },
      {
        title: '온라인 플랫폼 구축',
        description: '행사 전용 홈페이지, 온라인 등록, 초청장 발송 등 디지털 소통 창구를 구축합니다.',
        iconKey: 'globe',
      },
      {
        title: '참가자 및 연사 관리',
        description: '등록 문의 응대, 연사 섭외 및 케어, VIP 의전 등 사람 중심의 서비스를 제공합니다.',
        iconKey: 'users',
      },
      {
        title: '현장 운영 및 시스템',
        description: '등록 데스크, 인력 배치, 시스템 장비 운영 등 현장의 모든 요소를 컨트롤합니다.',
        iconKey: 'terminal',
      },
      {
        title: '홍보 및 디자인',
        description: '키 비주얼 제작, 온/오프라인 홍보물 디자인, 홍보 채널 운영을 지원합니다.',
        iconKey: 'palette',
      },
      {
        title: '결과 보고 및 분석',
        description: '참석 통계, 만족도 조사, 정산 보고 등 행사의 성과를 데이터로 정리합니다.',
        iconKey: 'clipboard',
      },
    ],
    flowSteps: [
      {
        step: 'STEP 01',
        title: '요구사항 분석',
        description: '행사의 목적, 규모, 타겟을 분석하여 최적의 운영 방향을 제안합니다.',
      },
      {
        step: 'STEP 02',
        title: '전략 기획',
        description: '세부 실행 계획, 예산안, 추진 일정을 수립합니다.',
      },
      {
        step: 'STEP 03',
        title: '준비 및 구축',
        description: '플랫폼 구축, 홍보물 제작, 인력 교육 등 실행을 준비합니다.',
      },
      {
        step: 'STEP 04',
        title: '현장 실행',
        description: '행사 당일 전문 인력이 배치되어 완벽한 운영을 수행합니다.',
      },
      {
        step: 'STEP 05',
        title: '성과 분석',
        description: '데이터 분석을 통한 결과 보고 및 피드백을 전달합니다.',
      },
    ],
  },
  cases: {
    introEyebrow: 'Our Works',
    categoriesEyebrow: 'Categories',
    allCategoryLabel: '전체보기',
    cardsEyebrow: 'Success Stories',
    searchPlaceholder: '사례명, 고객사, 카테고리 검색',
    searchButtonLabel: '검색',
    totalLabel: '전체',
    currentPageLabel: '현재페이지',
    detailLinkLabel: '자세히 보기',
    emptyStateMessage: '해당 카테고리의 사례가 아직 등록되지 않았습니다.',
    emptyStateDescription: '검색어 또는 카테고리 조건을 다시 확인해 주세요.',
    categories: ['컨퍼런스', '포럼 및 설명회', '기업 초청 행사', '정부 및 공공 행사'],
    entries: [
      {
        slug: 'global-ict-forum-2025',
        title: '2025 글로벌 ICT 산업 포럼',
        category: '포럼 및 설명회',
        updatedAt: '2026-03-16',
        description: '전 세계 20개국 ICT 전문가들이 참여한 대규모 하이브리드 포럼 운영',
        outcome: '오프라인 500명, 온라인 2,000명 참여 / 운영 만족도 4.8점',
        imageUrl:
          'https://images.unsplash.com/photo-1540575861501-7c0351a773a5?auto=format&fit=crop&w=1200&q=80',
        content:
          '국내외 전문가들을 초청하여 진행된 이번 포럼은 온/오프라인 동시 송출 시스템을 기반으로 안정적인 기술 운영과 체계적인 참가자 관리가 돋보인 사례입니다.',
      },
      {
        slug: 'regional-mice-alliance-day',
        title: '지역 MICE 얼라이언스 네트워킹 데이',
        category: '정부 및 공공 행사',
        updatedAt: '2026-03-12',
        description: '지역 내 MICE 업계 관계자들의 협력을 위한 네트워킹 행사 기획 및 운영',
        outcome: '80개 회원사 참여 / 12건의 신규 비즈니스 매칭 성사',
        imageUrl:
          'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=1200&q=80',
        content:
          '회원사 간의 실질적인 교류를 목적으로 기획된 이번 행사는 맞춤형 비즈니스 매칭 시스템과 몰입도 높은 프로그램 구성을 통해 참가자들의 큰 호응을 얻었습니다.',
      },
      {
        slug: 'tech-startup-demo-day',
        title: '테크 스타트업 통합 데모데이',
        category: '기업 초청 행사',
        updatedAt: '2026-03-09',
        description: '유망 스타트업의 투자 유치를 위한 IR 피칭 및 전시 부스 운영',
        outcome: '30개 스타트업 참여 / 누적 투자 상담액 50억원 달성',
        imageUrl:
          'https://images.unsplash.com/photo-1559136555-9303baea8ebd?auto=format&fit=crop&w=1200&q=80',
        content:
          '스타트업의 기술력을 가장 잘 보여줄 수 있는 전시 동선 설계와 매끄러운 IR 피칭 진행을 통해 투자자들과 스타트업 간의 연결을 성공적으로 지원했습니다.',
      },
    ],
  },
  resources: {
    introEyebrow: 'Resource Center',
    sectionsEyebrow: 'Board',
    noticesEyebrow: 'Latest News',
    downloadsEyebrow: 'Archives',
    noticeLinkLabel: '전체 뉴스 보기',
    resourceLinkLabel: '자료실 바로가기',
    categories: [
      { id: 'all', label: '전체' },
      { id: 'notice', label: '공지' },
      { id: 'press', label: '보도자료' },
      { id: 'event', label: '행사안내' },
    ],
    notices: [
      {
        slug: 'web-renewal-2026',
        category: '공지',
        title: '마이스파트너 공식 홈페이지 리뉴얼 안내',
        date: '2026. 03. 12',
        summary: '더 나은 서비스 제공을 위해 마이스파트너 홈페이지가 새롭게 단장했습니다.',
        body:
          '안녕하세요, 마이스파트너입니다. 고객 여러분께 더욱 편리하고 전문적인 정보를 전달하기 위해 홈페이지를 전면 리뉴얼했습니다. 앞으로도 많은 관심 부탁드립니다.',
        attachments: [{ label: '리뉴얼 상세 안내.pdf', url: '#' }],
      },
      {
        slug: 'mice-industry-report-q1',
        category: '보도자료',
        title: '2026년 1분기 MICE 산업 트렌드 리포트 발매',
        date: '2026. 02. 28',
        summary: '최근 급변하는 글로벌 MICE 시장의 핵심 트렌드 5가지를 정리했습니다.',
        body:
          '마이스파트너 부설 연구소에서 발행한 이번 리포트는 하이브리드 이벤트의 진화와 AI 기술의 실제 적용 사례를 중심으로 구성되었습니다.',
        attachments: [{ label: '트렌드리포트_샘플.pdf', url: '#' }],
      },
      {
        slug: 'new-office-relocation',
        category: '공지',
        title: '사무실 이전 및 연락처 변경 안내',
        date: '2026. 01. 15',
        summary: '마이스파트너가 새로운 공간에서 더 나은 서비스를 시작합니다.',
        body:
          '사업 확장으로 인해 사무실을 이전하게 되었습니다. 새로운 주소와 변경된 전화번호를 확인해 주시기 바랍니다.',
        attachments: [],
      },
    ],
    items: [
      {
        slug: 'company-profile-2026',
        title: '마이스파트너 회사소개서 (2026)',
        type: 'PDF',
        description: '회사 소개, 운영 범위, 협업 방식이 정리된 기본 회사소개서입니다.',
        fileName: 'micepartner-profile-2026.pdf',
        version: 'v2.1',
        updatedAt: '2026-03-01',
        coverImageUrl:
          'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
        downloadUrl: '/faq',
      },
      {
        slug: 'service-guide-deck',
        title: 'MICE 통합 운영 서비스 가이드',
        type: 'PDF',
        description: '기획부터 결과 보고까지 각 단계별 상세 서비스 내용이 포함된 가이드입니다.',
        fileName: 'micepartner-service-guide.pdf',
        version: 'v1.5',
        updatedAt: '2026-02-15',
        coverImageUrl:
          'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=1200&q=80',
        downloadUrl: '/faq',
      },
      {
        slug: 'portfolio-collection',
        title: '주요 행사 운영 포트폴리오 모음',
        type: 'PDF',
        description: '최근 3년간 진행된 주요 컨퍼런스 및 포럼의 운영 사례집입니다.',
        fileName: 'micepartner-portfolio-deck.pdf',
        version: 'v1.0',
        updatedAt: '2026-03-10',
        coverImageUrl:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
        downloadUrl: '/faq',
      },
    ],
  },
  about: {
    introEyebrow: 'About Us',
    identityEyebrow: 'Our Identity',
    strengthEyebrow: 'Strengths',
    processEyebrow: 'Process',
    heroImageUrl:
      'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=2000&q=80',
    messageTitle: '현장의 가치를 연결하는 진정한 파트너가 되겠습니다.',
    messageBody:
      '마이스파트너는 단순한 대행사가 아닙니다. 행사의 본질을 이해하고, 주최자의 고민을 함께 해결하며, 참가자에게는 최고의 경험을 선사하는 전문 운영 파트너입니다.\n\n우리는 대전·충청 지역의 MICE 생태계에 대한 깊은 이해를 바탕으로 실무에서 즉시 작동하는 운영 표준을 만들어가고 있습니다.',
    identityPoints: [
      '현장 중심의 실행력과 유연한 대응',
      '데이터 기반의 투명한 운영 및 결과 보고',
      '고객의 예산과 목적에 최적화된 맞춤형 솔루션',
    ],
    highlights: [
      {
        title: '검증된 실무 경험',
        description: '정부부처, 지자체, 대기업 등 수많은 프로젝트를 완수하며 쌓아온 노하우를 제공합니다.',
        iconKey: 'check-circle',
      },
      {
        title: '전담 인력 책임제',
        description: '각 프로젝트마다 숙련된 전담 매니저가 배치되어 초기 소통부터 마감까지 책임집니다.',
        iconKey: 'user-check',
      },
      {
        title: '안정적인 인프라',
        description: '등록 시스템, 온/오프라인 장비 등 최적화된 내부 인프라로 오류 없는 행사를 보장합니다.',
        iconKey: 'cpu',
      },
    ],
    processSteps: [
      {
        step: '01',
        title: '문의 수집',
        description: '고객의 요청 범위를 빠르게 파악해 필요한 자료와 다음 액션을 정리합니다.',
      },
      {
        step: '02',
        title: '운영 설계',
        description: '행사 운영 범위, 안내 구조, 협업 포인트를 실제 실행 관점에서 정리합니다.',
      },
      {
        step: '03',
        title: '실행과 회고',
        description: '행사 운영 후 결과와 개선 포인트를 남겨 반복 가능한 운영 체계를 만듭니다.',
      },
    ],
  },
  support: {
    introEyebrow: 'Customer Center',
    title: '고객센터',
    description: '어려움이나 궁금한 점이 있으신가요?',
    phone: '1800-1985',
    hours: '고객행복센터(전화): 오전 9시 ~ 오후 6시 운영\n채팅 상담 문의: 24시간 운영',
    chatLabel: '채팅 상담',
    chatHref: 'https://pf.kakao.com/',
    faqTitle: '자주 묻는 질문',
    faqCategories: ['전체', '서비스 이용', '견적/신청', '운영/현장', '결제/서류', '취소/변경'],
    faqs: [
      {
        category: '서비스 이용',
        question: '마이스파트너는 어떤 서비스인가요?',
        answer: '마이스파트너는 행사 기획, 홈페이지 제작, 참가자 등록 및 현장 운영까지 전 과정을 지원하는 통합 MICE 운영 서비스입니다.',
      },
      {
        category: '서비스 이용',
        question: '개인도 이용할 수 있나요?',
        answer: '네, 기업이나 기관뿐만 아니라 개인 주최자분들도 행사 규모에 맞춰 서비스를 이용하실 수 있습니다.',
      },
      {
        category: '서비스 이용',
        question: '회원가입을 해야 서비스 이용이 가능한가요?',
        answer: '홈페이지 이용은 별도 가입 없이 가능하며, 문의 및 상담 신청을 통해 맞춤형 서비스를 제공받으실 수 있습니다.',
      },
      {
        category: '견적/신청',
        question: '견적 확인은 어떻게 하나요?',
        answer: '문의 페이지를 통해 행사 개요를 남겨주시면, 담당자가 확인 후 24시간 이내에 예상 견적과 안내 자료를 보내드립니다.',
      },
      {
        category: '운영/현장',
        question: '현장 스태프만 별도로 요청할 수 있나요?',
        answer: '네, 등록 데스크 운영이나 현장 안내를 위한 전문 스태프 파견 서비스만 별도로 이용하실 수 있습니다.',
      },
      {
        category: '결제/서류',
        question: '세금계산서 발행이 가능한가요?',
        answer: '네, 모든 서비스 이용 시 정식 세금계산서 발행이 가능합니다. 결제 시 사업자등록증 사본을 전달해 주세요.',
      },
      {
        category: '취소/변경',
        question: '행사 일정이 변경되면 어떻게 되나요?',
        answer: '일정 변경 시 최대한 조율해 드리며, 취소 시에는 진행 단계에 따른 위약금이 발생할 수 있으니 사전 협의가 필요합니다.',
      },
    ],
  },
  members: {
    introEyebrow: 'Alliance',
    filterAllLabel: '전체 회원사',
    searchPlaceholder: '업체명 또는 지역 검색',
    searchButtonLabel: '검색',
    totalLabel: '전체',
    currentPageLabel: '현재페이지',
    emptyStateTitle: '검색 결과가 없습니다.',
    emptyStateDescription: '검색어 또는 분과 조건을 다시 확인해 주세요.',
    companies: [
      {
        name: '대전컨벤션센터(DCC)',
        category: '컨벤션센터',
        secondaryCategory: '전시장',
        address: '대전 유성구 엑스포로 107',
        phone: '042-250-1100',
        logoUrl: createTextLogoDataUrl('DCC', 520, 360, 58),
        updatedAt: '2026.03.12',
      },
      {
        name: '호텔 ICC',
        category: '호텔',
        secondaryCategory: '연회장',
        address: '대전 유성구 엑스포로123번길 55',
        phone: '042-866-5100',
        logoUrl: createTextLogoDataUrl('ICC HOTEL', 520, 360, 58),
        updatedAt: '2026.03.12',
      },
      {
        name: 'KT인재개발원',
        category: '교육·연수',
        secondaryCategory: '연수원',
        address: '대전 서구 갈마로 160',
        phone: '042-530-5114',
        logoUrl: createTextLogoDataUrl('KT HRD', 520, 360, 58),
        updatedAt: '2026.03.12',
      },
    ],
  },
  menus: {
    headerItems: [
      {
        label: '회사소개',
        path: '/about',
        imageUrl: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
        children: [
          { label: '브랜드 소개', path: '/about#about-identity' },
          { label: '강점 소개', path: '/about#about-strengths' },
          { label: '운영 프로세스', path: '/about#about-process' },
        ],
      },
      {
        label: '운영사례',
        path: '/cases',
        imageUrl: 'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=800&q=80',
        children: [
          { label: '대표 프로젝트', path: '/cases#portfolio-list' },
          { label: '기업·기관 행사 사례', path: '/cases?category=포럼%20및%20설명회#portfolio-list' },
          { label: '브랜드 초청 행사 사례', path: '/cases?category=기업%20초청%20행사#portfolio-list' },
        ],
      },
      {
        label: '협력업체',
        path: '/members',
        imageUrl: 'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=800&q=80',
        children: [
          { label: '회원사 소개', path: '/members#member-list' },
          { label: '회원사 검색', path: '/members#member-search' },
        ],
      },
      {
        label: '정보센터',
        path: '/resources',
        imageUrl: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
        children: [
          { label: '소식', path: '/resources/notices' },
          { label: '자료', path: '/resources/files' },
        ],
      },
      {
        label: '고객센터',
        path: '/faq',
        imageUrl: 'https://images.unsplash.com/photo-1521791136364-798a7bc0d267?auto=format&fit=crop&w=800&q=80',
        children: [
          { label: '전화 및 채팅', path: '/faq#support-contact' },
          { label: 'FAQ', path: '/faq#support-faq' },
        ],
      },
    ],
    footerQuickLinks: [
      { label: '회사소개', path: '/about' },
      { label: '협력업체', path: '/members' },
      { label: '고객센터', path: '/faq' },
    ],
  },
  footer: {
    headerCtaLabel: '상담문의',
    customerServiceTitle: 'C/S CENTER',
    customerServicePhone: '1800-1985',
    customerServiceHours: '월~금요일 09:20-18:00 점심 12:00-13:00 토요일, 일요일, 공휴일 휴무',
    bankSectionTitle: '계좌번호',
    bankName: '하나은행',
    bankAccountNumber: '734-910280-17507',
    bankAccountHolder: '예금주명 : 마이스파트너(이기섭)',
    bankLogoUrl: 'https://upload.wikimedia.org/wikipedia/commons/4/4c/Hana_Bank_logo.svg',
    legalLines: [
      '법인명(상호) : 마이스파트너 | 대표자(성함) : 이기섭 | 사업자 등록번호 안내 : [305-30-85537]',
      '통신판매업 신고 : 2025-대전대덕-0525 | [사업자정보확인]',
      '전화 : 010-4074-8387 | 주소 : 대전광역시 대덕구 대화로106번길 66 펜타플렉스 702호, 34365',
      '개인정보보호책임자 : 이기섭(hm_solutions@naver.com) | Contact for more information.',
    ],
    copyright: 'Copyright © 2026 마이스파트너 전용 . All rights reserved.',
    companyName: 'MICEPARTNER',
    metaPoints: [
      { label: '기업 홈페이지 운영', iconKey: 'users' },
      { label: '서비스 소개 + 포트폴리오 + 문의', iconKey: 'map' },
    ],
    contactInfo: [
      { label: '대표 메일', value: 'hello@micepartner.co.kr', href: 'mailto:hello@micepartner.co.kr' },
      { label: '대표 전화', value: '042-123-4567', href: 'tel:0421234567' },
      { label: '사업장', value: '대전광역시 유성구', href: '' },
    ],
  },
};
