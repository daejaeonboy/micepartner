import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContentPagination } from '../components/ContentPagination';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { formatMonthDay } from '../lib/contentUtils';
import { getMenuLinkedCategories } from '../lib/menuCategories';
import { fadeUp } from '../lib/motion';
import { createBreadcrumbJsonLd, truncateText } from '../lib/seo';

const PAGE_SIZE = 9;

export function CaseStudiesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.cases;
  const content = siteContent.cases;
  const isEditorLoggedIn = Boolean(getAdminToken());
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(content.allCategoryLabel);
  const [currentPage, setCurrentPage] = useState(1);
  const menuCategories = useMemo(
    () => getMenuLinkedCategories(siteContent.menus.headerItems, '/cases'),
    [siteContent.menus.headerItems],
  );

  const categories = useMemo(
    () =>
      menuCategories.length > 0
        ? [
            { label: content.allCategoryLabel, value: content.allCategoryLabel },
            ...menuCategories,
          ]
        : [
            { label: content.allCategoryLabel, value: content.allCategoryLabel },
            ...content.categories.map((item) => ({ label: item, value: item, path: '' })),
          ],
    [content.allCategoryLabel, content.categories, menuCategories],
  );

  useEffect(() => {
    const category = searchParams.get('category');
    const nextCategory =
      category && categories.some((item) => item.value === category && item.value !== content.allCategoryLabel)
        ? category
        : content.allCategoryLabel;
    setSelectedCategory(nextCategory);
  }, [categories, content.allCategoryLabel, searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setCurrentPage(1);
    if (category === content.allCategoryLabel) {
      setSearchParams({});
      return;
    }

    setSearchParams({ category });
  };

  const filteredEntries = useMemo(() => {
    return content.entries.filter((item) => {
      return selectedCategory === content.allCategoryLabel
        ? true
        : item.tags.includes(selectedCategory) || item.category === selectedCategory;
    });
  }, [content.allCategoryLabel, content.entries, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredEntries.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const paginatedEntries = filteredEntries.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );
  const seoTitle = 'MICE 행사 운영 포트폴리오';
  const seoDescription = truncateText(
    '컨퍼런스, 포럼, 세미나, 기업행사 등 마이스파트너의 MICE 행사 운영 사례와 포트폴리오를 확인할 수 있습니다.',
  );

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/cases"
        jsonLd={createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '포트폴리오', path: '/cases' },
        ])}
      />
      <PageHeaderBlock
        title={copy.introTitle}
        description={copy.introDescription}
      />
      <PageSectionBlock id="portfolio-list">
        {/* 새로운 격자형 카테고리 탭 */}
        <div className="category-tab-container">
          <ul className="category-tab-list">
            {categories.map((item) => (
              <li key={`${item.label}-${item.value}`} className="category-tab-item">
                <button
                  type="button"
                  className={selectedCategory === item.value ? 'category-tab-button is-active' : 'category-tab-button'}
                  onClick={() => handleCategoryChange(item.value)}
                >
                  {item.label}
                </button>
              </li>
            ))}
          </ul>
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
                  <time className="member-card__date">{formatMonthDay(item.updatedAt || item.period)}</time>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <div className="content-list-footer">
          <div className="content-list-footer__pagination">
            <ContentPagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
          {isEditorLoggedIn ? (
            <Link to="/cases/new" className="button button--primary content-list-footer__write-button">
              새 운영사례 등록
            </Link>
          ) : (
            <div />
          )}
        </div>
      </PageSectionBlock>
    </>
  );
}
