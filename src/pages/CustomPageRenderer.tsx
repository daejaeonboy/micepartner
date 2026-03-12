import { type ChangeEvent, type FormEvent, useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Search, ShieldCheck, X } from 'lucide-react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { BoardIndexSection } from '../components/BoardIndexSection';
import {
  PageBannerIntroBlock,
  PageHeaderBlock,
  PageIntroBlock,
  PageOwnerNoteBlock,
  PageSectionBlock,
  PageVisualBlock,
} from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { resolveTemplateLayout } from '../content/publicPageLayouts';
import { useSiteContent } from '../context/SiteContentContext';
import { submitInquiry } from '../lib/api';
import { fadeUp } from '../lib/motion';
import type { CustomPageContent, CustomPageSection, CustomPageSectionItem } from '../types/siteContent';

const DIRECTORY_PAGE_SIZE = 10;
const BOARD_INITIAL_COUNT = 10;
const BOARD_LOAD_MORE_COUNT = 10;

function isExternalHref(href: string) {
  return /^https?:\/\//i.test(href);
}

function splitLines(value: string) {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatBoardDate(value: string) {
  const trimmed = String(value || '').trim();

  if (!trimmed) {
    return '-';
  }

  return trimmed.replaceAll('-', '. ');
}

function ActionLink({ href, label, variant = 'primary' }: { href: string; label: string; variant?: 'primary' | 'light' }) {
  if (!href || !label) {
    return null;
  }

  const className = variant === 'primary' ? 'button button--primary' : 'button button--light';

  if (isExternalHref(href)) {
    return (
      <a href={href} className={className}>
        {label}
      </a>
    );
  }

  return (
    <Link to={href} className={className}>
      {label}
    </Link>
  );
}

function renderSectionActions(section: CustomPageSection) {
  if (!section.primaryButtonLabel && !section.secondaryButtonLabel) {
    return null;
  }

  return (
    <div className="custom-page-actions">
      <ActionLink href={section.primaryButtonHref} label={section.primaryButtonLabel} variant="primary" />
      <ActionLink href={section.secondaryButtonHref} label={section.secondaryButtonLabel} variant="light" />
    </div>
  );
}

function renderGenericCardGrid(items: CustomPageSectionItem[]) {
  return (
    <div className="custom-card-grid">
      {items.map((item, index) => (
        <motion.article key={`${item.title}-${index}`} {...fadeUp} className="custom-card">
          <div className="custom-card__image">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span>이미지 없음</span>}
          </div>
          <div className="custom-card__body">
            {item.badge ? <span className="custom-card__badge">{item.badge}</span> : null}
            <h3>{item.title}</h3>
            <p>{item.description}</p>
            {splitLines(item.details).length > 0 ? (
              <ul className="contact-card__list">
                {splitLines(item.details).map((detail) => (
                  <li key={detail}>{detail}</li>
                ))}
              </ul>
            ) : null}
            {item.meta ? <small>{item.meta}</small> : null}
            {item.href ? (
              isExternalHref(item.href) ? <a href={item.href}>자세히 보기</a> : <Link to={item.href}>자세히 보기</Link>
            ) : null}
          </div>
        </motion.article>
      ))}
    </div>
  );
}

function renderGenericRows(items: CustomPageSectionItem[]) {
  return (
    <div className="custom-row-list">
      {items.map((item, index) => (
        <motion.article key={`${item.title}-${index}`} {...fadeUp} className="custom-row-card">
          <div className="custom-row-card__copy">
            <strong>{item.title}</strong>
            <p>{item.description}</p>
            {splitLines(item.details).map((detail) => (
              <p key={detail}>{detail}</p>
            ))}
          </div>
          {item.meta ? <span>{item.meta}</span> : null}
        </motion.article>
      ))}
    </div>
  );
}

