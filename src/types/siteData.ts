import type { SiteEditorConfig } from './editorConfig';
import type { SiteCopy } from './siteCopy';
import type { SitePageLayouts } from './pageLayout';
import type { SitePageContent } from './siteContent';
import type { SitePageTemplates, SiteTemplateLayouts } from './pageTemplate';

export type SiteData = {
  copy: SiteCopy;
  content: SitePageContent;
  layouts: SitePageLayouts;
  templates: SitePageTemplates;
  templateLayouts: SiteTemplateLayouts;
  editor: SiteEditorConfig;
};
