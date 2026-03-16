import type { SiteData } from '../types/siteData';
import { defaultSiteContent } from './defaultSiteContent';
import { defaultSiteCopy } from './defaultSiteCopy';
import { defaultSiteEditorConfig } from './defaultSiteEditorConfig';

export const defaultSiteData: SiteData = {
  copy: defaultSiteCopy,
  content: defaultSiteContent,
  editor: defaultSiteEditorConfig,
};
