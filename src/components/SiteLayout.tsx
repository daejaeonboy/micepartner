import { ChevronDown, Menu, X, Facebook, Instagram, Youtube } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useSiteContent } from '../context/SiteContentContext';
import { clearAdminToken, getAdminToken } from '../lib/adminSession';
import { deleteAdminSession } from '../lib/api';
import { SiteContentSplash } from './SiteContentSplash';
import { FloatingActions } from './FloatingActions';

function toOptimizedMegaImageUrl(url: string) {
  const raw = String(url || '').trim();
  if (!raw) {
    return '';
  }

  try {
    const parsed = new URL(raw);
    if (parsed.hostname.includes('images.unsplash.com')) {
      parsed.searchParams.set('auto', 'format');
      parsed.searchParams.set('fit', 'crop');
      parsed.searchParams.set('w', '1100');
      parsed.searchParams.set('q', '72');
      return parsed.toString();
    }
    return raw;
  } catch {
    return raw;
  }
}

export function SiteLayout() {
  const [isOpen, setIsOpen] = useState(false);
  const [expandedMenuIndex, setExpandedMenuIndex] = useState<number | null>(null);
  const [hoveredMenuIndex, setHoveredMenuIndex] = useState<number | null>(null);
  const [isEditorLoggedIn, setIsEditorLoggedIn] = useState(() => Boolean(getAdminToken()));
  const location = useLocation();
  const navigate = useNavigate();
  const { siteCopy, siteContent, ready } = useSiteContent();

  if (!ready) {
    return <SiteContentSplash />;
  }

  const footer = siteContent.footer;
  const menus = siteContent.menus;

  useEffect(() => {
    setIsEditorLoggedIn(Boolean(getAdminToken()));
  }, [location.pathname, location.search, location.hash]);

  const normalizePathname = (path: string) => {
    const [pathname] = String(path || '').split('#');
    return pathname.split('?')[0] || '/';
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

  const activeMenu =
    hoveredMenuIndex !== null && hoveredMenuIndex >= 0 && hoveredMenuIndex < menus.headerItems.length
      ? menus.headerItems[hoveredMenuIndex]
      : null;
  const activeMenuImageSrc = activeMenu?.imageUrl ? toOptimizedMegaImageUrl(activeMenu.imageUrl) : '';
  const megaMenuImageUrls = useMemo(
    () =>
      Array.from(
        new Set(
          menus.headerItems
            .map((item) => toOptimizedMegaImageUrl(item.imageUrl || ''))
            .filter(Boolean),
        ),
      ),
    [menus.headerItems],
  );

  useEffect(() => {
    const preloadLinks: HTMLLinkElement[] = [];
    const preloadedImages: HTMLImageElement[] = [];

    megaMenuImageUrls.forEach((url, index) => {
      const preload = document.createElement('link');
      preload.rel = 'preload';
      preload.as = 'image';
      preload.href = url;
      if (index === 0) {
        preload.setAttribute('fetchpriority', 'high');
      }
      document.head.appendChild(preload);
      preloadLinks.push(preload);

      const image = new Image();
      image.decoding = 'async';
      image.src = url;
      preloadedImages.push(image);
    });

    return () => {
      preloadLinks.forEach((link) => {
        if (link.parentNode) {
          link.parentNode.removeChild(link);
        }
      });
      preloadedImages.forEach((image) => {
        image.src = '';
      });
    };
  }, [megaMenuImageUrls]);

  const handleEditorLogout = async () => {
    const token = getAdminToken();

    try {
      if (token) {
        await deleteAdminSession(token);
      }
    } catch {
      // Ignore and clear local session regardless.
    } finally {
      clearAdminToken();
      setIsEditorLoggedIn(false);
      setIsOpen(false);
      navigate('/', { replace: true });
    }
  };

  return (
    <div className="site-shell">
      <header 
        className="site-header"
        onMouseLeave={() => setHoveredMenuIndex(null)}
      >
        <div className="site-header__inner">
          <NavLink to="/" className="brand-mark" onClick={() => setIsOpen(false)}>
            <img src="/logo.png" alt="마이스파트너 로고" className="brand-mark__image" />
          </NavLink>

          <nav className="site-nav" aria-label="주요 메뉴">
            {menus.headerItems.map((item, index) => (
              <div 
                key={`${item.path}-${index}`} 
                className="site-nav__item"
                onMouseEnter={() => setHoveredMenuIndex(index)}
              >
                <NavLink
                  to={item.path}
                  className={isNavActive(item.path, item.children) ? 'site-nav__link is-active' : 'site-nav__link'}
                >
                  {item.label}
                </NavLink>
              </div>
            ))}
          </nav>

          <div className="site-header__actions">
            {isEditorLoggedIn ? (
              <button type="button" className="button button--light site-header__login-button" onClick={() => void handleEditorLogout()}>
                로그아웃
              </button>
            ) : (
              <NavLink to="/login" className="button button--light site-header__login-button">
                로그인
              </NavLink>
            )}
            <NavLink to="/faq" className="button button--primary site-header__cta">
              {footer.headerCtaLabel}
            </NavLink>
            <button
              type="button"
              className="mobile-menu-button"
              onClick={() => setIsOpen((prev) => !prev)}
              aria-label="메뉴 열기"
              aria-expanded={isOpen}
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 메가 메뉴 패널 */}
        <div className={`mega-menu ${hoveredMenuIndex !== null ? 'is-visible' : ''}`}>
          <div className="mega-menu__inner">
            {activeMenu && (
              <div className="mega-menu__split">
                <div className="mega-menu__nav-side">
                  <div className="mega-menu__column">
                    <div className="mega-menu__title">{activeMenu.label}</div>
                    <div className="mega-menu__list">
                      {activeMenu.children?.map((child, childIndex) => (
                        <Link
                          key={`${child.path}-${childIndex}`}
                          to={child.path}
                          className="mega-menu__link"
                          onClick={() => setHoveredMenuIndex(null)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="mega-menu__image-side">
                  <div className="mega-menu__image-container">
                    {activeMenuImageSrc && (
                      <img
                        src={activeMenuImageSrc}
                        alt={activeMenu.label}
                        loading="eager"
                        decoding="async"
                      />
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 메가 메뉴 활성 시 배경 어둡게 & 흐리게 처리하는 오버레이 */}
      <div className={`site-header-overlay ${hoveredMenuIndex !== null ? 'is-visible' : ''}`} />

      {/* 모바일 메뉴 전용 배경 어둡게 (백드롭) */}
      <div 
        className={`mobile-nav-backdrop ${isOpen ? 'is-visible' : ''}`} 
        onClick={() => setIsOpen(false)} 
        aria-hidden="true" 
      />

      {/* 모바일 사이드 내비게이션 패널 */}
      <div className={`mobile-nav ${isOpen ? 'is-open' : ''}`} aria-label="모바일 메뉴">
        <div className="mobile-nav__header">
          <img src="/logo.png" alt="Micepartner Logo" className="mobile-nav__logo" />
          <button type="button" className="mobile-nav__close" onClick={() => setIsOpen(false)} aria-label="메뉴 닫기">
            <X size={28} />
          </button>
        </div>
        <div className="mobile-nav__inner">
          {menus.headerItems.map((item, index) => (
            <div key={`${item.path}-${index}`} className="mobile-nav__group">
              <div 
                className="mobile-nav__link-wrapper"
                onClick={(e) => {
                  if (item.children?.length) {
                    e.preventDefault();
                    setExpandedMenuIndex(expandedMenuIndex === index ? null : index);
                  } else {
                    setIsOpen(false);
                  }
                }}
              >
                <NavLink
                  to={item.children?.length ? '#' : item.path}
                  className={isNavActive(item.path, item.children) ? 'mobile-nav__link is-active' : 'mobile-nav__link'}
                  onClick={(e) => {
                    if (item.children?.length) {
                      e.preventDefault();
                    }
                  }}
                >
                  {item.label}
                </NavLink>
                {item.children?.length ? (
                  <ChevronDown
                    size={20}
                    className={`mobile-nav__chevron ${expandedMenuIndex === index ? 'is-open' : ''}`}
                  />
                ) : null}
              </div>
              {item.children?.length ? (
                <div className={`mobile-nav__sublist-wrapper ${expandedMenuIndex === index ? 'is-open' : ''}`}>
                  <div className="mobile-nav__sublist">
                    {item.children.map((child, childIndex) => (
                      <Link
                        key={`${child.path}-${childIndex}`}
                        to={child.path}
                        className="mobile-nav__sublink"
                        onClick={() => setIsOpen(false)}
                      >
                        {child.label}
                      </Link>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>
          ))}
          
          <div className="mobile-nav__footer">
            <div className="mobile-nav__auth-actions">
              <NavLink to="/faq" className="header-cta mobile-nav__cta mobile-nav__cta--primary" onClick={() => setIsOpen(false)}>
                {footer.headerCtaLabel}
              </NavLink>
              {isEditorLoggedIn ? (
                <button type="button" className="mobile-nav__auth-link" onClick={() => void handleEditorLogout()}>
                  로그아웃
                </button>
              ) : (
                <NavLink to="/login" className="mobile-nav__auth-link" onClick={() => setIsOpen(false)}>
                  로그인
                </NavLink>
              )}
            </div>
            
            <div className="mobile-nav__socials">
              {footer.metaPoints.find((m) => m.label.includes('페이스북')) && (
                <a href={footer.metaPoints.find((m) => m.label.includes('페이스북'))?.value} target="_blank" rel="noopener noreferrer">
                  <Facebook size={20} />
                </a>
              )}
              {footer.metaPoints.find((m) => m.label.includes('인스타그램')) && (
                <a href={footer.metaPoints.find((m) => m.label.includes('인스타그램'))?.value} target="_blank" rel="noopener noreferrer">
                  <Instagram size={20} />
                </a>
              )}
              {footer.metaPoints.find((m) => m.label.includes('유튜브')) && (
                <a href={footer.metaPoints.find((m) => m.label.includes('유튜브'))?.value} target="_blank" rel="noopener noreferrer">
                  <Youtube size={20} />
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="page-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer__inner">
          <div className="site-footer__top">
            <div className="footer-brand-side">
              <img src="/logo.png" alt="Micepartner Logo" className="footer-logo--dark" />
            </div>
            <nav className="footer-nav">
              {menus.headerItems.map((item, index) => (
                <div key={`${item.path}-${index}`} className="footer-nav__col">
                  <h4>{item.label}</h4>
                  <ul>
                    {item.children?.map((child, childIndex) => (
                      <li key={`${child.path}-${childIndex}`}>
                        <Link to={child.path}>{child.label}</Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </nav>
          </div>

          <div className="site-footer__middle">
            <div className="footer-socials">
              <a href="#" aria-label="Facebook"><Facebook size={20} /></a>
              <a href="#" aria-label="Instagram"><Instagram size={20} /></a>
              <a href="#" aria-label="Youtube"><Youtube size={20} /></a>
            </div>
          </div>

          <div className="site-footer__bottom">
            <div className="footer-info">
              <div className="footer-legal">
                {footer.legalLines.map((line, idx) => (
                  <span key={idx}>{line}</span>
                ))}
              </div>
              <div className="footer-copyright">
                <strong>{footer.copyright}</strong>
                <div className="footer-policy-links">
                  <a href="#">이용약관</a>
                  <a href="#">개인정보처리방침</a>
                </div>
              </div>
            </div>
            <div className="footer-family-sites">
              <select className="family-site-select">
                <option value="">관련 사이트</option>
                <option value="https://micepartner.co.kr">마이스파트너</option>
              </select>
            </div>
          </div>
        </div>
      </footer>
      <FloatingActions />
    </div>
  );
}
