export type BuiltinEditorPageId =
  | 'home'
  | 'cases'
  | 'portfolioDetail'
  | 'resourcesNotices'
  | 'noticeDetail'
  | 'resourcesFiles'
  | 'resourceDetail'
  | 'about'
  | 'members'
  | 'support'
  | 'contact'
  | 'footer'
  | 'menus';

export type EditorPageId = BuiltinEditorPageId;

export type SiteEditorConfig = {
  sectionLabels: Record<string, Record<string, string>>;
};
