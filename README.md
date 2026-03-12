# 행사어때 / Mice Partner

마이스파트너의 기업 홈페이지 초안입니다.

현재 포함된 구조:

- 공개 사이트 페이지 분리
- 회사 소개 / 서비스 / 포트폴리오 / 문의 구조
- Firebase Auth 기반 관리자 회원가입 / 이메일 로그인 / Google 로그인
- Firestore 기반 문의/사이트 콘텐츠 저장
- 관리자 페이지에서 문의 목록/상태 확인
- 관리자 페이지에서 사이트 카피 + 페이지별 JSON 콘텐츠 편집

## 실행 방법

### 1. 프론트엔드

```bash
npm run dev
```

브라우저: `http://localhost:3000`

### 2. Firebase 에뮬레이터(선택)

```bash
npm run firebase:serve
```

## 주요 경로

- `/` 메인
- `/services` 서비스
- `/cases` 포트폴리오
- `/cases/:slug` 포트폴리오 상세 템플릿
- `/resources` 자료실/공지 뼈대
- `/about` 회사소개
- `/contact` 문의
- `/admin` 운영관리 초안

## 저장 데이터

- 문의 데이터와 사이트 콘텐츠는 Firestore에 저장됩니다.
- 관리자 인증은 Firebase Auth를 사용합니다.

## 관리자 인증

- 관리자 페이지 경로: `/admin`
- 이메일 회원가입 후 바로 로그인 상태로 진입합니다.
- Google 로그인을 사용하려면 Firebase 콘솔에서 `Authentication > Sign-in method > Google`을 활성화해야 합니다.
- `.env`에 아래 Firebase 값을 설정해야 합니다.
  - `VITE_FIREBASE_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_APP_ID`
  - 선택: `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`

## Firebase Hosting 배포

- 빌드 산출물은 `dist/` 기준으로 Firebase Hosting 설정이 포함되어 있습니다.
- 배포 전 `.env`에 실제 Firebase Web App 설정값을 입력해 주세요.
- Firebase CLI 로그인 후 아래 명령으로 배포할 수 있습니다.

```bash
npm run build
npm run firebase:deploy:all
```

- SPA 라우팅을 위해 `firebase.json`에 모든 경로를 `index.html`로 rewrite 하도록 설정했습니다.

## 관리자에서 수정 가능한 항목

- 페이지별 상단/섹션 카피
- 메인/서비스/회사소개/문의의 카드와 단계 데이터
- 포트폴리오 목록 및 상세 본문/이미지
- 자료실/공지 목록 및 상세 본문/이미지/링크
- 푸터 연락처 및 안내 정보

## 사용자 직접 수정 예정 항목

아래 항목은 placeholder 상태로 남겨두었고, 실제 운영 전 직접 교체하는 전제로 두었습니다.

- 회사 소개 문구
- 대표 연락처 및 사업자 정보
- 실제 포트폴리오/설치사례/고객사/로고
- 법적 문서

## 다음 추천 작업

- 관리자 권한 레벨 분리
- 이미지 실제 업로드 스토리지 연결
- 문의 회신 이력 / 담당자 지정 / 알림
- 콘텐츠 JSON 편집기를 더 세분화된 폼 UI로 고도화
