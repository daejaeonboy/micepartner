export type IconKey = string;

export type SiteMetric = {
  label: string;
  value: string;
};

export type SiteStat = {
  label: string;
  value: string;
  detail: string;
};

export type SiteCard = {
  title: string;
  description: string;
  iconKey: IconKey;
  imageUrl: string;
  badge?: string;
  points?: string[];
};

export type HeroSlide = {
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
};

export type TimelineItem = {
  step: string;
  title: string;
  description: string;
};

export type PartnerLogoItem = {
  name: string;
  logoUrl: string;
};

export type PortfolioGalleryItem = {
  imageUrl: string;
  caption: string;
};

export type PortfolioEntry = {
  slug: string;
  category: string;
  tags: string[];
  title: string;
  cardDescription: string;
  outcome: string;
  client: string;
  period: string;
  scope: string[];
  summary: string;
  challenge: string;
  approach: string;
  result: string;
  coverImageUrl: string;
  gallery: PortfolioGalleryItem[];
  updatedAt?: string;
  seoTitle?: string;
  seoDescription?: string;
};

export type ResourceCategory = {
  title: string;
  description: string;
};

export type NoticeAttachment = {
  label: string;
  url: string;
};

export type NoticeItem = {
  slug: string;
  category: string;
  title: string;
  date: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  attachments: NoticeAttachment[];
};

export type ResourceItem = {
  slug: string;
  title: string;
  type: string;
  description: string;
  body: string;
  downloadLabel: string;
  downloadUrl: string;
  fileName: string;
  version: string;
  updatedAt: string;
  coverImageUrl: string;
};

export type ContactInfoItem = {
  label: string;
  value: string;
  href: string;
};

export type FooterLinkItem = {
  label: string;
  path: string;
};

export type FooterMetaPoint = {
  label: string;
  iconKey: IconKey;
};

export type HeaderMenuChildItem = {
  label: string;
  path: string;
};

export type HeaderMenuItem = {
  label: string;
  path: string;
  imageUrl?: string;
  children: HeaderMenuChildItem[];
};

export type MemberCompany = {
  slug?: string;
  name: string;
  category: string;
  secondaryCategory: string;
  address: string;
  phone: string;
  logoUrl: string;
  updatedAt: string;
  body?: string;
};

export type FAQItem = {
  question: string;
  answer: string;
  category: string;
};

export type SitePageContent = {
  home: {
    servicePreviewEyebrow: string;
    servicePreviewImageUrl: string;
    heroEyebrow: string;
    heroBadge: string;
    heroImageUrl: string;
    heroSlides: HeroSlide[];
    heroPanelStatus: string;
    heroPanelTitle: string;
    heroPanelMetrics: SiteMetric[];
    heroStats: SiteStat[];
    positioningCards: SiteCard[];
    positioningCtaHref: string;
    proofItems: { label: string; iconKey: IconKey }[];
    partnerLogos: PartnerLogoItem[];
    primaryCtaLabel: string;
    primaryCtaHref: string;
    secondaryCtaLabel: string;
    secondaryCtaHref: string;
    resourcesCtaHref: string;
    partnersCtaHref: string;
    ctaButtonLabel: string;
    ctaButtonHref: string;
    ctaImageUrl: string;
  };
  services: {
    introEyebrow: string;
    modulesEyebrow: string;
    flowEyebrow: string;
    heroImageUrl: string;
    modules: SiteCard[];
    flowSteps: TimelineItem[];
  };
  cases: {
    introEyebrow: string;
    categoriesEyebrow: string;
    allCategoryLabel: string;
    cardsEyebrow: string;
    searchPlaceholder: string;
    searchButtonLabel: string;
    totalLabel: string;
    currentPageLabel: string;
    detailLinkLabel: string;
    emptyStateMessage: string;
    emptyStateDescription: string;
    categories: string[];
    entries: PortfolioEntry[];
  };
  resources: {
    introEyebrow: string;
    sectionsEyebrow: string;
    noticesEyebrow: string;
    downloadsEyebrow: string;
    noticeLinkLabel: string;
    resourceLinkLabel: string;
    categories: ResourceCategory[];
    notices: NoticeItem[];
    items: ResourceItem[];
  };
  about: {
    introEyebrow: string;
    identityEyebrow: string;
    strengthEyebrow: string;
    processEyebrow: string;
    heroImageUrl: string;
    identityImageUrl: string;
    strengthImageUrl: string;
    processImageUrl: string;
    messageTitle: string;
    messageBody: string;
    identityPoints: string[];
    highlights: SiteCard[];
    processSteps: TimelineItem[];
  };
  support: {
    introEyebrow: string;
    title: string;
    description: string;
    phone: string;
    hours: string;
    chatLabel: string;
    chatHref: string;
    faqTitle: string;
    faqCategories: string[];
    faqs: FAQItem[];
  };
  contact: {
    introEyebrow: string;
    optionsEyebrow: string;
    formEyebrow: string;
    organizationLabel: string;
    organizationPlaceholder: string;
    contactNameLabel: string;
    contactNamePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    eventDateLabel: string;
    eventDatePlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    submitButtonLabel: string;
    submitPendingLabel: string;
    submitSuccessMessage: string;
    heroImageUrl: string;
    options: SiteCard[];
    trustBullets: string[];
    responseSteps: TimelineItem[];
    checklist: string[];
    contactInfo: ContactInfoItem[];
  };
  members: {
    introEyebrow: string;
    filterAllLabel: string;
    searchPlaceholder: string;
    searchButtonLabel: string;
    totalLabel: string;
    currentPageLabel: string;
    emptyStateTitle: string;
    emptyStateDescription: string;
    companies: MemberCompany[];
  };
  menus: {
    headerItems: HeaderMenuItem[];
    footerQuickLinks: FooterLinkItem[];
  };
  footer: {
    headerCtaLabel: string;
    customerServiceTitle: string;
    customerServicePhone: string;
    customerServiceHours: string;
    bankSectionTitle: string;
    bankName: string;
    bankAccountNumber: string;
    bankAccountHolder: string;
    bankLogoUrl: string;
    legalLines: string[];
    copyright: string;
    companyName: string;
    metaPoints: FooterMetaPoint[];
    contactInfo: ContactInfoItem[];
  };
};
