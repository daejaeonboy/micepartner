import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BoardIndexSection } from '../components/BoardIndexSection';
import { PageHeaderBlock, PublicPageTemplate } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';

function formatBoardDate(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '-';
  return trimmed.replaceAll('-', '. ');
}

export function ResourceFilesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.resources;
  const content = siteContent.resources;
  const [activeCategory, setActiveCategory] = useState('전체');

  const fileCategories = useMemo(() => {
    const categories = Array.from(
      new Set(content.items.map((item) => String(item.type || '').trim()).filter(Boolean))
    );
    return ['전체', ...categories];
  }, [content.items]);

  const filteredItems = useMemo(() => {
    return content.items.filter((item) => {
      return activeCategory === '전체' || item.type === activeCategory;
    });
  }, [activeCategory, content.items]);

  const blocks = {
    header: (
      <PageHeaderBlock
        title={copy.downloadsTitle}
        description={copy.downloadsDescription}
        action={<Link to="/resources/notices" className="resource-news-page__jump">소식 보기</Link>}
      />
    ),
    archive: (
      <BoardIndexSection 
        id="resource-downloads"
        toolbar={
          <>
            {fileCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={activeCategory === category ? 'board-tab is-active' : 'board-tab'}
                onClick={() => setActiveCategory(category)}
              >
                {category}
              </button>
            ))}
          </>
        }
      >
        <div className="board-list">
          {filteredItems.map((item) => (
            <Link key={item.slug} to={`/resources/files/${item.slug}`} className="board-item">
              <div className="board-item__category">
                {formatBoardDate(item.updatedAt || '2026-03-12')}
              </div>
              <div className="board-item__content">
                <h3 className="board-item__title">{item.title}</h3>
                <p style={{ margin: 0, fontSize: '15px', color: '#666', fontWeight: 400 }}>{item.description}</p>
              </div>
              <div className="board-item__status">
                <span className="status-badge status-badge--active">
                  {item.type}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </BoardIndexSection>
    ),
  };

  return (
    <>
      <PageMeta title={copy.downloadsTitle} description={copy.downloadsDescription} />
      <PublicPageTemplate page="resourcesFiles" blocks={blocks} />
    </>
  );
}
