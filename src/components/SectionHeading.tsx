type SectionHeadingProps = {
  eyebrow: string;
  title: string;
  description: string;
};

export function SectionHeading({ eyebrow, title, description }: SectionHeadingProps) {
  return (
    <div className="section-heading">
      <p className="section-eyebrow">{eyebrow}</p>
      <div className="section-heading__body">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  );
}
