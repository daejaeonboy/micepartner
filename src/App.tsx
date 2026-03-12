import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { resolveTemplateIdForPath, templateCatalogMap } from './content/publicPageLayouts';
import { SiteContentSplash } from './components/SiteContentSplash';
import { SiteLayout } from './components/SiteLayout';
import { useSiteContent } from './context/SiteContentContext';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AboutPage } from './pages/AboutPage';
import { CaseStudiesPage } from './pages/CaseStudiesPage';
import { ContactPage } from './pages/ContactPage';
import { HomePage } from './pages/HomePage';
import { MembersPage } from './pages/MembersPage';
import { NoticeDetailPage } from './pages/NoticeDetailPage';
import { MenuPendingPage } from './pages/MenuPendingPage';
import { PortfolioDetailPage } from './pages/PortfolioDetailPage';
import { CustomPageRenderer } from './pages/CustomPageRenderer';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { ResourceFilesPage } from './pages/ResourceFilesPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { ServicesPage } from './pages/ServicesPage';
import { getAdminToken } from './lib/adminSession';
import { findCustomPageByPath } from './lib/customPages';
import type { ReactNode } from 'react';

function ProtectedAdminRoute() {
  const { ready } = useSiteContent();

  if (!getAdminToken()) {
    return <Navigate to="/admin/login" replace />;
  }

  if (!ready) {
    return <SiteContentSplash variant="admin" />;
  }

  return <AdminPage />;
}

function normalizeMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function ResolvedPublicPageRoute({ pathKey, fallback }: { pathKey: string; fallback: ReactNode }) {
  const { siteContent } = useSiteContent();
  const matchedCustomPage = findCustomPageByPath(siteContent.customPages, pathKey);

  if (matchedCustomPage) {
    return <CustomPageRenderer page={matchedCustomPage} />;
  }

  return <>{fallback}</>;
}

function ConfiguredMenuFallback() {
  const location = useLocation();
  const { siteContent, siteData } = useSiteContent();
  const currentFullPath = `${location.pathname}${location.search}${location.hash}`;
  const headerItems = siteContent.menus.headerItems;
  const footerQuickLinks = siteContent.menus.footerQuickLinks;
  const resolvedTemplateTitle = (() => {
    const templateId = resolveTemplateIdForPath(location.pathname, siteData.templates);
    return templateId ? templateCatalogMap[templateId]?.title : undefined;
  })();
  const matchedCustomPage = findCustomPageByPath(siteContent.customPages, location.pathname);

  if (matchedCustomPage) {
    return <CustomPageRenderer page={matchedCustomPage} />;
  }

  const matchedParent = headerItems.find((item) => normalizeMenuPath(item.path) === location.pathname);

  if (matchedParent?.children?.length) {
    const firstChild = matchedParent.children[0];

    if (firstChild && currentFullPath !== firstChild.path) {
      return <Navigate to={firstChild.path} replace />;
    }

    return (
      <MenuPendingPage
        label={firstChild?.label || matchedParent.label}
        parentLabel={matchedParent.label}
        templateTitle={resolvedTemplateTitle}
      />
    );
  }

  const matchedChild = headerItems
    .flatMap((item) => item.children.map((child) => ({ ...child, parentLabel: item.label })))
    .find((item) => normalizeMenuPath(item.path) === location.pathname);

  if (matchedChild) {
    return <MenuPendingPage label={matchedChild.label} parentLabel={matchedChild.parentLabel} templateTitle={resolvedTemplateTitle} />;
  }

  if (matchedParent) {
    return <MenuPendingPage label={matchedParent.label} templateTitle={resolvedTemplateTitle} />;
  }

  const matchedFooterLink = footerQuickLinks.find((item) => normalizeMenuPath(item.path) === location.pathname);

  if (matchedFooterLink) {
    return <MenuPendingPage label={matchedFooterLink.label} templateTitle={resolvedTemplateTitle} />;
  }

  return <Navigate to="/" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
        <Route element={<SiteLayout />}>
          <Route index element={<ResolvedPublicPageRoute pathKey="/" fallback={<HomePage />} />} />
          <Route path="/services" element={<ResolvedPublicPageRoute pathKey="/services" fallback={<ServicesPage />} />} />
          <Route path="/cases" element={<ResolvedPublicPageRoute pathKey="/cases" fallback={<CaseStudiesPage />} />} />
          <Route path="/cases/:slug" element={<ResolvedPublicPageRoute pathKey="/cases/:slug" fallback={<PortfolioDetailPage />} />} />
          <Route path="/resources" element={<Navigate to="/resources/notices" replace />} />
          <Route path="/resources/notices" element={<ResolvedPublicPageRoute pathKey="/resources/notices" fallback={<ResourcesPage />} />} />
          <Route path="/resources/files" element={<ResolvedPublicPageRoute pathKey="/resources/files" fallback={<ResourceFilesPage />} />} />
          <Route path="/resources/notices/:slug" element={<ResolvedPublicPageRoute pathKey="/resources/notices/:slug" fallback={<NoticeDetailPage />} />} />
          <Route path="/resources/files/:slug" element={<ResolvedPublicPageRoute pathKey="/resources/files/:slug" fallback={<ResourceDetailPage />} />} />
          <Route path="/about" element={<ResolvedPublicPageRoute pathKey="/about" fallback={<AboutPage />} />} />
          <Route path="/members" element={<ResolvedPublicPageRoute pathKey="/members" fallback={<MembersPage />} />} />
          <Route path="/contact" element={<ResolvedPublicPageRoute pathKey="/contact" fallback={<ContactPage />} />} />
          <Route path="*" element={<ConfiguredMenuFallback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
