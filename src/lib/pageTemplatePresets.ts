import { resolveTemplateIdForPath } from '../content/publicPageLayouts';
import { createDefaultCustomPage, findCustomPageByPath, normalizeCustomPagePath } from './customPages';
import type { SiteCopy } from '../types/siteCopy';
import type { SitePageContent, CustomPageContent, CustomPageSection, CustomPageSectionItem } from '../types/siteContent';
import type { SitePageTemplates, SiteTemplateLayouts } from '../types/pageTemplate';

type Snapshot = {
  copy: SiteCopy;
  content: SitePageContent;
  templates: SitePageTemplates;
  templateLayouts: SiteTemplateLayouts;
};

function createSection(id: string, patch: Partial<Omit<CustomPageSection, 'id'>> = {}): CustomPageSection {
  return {
    id,
    eyebrow: '',
    title: '',
    description: '',
    imageUrl: '',
    settings: {},
    primaryButtonLabel: '',
    primaryButtonHref: '',
    secondaryButtonLabel: '',
    secondaryButtonHref: '',
    items: [],
    ...patch,
  };
}

function createItem(patch: Partial<CustomPageSectionItem> = {}): CustomPageSectionItem {
  return {
    kind: 'default',
    title: '',
    description: '',
    details: '',
    meta: '',
    badge: '',
    imageUrl: '',
    href: '',
    ...patch,
  };
}

function cloneExistingCustomPage(sourcePage: CustomPageContent, targetPath: string, targetLabel: string, targetParentLabel: string) {
  return {
    ...sourcePage,
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: normalizeCustomPagePath(sourcePage.path),
    seoTitle: targetLabel,
    seoDescription: sourcePage.seoDescription,
    sections: sourcePage.sections.map((section) => ({
      ...section,
      settings: { ...(section.settings || {}) },
      items: section.items.map((item) => ({ ...item })),
    })),
  };
}

function joinLines(lines: string[]) {
  return lines.filter(Boolean).join('\n');
}

function cloneHomePage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.home.heroDescription,
    sections: [
      createSection('hero', {
        eyebrow: content.home.heroEyebrow,
        title: copy.home.heroTitle,
        description: copy.home.heroDescription,
        imageUrl: content.home.heroImageUrl,
        primaryButtonLabel: content.home.primaryCtaLabel,
        primaryButtonHref: content.home.primaryCtaHref,
        secondaryButtonLabel: content.home.secondaryCtaLabel,
        secondaryButtonHref: content.home.secondaryCtaHref,
      }),
      createSection('service-preview', {
        eyebrow: content.home.servicePreviewEyebrow,
        title: copy.home.servicePreviewTitle,
        description: copy.home.servicePreviewDescription,
        items: content.services.modules.slice(0, 4).map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.points?.join(' / ') || '',
            badge: item.badge || '',
            imageUrl: item.imageUrl,
          }),
        ),
      }),
      createSection('positioning', {
        title: copy.home.positioningTitle,
        description: copy.home.positioningDescription,
        items: content.home.positioningCards.map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            badge: item.badge || '',
            imageUrl: item.imageUrl,
          }),
        ),
      }),
      createSection('portfolio-preview', {
        title: copy.home.portfolioPreviewTitle,
        description: copy.home.portfolioPreviewDescription,
        items: content.cases.entries.slice(0, 3).map((item) =>
          createItem({
            title: item.title,
            description: item.cardDescription,
            meta: item.outcome,
            badge: item.category,
            imageUrl: item.coverImageUrl,
            href: `/cases/${item.slug}`,
          }),
        ),
      }),
      createSection('resources-preview', {
        title: copy.home.resourcesPreviewTitle,
        description: copy.home.resourcesPreviewDescription,
        items: content.resources.items.slice(0, 3).map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.updatedAt,
            badge: item.type,
            imageUrl: item.coverImageUrl,
            href: item.downloadUrl,
          }),
        ),
      }),
      createSection('partners', {
        title: copy.home.processTitle,
        description: copy.home.processDescription,
        items: content.home.partnerLogos.map((item) =>
          createItem({
            title: item.name,
            imageUrl: item.logoUrl,
          }),
        ),
      }),
      createSection('cta', {
        title: copy.home.ctaTitle,
        description: copy.home.ctaDescription,
        imageUrl: content.home.ctaImageUrl,
        primaryButtonLabel: content.home.ctaButtonLabel,
        primaryButtonHref: '/contact',
        secondaryButtonLabel: content.home.secondaryCtaLabel,
        secondaryButtonHref: content.home.secondaryCtaHref,
      }),
    ],
  } as CustomPageContent;
}

function cloneServicesPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/services',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.services.introDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.services.introEyebrow,
        title: copy.services.introTitle,
        description: copy.services.introDescription,
      }),
      createSection('section-1', {
        title: '',
        description: '',
        imageUrl: content.services.heroImageUrl,
      }),
      createSection('section-2', {
        eyebrow: content.services.modulesEyebrow,
        title: copy.services.modulesTitle,
        description: copy.services.modulesDescription,
        items: content.services.modules.map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.points?.join(' / ') || '',
            badge: item.badge || '',
            imageUrl: item.imageUrl,
          }),
        ),
      }),
      createSection('section-3', {
        eyebrow: content.services.flowEyebrow,
        title: copy.services.flowTitle,
        description: copy.services.flowDescription,
        items: content.services.flowSteps.map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.step,
          }),
        ),
      }),
    ],
  } as CustomPageContent;
}

function cloneCasesPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/cases',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.cases.introDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.cases.introEyebrow,
        title: copy.cases.introTitle,
        description: copy.cases.introDescription,
      }),
      createSection('section-1', {
        eyebrow: content.cases.categoriesEyebrow,
        title: copy.cases.categoriesTitle,
        description: copy.cases.categoriesDescription,
        items: content.cases.categories.map((item) => createItem({ title: item, description: '' })),
      }),
      createSection('section-2', {
        eyebrow: content.cases.cardsEyebrow,
        title: copy.cases.cardsTitle,
        description: copy.cases.cardsDescription,
        items: content.cases.entries.map((item) =>
          createItem({
            title: item.title,
            description: item.cardDescription,
            meta: item.outcome,
            badge: item.category,
            imageUrl: item.coverImageUrl,
            href: `/cases/${item.slug}`,
          }),
        ),
      }),
      createSection('section-3', {
        title: copy.cases.ownerTitle,
        description: copy.cases.ownerDescription,
      }),
    ],
  } as CustomPageContent;
}

function cloneResourcesNoticesPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/resources/notices',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.resources.noticesDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.resources.noticesEyebrow,
        title: copy.resources.noticesTitle,
        description: copy.resources.noticesDescription,
      }),
      createSection('section-1', {
        title: copy.resources.noticesTitle,
        description: copy.resources.noticesDescription,
        settings: {
          variant: 'notices',
          actionLabel: '자료 보기',
          actionHref: '/resources/files',
          allCategoryLabel: '전체',
          searchPlaceholder: '공지 검색',
          searchOpenLabel: '검색창 열기',
          searchCloseLabel: '검색창 닫기',
          clearSearchLabel: '검색어 지우기',
          loadMoreLabel: '더 보기',
          emptyMessage: '조건에 맞는 공지가 없습니다.',
        },
        items: content.resources.notices.map((item) =>
          createItem({
            kind: 'notice',
            title: item.title,
            description: item.summary,
            meta: item.date,
            badge: item.category,
            imageUrl: item.coverImageUrl,
            href: `/resources/notices/${item.slug}`,
          }),
        ),
      }),
      createSection('section-2', {
        title: copy.resources.ownerTitle,
        description: copy.resources.ownerDescription,
      }),
    ],
  } as CustomPageContent;
}

function cloneResourcesFilesPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/resources/files',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.resources.downloadsDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.resources.downloadsEyebrow,
        title: copy.resources.downloadsTitle,
        description: copy.resources.downloadsDescription,
      }),
      createSection('section-1', {
        title: copy.resources.downloadsTitle,
        description: copy.resources.sectionsDescription,
        settings: {
          variant: 'files',
          actionLabel: '소식 보기',
          actionHref: '/resources/notices',
        },
        items: content.resources.items.map((item) =>
          createItem({
            kind: 'resource',
            title: item.title,
            description: item.description,
            meta: item.updatedAt || item.version || item.fileName,
            badge: item.type,
            imageUrl: item.coverImageUrl,
            href: item.downloadUrl || `/resources/files/${item.slug}`,
          }),
        ),
      }),
      createSection('section-2', {
        title: copy.resources.ownerTitle,
        description: copy.resources.ownerDescription,
      }),
    ],
  } as CustomPageContent;
}

function cloneAboutPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/about',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.about.introDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.about.introEyebrow,
        title: copy.about.introTitle,
        description: copy.about.introDescription,
      }),
      createSection('section-1', {
        eyebrow: content.about.identityEyebrow,
        title: copy.about.identityTitle,
        description: copy.about.identityDescription,
        imageUrl: content.about.heroImageUrl,
        settings: {
          variant: 'about-identity',
          listTitle: copy.about.identityCardTitle,
          messageEyebrow: copy.about.ownerCardTitle,
          messageTitle: content.about.messageTitle,
          messageBody: content.about.messageBody,
        },
        items: content.about.identityPoints.map((point) => createItem({ kind: 'identity-point', title: point, description: '' })),
      }),
      createSection('section-2', {
        eyebrow: content.about.strengthEyebrow,
        title: copy.about.strengthTitle,
        description: copy.about.strengthDescription,
        items: content.about.highlights.map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.points?.join(' / ') || '',
            badge: item.badge || '',
            imageUrl: item.imageUrl,
          }),
        ),
      }),
      createSection('section-3', {
        eyebrow: content.about.processEyebrow,
        title: copy.about.processTitle,
        description: copy.about.processDescription,
        items: content.about.processSteps.map((item) =>
          createItem({
            title: item.title,
            description: item.description,
            meta: item.step,
          }),
        ),
      }),
    ],
  } as CustomPageContent;
}

function cloneMembersPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/members',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.members.introDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.members.introEyebrow,
        title: copy.members.introTitle,
        description: copy.members.introDescription,
      }),
      createSection('section-1', {
        settings: {
          filterAllLabel: content.members.filterAllLabel,
          searchPlaceholder: content.members.searchPlaceholder,
          searchButtonLabel: content.members.searchButtonLabel,
          totalLabel: content.members.totalLabel,
          currentPageLabel: content.members.currentPageLabel,
          emptyTitle: '검색 결과가 없습니다.',
          emptyDescription: '검색어 또는 분과 조건을 다시 확인해 주세요.',
        },
        items: content.members.companies.map((company) =>
          createItem({
            kind: 'company',
            title: company.name,
            description: `${company.category}${company.secondaryCategory ? ` · ${company.secondaryCategory}` : ''}\n${company.address}`,
            meta: company.phone,
            badge: company.category,
            imageUrl: company.logoUrl,
          }),
        ),
      }),
    ],
  } as CustomPageContent;
}

