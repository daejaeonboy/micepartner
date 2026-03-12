type SiteContentSplashProps = {
  variant?: 'site' | 'admin';
};

function SiteShellSkeleton() {
  return (
    <div className="site-shell site-loading-shell" role="status" aria-live="polite" aria-label="홈페이지 콘텐츠를 불러오는 중">
      <header className="site-header site-header--loading">
        <div className="site-header__inner">
          <div className="brand-mark" aria-hidden="true">
            <span className="loading-block loading-block--brand" />
          </div>

          <div className="site-nav site-nav--loading" aria-hidden="true">
            <span className="loading-block loading-block--nav" />
            <span className="loading-block loading-block--nav" />
            <span className="loading-block loading-block--nav" />
            <span className="loading-block loading-block--nav" />
            <span className="loading-block loading-block--nav loading-block--nav-short" />
          </div>

          <div className="site-header__actions site-header__actions--loading" aria-hidden="true">
            <span className="loading-block loading-block--button" />
          </div>
        </div>
      </header>

      <main className="page-main">
        <div className="site-loading-page">
          <section className="site-loading-section">
            <div className="loading-block loading-block--hero" />
          </section>

          <section className="site-loading-section">
            <div className="site-loading-section__header">
              <span className="loading-block loading-block--eyebrow" />
              <span className="loading-block loading-block--heading" />
              <span className="loading-block loading-block--copy" />
            </div>
            <div className="site-loading-card-grid site-loading-card-grid--services">
              <div className="loading-block loading-block--card-wide" />
              <div className="loading-block loading-block--card-wide" />
              <div className="loading-block loading-block--card-wide" />
            </div>
          </section>

          <section className="site-loading-section">
            <div className="site-loading-section__header site-loading-section__header--center">
              <span className="loading-block loading-block--heading loading-block--heading-center" />
              <span className="loading-block loading-block--copy loading-block--copy-center" />
            </div>
            <div className="loading-block loading-block--banner" />
          </section>

          <section className="site-loading-section">
            <div className="site-loading-section__header">
              <span className="loading-block loading-block--heading loading-block--heading-medium" />
              <span className="loading-block loading-block--copy" />
            </div>
            <div className="site-loading-card-grid site-loading-card-grid--gallery">
              <div className="loading-block loading-block--gallery" />
              <div className="loading-block loading-block--gallery" />
              <div className="loading-block loading-block--gallery" />
            </div>
          </section>

          <section className="site-loading-section">
            <div className="site-loading-section__header">
              <span className="loading-block loading-block--heading loading-block--heading-medium" />
              <span className="loading-block loading-block--copy loading-block--copy-short" />
            </div>
            <div className="site-loading-card-grid site-loading-card-grid--resources">
              <div className="site-loading-resource-card">
                <div className="loading-block loading-block--resource-image" />
                <div className="site-loading-card-copy">
                  <span className="loading-block loading-block--line" />
                  <span className="loading-block loading-block--line loading-block--line-short" />
                </div>
              </div>
              <div className="site-loading-resource-card">
                <div className="loading-block loading-block--resource-image" />
                <div className="site-loading-card-copy">
                  <span className="loading-block loading-block--line" />
                  <span className="loading-block loading-block--line loading-block--line-short" />
                </div>
              </div>
              <div className="site-loading-resource-card">
                <div className="loading-block loading-block--resource-image" />
                <div className="site-loading-card-copy">
                  <span className="loading-block loading-block--line" />
                  <span className="loading-block loading-block--line loading-block--line-short" />
                </div>
              </div>
            </div>
          </section>

          <section className="site-loading-section">
            <div className="site-loading-section__header site-loading-section__header--center">
              <span className="loading-block loading-block--heading loading-block--heading-medium" />
              <span className="loading-block loading-block--copy loading-block--copy-center" />
            </div>
            <div className="site-loading-logo-rows">
              <div className="site-loading-logo-row">
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
              </div>
              <div className="site-loading-logo-row site-loading-logo-row--offset">
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
                <span className="loading-block loading-block--logo" />
              </div>
            </div>
          </section>

          <section className="site-loading-section site-loading-section--last">
            <div className="loading-block loading-block--cta" />
          </section>
        </div>
      </main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <div className="footer-col">
            <div className="site-loading-footer-links" aria-hidden="true">
              <span className="loading-block loading-block--footer-link" />
              <span className="loading-block loading-block--footer-link" />
              <span className="loading-block loading-block--footer-link" />
            </div>
            <div className="site-loading-footer-copy" aria-hidden="true">
              <span className="loading-block loading-block--line" />
              <span className="loading-block loading-block--line" />
              <span className="loading-block loading-block--line loading-block--line-short" />
            </div>
          </div>

          <div className="footer-col" aria-hidden="true">
            <span className="loading-block loading-block--footer-title" />
            <span className="loading-block loading-block--footer-phone" />
            <span className="loading-block loading-block--line loading-block--line-short" />
          </div>

          <div className="footer-col" aria-hidden="true">
            <span className="loading-block loading-block--footer-title" />
            <span className="loading-block loading-block--line loading-block--line-short" />
            <span className="loading-block loading-block--line" />
            <span className="loading-block loading-block--line loading-block--line-short" />
          </div>
        </div>
      </footer>
    </div>
  );
}

