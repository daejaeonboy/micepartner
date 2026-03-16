import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { formatMonthDay } from '../lib/contentUtils';
import { fadeUp } from '../lib/motion';

const PAGE_SIZE = 10;

export function CaseStudiesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.cases;
  const content = siteContent.cases;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(content.allCategoryLabel);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => [content.allCategoryLabel, ...content.categories],
    [content.allCategoryLabel, content.categories],
  );

  useEffect(() => {
    const category = searchParams.get('category');
    const nextCategory = category && content.categories.includes(category) ? category : content.allCategoryLabel;
    setSelectedCategory(nextCategory);
  }, [content.allCategoryLabel, content.categories, searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === content.allCategoryLabel) {
      setSearchParams({});
      return;
    }

    setSearchParams({ category });
  };

  const filteredEntries = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return content.entries.filter((item) => {
      const matchesCategory =
        selectedCategory === content.allCategoryLabel
          ? true
          : item.tags.includes(selectedCategory) || item.category === selectedCategory;

      if (!matchesCategory) {
        return false;
      }

      if (!normalizedKeyword) {
        return true;
      }

      const haystack = [
        item.title,
        item.cardDescription,
        item.category,
        item.client,
        item.period,
        item.tags.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedKeyword);
    });
  }, [content.allCategoryLabel, content.entries, keyword, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCategory]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(searchInput);
  };

  return (
    <>
      <PageMeta title="포트폴리오" description={copy.introDescription} />
      <PageHeaderBlock
        title={copy.introTitle}
        description={copy.introDescription}
      />
      <PageSectionBlock id="portfolio-list">
        <motion.article {...fadeUp} className="members-search-panel">
          <form className="members-search-form" onSubmit={handleSearchSubmit}>
            <div className="members-search-form__inner">
              <label className="members-search-form__field">
                <span className="sr-only">카테고리 선택</span>
                <select value={selectedCategory} onChange={(event) => handleCategoryChange(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="members-search-form__field members-search-form__field--search">
                <span className="sr-only">운영사례 검색</span>
                <input
                  type="search"
                  value={searchInput}
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder={content.searchPlaceholder}
                />
              </label>

              <button type="submit" className="members-search-form__submit">
                {content.searchButtonLabel}
              </button>
            </div>
          </form>
        </motion.article>

        <div className="members-list-toolbar">
          <div className="members-list-toolbar__summary">
            <span>{content.totalLabel} <strong>{filteredEntries.length}</strong>건</span>
            <span className="members-list-toolbar__divider">|</span>
            <span>{content.currentPageLabel} <strong>{currentPage}/{totalPages}</strong></span>
          </div>
        </div>

        {paginatedEntries.length === 0 ? (
          <div className="members-empty-state">
            <strong>{content.emptyStateMessage}</strong>
            <p>{content.emptyStateDescription}</p>
          </div>
        ) : (
          <div className="members-grid">
            {paginatedEntries.map((item) => (
              <motion.article key={item.slug} {...fadeUp} className="member-card">
                <Link to={`/cases/${item.slug}`} className="member-card__image-box" aria-label={`${item.title} 상세 페이지 이동`}>
                  {item.coverImageUrl ? (
                    <img src={item.coverImageUrl} alt={item.title} />
                  ) : (
                    <div className="member-card__no-image">
                      <span>{item.title}</span>
                    </div>
                  )}
                </Link>
                <div className="member-card__content">
                  <h3 className="member-card__title">{item.title}</h3>
                  <p className="member-card__desc">
                    {item.category} · {item.client}
                    <br />
                    {item.cardDescription}
                  </p>
                  <time className="member-card__date">{formatMonthDay(item.updatedAt || item.period)}</time>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        {totalPages > 1 ? (
          <div className="members-pagination">
            <button
              type="button"
              className="members-pagination__arrow"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft size={18} />
            </button>
            <button
              type="button"
              className="members-pagination__arrow"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft size={18} />
            </button>

            {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
              <button
                key={page}
                type="button"
                className={page === currentPage ? 'members-pagination__button is-active' : 'members-pagination__button'}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              type="button"
              className="members-pagination__arrow"
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight size={18} />
            </button>
            <button
              type="button"
              className="members-pagination__arrow"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight size={18} />
            </button>
          </div>
        ) : null}
      </PageSectionBlock>
    </>
  );
}
