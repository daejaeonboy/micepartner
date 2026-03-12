export type PublicPageLayoutKey =
  | 'home'
  | 'services'
  | 'cases'
  | 'about'
  | 'contact'
  | 'members'
  | 'resourcesNotices'
  | 'resourcesFiles'
  | 'portfolioDetail'
  | 'noticeDetail'
  | 'resourceDetail'
  | 'menuPending';

export type PageLayoutSectionConfig = {
  id: string;
  visible: boolean;
};

export type SitePageLayout = {
  sections: PageLayoutSectionConfig[];
};

export type SitePageLayouts = Record<PublicPageLayoutKey, SitePageLayout>;
