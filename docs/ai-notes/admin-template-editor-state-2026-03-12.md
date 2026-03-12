# Admin Template Editor State

Date: 2026-03-12

## Current model

- The admin content editor is organized by actual public pages, not by top-level menu groups.
- Current editable public pages:
  - `home`
  - `services`
  - `cases`
  - `resourcesNotices`
  - `resourcesFiles`
  - `about`
  - `members`
  - `contact`
- Current common editor pages:
  - `footer`
  - `menus`

Relevant files:
- `src/pages/AdminPage.tsx`
- `src/content/publicPageLayouts.ts`
- `src/types/siteData.ts`
- `src/types/editorConfig.ts`

## Section tab behavior

- Section tabs in page edit default to `Section 1`, `Section 2`, ... .
- Each section card has a custom section-name field.
- Custom labels are stored in `siteData.editor.sectionLabels`.
- If a saved label is empty, the UI falls back to `Section n`.

Relevant files:
- `src/types/editorConfig.ts`
- `src/content/defaultSiteEditorConfig.ts`
- `src/pages/AdminPage.tsx`

## Template assignment status

- Each editable page shows an "applied template" label in the admin UI.
- Template assignments are stored in `siteData.templates`.
- Unimplemented menu targets can be assigned a template from the template manager.
- Pending pages show the connected template title when a route is not implemented.

Relevant files:
- `src/content/publicPageLayouts.ts`
- `src/pages/AdminPage.tsx`
- `src/App.tsx`
- `src/pages/MenuPendingPage.tsx`

## Important limitation

- True shared template inheritance is NOT implemented yet.
- Current state is page-template assignment, not template-driven structure inheritance.
- Editing a template does NOT automatically change the live section structure of every page using that template.
- Public pages still render from page-specific block code plus stored layout data.

In practice:
- `template = metadata / assignment`
- `page content = editable`
- `page structure = still resolved per page at runtime`

## Known risks confirmed in review

1. Menu path changes can orphan real pages.
   - Public routes are hardcoded in `src/App.tsx`.
   - Navigation uses the editable menu path from site content.
   - If a path like `/services` is changed in menu management, users can be sent to a pending page instead of the implemented page.

2. New menu targets can receive a template but still cannot be edited as pages.
   - Template manager discovers assignable paths from menu data.
   - Page edit entries are still hardcoded in `src/pages/AdminPage.tsx`.
   - Result: a new menu can look structurally configured, but there is no matching page editor.

3. Hidden `layouts` data still affects public rendering.
   - Page-structure management UI was removed.
   - Runtime still reads `siteData.layouts` in public rendering.
   - Old saved ordering/visibility can continue to affect live pages without any visible admin control.

## Recommended next step

To finish the intended system, move to this model:

1. Templates own section structure.
2. Pages reference a template and only own content data.
3. Admin separates:
   - template structure editing
   - page content editing
4. New page creation should generate:
   - page slug/path
   - menu link
   - template assignment
   - editable content record

## Files to inspect next

- `src/App.tsx`
- `src/components/SiteLayout.tsx`
- `src/components/PublicPageTemplate.tsx`
- `src/pages/HomePage.tsx`
- `src/pages/AdminPage.tsx`
- `src/lib/api.ts`
