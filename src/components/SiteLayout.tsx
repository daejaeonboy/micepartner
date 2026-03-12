import { ChevronDown, Menu, X, Facebook, Instagram, Youtube } from 'lucide-react';
import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import { SiteContentSplash } from './SiteContentSplash';

export function SiteLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const { siteCopy, siteContent, ready } = useSiteContent();

  if (!ready) {
    return <SiteContentSplash />;
  }

  const footer = siteContent.footer;
  const menus = siteContent.menus;

  const normalizePathname = (path: string) => {
    const [pathname] = String(path || '').split('#');
    return pathname.split('?')[0] || '/';
  };

  const getMenuTarget = (path: string, children?: { path: string }[]) => {
    if (children && children.length > 0) {
      return children[0].path;
    }

    return path;
  };

  const isNavActive = (path: string, children?: { path: string }[]) => {
    const candidates = [path, ...(children || []).map((item) => item.path)]
      .map(normalizePathname)
      .filter(Boolean);

    if (candidates.includes('/')) {
      return location.pathname === '/';
    }

    return candidates.some((candidate) => location.pathname === candidate || location.pathname.startsWith(`${candidate}/`));
  };

  return (
    <div className="site-shell">
      <header className="site-header">
        <div className="site-header__inner">
          <NavLink to="/" className="brand-mark" onClick={() => setIsOpen(false)}>
            <img src="/logo.png" alt="마이스파트너 로고" className="brand-mark__image" />
          </NavLink>

          <nav className="site-nav" aria-label="주요 메뉴">
            {menus.headerItems.map((item) => (
              <div key={item.path} className="site-nav__item">
                <NavLink
                  to={getMenuTarget(item.path, item.children)}
                  className={isNavActive(item.path, item.children) ? 'site-nav__link is-active' : 'site-nav__link'}
                >
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="site-header__actions">
            <NavLink to="/contact" className="button button--primary">
              {footer.headerCtaLabel}
            </NavLink>
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="메뉴 열기"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {/* 메가 메뉴 패널: site-header__inner 호버 시 노출 (CSS에서 제어) */}
          <div className="mega-menu">
            <div className="mega-menu__inner">
              {menus.headerItems.map((item) => (
                <div key={item.path} className="mega-menu__column">
                  <div className="mega-menu__title">{item.label}</div>
                  <div className="mega-menu__list">
                    {item.children?.map((child) => (
                      <Link key={child.path} to={child.path} className="mega-menu__link">
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </header>

      {isOpen ? (
        <div className="mobile-nav" aria-label="모바일 메뉴">
          <div className="mobile-nav__inner">
            {menus.headerItems.map((item) => (
              <div key={item.path} className="mobile-nav__group">
                <NavLink
                  to={getMenuTarget(item.path, item.children)}
                  className={isNavActive(item.path, item.children) ? 'mobile-nav__link is-active' : 'mobile-nav__link'}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </NavLink>
                {item.children?.length ? (
                  <div className="mobile-nav__sublist">
                    {item.children.map((child) => (
                      <Link key={child.path} to={child.path} className="mobile-nav__sublink" onClick={() => setIsOpen(false)}>
                        {child.label}
                      </Link>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
            <NavLink to="/contact" className="header-cta mobile-nav__cta" onClick={() => setIsOpen(false)}>
              {footer.headerCtaLabel}
            </NavLink>
          </div>
        </div>
      ) : null}

      <main className="page-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__grid">
          <div className="footer-col">
            <div className="footer-links" style={{ marginBottom: '20px' }}>
              {menus.footerQuickLinks.map((item, index) => (
                <Link key={`${item.label}-${item.path}`} to={item.path} style={index === menus.footerQuickLinks.length - 1 ? { fontWeight: 700 } : undefined}>
                  {item.label}
                </Link>
              ))}
            </div>
            <div className="footer-company-details">
              <div>
                <p>{siteCopy.footer.copy}</p>
                {footer.legalLines.map((line) => (
                  <p key={line}>{line}</p>
                ))}
              </div>
            </div>
          </div>

          <div className="footer-col">
            <h4>{footer.customerServiceTitle}</h4>
            <div className="footer-contact-info">
              <p>{footer.customerServicePhone}</p>
              <span>{footer.customerServiceHours}</span>
            </div>
          </div>

          <div className="footer-col">
            <h4>{footer.bankSectionTitle}</h4>
            <div className="footer-bank-info">
              <div className="footer-bank-details">
                <strong>{footer.bankName}</strong>
                <span>{footer.bankAccountNumber}</span>
                <span>{footer.bankAccountHolder}</span>
              </div>
            </div>
          </div>

          <div className="footer-bottom">
            <p>{footer.copyright}</p>
            <div className="footer-links">
              <a href="#" aria-label="Facebook"><Facebook size={16} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={16} /></a>
              <a href="#" aria-label="Youtube"><Youtube size={16} /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
