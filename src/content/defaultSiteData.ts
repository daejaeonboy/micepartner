import type { SiteData } from '../types/siteData';
import { defaultSiteContent } from './defaultSiteContent';
import { defaultSiteCopy } from './defaultSiteCopy';
import { defaultSiteEditorConfig } from './defaultSiteEditorConfig';
import { buildSitePageLayoutsFromTemplates, defaultSitePageTemplates, defaultSiteTemplateLayouts } from './publicPageLayouts';

export const defaultSiteData: SiteData = {
  copy: defaultSiteCopy,
  content: defaultSiteContent,
  layouts: buildSitePageLayoutsFromTemplates(defaultSitePageTemplates, defaultSiteTemplateLayouts),
  templates: defaultSitePageTemplates,
  templateLayouts: defaultSiteTemplateLayouts,
  editor: defaultSiteEditorConfig,
};