function cloneContactPage(snapshot: Snapshot, templateId: ReturnType<typeof resolveTemplateIdForPath>, targetPath: string, targetLabel: string, targetParentLabel: string) {
  if (!templateId) {
    return null;
  }

  const { copy, content } = snapshot;
  return {
    path: targetPath,
    label: targetLabel,
    parentLabel: targetParentLabel,
    sourcePath: '/contact',
    templateId,
    seoTitle: targetLabel,
    seoDescription: copy.contact.introDescription,
    sections: [
      createSection('intro', {
        eyebrow: content.contact.introEyebrow,
        title: copy.contact.introTitle,
        description: copy.contact.introDescription,
      }),
      createSection('section-1', {
        imageUrl: content.contact.heroImageUrl,
      }),
      createSection('section-2', {
        eyebrow: content.contact.optionsEyebrow,
        title: copy.contact.optionsTitle,
        description: copy.contact.optionsDescription,
        settings: {
          variant: 'contact-options',
        },
        items: [
          ...content.contact.options.map((item) =>
            createItem({
              kind: 'contact-option',
              title: item.title,
              description: item.description,
              meta: item.points?.join(' / ') || '',
              badge: item.badge || '',
              imageUrl: item.imageUrl,
            }),
          ),
          createItem({
            kind: 'trust-card',
            title: copy.contact.trustCardTitle,
            description: copy.contact.trustCardDescription,
            details: joinLines(content.contact.trustBullets),
          }),
        ],
      }),
      createSection('section-3', {
        eyebrow: content.contact.formEyebrow,
        title: copy.contact.formTitle,
        description: copy.contact.formDescription,
        primaryButtonLabel: content.contact.submitButtonLabel,
        primaryButtonHref: '/contact',
        settings: {
          variant: 'contact-form',
          organizationLabel: content.contact.organizationLabel,
          organizationPlaceholder: content.contact.organizationPlaceholder,
          contactNameLabel: content.contact.contactNameLabel,
          contactNamePlaceholder: content.contact.contactNamePlaceholder,
          emailLabel: content.contact.emailLabel,
          emailPlaceholder: content.contact.emailPlaceholder,
          eventDateLabel: content.contact.eventDateLabel,
          eventDatePlaceholder: content.contact.eventDatePlaceholder,
          messageLabel: content.contact.messageLabel,
          messagePlaceholder: content.contact.messagePlaceholder,
          submitButtonLabel: content.contact.submitButtonLabel,
          submitPendingLabel: content.contact.submitPendingLabel,
          submitSuccessMessage: content.contact.submitSuccessMessage,
          processCardTitle: copy.contact.processCardTitle,
          checklistCardTitle: copy.contact.checklistCardTitle,
          placeholderCardTitle: copy.contact.placeholderCardTitle,
        },
        items: [
          ...content.contact.responseSteps.map((item) =>
            createItem({
              kind: 'process-step',
              title: item.title,
              description: item.description,
              meta: item.step,
            }),
          ),
          ...content.contact.checklist.map((item) =>
            createItem({
              kind: 'checklist-item',
              title: item,
            }),
          ),
          ...content.contact.contactInfo.map((item) =>
            createItem({
              kind: 'contact-info',
              title: item.label,
              description: item.value,
              href: item.href,
            }),
          ),
        ],
      }),
    ],
  } as CustomPageContent;
}

export function buildClonedCustomPageFromSource(
  snapshot: Snapshot,
  sourcePath: string,
  targetPath: string,
  targetLabel: string,
  targetParentLabel = '',
) {
  const normalizedSourcePath = normalizeCustomPagePath(sourcePath);
  const normalizedTargetPath = normalizeCustomPagePath(targetPath);
  const existingCustomSource = findCustomPageByPath(snapshot.content.customPages, normalizedSourcePath);

  if (existingCustomSource) {
    return cloneExistingCustomPage(existingCustomSource, normalizedTargetPath, targetLabel, targetParentLabel);
  }

  const templateId = resolveTemplateIdForPath(normalizedSourcePath, snapshot.templates);

  switch (normalizedSourcePath) {
    case '/':
      return cloneHomePage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/services':
      return cloneServicesPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/cases':
      return cloneCasesPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/resources/notices':
      return cloneResourcesNoticesPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/resources/files':
      return cloneResourcesFilesPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/about':
      return cloneAboutPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/members':
      return cloneMembersPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    case '/contact':
      return cloneContactPage(snapshot, templateId, normalizedTargetPath, targetLabel, targetParentLabel);
    default:
      return templateId
        ? {
            ...createDefaultCustomPage(
              {
                label: targetLabel,
                path: normalizedTargetPath,
                parentLabel: targetParentLabel,
                source: '페이지 템플릿',
              },
              templateId,
              snapshot.templateLayouts,
            ),
            sourcePath: normalizedSourcePath,
          }
        : null;
  }
}
