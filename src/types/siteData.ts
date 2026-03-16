import type { SiteEditorConfig } from './editorConfig';
import type { SiteCopy } from './siteCopy';
import type { SitePageContent } from './siteContent';

export type SiteData = {
  copy: SiteCopy;
  content: SitePageContent;
  editor: SiteEditorConfig;
};
