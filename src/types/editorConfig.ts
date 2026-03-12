export type BuiltinEditorPageId =
  | 'home'
  | 'services'
  | 'cases'
  | 'portfolioDetail'
  | 'resourcesNotices'
  | 'noticeDetail'
  | 'resourcesFiles'
  | 'resourceDetail'
  | 'about'
  | 'members'
  | 'contact'
  | 'footer'
  | 'menus';

export type EditorPageId = BuiltinEditorPageId | `custom:${string}`;

export type SiteEditorConfig = {
  sectionLabels: Record<string, Record<string, string>>;
};
