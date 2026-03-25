import { Link, Navigate, useLocation } from 'react-router-dom';
import { Home, ChevronRight, ChevronDown } from 'lucide-react';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { getAboutResolvedPage, getAboutSidebarItems, normalizeMenuPath } from '../lib/aboutConfig';
import { normalizeRichTextHtml, stripHtmlTags } from '../lib/richText';
import { createBreadcrumbJsonLd, truncateText } from '../lib/seo';

export function AboutPage() {
  const location = useLocation();
  const { siteCopy, siteContent } = useSiteContent();
  const isEditorLoggedIn = Boolean(getAdminToken());
  const copy = siteCopy.about;
  const content = siteContent.about;
  const headerItems = siteContent.menus.headerItems;
  const aboutMenu = headerItems.find((item) => normalizeMenuPath(item.path) === '/about');
  const sidebarItems = getAboutSidebarItems(headerItems);
  const currentPage = getAboutResolvedPage(location.pathname, headerItems, copy, content);

  if (!currentPage) {
    return <Navigate to="/about" replace />;
  }

  const isNavItemActive = (path: string, index: number) => {
    const normalizedPath = normalizeMenuPath(path);
    return location.pathname === normalizedPath && (normalizedPath !== '/about' || index === 0);
  };
  const pageTitle = String(currentPage.title || '').trim();
  const headingText = pageTitle || (currentPage.key === 'intro' ? '' : currentPage.label);
  const seoTitle = currentPage.key === 'intro' ? '회사소개' : `${currentPage.label} · 회사소개`;
  const seoDescription = truncateText(stripHtmlTags(currentPage.description));
  const breadcrumbItems =
    currentPage.key === 'intro'
      ? [
          { name: '홈', path: '/' },
          { name: '회사소개', path: '/about' },
        ]
      : [
          { name: '홈', path: '/' },
          { name: '회사소개', path: '/about' },
          { name: currentPage.label, path: currentPage.path },
        ];

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        canonicalPath={currentPage.path}
        image={currentPage.imageUrl}
        imageAlt={`${currentPage.label} 대표 이미지`}
        jsonLd={createBreadcrumbJsonLd(breadcrumbItems)}
      />

      <section className="visual-page-header">
        {currentPage.imageUrl ? (
          <img src={currentPage.imageUrl} alt={`${currentPage.label} 배경`} />
        ) : (
          <div style={{ background: '#222', width: '100%', height: '100%' }} />
        )}
        <div className="visual-page-header__overlay">
          <h1>{aboutMenu?.label || '회사 소개'}</h1>
        </div>
      </section>

      <div className="about-breadcrumb-bar">
        <div className="about-breadcrumb-bar__inner">
          <Link to="/" className="breadcrumb-home-link">
            <Home size={18} />
          </Link>
          
          <div className="breadcrumb-select">
            <span className="breadcrumb-select__label">{aboutMenu?.label || '회사 소개'}</span>
            <ChevronDown size={14} className="breadcrumb-select__icon" />
            <div className="breadcrumb-dropdown">
              {headerItems.map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className={`breadcrumb-dropdown__item ${normalizeMenuPath(item.path) === '/about' ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>

          <div className="breadcrumb-select">
            <span className="breadcrumb-select__label">{currentPage.label}</span>
            <ChevronDown size={14} className="breadcrumb-select__icon" />
            <div className="breadcrumb-dropdown">
              {sidebarItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`breadcrumb-dropdown__item ${isNavItemActive(item.path, index) ? 'is-active' : ''}`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="about-layout-container">
        <main className="about-layout-content">
          <section className="about-text-section">
            {currentPage.label ? <p className="section-eyebrow">{currentPage.label}</p> : null}
            {headingText ? <h2>{headingText}</h2> : null}
            <div
              className="about-rich-content"
              dangerouslySetInnerHTML={{ __html: normalizeRichTextHtml(currentPage.description) }}
            />
            {isEditorLoggedIn ? (
              <div className="about-page-actions">
                <Link to={currentPage.editPath} className="button button--light notice-detail-page__edit-button">
                  {currentPage.label} 수정하기
                </Link>
              </div>
            ) : null}
          </section>
        </main>
      </div>
    </>
  );
}
