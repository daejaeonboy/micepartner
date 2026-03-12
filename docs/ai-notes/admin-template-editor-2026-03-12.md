# Admin / Template Editor Notes

Date: 2026-03-12
Project: `micepartner`

## Current admin editing model

- `홈페이지 관리 > 페이지 편집` is now organized by actual public pages, not by upper menu groups.
- Public-page editors currently exposed in the admin:
  - `메인 홈`
  - `서비스`
  - `포트폴리오`
  - `포트폴리오 상세`
  - `정보센터 소식`
  - `정보센터 소식 상세`
  - `정보센터 자료`
  - `정보센터 자료 상세`
  - `회사소개`
  - `MICE 회원`
  - `문의`
  - Common area: `푸터`
  - Separate content page: `메뉴 관리`
- Page names in the editor try to follow current header menu labels where possible.

## Section tab behavior

- Section tabs no longer use fixed Korean names in the admin tab strip.
- Each page editor shows tabs as `Section 1`, `Section 2`, ... by default.
- Each section card includes a `섹션명` input.
- If the input is empty, the tab label falls back to `Section n`.
- These labels are stored in `siteData.editor.sectionLabels`.

Files:
- `src/types/editorConfig.ts`
- `src/content/defaultSiteEditorConfig.ts`
- `src/types/siteData.ts`
- `src/content/defaultSiteData.ts`
- `src/pages/AdminPage.tsx`

## Template assignment and shared structure status

- `템플릿 관리` still stores page-to-template assignments in `siteData.templates`.
- Shared template structure is now stored in `siteData.templateLayouts`.
- Implemented pages and pending menu paths both use the same template assignment store.
- The admin page editor now treats `템플릿 적용` as `원본 페이지 복제` first:
  - the operator selects a source page
  - the target page gets that source page's current structure/content cloned into a custom override snapshot
  - after that, the target page's text/images are edited independently
- The page editor header now keeps only:
  - `적용 구조 템플릿`
  - `페이지 경로`
- Source-page reassignment is intentionally centralized in `템플릿 관리`.
- The admin template screen now edits:
  - page-to-template assignment
  - template section order
  - template section visibility

Current default template mapping and shared template layout definitions live in:
- `src/content/publicPageLayouts.ts`

Current template-aware storage lives in:
- `src/types/siteData.ts`
- `src/types/pageTemplate.ts`

## Runtime synchronization that is implemented now

- Public rendering now resolves sections from:
  - assigned template id
  - shared `templateLayouts`
  - page-specific runtime block bindings
- `siteData.layouts` is now a derived compatibility snapshot rebuilt from:
  - `siteData.templates`
  - `siteData.templateLayouts`
- During normalization/save, layouts are rebuilt from template assignments and shared template structure.
- This removed the old drift where stale saved layout order/visibility could affect the public site without any admin control.

Files:
- `src/content/publicPageLayouts.ts`
- `src/lib/api.ts`
- `src/content/defaultSiteData.ts`
- `src/components/PublicPageTemplate.tsx`
- `src/pages/HomePage.tsx`

## Custom pages that are implemented now

- `siteContent.customPages` now exists and stores path-based custom page content.
- `siteContent.customPages[].sourcePath` now records which page the override/custom page was cloned from.
- When a custom menu path gets a template assignment and is saved, normalization auto-generates a real editable custom page record.
- Implemented public routes can now also have a custom override snapshot in `siteContent.customPages`.
- If a built-in page receives a cloned source-page template in the admin, the app now renders the override snapshot first instead of the hardcoded page component.
- Unknown routed menu paths no longer always fall back to `준비중`:
  - if a matching custom page exists, the app renders a template-driven custom page
  - if not, it still shows `MenuPendingPage`
- Relevant files:
  - `src/lib/customPages.ts`
  - `src/lib/pageTemplatePresets.ts`
  - `src/pages/CustomPageRenderer.tsx`
  - `src/App.tsx`
  - `src/lib/api.ts`
  - `src/types/siteContent.ts`

## Source-page clone coverage that exists now

- Built-in page cloning now carries more than section titles and images.
- The generic custom-page snapshot also stores page-specific UI text in:
  - `section.settings`
  - `item.details`
- This is currently used for:
  - `정보센터 소식`: 카테고리/검색/더보기/빈 상태 문구
  - `정보센터 자료`: 점프 링크/리스트 설명
  - `회사소개`: 메시지 카드 제목/본문
  - `MICE 회원`: 검색/필터/요약/빈 상태 문구
  - `문의`: 신뢰 카드, 폼 라벨/플레이스홀더/완료 문구, 우측 카드 제목
