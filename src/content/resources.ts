import type { NoticeItem, ResourceCategory, ResourceItem } from './types';

export const resourceCategories: ResourceCategory[] = [
  {
    title: '공지사항',
    description: '회사 소식, 일정 안내, 업데이트 공지를 올릴 수 있는 영역입니다.',
  },
  {
    title: '자료실',
    description: '회사소개서, 서비스 소개서, 포트폴리오 PDF 같은 자료를 정리할 수 있는 영역입니다.',
  },
  {
    title: '보도/레퍼런스',
    description: '언론 노출, 협력 기사, 외부 소개 링크를 정리할 수 있는 영역입니다.',
  },
];

export const noticeItems: NoticeItem[] = [
  {
    slug: 'notice-placeholder-01',
    title: '공지사항 Placeholder 01',
    date: '2026-03-10',
    summary: '실제 공지 제목과 간단한 요약 문구를 여기에 입력하면 됩니다.',
    body: [
      '공지 상세 본문 Placeholder 01입니다.',
      '실제 운영 시에는 공지 내용, 일정, 안내 문구를 이 영역에 입력하면 됩니다.',
    ],
  },
  {
    slug: 'notice-placeholder-02',
    title: '공지사항 Placeholder 02',
    date: '2026-03-10',
    summary: '행사 운영 일정, 회사 소식, 업데이트 내용을 여기에 넣을 수 있습니다.',
    body: [
      '공지 상세 본문 Placeholder 02입니다.',
      '회사 소식, 서비스 업데이트, 일정 안내 등 운영성 문구를 여기에 넣으면 됩니다.',
    ],
  },
  {
    slug: 'notice-placeholder-03',
    title: '공지사항 Placeholder 03',
    date: '2026-03-10',
    summary: '최신 소식이나 안내 문구를 추후 직접 수정하면 됩니다.',
    body: [
      '공지 상세 본문 Placeholder 03입니다.',
      '실제 공지로 교체할 때는 제목, 날짜, 본문만 수정하면 됩니다.',
    ],
  },
];

export const resourceItems: ResourceItem[] = [
  {
    slug: 'company-profile-placeholder',
    title: '회사소개서 Placeholder',
    type: 'PDF',
    description: '실제 회사소개서 파일 링크 또는 다운로드 버튼으로 교체하면 됩니다.',
    details: ['파일명 Placeholder', '다운로드 링크 Placeholder', '버전/업데이트 일자 Placeholder'],
  },
  {
    slug: 'service-deck-placeholder',
    title: '서비스 소개서 Placeholder',
    type: 'DOC/PDF',
    description: '서비스 범위와 제안 내용을 담은 문서 링크로 교체하면 됩니다.',
    details: ['서비스 설명 파일 Placeholder', '다운로드 링크 Placeholder', '문서 설명 Placeholder'],
  },
  {
    slug: 'portfolio-deck-placeholder',
    title: '포트폴리오 자료 Placeholder',
    type: 'PDF',
    description: '설치사례와 운영 결과를 모은 자료 파일로 교체하면 됩니다.',
    details: ['포트폴리오 파일 Placeholder', '다운로드 링크 Placeholder', '활용 목적 Placeholder'],
  },
];
