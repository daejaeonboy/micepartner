import { PageMeta } from '../components/PageMeta';
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

  return (
    <>
      <PageMeta title="회사소개" description={copy.introDescription} />
      
      <section className="visual-page-header">
        {content.heroImageUrl ? (
          <img src={content.heroImageUrl} alt="Company Header Visual" />
        ) : null}
        <div className="visual-page-header__overlay">
          <h1>Company</h1>
        </div>
      </section>

      <div className="about-page-content">
        <section id="intro" className="about-text-section">
          <p className="section-eyebrow">회사 소개</p>
          <h2>{copy.introTitle}</h2>
          <p>{copy.introDescription}</p>
        </section>

        <section id="about-identity" className="about-text-section">
          <p className="section-eyebrow">운영 기준</p>
          <h2>마이스파트너는 실무에서 바로 적용할 수 있는 운영 기준을 먼저 정리합니다.</h2>
          <div className="about-plain-body" style={{ padding: 0 }}>
            {messageParagraphs.map((paragraph, idx) => (
              <p key={idx} style={{ marginBottom: '16px' }}>{paragraph}</p>
            ))}
          </div>
        </section>

        <section id="about-strengths" className="about-text-section">
          <p className="section-eyebrow">브랜드 철학</p>
          <h2>{copy.strengthTitle}</h2>
          <div className="about-plain-body" style={{ padding: 0 }}>
            {content.highlights.map((item) => (
              <div key={item.title} className="about-plain-text-block" style={{ marginBottom: '24px' }}>
                <h3 className="about-plain-subtitle" style={{ fontSize: '24px', marginBottom: '8px' }}>{item.title}</h3>
                <p>{item.description}</p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
