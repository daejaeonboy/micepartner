import { ChevronLeft, Link2 } from 'lucide-react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { formatIsoLikeDate, splitParagraphs } from '../lib/contentUtils';

export function PortfolioDetailPage() {
  const { slug } = useParams();
  const { siteContent } = useSiteContent();
  const entry = siteContent.cases.entries.find((item) => item.slug === slug);

  if (!entry) {
    return <Navigate to="/cases" replace />;
  }

  const metaTitle = entry.seoTitle || `${entry.title} 포트폴리오`;
  const metaDescription = entry.seoDescription || entry.cardDescription;
  const paragraphs = splitParagraphs(
    [entry.cardDescription, entry.summary, entry.challenge, entry.approach, entry.result]
      .filter(Boolean)
      .join('\n\n'),
  );

  return (
    <>
      <PageMeta title={metaTitle} description={metaDescription} />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/cases" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            운영사례 목록으로
          </Link>

          <header className="notice-detail-page__header">
            <h1>{entry.title}</h1>
            <p>{formatIsoLikeDate(entry.updatedAt || entry.period)}</p>
          </header>

          <article className="notice-detail-card">
            <div className="notice-detail-card__body">
              {paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </div>

            <div className="notice-detail-card__attachments">
              <strong>관련 정보</strong>
              <div className="notice-detail-card__attachment-list">
                <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                  <Link2 size={16} />
                  {entry.category}
                </div>
                <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                  <Link2 size={16} />
                  {entry.client}
                </div>
                {entry.outcome ? (
                  <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                    <Link2 size={16} />
                    {entry.outcome}
                  </div>
                ) : null}
                {entry.scope.map((item) => (
                  <div key={item} className="notice-detail-card__attachment notice-detail-card__attachment--static">
                    <Link2 size={16} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
