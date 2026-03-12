import { PageMeta } from '../components/PageMeta';
import { PublicPageTemplate } from '../components/PublicPageTemplate';
import { useSiteContent } from '../context/SiteContentContext';

function splitParagraphs(value: string) {
  return String(value || '')
    .split('\n\n')
    .map((paragraph) => paragraph.trim())
    .filter(Boolean);
}

export function AboutPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.about;
  const content = siteContent.about;
  const messageParagraphs = splitParagraphs(content.messageBody);

  const blocks = {
    intro: (
      <section className="about-plain-hero">
        <div className="about-plain-hero__inner">
          <p className="section-eyebrow">{content.introEyebrow}</p>
          <h1>{copy.introTitle}</h1>
          <p>{copy.introDescription}</p>
        </div>
      </section>
    ),
    identity: (
      <section id="about-identity" className="about-plain-section">
        <div className="about-plain-heading">
          <p className="section-eyebrow">{content.identityEyebrow}</p>
          <h2>{copy.identityTitle}</h2>
          <p>{copy.identityDescription}</p>
        </div>

        <div className="about-plain-body">
          <p className="about-plain-label">{copy.identityCardTitle}</p>
          {content.identityPoints.map((point) => (
            <p key={point}>{point}</p>
          ))}

          <p className="about-plain-label">{copy.ownerCardTitle}</p>
          <h3 className="about-plain-subtitle">{content.messageTitle}</h3>
          {messageParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </section>
    ),
    strengths: (
      <section id="about-strengths" className="about-plain-section">
        {content.heroImageUrl ? (
          <div className="about-plain-image">
            <img src={content.heroImageUrl} alt="회사 소개 대표 이미지" />
          </div>
        ) : null}

        <div className="about-plain-heading">
          <p className="section-eyebrow">{content.strengthEyebrow}</p>
          <h2>{copy.strengthTitle}</h2>
          <p>{copy.strengthDescription}</p>
        </div>

        <div className="about-plain-body">
          {content.highlights.map((item) => (
            <div key={item.title} className="about-plain-text-block">
              <h3 className="about-plain-subtitle">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
    process: (
      <section id="about-process" className="about-plain-section about-plain-section--last">
        <div className="about-plain-heading">
          <p className="section-eyebrow">{content.processEyebrow}</p>
          <h2>{copy.processTitle}</h2>
          <p>{copy.processDescription}</p>
        </div>

        <div className="about-plain-body">
          {content.processSteps.map((item) => (
            <div key={item.step} className="about-plain-text-block">
              <p className="about-plain-label">{item.step}</p>
              <h3 className="about-plain-subtitle">{item.title}</h3>
              <p>{item.description}</p>
            </div>
          ))}
        </div>
      </section>
    ),
  };

  return (
    <>
      <PageMeta title="회사소개" description={copy.introDescription} />
      <PublicPageTemplate page="about" blocks={blocks} />
    </>
  );
}
