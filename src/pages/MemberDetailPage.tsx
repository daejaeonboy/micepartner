import { ChevronLeft, Link2 } from 'lucide-react';
import { Navigate, Link, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { createMemberCompanySlug, formatIsoLikeDate, splitParagraphs } from '../lib/contentUtils';

export function MemberDetailPage() {
  const { slug } = useParams();
  const { siteContent } = useSiteContent();
  const company = siteContent.members.companies.find(
    (item) => createMemberCompanySlug(item.name) === String(slug || ''),
  );

  if (!company) {
    return <Navigate to="/members" replace />;
  }

  const paragraphs = splitParagraphs(
    [
      `${company.name}는 ${company.category}${company.secondaryCategory ? ` · ${company.secondaryCategory}` : ''} 분야의 협력업체입니다.`,
      `${company.address}에서 운영 중이며, 행사 운영과 제휴 협업 시 필요한 현장 인프라와 실무 커뮤니케이션을 지원합니다.`,
      `문의가 필요한 경우 ${company.phone}로 바로 연결할 수 있습니다.`,
    ].join('\n\n'),
  );
  const detailDate = formatIsoLikeDate(company.updatedAt);

  return (
    <>
      <PageMeta title={`${company.name} 협력업체`} description={`${company.category} ${company.secondaryCategory}`.trim()} />
      <section className="notice-detail-page">
        <div className="notice-detail-page__inner">
          <Link to="/members" className="notice-detail-page__back">
            <ChevronLeft size={16} />
            협력업체 목록으로
          </Link>

          <header className="notice-detail-page__header">
            <h1>{company.name}</h1>
            {detailDate ? <p>{detailDate}</p> : null}
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
                  {company.category}
                </div>
                {company.secondaryCategory ? (
                  <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                    <Link2 size={16} />
                    {company.secondaryCategory}
                  </div>
                ) : null}
                <div className="notice-detail-card__attachment notice-detail-card__attachment--static">
                  <Link2 size={16} />
                  {company.address}
                </div>
                <a href={`tel:${company.phone.replace(/[^\d+]/g, '')}`} className="notice-detail-card__attachment">
                  <Link2 size={16} />
                  {company.phone}
                </a>
              </div>
            </div>
          </article>
        </div>
      </section>
    </>
  );
}
