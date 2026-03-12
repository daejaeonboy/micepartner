import type { ReactNode } from 'react';

type BoardIndexSectionProps = {
  id: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  toolbar?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
};

export function BoardIndexSection({
  id,
  toolbar,
  footer,
  children,
}: BoardIndexSectionProps) {
  return (
    <section id={id} className="board-container" style={{ paddingTop: 0 }}>
      {toolbar ? <nav className="board-tabs">{toolbar}</nav> : null}
      <div className="board-list">{children}</div>
      {footer ? <div className="board-footer">{footer}</div> : null}
    </section>
  );
}
