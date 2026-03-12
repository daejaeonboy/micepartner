import type { SitePageContent } from '../types/siteContent';

function createTextLogoDataUrl(label: string, width = 720, height = 240, fontSize = 34) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none">
      <rect width="${width}" height="${height}" rx="32" fill="white"/>
      <text x="${width / 2}" y="${Math.round(height * 0.55)}" text-anchor="middle" fill="#6B7280" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="700" letter-spacing="2">
        ${label}
      </text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

export const defaultSiteContent: SitePageContent = {
  home: {
    servicePreviewEyebrow: 'Service Preview',
    heroEyebrow: 'MICEPARTNER',
    heroBadge: '행사 운영부터 결과 정리까지 한 흐름으로 연결합니다.',
    heroImageUrl:
      'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1920&q=80',
    heroPanelStatus: 'Current Scope',
    heroPanelTitle: '기업 소개, 운영 경험, 문의 전환을 하나의 웹 흐름으로 정리했습니다.',
    heroPanelMetrics: [
      { label: '핵심 메뉴', value: '6개' },
      { label: '문의 수집', value: '실시간 저장' },
      { label: '관리 방식', value: '관리자 직접 편집' },
    ],
    heroStats: [
      { label: '주요 고객군', value: '기업 · 기관', detail: '포럼, 학회, 기업행사, 설명회, 공공 프로젝트' },
      { label: '제공 범위', value: '기획 ~ 운영', detail: '준비, 현장 운영, 사후 정리까지 한 팀으로 대응' },
      { label: '콘텐츠 운영', value: '관리자 편집', detail: '회사 소개, 포트폴리오, 자료실 문구를 직접 수정 가능' },
    ],
    positioningCards: [
      {
        title: '실행 가능한 제안',
        description: '제안서 문구에 머무르지 않고 실제 운영 가능한 일정, 역할, 산출물을 같이 제시합니다.',
        iconKey: 'building',
        imageUrl: '',
      },
      {
        title: '현장 중심 경험',
        description: '등록 데스크, 체크인, 세션 운영, 협력사 조율 등 현장 리듬에 맞는 의사결정을 지원합니다.',
        iconKey: 'ticket',
        imageUrl: '',
      },
      {
        title: '보고 가능한 결과',
        description: '행사 종료 후 내부 보고와 다음 행사 개선까지 이어질 수 있게 결과를 정리합니다.',
        iconKey: 'chart',
        imageUrl: '',
      },
    ],
    proofItems: [
      { label: '회사 소개 페이지', iconKey: 'badge' },
      { label: '서비스 안내 페이지', iconKey: 'badge' },
      { label: '포트폴리오 및 자료실', iconKey: 'badge' },
    ],
    partnerLogos: [
      { name: 'KOREA HEATING', logoUrl: createTextLogoDataUrl('KOREA HEATING') },
      { name: 'KIRD', logoUrl: createTextLogoDataUrl('KIRD') },
      { name: 'SEOUL NATIONAL', logoUrl: createTextLogoDataUrl('SEOUL NATIONAL') },
      { name: 'KOREA EDU', logoUrl: createTextLogoDataUrl('KOREA EDU') },
      { name: 'EWHA WOMANS', logoUrl: createTextLogoDataUrl('EWHA WOMANS') },
      { name: 'HANWHA RESORTS', logoUrl: createTextLogoDataUrl('HANWHA RESORTS') },
      { name: 'SAMSUNG MEDICAL', logoUrl: createTextLogoDataUrl('SAMSUNG MEDICAL') },
      { name: 'BIFAN', logoUrl: createTextLogoDataUrl('BIFAN') },
      { name: 'JEONJU IFF', logoUrl: createTextLogoDataUrl('JEONJU IFF') },
      { name: 'MICE ALLIANCE', logoUrl: createTextLogoDataUrl('MICE ALLIANCE') },
    ],
    primaryCtaLabel: '서비스 보기',
    primaryCtaHref: '/services',
    secondaryCtaLabel: '포트폴리오 보기',
    secondaryCtaHref: '/cases',
    ctaButtonLabel: '문의 페이지로 이동',
    ctaImageUrl:
      'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
  },
  services: {
    introEyebrow: 'Services',
    modulesEyebrow: 'Service Modules',
    flowEyebrow: 'Working Flow',
    heroImageUrl:
      'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80',
    modules: [
      {
        title: '행사 기획 및 운영',
        description: '행사 목적과 대상에 맞춰 프로그램 구성, 운영 시나리오, 인력 운영안을 함께 정리합니다.',
        iconKey: 'layout',
        imageUrl: '',
        points: ['운영 시나리오 정리', '현장 동선 설계', '운영 체크리스트 작성'],
      },
      {
        title: '행사 홈페이지 제작',
        description: '참가자 안내와 문의 전환에 필요한 행사형 웹페이지를 빠르게 구성합니다.',
        iconKey: 'globe',
        imageUrl: '',
        points: ['행사 소개 페이지', '연사/프로그램 안내', '문의 및 신청 연결'],
      },
      {
        title: '참가자 등록 및 응대',
        description: '사전등록, 현장 접수, 문의 대응까지 참가자 커뮤니케이션 흐름을 설계합니다.',
        iconKey: 'file',
        imageUrl: '',
        points: ['참가자 명단 관리', '안내 메일 정리', '현장 등록 프로세스'],
      },
      {
        title: '현장 체크인 지원',
        description: '행사 당일 등록 데스크 운영과 참석 확인 동선을 체계적으로 정리합니다.',
        iconKey: 'qr',
        imageUrl: '',
        points: ['QR 체크인 지원', '배지/명찰 운영', '안내 스태프 운영'],
      },
      {
        title: '협력사 커뮤니케이션',
        description: '장소, 장비, 인쇄물, 케이터링, 인력 등 외부 파트너와의 협업을 조율합니다.',
        iconKey: 'handshake',
        imageUrl: '',
        points: ['협력사 일정 조율', '발주/산출물 체크', '현장 이슈 대응'],
      },
      {
        title: '사후 결과 정리',
        description: '행사 종료 후 사진, 결과, 이슈, 개선 포인트를 남겨 다음 운영에 반영할 수 있게 합니다.',
        iconKey: 'calendar',
        imageUrl: '',
        points: ['결과 리포트 정리', '자료 아카이빙', '개선 포인트 제안'],
      },
    ],
    flowSteps: [
      {
        step: '01',
        title: '초기 상담',
        description: '행사 목적과 현재 준비 상태를 기준으로 필요한 지원 범위를 정리합니다.',
      },
      {
        step: '02',
        title: '운영 설계',
        description: '세부 일정, 제작물, 홈페이지, 응대 흐름, 현장 역할을 실행 단위로 나눕니다.',
      },
      {
        step: '03',
        title: '현장 실행',
        description: '행사 당일 돌발 이슈와 운영 속도에 대응할 수 있게 운영 체계를 가동합니다.',
      },
    ],
  },
  cases: {
    introEyebrow: 'Portfolio',
    categoriesEyebrow: 'Portfolio Categories',
    allCategoryLabel: '전체',
    cardsEyebrow: 'Portfolio Cards',
    detailLinkLabel: '상세 구조 보기',
    emptyStateMessage: '선택한 카테고리에 연결된 사례가 없습니다.',
    categories: ['포럼 및 설명회', '학회 및 세미나', '기업 초청 행사', '현장 등록 및 체크인'],
    entries: [
      {
        slug: 'smart-city-forum-2025',
        category: '포럼 및 설명회',
        tags: ['포럼 및 설명회'],
        title: '스마트시티 포럼 운영',
        cardDescription: '행사 홈페이지, 참가자 등록, 현장 운영, 결과 정리까지 연결한 포럼 운영 사례입니다.',
        outcome: '참가자 동선 혼선 없이 등록 완료, 현장 응대 속도 개선',
        client: '대전 지역 공공기관',
        period: '2025.09',
        scope: ['행사 안내 페이지 구축', '사전등록 관리', '현장 운영 스태프 운영', '사후 결과 정리'],
        summary:
          '스마트시티 정책 포럼을 준비하며 참가자 안내 채널과 현장 응대 기준을 동시에 정리해야 했습니다. 발표 세션과 네트워킹 세션이 함께 있는 구조라 동선 안내와 등록 흐름의 정밀도가 중요했습니다.',
        challenge:
          '짧은 준비 기간 안에 공공기관 보고용 정보와 참가자 친화적인 안내 구조를 함께 맞춰야 했고, 행사 당일에는 현장 응대 속도와 질의 대응 기준을 일정하게 유지해야 했습니다.',
        approach:
          '행사 소개 페이지와 참석 안내 문구를 먼저 정리한 뒤, 등록 데스크 운영 기준과 현장 스태프 역할표를 맞췄습니다. 발표 세션 이동 흐름과 네트워킹 구간 안내도 별도 시나리오로 준비했습니다.',
        result:
          '사전 안내와 현장 운영이 같은 기준으로 움직이면서 등록 지연 없이 행사를 시작했고, 종료 후 결과 자료와 개선 메모를 정리해 다음 행사 제안 자료로 바로 활용할 수 있었습니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&w=900&q=80',
            caption: '등록 데스크와 입장 동선을 사전 시뮬레이션한 현장 구성',
          },
          {
            imageUrl:
              'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?auto=format&fit=crop&w=900&q=80',
            caption: '메인 세션 진행 장면과 참가자 안내 운영',
          },
        ],
      },
      {
        slug: 'medical-seminar-checkin',
        category: '학회 및 세미나',
        tags: ['학회 및 세미나', '현장 등록 및 체크인'],
        title: '의료 세미나 체크인 운영',
        cardDescription: '연사 안내, 현장 체크인, 좌석 안내와 세션별 운영 흐름을 정리한 세미나 사례입니다.',
        outcome: '입장 대기 시간 단축, 참가자 응대 표준화',
        client: '전문학회 운영사',
        period: '2025.11',
        scope: ['체크인 동선 설계', '현장 안내 운영', '연사/세션 안내', '현장 이슈 대응'],
        summary:
          '의료 세미나는 참석자 정보 확인과 세션별 입장 관리가 중요했습니다. 행사 규모 대비 등록 시간이 짧아 현장 혼잡을 줄이는 설계가 핵심이었습니다.',
        challenge:
          '참석자 확인 방식이 여러 유형으로 나뉘어 있어 등록 데스크 처리 속도를 높이면서도 오기입과 누락을 줄이는 방식이 필요했습니다.',
        approach:
          '체크인 구간을 역할별로 분리하고, 문의 유형별 응대 문구를 현장 스태프에게 사전 배포했습니다. 세션 이동이 많은 시간대에는 별도 안내 스태프를 배치했습니다.',
        result:
          '현장 체류 시간을 줄이고 등록 대기 구간을 안정적으로 운영했으며, 종료 후에는 참가자 유형별 응대 메모를 남겨 추후 반복 행사 운영 효율을 높일 수 있었습니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1519389950473-47ba0277781c?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=900&q=80',
            caption: '체크인 현장 운영팀 브리핑 장면',
          },
          {
            imageUrl:
              'https://images.unsplash.com/photo-1543269865-cbf427effbad?auto=format&fit=crop&w=900&q=80',
            caption: '세션별 안내 동선을 시각화한 행사장 구성',
          },
        ],
      },
      {
        slug: 'vip-brand-invitation',
        category: '기업 초청 행사',
        tags: ['기업 초청 행사'],
        title: '브랜드 VIP 초청 행사',
        cardDescription: '초청 대상 관리, 응대 동선, 현장 안내와 사후 보고를 함께 수행한 기업 행사 사례입니다.',
        outcome: 'VIP 응대 프로세스 정리, 현장 돌발 이슈 최소화',
        client: 'B2B 브랜드 마케팅팀',
        period: '2026.01',
        scope: ['초청 대상 커뮤니케이션', '현장 응대', '운영 시나리오 작성', '사후 결과 보고'],
        summary:
          '기업 VIP 초청 행사는 초청 대상별 응대 기준과 일정 관리가 매우 중요했습니다. 현장 운영의 세밀함과 브랜드 경험의 일관성이 동시에 필요했습니다.',
        challenge:
          '초청 대상이 다층적이고 현장 일정 변경 가능성이 높아, 모든 운영 인력이 동일한 기준으로 즉시 대응할 수 있어야 했습니다.',
        approach:
          '행사 전 초청 대상 그룹을 세분화하고 현장 스태프별 역할표를 만들어 공유했습니다. 행사 당일에는 주요 이슈 보고 라인을 단순화해 대응 속도를 높였습니다.',
        result:
          '초청 대상 안내와 현장 응대의 균형을 맞추며 일관된 행사 경험을 만들었고, 종료 후에는 운영 리포트와 개선 제안을 정리해 후속 행사 기획에 활용했습니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=1200&q=80',
        gallery: [
          {
            imageUrl:
              'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?auto=format&fit=crop&w=900&q=80',
            caption: '브랜드 초청 행사 메인 공간 운영',
          },
          {
            imageUrl:
              'https://images.unsplash.com/photo-1503428593586-e225b39bddfe?auto=format&fit=crop&w=900&q=80',
            caption: '현장 응대와 안내 동선 운영 모습',
          },
        ],
      },
    ],
  },
  resources: {
    introEyebrow: 'Resources',
    sectionsEyebrow: 'Sections',
    noticesEyebrow: 'Notices',
    downloadsEyebrow: 'Downloads',
    noticeLinkLabel: '공지 상세 보기',
    resourceLinkLabel: '자료 상세 보기',
    categories: [
      { title: '공지사항', description: '회사 소식, 일정 안내, 운영 업데이트를 게시하는 영역입니다.' },
      { title: '자료실', description: '회사소개서, 서비스 소개서, 포트폴리오 자료를 정리하는 공간입니다.' },
      { title: '레퍼런스', description: '보도자료, 외부 소개 링크, 협력 콘텐츠를 함께 소개할 수 있습니다.' },
    ],
    notices: [
      {
        slug: '2026-service-guide-update',
        category: '서비스',
        title: '2026 서비스 안내 자료 업데이트',
        date: '2026-03-10',
        summary: '회사소개서와 서비스 안내서 최신 버전을 자료실에 반영했습니다.',
        body:
          '마이스파트너의 2026년 기준 서비스 소개 자료를 업데이트했습니다.\n\n이번 버전에는 행사 홈페이지 구축 범위, 참가자 안내 흐름, 현장 운영 지원 범위를 더 구체적으로 정리했습니다.\n\n영업 제안 또는 미팅 전에 필요한 자료가 있으면 문의 페이지를 통해 요청해 주세요.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
        attachments: [{ label: '서비스 안내서 요청', url: '/contact' }],
      },
      {
        slug: 'spring-forum-operation-notice',
        category: '이벤트',
        title: '봄 시즌 포럼 운영 상담 접수 중',
        date: '2026-03-08',
        summary: '포럼, 설명회, 세미나 운영 상담을 순차적으로 받고 있습니다.',
        body:
          '상반기 포럼 및 설명회 시즌을 대비해 운영 상담을 접수하고 있습니다.\n\n행사 홈페이지 구축, 참가자 안내, 현장 체크인 운영이 필요한 경우 미리 문의해 주시면 일정과 범위를 빠르게 검토해 드립니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&w=1200&q=80',
        attachments: [],
      },
      {
        slug: '2026-checkin-flow-update',
        category: '업데이트',
        title: '현장 체크인 동선 운영 기준을 업데이트했습니다.',
        date: '2026-03-06',
        summary: '등록 대기 분산과 현장 응대 흐름을 반영한 체크인 운영 기준을 정리했습니다.',
        body:
          '현장 등록 대기 분산과 안내 데스크 운영 기준을 업데이트했습니다.\n\n참가자 동선, 현장 문의 응대, 출력물 배치 방식까지 포함한 체크리스트를 정리해 내부 운영 문서에 반영했습니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1515169067868-5387ec356754?auto=format&fit=crop&w=1200&q=80',
        attachments: [{ label: '운영 문의하기', url: '/contact' }],
      },
      {
        slug: 'partner-briefing-open',
        category: '공지',
        title: '협력 파트너 사전 브리핑 신청을 받고 있습니다.',
        date: '2026-03-05',
        summary: '협력업체와 함께하는 현장 운영 브리핑 일정을 순차적으로 잡고 있습니다.',
        body:
          '행사 운영 전 협력업체와 함께 진행하는 사전 브리핑 신청을 받고 있습니다.\n\n무대, 안내, 등록, 현장 동선 담당 파트너가 함께 보는 운영 기준 문서를 미리 공유해 현장 혼선을 줄이는 방식으로 운영합니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
        attachments: [],
      },
      {
        slug: 'website-open-schedule',
        category: '작업',
        title: '행사 홈페이지 오픈 전 QA 일정을 안내드립니다.',
        date: '2026-03-04',
        summary: '참가 신청 전 마지막 점검 일정과 확인 항목을 공유합니다.',
        body:
          '행사 홈페이지 오픈 전 QA 일정을 안내드립니다.\n\n페이지별 문구, 폼 연결, 메일 수신, 관리자 반영 상태를 마지막으로 점검한 뒤 오픈하는 순서로 진행합니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1200&q=80',
        attachments: [],
      },
      {
        slug: 'proposal-material-request-guide',
        category: '공공기관',
        title: '제안 자료 요청 시 필요한 기본 정보 안내',
        date: '2026-03-03',
        summary: '제안서 요청 전에 일정, 규모, 운영 범위를 알려주시면 검토가 빨라집니다.',
        body:
          '제안 자료 요청 시 행사 일정, 예상 규모, 필요한 운영 범위를 함께 알려주시면 검토가 훨씬 빨라집니다.\n\n특히 공공기관 행사나 설명회 유형은 필수 운영 범위가 비슷해 사전 정보만 정리되어 있어도 빠르게 자료를 드릴 수 있습니다.',
        coverImageUrl:
          'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
        attachments: [{ label: '문의 페이지로 이동', url: '/contact' }],
      },
    ],
    items: [
      {
        slug: 'company-profile-2026',
        title: '마이스파트너 회사소개서',
        type: 'PDF',
        description: '회사 소개, 운영 범위, 협업 방식이 정리된 기본 회사소개서입니다.',
        body:
          '회사소개서는 마이스파트너가 어떤 유형의 행사 운영을 지원하는지, 어떤 방식으로 협업하는지 정리한 기본 자료입니다.\n\n미팅 전 검토 자료나 내부 공유용 문서로 활용할 수 있습니다.',
        downloadLabel: '문의 후 자료 요청',
        downloadUrl: '/contact',
        fileName: 'micepartner-company-profile.pdf',
        version: 'v1.0',
        updatedAt: '2026-03-10',
        coverImageUrl:
          'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80',
      },
      {
        slug: 'service-deck-2026',
        title: '서비스 소개서',
        type: 'PDF',
        description: '행사 기획, 홈페이지, 등록 응대, 현장 운영 범위를 정리한 자료입니다.',
        body:
          '서비스 소개서는 행사 준비부터 현장 운영까지 어떤 업무를 맡을 수 있는지 항목별로 정리한 문서입니다.\n\n제안 범위 협의 전에 참고 자료로 활용하기 좋습니다.',
        downloadLabel: '서비스 소개서 문의',
        downloadUrl: '/contact',
        fileName: 'micepartner-service-deck.pdf',
        version: 'v1.1',
        updatedAt: '2026-03-10',
        coverImageUrl:
          'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1200&q=80',
      },
      {
        slug: 'portfolio-deck-2026',
        title: '포트폴리오 자료',
        type: 'PDF',
        description: '대표 운영 사례와 협업 포인트를 요약한 자료입니다.',
        body:
          '포트폴리오 자료에는 행사 유형별 핵심 사례와 운영 포인트를 간단히 정리했습니다.\n\n고객 미팅 전 비슷한 유형의 행사 경험을 공유할 때 사용할 수 있습니다.',
        downloadLabel: '포트폴리오 문의',
        downloadUrl: '/contact',
        fileName: 'micepartner-portfolio-deck.pdf',
        version: 'v1.0',
        updatedAt: '2026-03-10',
        coverImageUrl:
          'https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=1200&q=80',
      },
    ],
  },
  about: {
    introEyebrow: 'About',
    identityEyebrow: 'Who We Are',
    strengthEyebrow: 'Why Mice Partner',
    processEyebrow: 'Working Process',
    heroImageUrl:
      'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?auto=format&fit=crop&w=1200&q=80',
    messageTitle: '마이스파트너는 현장에서 바로 작동하는 운영 구조를 만드는 팀입니다.',
    messageBody:
      '우리는 행사 소개 문구를 예쁘게 정리하는 것보다 실제 운영 흐름이 끊기지 않게 만드는 일을 더 중요하게 생각합니다.\n\n고객이 처음 문의하는 순간부터 행사 종료 후 결과를 정리하는 시점까지, 커뮤니케이션과 현장 운영이 같은 기준으로 움직이는 구조를 만듭니다.',
    identityPoints: [
      '행사 목적과 일정에 맞는 운영 범위를 먼저 정리합니다.',
      '현장 등록, 체크인, 협력사 커뮤니케이션처럼 실제 실행 구간을 기준으로 제안합니다.',
      '행사 종료 후 결과 정리와 다음 운영 개선까지 연결될 수 있게 기록을 남깁니다.',
    ],
    highlights: [
      {
        title: '지역 기반 실행력',
        description: '대전과 충청권 행사 운영 환경을 이해한 상태에서 빠르게 협력 체계를 만들 수 있습니다.',
        iconKey: 'map',
        imageUrl: '',
      },
      {
        title: '운영 커뮤니케이션',
        description: '주최기관, 협력사, 스태프가 같은 기준으로 움직이도록 정보 구조를 정리합니다.',
        iconKey: 'message',
        imageUrl: '',
      },
      {
        title: '웹과 현장의 연결',
        description: '웹사이트 문구, 참가자 안내, 현장 운영이 끊기지 않도록 한 흐름으로 설계합니다.',
        iconKey: 'globe',
        imageUrl: '',
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
  contact: {
    introEyebrow: 'Contact',
    optionsEyebrow: 'Contact Options',
    formEyebrow: 'Inquiry Form',
    organizationLabel: '기관명',
    organizationPlaceholder: '예: 대전 ○○기관',
    contactNameLabel: '담당자명',
    contactNamePlaceholder: '이름을 입력해 주세요',
    emailLabel: '이메일',
    emailPlaceholder: 'contact@example.com',
    eventDateLabel: '행사 예정일',
    eventDatePlaceholder: '예: 2026년 6월',
    messageLabel: '문의 내용',
    messagePlaceholder: '행사 유형, 예상 참가 인원, 필요한 기능을 적어 주세요.',
    submitPendingLabel: '문의 저장 중...',
    submitSuccessMessage: '문의가 저장되었습니다. 관리자 페이지에서 바로 확인할 수 있습니다.',
    heroImageUrl:
      'https://images.unsplash.com/photo-1516321165247-4aa89a48be28?auto=format&fit=crop&w=1200&q=80',
    options: [
      {
        title: '운영 문의',
        description: '행사 준비 상황과 일정, 필요한 운영 범위를 먼저 상담하고 싶을 때 적합합니다.',
        iconKey: 'message',
        imageUrl: '',
      },
      {
        title: '제안서 요청',
        description: '행사 개요를 바탕으로 운영 범위와 제안 구성을 검토받고 싶을 때 활용합니다.',
        iconKey: 'file',
        imageUrl: '',
      },
      {
        title: '포트폴리오 문의',
        description: '비슷한 유형의 운영 사례와 결과를 먼저 보고 싶을 때 연결됩니다.',
        iconKey: 'map',
        imageUrl: '',
      },
    ],
    trustBullets: ['문의 저장 API 연동', '관리자 상태 관리 가능', '사이트 콘텐츠 직접 수정 가능'],
    responseSteps: [
      {
        step: '01',
        title: '문의 접수',
        description: '입력한 내용은 저장 즉시 관리자 화면에서 확인할 수 있습니다.',
      },
      {
        step: '02',
        title: '내용 검토',
        description: '행사 일정, 목적, 요청 범위를 기준으로 필요한 지원을 검토합니다.',
      },
      {
        step: '03',
        title: '답변 및 제안',
        description: '필요 시 추가 확인을 거쳐 상담 또는 제안 단계로 이어집니다.',
      },
    ],
    checklist: ['행사 목적', '예상 참가 인원', '필요한 운영 범위', '희망 일정 또는 마감 시점'],
    contactInfo: [
      { label: '대표 메일', value: 'hello@micepartner.co.kr', href: 'mailto:hello@micepartner.co.kr' },
      { label: '대표 전화', value: '042-123-4567', href: 'tel:0421234567' },
      { label: '운영 지역', value: '대전광역시 중심 / 전국 프로젝트 협의 가능', href: '' },
    ],
    submitButtonLabel: '문의 접수하기',
  },
  members: {
    introEyebrow: 'MICE Members',
    filterAllLabel: '전체',
    searchPlaceholder: '얼라이언스명을 입력해주세요.',
    searchButtonLabel: '검색',
    totalLabel: '전체',
    currentPageLabel: '현재페이지',
    companies: [
      {
        name: '대전컨벤션센터',
        category: 'MICE 시설분과',
        secondaryCategory: '컨벤션센터',
        address: '대전 유성구 엑스포로 107 (도룡동)',
        phone: '042-250-1100',
        logoUrl: createTextLogoDataUrl('DCC', 520, 360, 92),
      },
      {
        name: '굿모닝레지던스 호텔 휴',
        category: 'MICE 시설분과',
        secondaryCategory: '호텔',
        address: '대전 서구 둔산로73번길 21 (둔산동)',
        phone: '042-489-4000',
        logoUrl: createTextLogoDataUrl('HOTEL HUE', 520, 360, 52),
      },
      {
        name: '호텔 오노마 대전',
        category: 'MICE 시설분과',
        secondaryCategory: '호텔',
        address: '대전 유성구 엑스포로 1 (도룡동)',
        phone: '042-259-8000',
        logoUrl: createTextLogoDataUrl('ONOMA', 520, 360, 70),
      },
      {
        name: 'ICC 호텔',
        category: 'MICE 시설분과',
        secondaryCategory: '호텔',
        address: '대전 유성구 엑스포로123번길 55',
        phone: '042-866-5100',
        logoUrl: createTextLogoDataUrl('ICC HOTEL', 520, 360, 58),
      },
      {
        name: 'KT인재개발원',
        category: '교육·연수',
        secondaryCategory: '연수원',
        address: '대전 서구 갈마로 160',
        phone: '042-620-5114',
        logoUrl: createTextLogoDataUrl('KT HRD', 520, 360, 72),
      },
      {
        name: '한남대학교',
        category: '교육·연수',
        secondaryCategory: '대학교',
        address: '대전 대덕구 한남로 70',
        phone: '042-629-7114',
        logoUrl: createTextLogoDataUrl('HANNAM', 520, 360, 74),
      },
      {
        name: '엑스포과학공원',
        category: 'MICE 시설분과',
        secondaryCategory: '전시·이벤트',
        address: '대전 유성구 대덕대로 480',
        phone: '042-250-1114',
        logoUrl: createTextLogoDataUrl('EXPO PARK', 520, 360, 64),
      },
      {
        name: '라마다호텔 대전',
        category: 'MICE 시설분과',
        secondaryCategory: '호텔',
        address: '대전 유성구 계룡로 127',
        phone: '042-540-1000',
        logoUrl: createTextLogoDataUrl('RAMADA', 520, 360, 78),
      },
    ],
  },
  customPages: [],
  menus: {
    headerItems: [
      {
        label: '서비스',
        path: '/services',
        children: [
          { label: '통합 운영 서비스', path: '/services#service-modules' },
          { label: '협업 프로세스', path: '/services#service-flow' },
        ],
      },
      {
        label: '포트폴리오',
        path: '/cases',
        children: [
          { label: '대표 프로젝트', path: '/cases#portfolio-list' },
          { label: '기업·기관 행사 사례', path: '/cases?category=포럼%20및%20설명회#portfolio-list' },
          { label: '브랜드 초청 행사 사례', path: '/cases?category=기업%20초청%20행사#portfolio-list' },
        ],
      },
      {
        label: '정보센터',
        path: '/resources',
        children: [
          { label: '소식', path: '/resources/notices' },
          { label: '자료', path: '/resources/files' },
        ],
      },
      {
        label: '회사소개',
        path: '/about',
        children: [
          { label: '브랜드 소개', path: '/about#about-identity' },
          { label: '강점 소개', path: '/about#about-strengths' },
          { label: '운영 프로세스', path: '/about#about-process' },
        ],
      },
      {
        label: 'MICE 회원',
        path: '/members',
        children: [
          { label: '회원사 소개', path: '/members#member-list' },
          { label: '회원사 검색', path: '/members#member-search' },
        ],
      },
      {
        label: '문의',
        path: '/contact',
        children: [
          { label: '상담 안내', path: '/contact#contact-options' },
          { label: '문의 접수', path: '/contact#contact-form' },
        ],
      },
    ],
    footerQuickLinks: [
      { label: '회사소개', path: '/about' },
      { label: 'MICE 회원', path: '/members' },
      { label: '문의하기', path: '/contact' },
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