function renderLogoGrid(items: CustomPageSectionItem[]) {
  return (
    <div className="custom-logo-grid">
      {items.map((item, index) => (
        <motion.article key={`${item.title}-${index}`} {...fadeUp} className="custom-logo-card">
          <div className="custom-logo-card__image">
            {item.imageUrl ? <img src={item.imageUrl} alt={item.title} /> : <span>{item.title}</span>}
          </div>
          <strong>{item.title}</strong>
        </motion.article>
      ))}
    </div>
  );
}

export function CustomPageRenderer({ page }: { page: CustomPageContent }) {
  const { siteData } = useSiteContent();
  const sectionMap = useMemo(() => new Map(page.sections.map((section) => [section.id, section])), [page.sections]);
  const visibleSections = useMemo(
    () => resolveTemplateLayout(page.templateId, siteData.templateLayouts).sections.filter((section) => section.visible),
    [page.templateId, siteData.templateLayouts],
  );

  const directorySection = sectionMap.get('section-1');
  const directoryFilterAllLabel = directorySection?.settings.filterAllLabel || '전체';
  const [directoryCategory, setDirectoryCategory] = useState(directoryFilterAllLabel);
  const [directorySearchInput, setDirectorySearchInput] = useState('');
  const [directoryKeyword, setDirectoryKeyword] = useState('');
  const [directoryCurrentPage, setDirectoryCurrentPage] = useState(1);

  const boardSection = sectionMap.get('section-1');
  const boardAllCategoryLabel = boardSection?.settings.allCategoryLabel || '전체';
  const [boardCategory, setBoardCategory] = useState(boardAllCategoryLabel);
  const [boardSearch, setBoardSearch] = useState('');
  const [boardSearchOpen, setBoardSearchOpen] = useState(false);
  const [boardVisibleCount, setBoardVisibleCount] = useState(BOARD_INITIAL_COUNT);

  const [contactForm, setContactForm] = useState({
    organizationName: '',
    contactName: '',
    email: '',
    eventDate: '',
    message: '',
  });
  const [isSubmittingContact, setIsSubmittingContact] = useState(false);
  const [contactSubmitMessage, setContactSubmitMessage] = useState('');
  const [contactSubmitError, setContactSubmitError] = useState('');

  useEffect(() => {
    setDirectoryCategory(directoryFilterAllLabel);
    setDirectorySearchInput('');
    setDirectoryKeyword('');
    setDirectoryCurrentPage(1);
  }, [directoryFilterAllLabel, page.path]);

  useEffect(() => {
    setBoardCategory(boardAllCategoryLabel);
    setBoardSearch('');
    setBoardSearchOpen(false);
    setBoardVisibleCount(BOARD_INITIAL_COUNT);
  }, [boardAllCategoryLabel, page.path]);

  useEffect(() => {
    setContactForm({
      organizationName: '',
      contactName: '',
      email: '',
      eventDate: '',
      message: '',
    });
    setContactSubmitMessage('');
    setContactSubmitError('');
    setIsSubmittingContact(false);
  }, [page.path]);

  const directoryCategories = useMemo(() => {
    if (page.templateId !== 'directory' || !directorySection) {
      return [directoryFilterAllLabel];
    }

    return [directoryFilterAllLabel, ...Array.from(new Set(directorySection.items.map((item) => item.badge).filter(Boolean)))];
  }, [directoryFilterAllLabel, directorySection, page.templateId]);

  const filteredDirectoryItems = useMemo(() => {
    if (page.templateId !== 'directory' || !directorySection) {
      return [];
    }

    const normalizedKeyword = directoryKeyword.trim().toLowerCase();

    return directorySection.items.filter((item) => {
      const matchesCategory = directoryCategory === directoryFilterAllLabel || item.badge === directoryCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return [item.title, item.description, item.meta, item.badge, item.details].join(' ').toLowerCase().includes(normalizedKeyword);
    });
  }, [directoryCategory, directoryFilterAllLabel, directoryKeyword, directorySection, page.templateId]);

  const directoryTotalPages = Math.max(1, Math.ceil(filteredDirectoryItems.length / DIRECTORY_PAGE_SIZE));
  const paginatedDirectoryItems = filteredDirectoryItems.slice(
    (directoryCurrentPage - 1) * DIRECTORY_PAGE_SIZE,
    directoryCurrentPage * DIRECTORY_PAGE_SIZE,
  );

  useEffect(() => {
    setDirectoryCurrentPage(1);
  }, [directoryCategory, directoryKeyword]);

  useEffect(() => {
    setDirectoryCurrentPage((current) => Math.min(current, directoryTotalPages));
  }, [directoryTotalPages]);

  const boardCategories = useMemo(() => {
    if (page.templateId !== 'board-index' || !boardSection || boardSection.settings.variant !== 'notices') {
      return [boardAllCategoryLabel];
    }

    return [boardAllCategoryLabel, ...Array.from(new Set(boardSection.items.map((item) => item.badge).filter(Boolean)))];
  }, [boardAllCategoryLabel, boardSection, page.templateId]);

  const filteredBoardItems = useMemo(() => {
    if (page.templateId !== 'board-index' || !boardSection) {
      return [];
    }

    if (boardSection.settings.variant !== 'notices') {
      return boardSection.items;
    }

    const normalizedKeyword = boardSearch.trim().toLowerCase();

    return boardSection.items.filter((item) => {
      const matchesCategory = boardCategory === boardAllCategoryLabel || item.badge === boardCategory;
      if (!matchesCategory) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      return [item.title, item.description, item.badge, item.details].join(' ').toLowerCase().includes(normalizedKeyword);
    });
  }, [boardAllCategoryLabel, boardCategory, boardSearch, boardSection, page.templateId]);

  useEffect(() => {
    setBoardVisibleCount(BOARD_INITIAL_COUNT);
  }, [boardCategory, boardSearch]);

  const visibleBoardItems = filteredBoardItems.slice(0, boardVisibleCount);
  const canLoadMoreBoardItems = boardVisibleCount < filteredBoardItems.length;

  const handleDirectorySearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setDirectoryKeyword(directorySearchInput);
  };

  const handleContactChange = (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setContactForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleContactSubmit = async (event: FormEvent<HTMLFormElement>, section: CustomPageSection) => {
    event.preventDefault();
    setIsSubmittingContact(true);
    setContactSubmitMessage('');
    setContactSubmitError('');

    try {
      await submitInquiry(contactForm);
      setContactForm({
        organizationName: '',
        contactName: '',
        email: '',
        eventDate: '',
        message: '',
      });
      setContactSubmitMessage(section.settings.submitSuccessMessage || '문의가 정상적으로 접수되었습니다.');
    } catch (error) {
      const message = error instanceof Error ? error.message : '문의 저장 중 오류가 발생했습니다.';
      setContactSubmitError(message);
    } finally {
      setIsSubmittingContact(false);
    }
  };

  return (
    <>
      <PageMeta title={page.seoTitle || page.label} description={page.seoDescription} />
      <div className="custom-page">
        {visibleSections.map((layoutSection, index) => {
          const section = sectionMap.get(layoutSection.id);
          if (!section) {
            return null;
          }

          if (page.templateId === 'home-story') {
            if (layoutSection.id === 'hero') {
              return (
                <section key={layoutSection.id} className="custom-template-hero">
                  <div className="custom-template-hero__media">
                    {section.imageUrl ? <img src={section.imageUrl} alt={section.title} /> : null}
                  </div>
                  <div className="custom-template-hero__overlay">
                    {section.eyebrow ? <p>{section.eyebrow}</p> : null}
                    <h1>{section.title}</h1>
                    <p>{section.description}</p>
                    {renderSectionActions(section)}
                  </div>
                </section>
              );
            }

            if (layoutSection.id === 'partners') {
              return (
                <div key={layoutSection.id}>
                  <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description}>
                    {renderLogoGrid(section.items)}
                  </PageSectionBlock>
                </div>
              );
            }

            if (layoutSection.id === 'cta') {
              return (
                <section key={layoutSection.id} className="custom-template-cta">
                  <div className="custom-template-cta__media">
                    {section.imageUrl ? <img src={section.imageUrl} alt={section.title} /> : null}
                  </div>
                  <div className="custom-template-cta__overlay">
                    {section.eyebrow ? <p>{section.eyebrow}</p> : null}
                    <h2>{section.title}</h2>
                    <p>{section.description}</p>
                    {renderSectionActions(section)}
                  </div>
                </section>
              );
            }

            return (
              <div key={layoutSection.id}>
                <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description}>
                  {renderGenericCardGrid(section.items)}
                  {renderSectionActions(section)}
                </PageSectionBlock>
              </div>
            );
          }

          if (page.templateId === 'visual-landing') {
            if (layoutSection.id === 'intro') {
              return (
                <div key={layoutSection.id}>
                  <PageIntroBlock eyebrow={section.eyebrow} title={section.title} description={section.description} />
                </div>
              );
            }

            if (layoutSection.id === 'section-1' && section.settings.variant === 'about-identity') {
              return (
                <div key={layoutSection.id}>
                  <PageSectionBlock id="custom-about-identity" eyebrow={section.eyebrow} title={section.title} description={section.description}>
                    <div className="content-grid-2">
                      <motion.article {...fadeUp} className="stack-card">
                        <h3>{section.settings.listTitle || '핵심 정리'}</h3>
                        <ul>
                          {section.items.map((item, itemIndex) => (
                            <li key={`${item.title}-${itemIndex}`}>{item.title}</li>
                          ))}
                        </ul>
                      </motion.article>
                      <motion.article {...fadeUp} className="stack-card stack-card--rich">
                        {section.imageUrl ? <img src={section.imageUrl} alt={section.title} className="stack-card__image" /> : null}
                        {section.settings.messageEyebrow ? <p className="section-eyebrow">{section.settings.messageEyebrow}</p> : null}
                        {section.settings.messageTitle ? <h3>{section.settings.messageTitle}</h3> : null}
                        {splitLines(section.settings.messageBody).map((paragraph) => (
                          <p key={paragraph}>{paragraph}</p>
                        ))}
                      </motion.article>
                    </div>
                  </PageSectionBlock>
                </div>
              );
            }

            if (layoutSection.id === 'section-1') {
              return (
                <div key={layoutSection.id}>
                  <PageVisualBlock imageUrl={section.imageUrl} alt={section.title} />
                  {section.description || section.primaryButtonLabel || section.secondaryButtonLabel ? (
                    <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description}>
                      {renderSectionActions(section)}
                    </PageSectionBlock>
                  ) : null}
                </div>
              );
            }

            if (layoutSection.id === 'section-2' && section.settings.variant === 'contact-options') {
              const optionItems = section.items.filter((item) => item.kind !== 'trust-card');
              const trustCard = section.items.find((item) => item.kind === 'trust-card');

              return (
                <div key={layoutSection.id}>
                  <PageSectionBlock id="custom-contact-options" eyebrow={section.eyebrow} title={section.title} description={section.description}>
                    <div className="contact-grid">
                      {optionItems.map((item, itemIndex) => (
                        <motion.article key={`${item.title}-${itemIndex}`} {...fadeUp} className="contact-card">
                          <h3>{item.title}</h3>
                          <p>{item.description}</p>
                          {item.meta ? <p>{item.meta}</p> : null}
                        </motion.article>
                      ))}
                      {trustCard ? (
                        <motion.article {...fadeUp} className="contact-card contact-card--trust">
                          <div className="value-card__icon">
                            <ShieldCheck size={24} />
                          </div>
                          <h3>{trustCard.title}</h3>
                          <p>{trustCard.description}</p>
                          <ul className="contact-card__list">
                            {splitLines(trustCard.details).map((detail) => (
                              <li key={detail}>{detail}</li>
                            ))}
                          </ul>
                        </motion.article>
                      ) : null}
                    </div>
                  </PageSectionBlock>
                </div>
              );
            }

            if (layoutSection.id === 'section-3' && section.settings.variant === 'contact-form') {
              const processItems = section.items.filter((item) => item.kind === 'process-step');
              const checklistItems = section.items.filter((item) => item.kind === 'checklist-item');
              const contactInfoItems = section.items.filter((item) => item.kind === 'contact-info');

              return (
                <div key={layoutSection.id}>
                  <PageSectionBlock id="custom-contact-form" variant="alt" eyebrow={section.eyebrow} title={section.title} description={section.description}>
                    <div className="contact-form-layout">
                      <motion.form {...fadeUp} className="contact-form" onSubmit={(event) => void handleContactSubmit(event, section)}>
                        <div className="form-grid">
                          <label className="form-field">
                            <span>{section.settings.organizationLabel || '회사명'}</span>
                            <input name="organizationName" type="text" placeholder={section.settings.organizationPlaceholder || ''} value={contactForm.organizationName} onChange={handleContactChange} required />
                          </label>
                          <label className="form-field">
                            <span>{section.settings.contactNameLabel || '담당자명'}</span>
                            <input name="contactName" type="text" placeholder={section.settings.contactNamePlaceholder || ''} value={contactForm.contactName} onChange={handleContactChange} required />
                          </label>
                          <label className="form-field">
                            <span>{section.settings.emailLabel || '이메일'}</span>
                            <input name="email" type="email" placeholder={section.settings.emailPlaceholder || ''} value={contactForm.email} onChange={handleContactChange} required />
                          </label>
                          <label className="form-field">
                            <span>{section.settings.eventDateLabel || '행사 일정'}</span>
                            <input name="eventDate" type="text" placeholder={section.settings.eventDatePlaceholder || ''} value={contactForm.eventDate} onChange={handleContactChange} />
                          </label>
                        </div>
                        <label className="form-field">
                          <span>{section.settings.messageLabel || '문의 내용'}</span>
                          <textarea name="message" rows={6} placeholder={section.settings.messagePlaceholder || ''} value={contactForm.message} onChange={handleContactChange} required />
                        </label>
                        {contactSubmitMessage ? <p className="form-feedback form-feedback--success">{contactSubmitMessage}</p> : null}
                        {contactSubmitError ? <p className="form-feedback form-feedback--error">{contactSubmitError}</p> : null}
                        <button type="submit" className="button button--light form-submit" disabled={isSubmittingContact}>
                          {isSubmittingContact ? section.settings.submitPendingLabel || section.primaryButtonLabel || '전송 중...' : section.settings.submitButtonLabel || section.primaryButtonLabel || '문의 접수'}
                        </button>
                      </motion.form>
                      <motion.aside {...fadeUp} transition={{ ...fadeUp.transition, delay: 0.12 }} className="contact-side-panel">
                        <article className="contact-side-card">
                          <h3>{section.settings.processCardTitle || '진행 방식'}</h3>
                          <div className="contact-process-list">
                            {processItems.map((item) => (
                              <div key={`${item.meta}-${item.title}`} className="contact-process-item">
                                <span>{item.meta}</span>
                                <div>
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </article>
                        <article className="contact-side-card">
                          <h3>{section.settings.checklistCardTitle || '체크리스트'}</h3>
                          <ul className="contact-checklist">
                            {checklistItems.map((item) => (
                              <li key={item.title}>
                                <CheckCircle2 size={16} />
                                {item.title}
                              </li>
                            ))}
                          </ul>
                        </article>
                        <article className="contact-side-card contact-side-card--placeholder">
                          <h3>{section.settings.placeholderCardTitle || '연락처'}</h3>
                          <div className="placeholder-list">
                            {contactInfoItems.map((item) =>
                              item.href ? (
                                <a key={item.title} href={item.href}>
                                  <strong>{item.title}</strong>
                                  <span>{item.description}</span>
                                </a>
                              ) : (
                                <div key={item.title}>
                                  <strong>{item.title}</strong>
                                  <span>{item.description}</span>
                                </div>
                              ),
                            )}
                          </div>
                        </article>
                      </motion.aside>
                    </div>
                  </PageSectionBlock>
                </div>
              );
            }

            return (
              <div key={layoutSection.id}>
                <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description} variant={index % 2 === 0 ? 'alt' : 'default'}>
                  {renderGenericCardGrid(section.items)}
                  {renderSectionActions(section)}
                </PageSectionBlock>
              </div>
            );
          }

          if (page.templateId === 'showcase-grid') {
            if (layoutSection.id === 'intro') {
              return (
                <div key={layoutSection.id}>
                  <PageIntroBlock eyebrow={section.eyebrow} title={section.title} description={section.description} />
                </div>
              );
            }

            if (layoutSection.id === 'section-3') {
              return (
                <div key={layoutSection.id}>
                  <PageOwnerNoteBlock title={section.title} description={section.description} />
                </div>
              );
            }

            return (
              <div key={layoutSection.id}>
                <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description} variant={layoutSection.id === 'section-2' ? 'alt' : 'default'}>
                  {renderGenericCardGrid(section.items)}
                </PageSectionBlock>
              </div>
            );
          }

          if (page.templateId === 'board-index') {
            const bodySection = sectionMap.get('section-1');

            if (layoutSection.id === 'intro') {
              return (
                <section key={layoutSection.id} className="resource-news-page">
                  <div className="resource-news-page__inner">
                    <PageHeaderBlock
                      title={section.title}
                      description={section.description}
                      action={
                        bodySection?.settings.actionLabel && bodySection?.settings.actionHref ? (
                          <Link to={bodySection.settings.actionHref} className="resource-news-page__jump">
                            {bodySection.settings.actionLabel}
                          </Link>
                        ) : undefined
                      }
                    />
                  </div>
                </section>
              );
            }

            if (layoutSection.id === 'section-2') {
              return (
                <div key={layoutSection.id}>
                  <PageOwnerNoteBlock title={section.title} description={section.description} variant="resource" />
                </div>
              );
            }

            if (section.settings.variant === 'files') {
              return (
                <section key={layoutSection.id} className="resource-news-page">
                  <div className="resource-news-page__inner">
                    <BoardIndexSection id={`custom-${layoutSection.id}`} eyebrow={section.eyebrow} title={section.title} description={section.description}>
                      <div className="resource-archive-list">
                        {section.items.map((item, itemIndex) =>
                          item.href ? (
                            isExternalHref(item.href) ? (
                              <a key={`${item.title}-${itemIndex}`} href={item.href} className="resource-archive-row">
                                <time>{formatBoardDate(item.meta)}</time>
                                <div className="resource-archive-row__copy">
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                                <span>{item.badge}</span>
                              </a>
                            ) : (
                              <Link key={`${item.title}-${itemIndex}`} to={item.href} className="resource-archive-row">
                                <time>{formatBoardDate(item.meta)}</time>
                                <div className="resource-archive-row__copy">
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                                <span>{item.badge}</span>
                              </Link>
                            )
                          ) : (
                            <article key={`${item.title}-${itemIndex}`} className="resource-archive-row">
                              <time>{formatBoardDate(item.meta)}</time>
                              <div className="resource-archive-row__copy">
                                <strong>{item.title}</strong>
                                <p>{item.description}</p>
                              </div>
                              <span>{item.badge}</span>
                            </article>
                          ),
                        )}
                      </div>
                    </BoardIndexSection>
                  </div>
                </section>
              );
            }

            return (
              <section key={layoutSection.id} className="resource-news-page">
                <div className="resource-news-page__inner">
                  <BoardIndexSection
                    id={`custom-${layoutSection.id}`}
                    eyebrow={section.eyebrow}
                    title={section.title}
                    description={section.description}
                    toolbar={
                      <>
                        <div className="resource-news-board__tabs" role="tablist" aria-label="공지 카테고리">
                          {boardCategories.map((category) => (
                            <button key={category} type="button" role="tab" aria-selected={boardCategory === category} className={boardCategory === category ? 'resource-news-tab is-active' : 'resource-news-tab'} onClick={() => setBoardCategory(category)}>
                              {category}
                            </button>
                          ))}
                        </div>
                        <div className={boardSearchOpen ? 'resource-news-search is-open' : 'resource-news-search'}>
                          {boardSearchOpen ? (
                            <input type="search" value={boardSearch} onChange={(event) => setBoardSearch(event.target.value)} placeholder={section.settings.searchPlaceholder || '검색'} aria-label={section.settings.searchPlaceholder || '검색'} />
                          ) : null}
                          {boardSearchOpen && boardSearch ? (
                            <button type="button" className="resource-news-search__icon-button" aria-label={section.settings.clearSearchLabel || '검색어 지우기'} onClick={() => setBoardSearch('')}>
                              <X size={16} />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            className="resource-news-search__icon-button"
                            aria-label={boardSearchOpen ? section.settings.searchCloseLabel || '검색창 닫기' : section.settings.searchOpenLabel || '검색창 열기'}
                            onClick={() => {
                              if (boardSearchOpen && !boardSearch) {
                                setBoardSearchOpen(false);
                                return;
                              }
                              setBoardSearchOpen(true);
                            }}
                          >
                            <Search size={16} />
                          </button>
                        </div>
                      </>
                    }
                    footer={
                      canLoadMoreBoardItems || filteredBoardItems.length > 0 ? (
                        <button type="button" className="resource-news-board__more" onClick={() => setBoardVisibleCount((current) => current + BOARD_LOAD_MORE_COUNT)} disabled={!canLoadMoreBoardItems}>
                          {(section.settings.loadMoreLabel || '더 보기')} ({Math.min(boardVisibleCount, filteredBoardItems.length)}/{filteredBoardItems.length})
                        </button>
                      ) : null
                    }
                  >
                    <div className="resource-news-board__list">
                      {visibleBoardItems.length > 0 ? (
                        visibleBoardItems.map((item, itemIndex) =>
                          item.href ? (
                            isExternalHref(item.href) ? (
                              <a key={`${item.title}-${itemIndex}`} href={item.href} className="resource-news-row">
                                <span className="resource-news-row__category">{item.badge || '일반'}</span>
                                <div className="resource-news-row__copy">
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                                <time>{formatBoardDate(item.meta)}</time>
                              </a>
                            ) : (
                              <Link key={`${item.title}-${itemIndex}`} to={item.href} className="resource-news-row">
                                <span className="resource-news-row__category">{item.badge || '일반'}</span>
                                <div className="resource-news-row__copy">
                                  <strong>{item.title}</strong>
                                  <p>{item.description}</p>
                                </div>
                                <time>{formatBoardDate(item.meta)}</time>
                              </Link>
                            )
                          ) : (
                            <article key={`${item.title}-${itemIndex}`} className="resource-news-row">
                              <span className="resource-news-row__category">{item.badge || '일반'}</span>
                              <div className="resource-news-row__copy">
                                <strong>{item.title}</strong>
                                <p>{item.description}</p>
                              </div>
                              <time>{formatBoardDate(item.meta)}</time>
                            </article>
                          ),
                        )
                      ) : (
                        <div className="resource-news-empty">{section.settings.emptyMessage || '조건에 맞는 항목이 없습니다.'}</div>
                      )}
                    </div>
                  </BoardIndexSection>
                </div>
              </section>
            );
          }

          if (page.templateId === 'directory') {
            if (layoutSection.id === 'intro') {
              return (
                <div key={layoutSection.id}>
                  <PageBannerIntroBlock eyebrow={section.eyebrow} title={section.title} description={section.description} />
                </div>
              );
            }

            return (
              <div key={layoutSection.id}>
                <PageSectionBlock id="member-search">
                  <motion.article {...fadeUp} className="members-search-panel">
                    <form className="members-search-form" onSubmit={handleDirectorySearchSubmit}>
                      <div className="members-search-form__inner">
                        <label className="members-search-form__field">
                          <span className="sr-only">카테고리 선택</span>
                          <select value={directoryCategory} onChange={(event) => setDirectoryCategory(event.target.value)}>
                            {directoryCategories.map((item) => (
                              <option key={item} value={item}>
                                {item === directoryFilterAllLabel ? '전체' : item}
                              </option>
                            ))}
                          </select>
                        </label>
                        <label className="members-search-form__field members-search-form__field--search">
                          <span className="sr-only">회원사 검색</span>
                          <input type="search" value={directorySearchInput} onChange={(event) => setDirectorySearchInput(event.target.value)} placeholder={section.settings.searchPlaceholder || '회원사 검색'} />
                        </label>
                        <button type="submit" className="members-search-form__submit">
                          {section.settings.searchButtonLabel || '검색'}
                        </button>
                      </div>
                    </form>
                  </motion.article>
                  <div className="members-list-toolbar">
                    <div className="members-list-toolbar__summary">
                      <span>{section.settings.totalLabel || '전체'} <strong>{filteredDirectoryItems.length}</strong>건</span>
                      <span className="members-list-toolbar__divider">|</span>
                      <span>{section.settings.currentPageLabel || '현재페이지'} <strong>{directoryCurrentPage}/{directoryTotalPages}</strong></span>
                    </div>
                  </div>
                  {paginatedDirectoryItems.length === 0 ? (
                    <div className="members-empty-state">
                      <strong>{section.settings.emptyTitle || '검색 결과가 없습니다.'}</strong>
                      <p>{section.settings.emptyDescription || '검색어 또는 조건을 다시 확인해 주세요.'}</p>
                    </div>
                  ) : (
                    <div className="members-grid">
                      {paginatedDirectoryItems.map((item, itemIndex) => {
                        const descriptionLines = splitLines(item.description);

                        return (
                          <motion.article key={`${item.title}-${itemIndex}`} {...fadeUp} className="member-card">
                            <div className="member-card__image-box">
                              {item.imageUrl ? (
                                <img src={item.imageUrl} alt={item.title} />
                              ) : (
                                <div className="member-card__no-image">
                                  <span>{item.title}</span>
                                </div>
                              )}
                            </div>
                            <div className="member-card__content">
                              <h3 className="member-card__title">{item.title}</h3>
                              <p className="member-card__desc">
                                {descriptionLines.map((line, lineIndex) => (
                                  <span key={`${item.title}-${lineIndex}`}>
                                    {line}
                                    {lineIndex < descriptionLines.length - 1 ? <br /> : null}
                                  </span>
                                ))}
                              </p>
                              {item.meta ? <time className="member-card__date">{item.meta}</time> : null}
                            </div>
                          </motion.article>
                        );
                      })}
                    </div>
                  )}
                </PageSectionBlock>
              </div>
            );
          }

          if (page.templateId === 'detail-story') {
            if (layoutSection.id === 'intro') {
              return (
                <div key={layoutSection.id}>
                  <PageIntroBlock eyebrow={section.eyebrow} title={section.title} description={section.description} />
                </div>
              );
            }

            if (layoutSection.id === 'section-1') {
              return (
                <div key={layoutSection.id}>
                  <PageVisualBlock imageUrl={section.imageUrl} alt={section.title} />
                </div>
              );
            }

            return (
              <div key={layoutSection.id}>
                <PageSectionBlock eyebrow={section.eyebrow} title={section.title} description={section.description}>
                  {renderGenericRows(section.items)}
                  {renderSectionActions(section)}
                </PageSectionBlock>
              </div>
            );
          }

          return null;
        })}
      </div>
    </>
  );
}
