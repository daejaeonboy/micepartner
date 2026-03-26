import { ChevronLeft, Link2, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteDataWithTransform } from '../lib/api';
import { formatIsoLikeDate } from '../lib/contentUtils';
import { normalizeRichTextHtml, stripHtmlTags } from '../lib/richText';
import {
  createArticleJsonLd,
  createBreadcrumbJsonLd,
  toSchemaDate,
  truncateText,
} from '../lib/seo';

export function PortfolioDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData, siteContent } = useSiteContent();
  const entry = siteContent.cases.entries.find((item) => item.slug === slug);
  const isEditorLoggedIn = Boolean(getAdminToken());
  const adminToken = getAdminToken();

  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!entry) {
    return <Navigate to="/cases" replace />;
  }

  const handleDelete = async () => {
    if (!adminToken) return;
    
    const confirmed = window.confirm('이 운영사례를 정말 삭제할까요? 삭제 후에는 복구할 수 없습니다.');
    if (!confirmed) return;

    try {
      const saved = await saveSiteDataWithTransform(adminToken, (current) => ({
        ...current,
        content: {
          ...current.content,
          cases: {
            ...current.content.cases,
            entries: current.content.cases.entries.filter((item) => item.slug !== entry.slug),
          },
        },
      }));

      updateSiteData(saved);
      navigate('/cases', { replace: true });
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const rawSeoTitle = String(entry.seoTitle || '').trim();
  const metaTitle =
    rawSeoTitle && rawSeoTitle !== entry.title
      ? rawSeoTitle
      : /사례/.test(entry.title)
        ? entry.title
        : /운영/.test(entry.title)
          ? `${entry.title} 사례`
          : `${entry.title} 행사 운영 사례`;
  const metaDescription = truncateText(
    entry.seoDescription || entry.cardDescription || stripHtmlTags(entry.summary),
  );
  
  const bodyHtml = normalizeRichTextHtml(entry.summary || '');
  const structuredData = [
    createBreadcrumbJsonLd([
      { name: '홈', path: '/' },
      { name: '포트폴리오', path: '/cases' },
      { name: entry.title, path: `/cases/${entry.slug}` },
    ]),
    createArticleJsonLd({
      headline: entry.title,
      description: metaDescription,
      path: `/cases/${entry.slug}`,
      image: entry.coverImageUrl,
      datePublished: toSchemaDate(entry.updatedAt || entry.period),
      dateModified: toSchemaDate(entry.updatedAt || entry.period),
      section: entry.category,
    }),
  ];

  return (
    <>
      <PageMeta
        title={metaTitle}
        description={metaDescription}
        canonicalPath={`/cases/${entry.slug}`}
        image={entry.coverImageUrl}
        imageAlt={entry.title}
        type="article"
        jsonLd={structuredData}
      />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/cases" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            운영사례 목록으로
          </Link>

          <header className="notice-detail-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '20px', position: 'relative' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <h1 style={{ margin: 0 }}>{entry.title}</h1>
              <p style={{ margin: 0 }}>{formatIsoLikeDate(entry.updatedAt || entry.period)}</p>
            </div>
            
            {isEditorLoggedIn ? (
              <div ref={menuRef} style={{ position: 'relative' }}>
                <button 
                  onClick={() => setShowMenu(!showMenu)}
                  className="button button--light" 
                  style={{ 
                    width: '42px', 
                    height: '42px', 
                    minWidth: '42px', 
                    padding: 0, 
                    borderRadius: 0, 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    color: '#666',
                    border: '1px solid #eee',
                    backgroundColor: '#fff'
                  }}
                >
                  <MoreVertical size={20} />
                </button>

                {showMenu && (
                  <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    marginTop: '8px',
                    width: '160px',
                    backgroundColor: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 0,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    zIndex: 50,
                    overflow: 'hidden'
                  }}>
                    <Link 
                      to={`/cases/${entry.slug}/edit`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#333',
                        transition: 'background 0.2s',
                        borderBottom: '1px solid #f5f5f5'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f8fafc'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Pencil size={14} /> 수정하기
                    </Link>
                    <button 
                      onClick={handleDelete}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        width: '100%',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#e11d48',
                        background: 'none',
                        border: 'none',
                        textAlign: 'left',
                        cursor: 'pointer',
                        transition: 'background 0.2s'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fff1f2'}
                      onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                    >
                      <Trash2 size={14} /> 삭제하기
                    </button>
                  </div>
                )}
              </div>
            ) : null}
          </header>

          <article className="notice-detail-card">
            <div className="notice-detail-card__body">
              {entry.coverImageUrl && (
                <div className="portfolio-detail-card__image-box">
                  <img src={entry.coverImageUrl} alt={entry.title} />
                </div>
              )}

              {bodyHtml ? <div className="notice-detail-card__rich-copy" dangerouslySetInnerHTML={{ __html: bodyHtml }} /> : null}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
