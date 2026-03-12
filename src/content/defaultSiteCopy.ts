import type { SiteCopy } from '../types/siteCopy';

export const defaultSiteCopy: SiteCopy = {
  home: {
    heroTitle: '마이스파트너가\n어떤 서비스를 제공하는\n회사인지 보여줍니다',
    heroDescription:
      '메인 페이지는 전문성, 실행력, 포트폴리오 신뢰, 문의 전환을 가장 빠르게 전달하는 구조로 설계했습니다. 실제 회사 정보와 운영 사례는 이후 직접 교체할 수 있게 placeholder 중심으로 정리되어 있습니다.',
    positioningTitle: '기업 홈페이지는 회사 소개, 서비스 설명, 포트폴리오 신뢰 형성이 핵심입니다.',
    positioningDescription:
      '행사 기능은 다른 플랫폼에서 운영 중이므로, 이 사이트는 마이스파트너의 성격과 결과물을 설득력 있게 보여주는 데 집중합니다.',
    servicePreviewTitle: '서비스는 카드형 구조로 빠르게 이해되고, 상세는 별도 페이지에서 보강되도록 설계합니다.',
    servicePreviewDescription:
      '메인에서는 모든 설명을 다 보여주기보다 대표 범위만 먼저 보여주고 서비스 페이지로 넘기는 편이 전환에 유리합니다.',
    portfolioPreviewTitle: '포트폴리오와 설치사례는 사진형 카드와 상세 구조가 연결되어야 신뢰가 생깁니다.',
    portfolioPreviewDescription:
      '지금은 placeholder 데이터지만, 실제 행사명과 결과 수치, 대표 사진으로 교체하면 그대로 운영 사례 페이지로 확장할 수 있습니다.',
    resourcesPreviewTitle: '자료실에는 다운로드 가능한 문서 구조도 같이 있으면 좋습니다.',
    resourcesPreviewDescription:
      '회사소개서, 서비스 소개서, 포트폴리오 PDF처럼 자주 요청되는 자료는 메인에서도 바로 보이게 두는 편이 좋습니다.',
    processTitle: '협력업체',
    processDescription:
      '행사 목적, 대상, 일정, 운영 범위를 먼저 정리해 어떤 파트너십이 맞는지 빠르게 검토할 수 있습니다.',
    ctaTitle: '다음 프로젝트 상담은 문의 페이지에서 바로 받을 수 있습니다.',
    ctaDescription: '소개, 서비스, 포트폴리오를 본 사용자가 자연스럽게 문의로 이어지도록 마지막 전환 영역을 별도로 둡니다.',
  },
  services: {
    introTitle: '서비스 페이지는 회사가 실제로 어떤 일을 맡는지 명확하게 설명하는 곳입니다.',
    introDescription:
      '제품 기능 설명이 아니라, 마이스파트너가 행사 준비와 운영 과정에서 어떤 서비스를 제공하는지 정리하는 구조로 두었습니다.',
    modulesTitle: '운영 범위를 항목별로 나눠 보여주면 고객이 문의하기 쉬워집니다.',
    modulesDescription:
      '고객은 처음부터 전체 패키지를 이해하기보다, 필요한 범위가 무엇인지 먼저 확인합니다. 서비스 페이지는 그 판단을 돕는 역할을 합니다.',
    flowTitle: '서비스 설명 뒤에는 보통 어떤 순서로 일하는지 같이 보여주는 것이 좋습니다.',
    flowDescription:
      '문의 후 어떤 단계를 거쳐 제안과 운영이 진행되는지 정리하면, 처음 보는 고객도 협업 방식을 쉽게 이해할 수 있습니다.',
  },
  cases: {
    introTitle: '포트폴리오 페이지는 회사가 해 온 일을 가장 직관적으로 보여주는 곳입니다.',
    introDescription:
      '실제 행사 사례와 설치사례가 들어가면 신뢰도가 크게 올라갑니다. 지금은 그 내용을 나중에 직접 채울 수 있도록 구조만 먼저 잡아 두었습니다.',
    categoriesTitle: '포트폴리오도 행사 유형별로 나누면 고객이 자기 사례를 더 쉽게 찾습니다.',
    categoriesDescription:
      '예를 들어 포럼, 학회, 기업행사, 현장 등록, 전시 운영처럼 카테고리를 나눠두면 실제 사례가 쌓였을 때 정리하기 쉽습니다.',
    cardsTitle: '지금은 placeholder 카드로 두고, 나중에 실제 행사명과 사진만 바꾸면 됩니다.',
    cardsDescription: '포트폴리오 구조를 미리 잡아두면 실운영 시에는 내용만 바꿔서 계속 쌓아갈 수 있습니다.',
    ownerTitle: '아래 항목은 실제 운영 전에 직접 채우면 됩니다.',
    ownerDescription: '이 부분은 구조만 남겨둔 상태이고, 회사 자료가 준비되면 그대로 실제 정보로 교체하면 됩니다.',
  },
  resources: {
    introTitle: '자료실과 공지 페이지는 회사 운영 정보가 쌓이는 기본 공간입니다.',
    introDescription:
      '이 페이지는 실제 파일 업로드 기능 없이 구조만 먼저 만든 상태입니다. 나중에 공지 제목, 첨부파일 링크, 게시일만 넣으면 바로 활용할 수 있게 구성했습니다.',
    sectionsTitle: '자료실은 보통 공지, 파일, 외부 레퍼런스 세 영역으로 나누면 관리가 쉽습니다.',
    sectionsDescription: '회사 홈페이지에서는 포트폴리오 외에도 소개서, 보도자료, 공지 같은 운영성 콘텐츠가 필요한 경우가 많습니다.',
    noticesTitle: '공지사항 목록도 카드형 placeholder로 두고 실제 게시물로 교체하면 됩니다.',
    noticesDescription: '실제 운영 시에는 제목, 게시일, 간단한 요약만으로도 기본 공지 목록을 운영할 수 있습니다.',
    downloadsTitle: '자료실에는 다운로드 가능한 문서 구조도 같이 있으면 좋습니다.',
    downloadsDescription: '회사소개서, 서비스 소개서, 포트폴리오 PDF처럼 자주 요청되는 자료는 여기에 모아둘 수 있습니다.',
    ownerTitle: '실제 운영 전에는 아래 항목들을 직접 채우면 됩니다.',
    ownerDescription: '이 페이지는 구조만 잡아 둔 상태이므로, 실제 파일과 링크, 공지 내용은 회사 자료로 교체하면 됩니다.',
  },
  about: {
    introTitle: '회사소개 페이지는 회사가 누구인지보다 어떤 방식으로 일하는지까지 보여줘야 합니다.',
    introDescription:
      '이 페이지는 마이스파트너의 방향, 일하는 방식, 강점을 정리하는 구조로 두었고, 실제 회사 문구는 이후 직접 교체할 수 있게 placeholder로 남겨두었습니다.',
    identityTitle: '회사소개에서는 핵심 메시지와 일하는 기준이 먼저 보여야 합니다.',
    identityDescription:
      '실제 소개 문구는 이후 바꾸더라도, 어떤 성격의 회사인지와 어떤 서비스를 중심으로 일하는지는 먼저 구조로 잡아두는 편이 좋습니다.',
    identityCardTitle: '회사 소개 문장 Placeholder',
    ownerCardTitle: '직접 교체할 항목',
    strengthTitle: '회사소개에는 강점과 협업 방식이 같이 들어가야 신뢰가 생깁니다.',
    strengthDescription: '연혁만 나열하는 방식보다, 고객이 왜 이 회사를 선택해야 하는지 바로 이해할 수 있게 구성하는 편이 더 좋습니다.',
    processTitle: '문의부터 운영까지 어떤 흐름으로 일하는지 정리해 두면 회사 소개가 훨씬 선명해집니다.',
    processDescription: '실제 회사소개 페이지에서도 협업 절차가 보이면 고객이 문의 전부터 기대치를 맞추기 쉬워집니다.',
  },
  contact: {
    introTitle: '문의 페이지는 실제로 저장되고, 운영자가 바로 확인할 수 있어야 합니다.',
    introDescription:
      '기업 홈페이지에서 가장 중요한 건 문의 누락이 없는 구조입니다. 실제 대표 연락처와 회사 정보는 아래 placeholder를 나중에 직접 바꾸면 됩니다.',
    optionsTitle: "고객은 보통 '우리 행사도 가능한지'를 가장 먼저 묻습니다.",
    optionsDescription: '그래서 문의 페이지는 복잡한 설명보다 빠른 상담 유도, 데모 요청, 구축 일정 확인을 중심으로 구성하는 편이 좋습니다.',
    trustCardTitle: '문의 처리 구조',
    trustCardDescription: '문의는 저장, 확인, 상태 관리까지 이어지도록 구성되어 있어 누락 없이 운영할 수 있습니다.',
    formTitle: '실제 서비스 전환을 위해서는 문의 폼이 가장 먼저 동작해야 합니다.',
    formDescription: '현재는 기관명, 담당자, 이메일, 행사 예정일, 문의 내용을 저장하고, 내부 운영관리 페이지에서 상태를 관리할 수 있게 구현했습니다.',
    processCardTitle: '문의 후 진행 방식',
    checklistCardTitle: '빠른 검토를 위한 정보',
    placeholderCardTitle: '직접 교체할 연락 정보',
  },
  members: {
    introTitle: '회원사 소개',
    introDescription:
      '대전·충청 MICE 얼라이언스처럼 회원사와 협력 네트워크를 한 화면에서 탐색할 수 있도록 구성한 목록형 페이지입니다.',
  },
  footer: {
    copy: '마이스파트너가 어떤 서비스를 제공하는 회사인지 명확하게 보여주기 위한 기업 홈페이지 구조입니다.',
  },
};
