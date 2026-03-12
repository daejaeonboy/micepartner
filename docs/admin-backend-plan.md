# Admin Backend Plan

마이스파트너 웹사이트는 공개 사이트와 `admin` 운영 영역을 분리하는 구조가 적합하다.

## 기본 원칙

- 공개 사이트: 회사 소개, 사업영역, 포트폴리오, 행사어때 소개, 문의 유입
- admin: 콘텐츠 관리, 문의 처리, 내부 운영, 행사어때 콘솔
- 권한: `super_admin`, `editor`, `operator`

## 추천 데이터 범위

- `site_contents`
- `portfolio_items`
- `partners`
- `inquiries`
- `events`
- `registrations`
- `checkins`

## Firebase로 갈 경우

- 인증: Firebase Auth
- DB: Firestore
- 함수: Cloud Functions
- 파일: Firebase Storage
- 적합한 경우: 빠른 초기 구축, 프런트 중심 개발, 문서형 데이터

## Supabase로 갈 경우

- 인증: Supabase Auth
- DB: Postgres
- 함수: Edge Functions
- 파일: Supabase Storage
- 적합한 경우: 행사/신청자/체크인 관계형 데이터 확장, SQL 기반 리포팅

## 권장 판단

- 회사 웹사이트 + 간단한 admin이면 `Firebase`도 충분
- 향후 행사어때 운영 콘솔까지 본격 확장할 계획이면 `Supabase`가 더 안정적

## 초기 구현 순서

1. 공개 사이트 완성
2. `/admin` 로그인과 보호 라우트 구성
3. 문의 관리와 포트폴리오 관리 연결
4. 이후 행사어때용 행사/신청/체크인 모듈 확장
