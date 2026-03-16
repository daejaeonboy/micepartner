# Admin / Template Editor Notes

Date: 2026-03-13
Project: `micepartner`

## Status

- 템플릿 시스템 제거 작업은 완료됐습니다.
- 아래 항목은 현재 코드베이스에서 사용하지 않습니다.
  - `siteData.templates`
  - `siteData.templateLayouts`
  - `siteContent.customPages`
  - 템플릿 구조 상속
  - 원본 페이지 복제형 템플릿 적용 흐름

## Current direction

- 페이지는 템플릿이 아니라 개별 페이지 단위로 관리합니다.
- 저장 구조는 `copy`, `content`, `editor` 중심으로 단순화합니다.
- 예전 Firestore 데이터에 템플릿/커스텀 페이지 필드가 남아 있어도 정규화 단계에서 무시합니다.

## Notes for the next AI

- 템플릿 관리 UI, 템플릿 기반 런타임 렌더링, 커스텀 페이지 자동 생성 흐름은 이미 제거된 상태로 보고 작업해야 합니다.
- 페이지는 개별 페이지 단위로 편집하며, 새 페이지를 추가할 때도 템플릿이 아니라 별도 페이지 구현 기준으로 작업해야 합니다.
