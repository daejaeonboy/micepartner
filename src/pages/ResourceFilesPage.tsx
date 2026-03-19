import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ContentPagination } from '../components/ContentPagination';
import { PageMeta } from '../components/PageMeta';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';

const PAGE_SIZE = 10;

export function ResourceFilesPage() {
  const { siteCopy, siteContent, ready } = useSiteContent();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('전체');
  const [currentPage, setCurrentPage] = useState(1);
  const isEditorLoggedIn = Boolean(getAdminToken());

  // 데이터 로딩 중 처리
  if (!ready || !siteContent || !siteCopy) {
    return null; 
  }

  const copy = siteCopy.resources || {};
  const content = siteContent.resources || { items: [], notices: [] };
  const archive = content.items || [];

  const fileCategories = useMemo(() => {
    const categories = Array.from(
      new Set(archive.map((item: any) => String(item.type || '').trim()).filter(Boolean))
    );
    return ['전체', ...categories];
  }, [archive]);

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

  const filteredFiles = useMemo(() => {
    return archive.filter((item: any) => {
      if (activeCategory === '전체') return true;
      return String(item.type || '').trim() === activeCategory;
    });
  }, [activeCategory, archive]);

  const totalPages = Math.max(1, Math.ceil(filteredFiles.length / PAGE_SIZE));

  const paginatedFiles = filteredFiles.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const formatBoardDate = (value: string) => {
    const trimmed = String(value || '').trim();
    if (!trimmed) return '-';
    return trimmed.replaceAll('-', '. ');
  };

  return (
    <>
      <PageMeta title={copy.downloadsTitle || '자료실'} description={copy.downloadsDescription || ''} />
      
      <PageHeaderBlock
        title={copy.downloadsTitle}
        description={copy.downloadsDescription}
        align="left"
        width="content"
      />

      <PageSectionBlock>
        <div className="resource-news-board-container">
          <div className="category-tab-container is-flexible">
            <ul className="category-tab-list">
              {fileCategories.map((category) => (
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
            {paginatedFiles.length > 0 ? (
              paginatedFiles.map((item: any) => (
                <Link key={item.slug} to={`/resources/files/${item.slug}`} className="board-item">
                  <div className="board-item__category">
                    {formatBoardDate(item.updatedAt)}
                  </div>
                  <div className="board-item__content">
                    <h3 className="board-item__title">{item.title}</h3>
                    <p>{item.description}</p>
                  </div>
                  <div className="board-item__status">
                    <span className="status-badge status-badge--active">
                      {item.type}
                    </span>
                  </div>
                </Link>
              ))
            ) : (
              <div className="resource-news-empty">
                조건에 맞는 자료가 없습니다.
              </div>
            )}
          </div>
        </div>

        <div className="content-list-footer">
          <div className="content-list-footer__pagination">
            <ContentPagination currentPage={currentPage} totalPages={totalPages} onChange={setCurrentPage} />
          </div>
          {isEditorLoggedIn ? (
            <Link to="/resources/files/new" className="button button--primary content-list-footer__write-button">
              자료 등록
            </Link>
          ) : (
            <div />
          )}
        </div>
      </PageSectionBlock>
    </>
  );
}
