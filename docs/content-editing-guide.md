# Content Editing Guide

마이스파트너 사이트는 이제 템플릿 시스템 없이 `페이지별 개별 편집` 구조로 운영합니다.

## 운영 원칙

- 실제 운영 중 문구/이미지 수정은 관리자 화면에서 합니다.
- 코드에서 직접 수정하는 경우는 기본값 정리나 새 페이지 구현이 필요할 때만입니다.

## 관리자에서 수정하는 항목

- 메인 홈
- 사업안내
- 운영사례
- 운영사례 상세
- 정보센터 소식
- 정보센터 소식 상세
- 정보센터 자료
- 정보센터 자료 상세
- 회사소개
- 협력업체
- 상담신청
- 고객센터
- 메뉴 관리
- 푸터

## 코드 기준 기본값 위치

- 기본 카피: `src/content/defaultSiteCopy.ts`
- 기본 콘텐츠: `src/content/defaultSiteContent.ts`
- 관리자 섹션 메타: `src/content/defaultSiteEditorConfig.ts`
- 통합 기본 데이터: `src/content/defaultSiteData.ts`

Firestore 데이터가 없거나 일부 값이 비어 있으면 위 기본값이 사용됩니다.

## 페이지별 실제 구현 파일

- 메인 홈: `src/pages/HomePage.tsx`
- 사업안내: `src/pages/ServicesPage.tsx`
- 운영사례: `src/pages/CaseStudiesPage.tsx`
- 운영사례 상세: `src/pages/PortfolioDetailPage.tsx`
- 정보센터 소식: `src/pages/ResourcesPage.tsx`
- 정보센터 소식 상세: `src/pages/NoticeDetailPage.tsx`
- 정보센터 자료: `src/pages/ResourceFilesPage.tsx`
- 정보센터 자료 상세: `src/pages/ResourceDetailPage.tsx`
- 회사소개: `src/pages/AboutPage.tsx`
- 협력업체: `src/pages/MembersPage.tsx`
- 고객센터: `src/pages/FAQPage.tsx`
- 상담신청: `src/pages/ContactPage.tsx`

## 공통 UI 파일

- 공통 레이아웃: `src/components/SiteLayout.tsx`
- 공통 페이지 블록: `src/components/PublicPageTemplate.tsx`
- 전역 스타일: `src/index.css`

## 데이터 저장/정규화

- 사이트 데이터 로드/저장: `src/lib/api.ts`
- 사이트 데이터 컨텍스트: `src/context/SiteContentContext.tsx`

## 참고

- 템플릿 시스템, 커스텀 페이지 자동 생성, 정적 seed 파일(`src/content/site.ts`, `src/content/resources.ts` 등)은 제거됐습니다.
- 새 페이지가 필요하면 기존 페이지를 복제하는 방식이 아니라 해당 페이지를 별도로 구현하고 관리자 편집 대상에 추가해야 합니다.
