import { Fragment, type ReactNode } from 'react';
import { motion } from 'motion/react';
import { resolveTemplateIdForPage, resolveTemplateSectionsForPage } from '../content/publicPageLayouts';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';
import type { PublicPageLayoutKey } from '../types/pageLayout';
import { PageIntro } from './PageIntro';
import { SectionHeading } from './SectionHeading';

type PublicPageTemplateProps = {
  page: PublicPageLayoutKey;
  blocks: Record<string, ReactNode>;
};

type PageVisualBlockProps = {
  imageUrl?: string;
  alt: string;
};

type PageSectionBlockProps = {
  id?: string;
  variant?: 'default' | 'alt' | 'tight';
  eyebrow?: string;
  title?: string;
  description?: string;
  children: ReactNode;
};

type PageHeaderBlockProps = {
  title: string;
  description: string;
  actionLabel?: string;
  actionTo?: string;
  action?: ReactNode;
};

type PageOwnerNoteBlockProps = {
  title: string;
  description: string;
  variant?: 'card' | 'resource';
};

type PageBannerIntroBlockProps = {
  title: string;
  description: string;
  eyebrow?: string;
};

export function PublicPageTemplate({ page, blocks }: PublicPageTemplateProps) {
  const { siteData } = useSiteContent();
  const templateId = resolveTemplateIdForPage(page, siteData.templates);
  const resolvedSections = resolveTemplateSectionsForPage(page, templateId, siteData.templateLayouts);

  return (
    <>
      {resolvedSections.filter((section) => section.visible).map((section) => (
        <Fragment key={section.id}>{blocks[section.id] ?? null}</Fragment>
      ))}
    </>
  );
}

export function PageIntroBlock({ eyebrow, title, description }: { eyebrow: string; title: string; description: string }) {
  return <PageIntro eyebrow={eyebrow} title={title} description={description} />;
}

export function PageBannerIntroBlock({ title, description, eyebrow }: PageBannerIntroBlockProps) {
  return (
    <section className="members-hero" style={{ padding: '64px 0 0' }}>
      <div className="members-hero__inner">
        <div className="members-hero__content">
          {eyebrow ? <p className="section-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </section>
  );
}

export function PageVisualBlock({ imageUrl, alt }: PageVisualBlockProps) {
  if (!imageUrl) {
    return null;
  }

  return (
    <section className="content-section content-section--tight">
      <div className="section-image-frame">
        <img src={imageUrl} alt={alt} className="section-image-frame__image" />
      </div>
    </section>
  );
}

export function PageSectionBlock({
  id,
  variant = 'default',
  eyebrow,
  title,
  description,
  children,
}: PageSectionBlockProps) {
  const className =
    variant === 'alt'
      ? 'content-section content-section--alt'
      : variant === 'tight'
        ? 'content-section content-section--tight'
        : 'content-section';

  return (
    <section id={id} className={className}>
      {eyebrow || title || description ? (
        <SectionHeading eyebrow={eyebrow || ''} title={title || ''} description={description || ''} />
      ) : null}
      {children}
    </section>
  );
}

export function PageHeaderBlock({ title, description, actionLabel, actionTo, action }: PageHeaderBlockProps) {
  return (
    <header className="board-container board-header" style={{ paddingBottom: 0 }}>
      <h1>{title}</h1>
      <p>{description}</p>
      {action ? action : actionLabel && actionTo ? <a href={actionTo} className="resource-news-page__jump">{actionLabel}</a> : null}
    </header>
  );
}

export function PageOwnerNoteBlock({ title, description, variant = 'card' }: PageOwnerNoteBlockProps) {
  if (variant === 'resource') {
    return (
      <section className="resource-owner-note">
        <strong>{title}</strong>
        <p>{description}</p>
      </section>
    );
  }

  return (
    <section className="content-section">
      <motion.article {...fadeUp} className="stack-card">
        <h3>{title}</h3>
        <p>{description}</p>
      </motion.article>
    </section>
  );
}
