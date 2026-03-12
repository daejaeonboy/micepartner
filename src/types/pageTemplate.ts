export type TemplateCatalogId =
  | 'home-story'
  | 'visual-landing'
  | 'showcase-grid'
  | 'board-index'
  | 'directory'
  | 'detail-story';

export type TemplateLayoutSectionConfig = {
  id: string;
  visible: boolean;
};

export type SiteTemplateLayout = {
  sections: TemplateLayoutSectionConfig[];
};

export type SiteTemplateLayouts = Record<TemplateCatalogId, SiteTemplateLayout>;

export type SitePageTemplates = Record<string, TemplateCatalogId>;
