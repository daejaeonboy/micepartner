import { ChevronLeft, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { Navigate, Link, useParams, useNavigate } from 'react-router-dom';
import { useState, useRef, useEffect } from 'react';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteData } from '../lib/api';
import { formatIsoLikeDate } from '../lib/contentUtils';

function splitParagraphs(value: string) {
  return String(value || '')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ResourceDetailPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData, siteContent } = useSiteContent();
  const isEditorLoggedIn = Boolean(getAdminToken());
  const adminToken = getAdminToken();
  const resource = siteContent.resources.items.find((item) => item.slug === slug);

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

  if (!resource) {
    return <Navigate to="/resources/files" replace />;
  }

  const handleDelete = async () => {
    if (!adminToken) return;

    const confirmed = window.confirm('이 자료를 정말 삭제할까요? 삭제 후에는 복구할 수 없습니다.');
    if (!confirmed) return;

    try {
      const nextItems = siteData.content.resources.items.filter((item) => item.slug !== resource.slug);
      const saved = await saveSiteData(
        {
          ...siteData,
          content: {
            ...siteData.content,
            resources: {
              ...siteData.content.resources,
              items: nextItems,
            },
          },
        },
        adminToken,
      );

      updateSiteData(saved);
      navigate('/resources/files', { replace: true });
    } catch (e) {
      alert('삭제 중 오류가 발생했습니다.');
    }
  };

  const paragraphs = splitParagraphs(resource.body);
  const detailDate = formatIsoLikeDate(resource.updatedAt);

  return (
    <>
      <PageMeta title={`${resource.title} 자료`} description={resource.description} />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/resources/files" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            자료 목록으로
          </Link>

          <header className="notice-detail-page__header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', paddingBottom: '20px', position: 'relative' }}>
            <div style={{ display: 'grid', gap: '8px' }}>
              <h1 style={{ margin: 0 }}>{resource.title}</h1>
              {detailDate ? <p style={{ margin: 0 }}>{detailDate}</p> : null}
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
                    borderRadius: '0px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    border: '1px solid #eee',
                    backgroundColor: '#fff',
                  }}
                >
                  <MoreVertical size={20} />
                </button>

                {showMenu && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '100%',
                      right: 0,
                      marginTop: '8px',
                      width: '160px',
                      backgroundColor: '#fff',
                      border: '1px solid #eee',
                      borderRadius: '0px',
                      boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                      zIndex: 50,
                      overflow: 'hidden',
                    }}
                  >
                    <Link
                      to={`/resources/files/${resource.slug}/edit`}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px',
                        padding: '12px 16px',
                        fontSize: '14px',
                        color: '#333',
                        transition: 'background 0.2s',
                        borderBottom: '1px solid #f5f5f5',
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
                        transition: 'background 0.2s',
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
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>{resource.description}</p>
              )}
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