function AdminShellSkeleton() {
  return (
    <main className="admin-dashboard admin-dashboard--loading" role="status" aria-live="polite" aria-label="관리자 데이터를 불러오는 중">
      <aside className="admin-sidebar">
        <div className="admin-sidebar__brand" aria-hidden="true">
          <span className="loading-block loading-block--eyebrow" />
          <span className="loading-block loading-block--admin-title" />
          <span className="loading-block loading-block--line" />
          <span className="loading-block loading-block--line loading-block--line-short" />
        </div>

        <div className="admin-sidebar__nav admin-sidebar__nav--loading" aria-hidden="true">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="admin-sidebar__item admin-sidebar__item--loading">
              <span className="loading-block loading-block--admin-icon" />
              <span className="admin-sidebar__item-copy">
                <span className="loading-block loading-block--admin-label" />
                <span className="loading-block loading-block--admin-copy" />
              </span>
            </div>
          ))}
        </div>
      </aside>

      <div className="admin-main">
        <header className="admin-topbar admin-topbar--loading" aria-hidden="true">
          <div className="admin-topbar__title">
            <span className="loading-block loading-block--admin-back" />
            <div className="admin-loading-title-stack">
              <span className="loading-block loading-block--admin-heading" />
              <span className="loading-block loading-block--admin-subheading" />
            </div>
          </div>
          <div className="admin-topbar__actions">
            <div className="admin-user-chip admin-user-chip--loading">
              <span className="loading-block loading-block--avatar" />
              <span className="admin-loading-title-stack">
                <span className="loading-block loading-block--admin-copy" />
                <span className="loading-block loading-block--admin-copy loading-block--admin-copy-short" />
              </span>
            </div>
            <span className="loading-block loading-block--button loading-block--button-light" />
          </div>
        </header>

        <div className="admin-main__content" aria-hidden="true">
          <div className="loading-block loading-block--admin-hero" />
          <div className="admin-loading-grid">
            <div className="loading-block loading-block--admin-panel" />
            <div className="loading-block loading-block--admin-panel" />
            <div className="loading-block loading-block--admin-panel" />
          </div>
          <div className="loading-block loading-block--admin-panel loading-block--admin-panel-wide" />
        </div>
      </div>
    </main>
  );
}

export function SiteContentSplash({ variant = 'site' }: SiteContentSplashProps) {
  return variant === 'admin' ? <AdminShellSkeleton /> : <SiteShellSkeleton />;
}
