import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { BoardIndexSection } from '../components/BoardIndexSection';
import { PageHeaderBlock } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';

const INITIAL_NOTICE_COUNT = 10;
const LOAD_MORE_COUNT = 10;

function formatBoardDate(value: string) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return '-';
  return trimmed.replaceAll('-', '. ');
}

export function ResourcesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.resources;
  const content = siteContent.resources;
  const [activeCategory, setActiveCategory] = useState('전체');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [visibleCount, setVisibleCount] = useState(INITIAL_NOTICE_COUNT);

  const noticeCategories = useMemo(() => {
    const categories = Array.from(
      new Set(content.notices.map((item) => String(item.category || '').trim()).filter(Boolean))
    );
    return ['전체', ...categories];
  }, [content.notices]);

  const filteredNotices = useMemo(() => {
    const keyword = searchKeyword.trim().toLowerCase();
    return content.notices.filter((item) => {
      const matchesCategory = activeCategory === '전체' || item.category === activeCategory;
      if (!matchesCategory) return false;
      if (!keyword) return true;
      return [item.title, item.summary, item.category].some((field) =>
        String(field || '').toLowerCase().includes(keyword)
      );
    });
  }, [activeCategory, content.notices, searchKeyword]);

  useEffect(() => {
    setVisibleCount(INITIAL_NOTICE_COUNT);
  }, [activeCategory, searchKeyword]);

  const visibleNotices = filteredNotices.slice(0, visibleCount);
  const canLoadMore = visibleCount < filteredNotices.length;

  return (
    <>
      <PageMeta title={copy.noticesTitle} description={copy.noticesDescription} />
      <div className="news-page">
        <div className="news-page__inner">
          <PageHeaderBlock
            title={copy.noticesTitle}
            description={copy.noticesDescription}
            align="left"
          />
          <BoardIndexSection
            id="news-board"
            toolbar={
              <>
                {noticeCategories.map((category) => (
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
            footer={
              canLoadMore ? (
                <button
                  type="button"
                  className="board-more-button"
                  onClick={() => setVisibleCount((current) => current + LOAD_MORE_COUNT)}
                >
                  더 보기
                </button>
              ) : null
            }
          >
            <div className="board-list">
              {visibleNotices.length > 0 ? (
                visibleNotices.map((item) => (
                  <Link key={item.slug} to={`/resources/notices/${item.slug}`} className="board-item">
                    <div className="board-item__category">
                      {formatBoardDate(item.date)}
                    </div>
                    <div className="board-item__content">
                      <h3 className="board-item__title">{item.title}</h3>
                      <p style={{ margin: 0, fontSize: '15px', color: '#666', fontWeight: 400 }}>{item.summary}</p>
                    </div>
                    <div className="board-item__status">
                      <span className="status-badge status-badge--active">
                        {item.category || '일반'}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <div className="news-empty">조건에 맞는 소식이 없습니다.</div>
              )}
            </div>
          </BoardIndexSection>
        </div>
      </div>
    </>
  );
}
