export type BuiltinEditorPageId =
  | 'home'
  | 'cases'
  | 'resourcesNotices'
  | 'resourcesFiles'
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
