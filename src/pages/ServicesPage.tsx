import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { createBreadcrumbJsonLd, truncateText } from '../lib/seo';

export function ServicesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.services;
  const content = siteContent.services;
  const seoTitle = 'MICE 행사기획·운영 서비스';
  const seoDescription = truncateText(
    '마이스파트너의 MICE 행사기획, 현장 운영, 협력 파트너 연계, 실행 프로세스를 한눈에 확인할 수 있는 서비스 소개 페이지입니다.',
  );

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/services"
        image={content.heroImageUrl}
        jsonLd={createBreadcrumbJsonLd([
          { name: '홈', path: '/' },
          { name: '서비스', path: '/services' },
        ])}
      />
      <section className="service-plain-hero">
        <div className="service-plain-hero__inner">
          <p className="section-eyebrow">{content.introEyebrow}</p>
          <h1>{copy.introTitle}</h1>
          <p>{copy.introDescription}</p>
        </div>
      </section>

      {content.heroImageUrl ? (
        <section className="service-plain-section service-plain-section--visual">
          <div className="service-plain-image">
            <img src={content.heroImageUrl} alt="서비스 페이지 대표 이미지" />
          </div>
        </section>
      ) : null}

      <section id="service-modules" className="service-plain-section">
        <div className="service-plain-heading">
          <p className="section-eyebrow">{content.modulesEyebrow}</p>
          <h2>{copy.modulesTitle}</h2>
          <p>{copy.modulesDescription}</p>
        </div>

        <div className="service-plain-body">
          {content.modules.map((item) => (
            <article key={item.title} className="service-plain-block">
              <h3>{item.title}</h3>
              <p>{item.description}</p>
              {item.points?.length ? (
                <div className="service-plain-points">
                  {item.points.map((point) => (
                    <p key={point}>{point}</p>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section id="service-flow" className="service-plain-section service-plain-section--last">
        <div className="service-plain-heading">
          <p className="section-eyebrow">{content.flowEyebrow}</p>
          <h2>{copy.flowTitle}</h2>
          <p>{copy.flowDescription}</p>
        </div>

        <div className="service-plain-body">
          {content.flowSteps.map((item) => (
            <article key={item.step} className="service-plain-block">
              <p className="service-plain-label">{item.step}</p>
              <h3>{item.title}</h3>
              <p>{item.description}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
