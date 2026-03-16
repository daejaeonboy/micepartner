# Admin Template Editor State

Date: 2026-03-13

## Current state

- 템플릿 시스템은 유지하지 않습니다.
- 페이지는 개별 페이지 편집 기준으로 정리하는 방향입니다.
- 템플릿 할당, 템플릿 레이아웃, 커스텀 페이지 자동 생성은 제거 완료됐습니다.

## Data model direction

- 유지 대상
  - `siteData.copy`
  - `siteData.content`
  - `siteData.editor`
- 제거 대상
  - `siteData.layouts`
  - `siteData.templates`
  - `siteData.templateLayouts`
  - `siteContent.customPages`

## Note

- 이 문서는 템플릿 제거 이후 기준 상태를 기록합니다.
