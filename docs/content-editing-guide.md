# Content Editing Guide

마이스파트너 회사소개 홈페이지에서 실제 회사 정보를 넣을 때 수정해야 하는 파일 위치를 정리한 문서입니다.

## 1. 상단 메뉴와 공통 소개

- 메뉴명: `src/content/site.ts`
  - `navItems`
- 푸터 하단 안내 문구 및 placeholder 노출: `src/components/SiteLayout.tsx`

## 2. 메인 페이지

- 메인 핵심 지표: `src/content/site.ts`
  - `heroStats`
- 메인 강점 카드: `src/content/site.ts`
  - `valueCards`
- 메인 서비스 미리보기: `src/content/site.ts`
  - `serviceCards`
- 메인 프로세스: `src/content/site.ts`
  - `processSteps`

## 3. 서비스 페이지

- 서비스 카드 내용: `src/content/site.ts`
  - `serviceCards`
- 서비스 진행 흐름: `src/content/site.ts`
  - `processSteps`

## 4. 포트폴리오 페이지

- 포트폴리오 목록/상세 내용: `src/content/portfolio.ts`
  - `portfolioEntries`
- 포트폴리오 카테고리: `src/content/portfolio.ts`
  - `portfolioCategories`

포트폴리오 한 건을 수정할 때 주로 바꾸는 항목:

- `title`
- `description`
- `outcome`
- `client`
- `period`
- `scope`
- `summary`
- `challenge`
- `approach`
- `result`
- `galleryPlaceholders`

## 5. 자료실 / 공지

- 공지 목록/상세: `src/content/resources.ts`
  - `noticeItems`
- 자료실 목록/상세: `src/content/resources.ts`
  - `resourceItems`
- 자료실 카테고리 소개: `src/content/resources.ts`
  - `resourceCategories`

## 6. 회사소개 페이지

- 회사 소개 문장/강점/문의 포인트: `src/content/site.ts`
  - `aboutPoints`
  - `partnerHighlights`
  - `contactPoints`

## 7. 직접 교체해야 하는 placeholder

- 공통 placeholder 목록: `src/content/site.ts`
  - `ownerTodoPlaceholders`

현재 이 항목들은 실제 운영 전에 직접 바꾸는 용도로 남겨져 있습니다.

## 8. 문의 기능

- 프론트 문의 폼: `src/pages/ContactPage.tsx`
- 문의 API 호출: `src/lib/api.ts`
- 문의 저장 서버: `server/index.js`
- 문의 DB: `server/db.js`

## 9. 디자인 구조 참고

- Gemini 디자인 브리프: `docs/gemini-design-brief.md`
- 전역 스타일: `src/index.css`

## 10. 가장 자주 손대는 파일

실제 운영 준비 시 보통 아래 4개 파일을 가장 많이 수정하게 됩니다.

- `src/content/site.ts`
- `src/content/portfolio.ts`
- `src/content/resources.ts`
- `src/components/SiteLayout.tsx`
