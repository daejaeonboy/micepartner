import { ChevronLeft, Download, Link2 } from 'lucide-react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';

function splitParagraphs(value: string) {
  return String(value || '')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function ResourceDetailPage() {
  const { slug } = useParams();
  const { siteContent } = useSiteContent();
  const resource = siteContent.resources.items.find((item) => item.slug === slug);

  if (!resource) {
    return <Navigate to="/resources/files" replace />;
  }

  const paragraphs = splitParagraphs(resource.body);

  return (
    <>
      <PageMeta title={`${resource.title} 자료`} description={resource.description} />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/resources/files" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            자료 목록으로
          </Link>

          <header className="notice-detail-page__header">
            <h1>{resource.title}</h1>
            <p>{resource.updatedAt}</p>
          </header>

          <article className="notice-detail-card">
            <div className="notice-detail-card__body">
              {paragraphs.length > 0 ? (
                paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)
              ) : (
                <p>{resource.description}</p>
              )}
            </div>

            <div className="notice-detail-card__attachments">
              <strong>관련 링크</strong>
              <div className="notice-detail-card__attachment-list">
                <a href={resource.downloadUrl} className="notice-detail-card__attachment">
                  <Download size={16} />
                  {resource.downloadLabel}
                </a>
                {resource.fileName ? (
                  <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                    <Link2 size={16} />
                    {resource.fileName}
                  </div>
                ) : null}
                {resource.version ? (
                  <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                    <Link2 size={16} />
                    버전 {resource.version}
                  </div>
                ) : null}
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