- The generic renderer reads those settings from:
  - `src/pages/CustomPageRenderer.tsx`

## Admin duplicate cleanup applied

- Page editing no longer repeats `템플릿 원본 페이지` in each page header.
- Template/source changes now live only in `템플릿 관리`.
- The duplicated `템플릿 구조/지정 저장` button in the pending-menu section was removed.
- One important split to keep in mind:
  - `템플릿 관리` = source page / template structure
  - `홈페이지 관리 > 페이지 편집` = copied page content

## Board-index template consistency

- `정보센터 소식` and `정보센터 자료` now share the same outer board shell component.
- The shared frame lives in:
  - `src/components/BoardIndexSection.tsx`
- It is used by:
  - `src/pages/ResourcesPage.tsx`
  - `src/pages/ResourceFilesPage.tsx`
- This keeps the board-index template closer to a single frame language even though the inner list content is still page-specific.

## What true template inheritance means in the current codebase

This is the current architectural state.

What is implemented now:
- Template structure edits update shared section order/visibility.
- Pages using the same template pick up that shared structure at runtime.
- Page editors now derive their tab order from template-driven runtime sections instead of only fixed page order.
- Page content remains independent:
  - text
  - images
  - cards
  - item arrays

In short:
- `templates` = which template a page uses
- `templateLayouts` = shared template structure
- `content/copy` = per-page content
- `layouts` = derived runtime snapshot

This means the project is now in a real:
- `template owns structure`
- `page owns text/images`

state for the existing built-in pages.

## Current runtime structure source

Public rendering resolves layout data from:
- `src/components/PublicPageTemplate.tsx`
- `src/pages/HomePage.tsx`
- `src/content/publicPageLayouts.ts`

It resolves visible section order through:
- `resolvePageLayoutSections(...)`
- `resolveTemplateIdForPage(...)`
- `resolveTemplateLayout(...)`

`siteData.layouts` remains only as a template-derived compatibility snapshot during normalization/save.

## Current risk areas to remember

1. Some page editors still map multiple runtime sections into one content tab.
   - This improved for pages with a true standalone visual slot, but not every template/page pair is perfectly 1-section=1-tab yet.
   - `about` and detail pages still have some content concentrated into broader tabs because the underlying data model is still page-specific.

2. Built-in page cloning now works through the generic custom-page renderer.
   - This means `소스 페이지를 복제한 대상 페이지` is rendered by `CustomPageRenderer`, not the original bespoke built-in TSX.
   - So the result follows the selected source page's structure/content snapshot, but it is still constrained by the generic renderer for that template family.

3. `section.settings` is still a loose `Record<string, string>`.
   - This is flexible for admin editing, but TS cannot strongly protect against key drift between presets and renderer.
   - If clone presets or renderer logic change, inspect:
     - `src/lib/pageTemplatePresets.ts`
     - `src/pages/CustomPageRenderer.tsx`

4. Menu path editing for implemented public routes is intentionally locked in the admin.
   - This prevents accidental breakage between menu links and hardcoded real routes.
   - New custom menu paths still remain editable.

## Files to inspect first next time

- `src/pages/AdminPage.tsx`
- `src/components/PublicPageTemplate.tsx`
- `src/pages/HomePage.tsx`
- `src/content/publicPageLayouts.ts`
- `src/lib/api.ts`
- `src/types/siteData.ts`
- `src/types/editorConfig.ts`

## Recommended next implementation order

1. Move real section structure ownership from page-specific config into template data.
2. Split editor tabs further where one runtime block still maps to a combined content group.
3. Improve `CustomPageRenderer` template families so cloned built-in pages match their source pages more exactly.
4. Keep page-specific editing focused on text, images, cards, and item data.

## Quick summary for the next AI

If you reopen this project later, assume:
- admin page editing is page-based
- detail pages are now listed in admin page editing
- section tab labels are editable and stored in `siteData.editor.sectionLabels`
- template assignment exists and shared template structure now drives runtime section order/visibility
- source-page cloning now creates/updates `siteContent.customPages` overrides for both custom paths and built-in paths
- built-in routes now render a matching custom override first when one exists
- menu links for implemented routes are intentionally path-locked in admin
- the generic custom-page renderer exists, but it is template-driven rather than a full freeform page builder
