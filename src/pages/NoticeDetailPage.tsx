import { ChevronLeft, Link2 } from 'lucide-react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';

function splitParagraphs(value: string) {
  return String(value || '')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function NoticeDetailPage() {
  const { slug } = useParams();
  const { siteContent } = useSiteContent();
  const notice = siteContent.resources.notices.find((item) => item.slug === slug);

  if (!notice) {
    return <Navigate to="/resources/notices" replace />;
  }

  const paragraphs = splitParagraphs(notice.body);

  return (
    <>
      <PageMeta title={`${notice.title} 공지`} description={notice.summary} />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/resources/notices" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            공지사항 목록으로
          </Link>

          <header className="notice-detail-page__header">
            <h1>{notice.title}</h1>
            <p>{notice.date}</p>
          </header>

          <article className="notice-detail-card">
            <div className="notice-detail-card__body">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            {notice.attachments.length > 0 ? (
              <div className="notice-detail-card__attachments">
                <strong>관련 링크</strong>
                <div className="notice-detail-card__attachment-list">
                  {notice.attachments.map((item) => (
                    <a key={`${item.label}-${item.url}`} href={item.url} className="notice-detail-card__attachment">
                      <Link2 size={16} />
                      {item.label}
                    </a>
                  ))}
                </div>
              </div>
            ) : null}
          </article>
        </div>
      </section>
    </>
  );
}
