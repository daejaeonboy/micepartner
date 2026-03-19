import { motion } from 'motion/react';
import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ContentPagination } from '../components/ContentPagination';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { formatMonthDay, resolveMemberCompanySlug } from '../lib/contentUtils';
import { fadeUp } from '../lib/motion';

const PAGE_SIZE = 12;

export function MembersPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.members;
  const content = siteContent.members;
  const isEditorLoggedIn = Boolean(getAdminToken());
  const [selectedCategory, setSelectedCategory] = useState(content.filterAllLabel);
  const [currentPage, setCurrentPage] = useState(1);

  const categories = useMemo(
    () => [content.filterAllLabel, ...Array.from(new Set(content.companies.map((item) => item.category).filter(Boolean)))],
    [content.companies, content.filterAllLabel],
  );

  const filteredCompanies = useMemo(() => {
    return content.companies.filter((company) => {
      return selectedCategory === content.filterAllLabel ? true : company.category === selectedCategory;
    });
  }, [content.companies, content.filterAllLabel, selectedCategory]);

  const totalPages = Math.max(1, Math.ceil(filteredCompanies.length / PAGE_SIZE));

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory]);

  const paginatedCompanies = filteredCompanies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  return (
    <>
      <PageMeta title="MICE 회원" description={copy.introDescription} />
      <PageHeaderBlock
        title={copy.introTitle}
        description={copy.introDescription}
      />
      <PageSectionBlock id="member-list-section">
        {/* 새로운 격자형 카테고리 탭 */}
        <div className="category-tab-container">
          <ul className="category-tab-list">
            {categories.map((item) => (
              <li key={item} className="category-tab-item">
                <button
                  type="button"
                  className={selectedCategory === item ? 'category-tab-button is-active' : 'category-tab-button'}
                  onClick={() => setSelectedCategory(item)}
                >
                  {item}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {paginatedCompanies.length === 0 ? (
          <div className="members-empty-state">
            <strong>{content.emptyStateTitle}</strong>
            <p>{content.emptyStateDescription}</p>
          </div>
        ) : (
          <div className="members-grid">
            {paginatedCompanies.map((company) => (
              <motion.article key={resolveMemberCompanySlug(company)} {...fadeUp} className="member-card">
                <Link
                  to={`/members/${resolveMemberCompanySlug(company)}`}
                  className="member-card__image-box"
                  aria-label={`${company.name} 상세 페이지 이동`}
                >
                  {company.logoUrl ? (
                    <img src={company.logoUrl} alt={company.name} />
                  ) : (
                    <div className="member-card__no-image">
                      <span>{company.name}</span>
                    </div>
                  )}
                </Link>
                <div className="member-card__content">
                  <h3 className="member-card__title">{company.name}</h3>
                  {company.updatedAt ? <time className="member-card__date">{formatMonthDay(company.updatedAt)}</time> : null}
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
            <Link to="/members/new" className="button button--primary content-list-footer__write-button">
              새 협력업체 등록
            </Link>
          ) : (
            <div />
          )}
        </div>
      </PageSectionBlock>
    </>
  );
}
