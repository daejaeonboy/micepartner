type PageIntroProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <section className="page-hero">
      <div className="page-hero__inner">
        <p className="section-eyebrow">{eyebrow}</p>
        <div className="page-hero__copy">
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
      </div>
    </section>
  );
}
