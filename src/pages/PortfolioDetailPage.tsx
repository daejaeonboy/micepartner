import { Navigate, useParams } from 'react-router-dom';
import { PageIntroBlock, PageSectionBlock, PageVisualBlock, PublicPageTemplate } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';

export function PortfolioDetailPage() {
  const { slug } = useParams();
  const { siteContent } = useSiteContent();
  const entry = siteContent.cases.entries.find((item) => item.slug === slug);

  if (!entry) {
    return <Navigate to="/cases" replace />;
  }

  const metaTitle = entry.seoTitle || `${entry.title} 포트폴리오`;
  const metaDescription = entry.seoDescription || entry.cardDescription;
  const blocks = {
    intro: <PageIntroBlock eyebrow="Portfolio Detail" title={entry.title} description={entry.cardDescription} />,
    visual: <PageVisualBlock imageUrl={entry.coverImageUrl} alt={entry.title} />,
    overview: (
      <PageSectionBlock
        eyebrow="Project Overview"
        title="프로젝트 개요와 수행 범위를 먼저 확인할 수 있습니다."
        description="포트폴리오 상세 페이지는 프로젝트 성격, 수행 범위, 운영 결과가 한눈에 보이도록 구성합니다."
      >
        <div className="content-grid-2">
          <article className="stack-card">
            <h3>기본 정보</h3>
            <ul>
              <li>카테고리: {entry.category}</li>
              <li>고객사: {entry.client}</li>
              <li>기간: {entry.period}</li>
            </ul>
          </article>
          <article className="stack-card">
            <h3>수행 범위</h3>
            <ul>
              {entry.scope.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </article>
        </div>
      </PageSectionBlock>
    ),
    narrative: (
      <PageSectionBlock
        eyebrow="Case Narrative"
        title="문제, 접근 방식, 결과를 순서대로 정리했습니다."
        description="관리자에서 본문과 이미지를 수정하면 이 상세 페이지도 바로 갱신됩니다."
      >
        <div className="workflow-list">
          <article className="workflow-card">
            <span>01</span>
            <div>
              <h3>프로젝트 개요</h3>
              <p>{entry.summary}</p>
            </div>
          </article>
          <article className="workflow-card">
            <span>02</span>
            <div>
              <h3>주요 과제</h3>
              <p>{entry.challenge}</p>
            </div>
          </article>
          <article className="workflow-card">
            <span>03</span>
            <div>
              <h3>진행 방식과 결과</h3>
              <p>{entry.approach}</p>
              <p>{entry.result}</p>
            </div>
          </article>
        </div>
      </PageSectionBlock>
    ),
    gallery: entry.gallery.length > 0 ? (
      <PageSectionBlock
        eyebrow="Project Gallery"
        title="현장 이미지와 보조 자료를 함께 보여줄 수 있습니다."
        description="관리자에서 이미지 URL과 캡션을 수정하면 포트폴리오 상세에 바로 반영됩니다."
      >
        <div className="media-grid">
          {entry.gallery.map((item) => (
            <article key={`${item.imageUrl}-${item.caption}`} className="media-card">
              <img src={item.imageUrl} alt={item.caption} className="media-card__image" />
              <p>{item.caption}</p>
            </article>
          ))}
        </div>
      </PageSectionBlock>
    ) : null,
  };

  return (
    <>
      <PageMeta title={metaTitle} description={metaDescription} />
      <PublicPageTemplate page="portfolioDetail" blocks={blocks} />
    </>
  );
}
