import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContentPagination } from '../components/ContentPagination';
import { PageMeta } from '../components/PageMeta';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';

const PAGE_SIZE = 10;

function formatBoardDate(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '-';
  return trimmed.replaceAll('-', '. ');
}

export function ResourcesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.resources;
  const content = siteContent.resources;
  const isEditorLoggedIn = Boolean(getAdminToken());
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);

  const noticeCategories = useMemo(() => {
    const categories = Array.from(
      new Set(content.notices.map((item) => String(item.category || '').trim()).filter(Boolean))
    );
    return ['전체', ...categories];
  }, [content.notices]);

  useEffect(() => {
    const cat = searchParams.get('category') || '전체';
    setActiveCategory(cat);
    setCurrentPage(1);
  }, [searchParams]);

  const handleCategoryChange = (category: string) => {
    if (category === '전체') {
      setSearchParams({});
    } else {
      setSearchParams({ category });
    }
  };

  const filteredNotices = useMemo(() => {
    return content.notices.filter((item) => {
      return activeCategory === '전체' || item.category === activeCategory;
    });
  }, [activeCategory, content.notices]);

  const totalPages = Math.max(1, Math.ceil(filteredNotices.length / PAGE_SIZE));

  const paginatedNotices = useMemo(() => {
    return filteredNotices.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  }, [filteredNotices, currentPage]);

  return (
    <>
      <PageMeta title={copy.noticesTitle} description={copy.noticesDescription} />
      
      <PageHeaderBlock
        title={copy.noticesTitle}
        description={copy.noticesDescription}
        align="left"
        width="content"
      />

      <PageSectionBlock>
        <div className="resource-news-board-container">
          <div className="category-tab-container is-flexible">
            <ul className="category-tab-list">
              {noticeCategories.map((category) => (
                <li key={category} className="category-tab-item">
                  <button
                    className={`category-tab-button ${activeCategory === category ? 'is-active' : ''}`}
                    onClick={() => handleCategoryChange(category)}
                  >
                    {category}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="board-list">
            {paginatedNotices.length > 0 ? (
              paginatedNotices.map((item) => (
                <Link key={item.slug} to={`/resources/notices/${item.slug}`} className="board-item">
                  <div className="board-item__category">
                    {formatBoardDate(item.date)}
                  </div>
                  <div className="board-item__content">
                    <h3 className="board-item__title">{item.title}</h3>
                    <p>{item.summary}</p>
                  </div>
                  <div className="board-item__status">
                    <span className="status-badge status-badge--active">
                      {item.category || '일반'}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="resource-news-empty">조건에 맞는 소식이 없습니다.</div>
            )}
          </div>
        </div>

        <div className="content-list-footer">
          <div className="content-list-footer__pagination">
            <ContentPagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
          {isEditorLoggedIn ? (
            <Link to="/resources/notices/new" className="button button--primary content-list-footer__write-button">
              소식 등록
            </Link>
          ) : (
            <div />
          )}
        </div>
      </PageSectionBlock>
    </>
  );
}
