import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { PageBannerIntroBlock, PageSectionBlock, PublicPageTemplate } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';

const PAGE_SIZE = 10;

export function MembersPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.members;
  const content = siteContent.members;
  const [selectedCategory, setSelectedCategory] = useState(content.filterAllLabel);
  const [searchInput, setSearchInput] = useState('');
  const [keyword, setKeyword] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => [content.filterAllLabel, ...Array.from(new Set(content.companies.map((item) => item.category).filter(Boolean)))],
    [content.companies, content.filterAllLabel],
  );

  const filteredCompanies = useMemo(() => {
    const normalizedKeyword = keyword.trim().toLowerCase();

    return content.companies.filter((company) => {
      const matchesCategory =
        selectedCategory === content.filterAllLabel ? true : company.category === selectedCategory;

      if (!normalizedKeyword) {
        return matchesCategory;
      }

      const haystack = [
        company.name,
        company.category,
        company.secondaryCategory,
        company.address,
        company.phone,
      ]
        .join(' ')
        .toLowerCase();

      return matchesCategory && haystack.includes(normalizedKeyword);
    });
  }, [content.companies, content.filterAllLabel, keyword, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [keyword, selectedCategory]);

  useEffect(() => {
    setCurrentPage((page) => Math.min(page, totalPages));
  }, [totalPages]);

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setKeyword(searchInput);
  };
  const blocks = {
    intro: (
      <PageBannerIntroBlock
        eyebrow={content.introEyebrow}
        title={copy.introTitle}
        description={copy.introDescription}
      />
    ),
    directory: (
      <PageSectionBlock id="member-search">
        <motion.article {...fadeUp} className="members-search-panel">
          <form className="members-search-form" onSubmit={handleSearchSubmit}>
            <div className="members-search-form__inner">
              <label className="members-search-form__field">
                <span className="sr-only">카테고리 선택</span>
                <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                  {categories.map((item) => (
                    <option key={item} value={item}>
                      {item === content.filterAllLabel ? '전체' : item}
                    </option>
                  ))}
                </select>
              </label>

              <label className="members-search-form__field members-search-form__field--search">
                <span className="sr-only">회원사 검색</span>
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

        <div id="member-list" className="members-list-toolbar">
          <div className="members-list-toolbar__summary">
            <span>{content.totalLabel} <strong>{filteredCompanies.length}</strong>건</span>
            <span className="members-list-toolbar__divider">|</span>
            <span>{content.currentPageLabel} <strong>{currentPage}/{totalPages}</strong></span>
          </div>
        </div>

        {paginatedCompanies.length === 0 ? (
          <div className="members-empty-state">
            <strong>검색 결과가 없습니다.</strong>
            <p>검색어 또는 분과 조건을 다시 확인해 주세요.</p>
          </div>
        ) : (
          <div className="members-grid">
            {paginatedCompanies.map((company) => (
              <motion.article key={`${company.name}-${company.phone}`} {...fadeUp} className="member-card">
                <div className="member-card__image-box">
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} />
                  ) : (
                    <div className="member-card__no-image">
                      <span>{company.name}</span>
                    </div>
                  )}
                </div>
                <div className="member-card__content">
                  <h3 className="member-card__title">{company.name}</h3>
                  <p className="member-card__desc">
                    {company.category} {company.secondaryCategory ? `· ${company.secondaryCategory}` : ''}
                    <br />
                    {company.address}
                  </p>
                  <time className="member-card__date">2026. 3. 12.</time>
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
    ),
  };

  return (
    <>
      <PageMeta title="MICE 회원" description={copy.introDescription} />
      <PublicPageTemplate page="members" blocks={blocks} />
    </>
  );
}
