import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { SiteContentSplash } from './components/SiteContentSplash';
import { SiteLayout } from './components/SiteLayout';
import { useSiteContent } from './context/SiteContentContext';
import { clearAdminToken, getAdminToken } from './lib/adminSession';
import { fetchCurrentAdmin, isAdminApprovalPendingError } from './lib/api';
import { AdminPage } from './pages/AdminPage';
import { AdminLoginPage } from './pages/AdminLoginPage';
import { AboutPage } from './pages/AboutPage';
import { AboutEditorPage } from './pages/AboutEditorPage';
import { CaseEditorPage } from './pages/CaseEditorPage';
import { CaseStudiesPage } from './pages/CaseStudiesPage';
import { HomePage } from './pages/HomePage';
import { MemberEditorPage } from './pages/MemberEditorPage';
import { MemberDetailPage } from './pages/MemberDetailPage';
import { MembersPage } from './pages/MembersPage';
import { NoticeDetailPage } from './pages/NoticeDetailPage';
import { NoticeEditorPage } from './pages/NoticeEditorPage';
import { MenuPendingPage } from './pages/MenuPendingPage';
import { PortfolioDetailPage } from './pages/PortfolioDetailPage';
import { FAQPage } from './pages/FAQPage';
import { ResourceDetailPage } from './pages/ResourceDetailPage';
import { ResourceFileEditorPage } from './pages/ResourceFileEditorPage';
import { ResourceFilesPage } from './pages/ResourceFilesPage';
import { ResourcesPage } from './pages/ResourcesPage';
import { LoginPage } from './pages/LoginPage';

function buildEditorRedirect(location: ReturnType<typeof useLocation>, approval?: 'pending') {
  const redirect = encodeURIComponent(`${location.pathname}${location.search}${location.hash}`);
  const params = new URLSearchParams({ redirect });

  if (approval) {
    params.set('approval', approval);
  }

  return `/login?${params.toString()}`;
}

function ApprovedRouteGate({
  children,
  loginPath,
}: {
  children: JSX.Element;
  loginPath: '/admin/login' | '/login';
}) {
  const location = useLocation();
  const { ready } = useSiteContent();
  const [status, setStatus] = useState<'checking' | 'allowed'>('checking');
  const adminToken = getAdminToken();

  useEffect(() => {
    if (!adminToken) {
      return;
    }

    let active = true;
    setStatus('checking');

    const verifyApproval = async () => {
      try {
        await fetchCurrentAdmin(adminToken);
        if (active) {
          setStatus('allowed');
        }
      } catch (error) {
        if (!active) {
          return;
        }

        clearAdminToken();
        const approvalQuery = isAdminApprovalPendingError(error) ? '?approval=pending' : '';
        const redirectPath =
          loginPath === '/login' ? buildEditorRedirect(location, isAdminApprovalPendingError(error) ? 'pending' : undefined) : `${loginPath}${approvalQuery}`;

        window.location.replace(redirectPath);
      }
    };

    void verifyApproval();

    return () => {
      active = false;
    };
  }, [adminToken, location, loginPath]);

  if (!adminToken) {
    return <Navigate to={loginPath === '/login' ? buildEditorRedirect(location) : '/admin/login'} replace />;
  }

  if (!ready || status === 'checking') {
    return <SiteContentSplash variant={loginPath === '/admin/login' ? 'admin' : 'site'} />;
  }

  return children;
}

function ProtectedAdminRoute() {
  return (
    <ApprovedRouteGate loginPath="/admin/login">
      <AdminPage />
    </ApprovedRouteGate>
  );
}

function ProtectedEditorRoute({ children }: { children: JSX.Element }) {
  return <ApprovedRouteGate loginPath="/login">{children}</ApprovedRouteGate>;
}

function normalizeMenuPath(path: string) {
  const [pathname] = String(path || '').split('#');
  return pathname.split('?')[0] || '/';
}

function ConfiguredMenuFallback() {
  const location = useLocation();
  const { siteContent } = useSiteContent();
  const currentFullPath = `${location.pathname}${location.search}${location.hash}`;
  const headerItems = siteContent.menus.headerItems;
  const footerQuickLinks = siteContent.menus.footerQuickLinks;

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
      />
    );
  }

  const matchedChild = headerItems
    .flatMap((item) => item.children.map((child) => ({ ...child, parentLabel: item.label })))
    .find((item) => normalizeMenuPath(item.path) === location.pathname);

  if (matchedChild) {
    return <MenuPendingPage label={matchedChild.label} parentLabel={matchedChild.parentLabel} />;
  }

  if (matchedParent) {
    return <MenuPendingPage label={matchedParent.label} />;
  }

  const matchedFooterLink = footerQuickLinks.find((item) => normalizeMenuPath(item.path) === location.pathname);

  if (matchedFooterLink) {
    return <MenuPendingPage label={matchedFooterLink.label} />;
  }

  return <Navigate to="/" replace />;
}

function ScrollToTopOnRouteChange() {
  const { pathname, search } = useLocation();
  const { ready } = useSiteContent();
  const isInitialRender = useRef(true);
  const lastPathname = useRef(pathname);

  useLayoutEffect(() => {
    // 1. 데이터가 아직 로딩 중이면 아무것도 하지 않습니다.
    if (!ready) return;

    // 2. 데이터 로딩이 완료된 직후(새로고침 후 첫 로딩 완료)에도 스크롤을 건드리지 않습니다.
    if (isInitialRender.current) {
      isInitialRender.current = false;
      lastPathname.current = pathname;
      return;
    }

    // 3. 경로가 실제로 바뀌었을 때만 스크롤을 상단으로 올립니다.
    if (lastPathname.current !== pathname) {
      window.scrollTo({
        top: 0,
        left: 0,
        behavior: 'auto',
      });
      lastPathname.current = pathname;
    }
  }, [pathname, search, ready]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTopOnRouteChange />
      <Routes>
        <Route path="/admin/login" element={<AdminLoginPage />} />
        <Route path="/admin" element={<ProtectedAdminRoute />} />
        <Route element={<SiteLayout />}>
          <Route index element={<HomePage />} />
          <Route path="/services" element={<Navigate to="/cases" replace />} />
          <Route path="/cases" element={<CaseStudiesPage />} />
          <Route path="/cases/new" element={<ProtectedEditorRoute><CaseEditorPage /></ProtectedEditorRoute>} />
          <Route path="/cases/:slug/edit" element={<ProtectedEditorRoute><CaseEditorPage /></ProtectedEditorRoute>} />
          <Route path="/cases/:slug" element={<PortfolioDetailPage />} />
          <Route path="/resources" element={<Navigate to="/resources/notices" replace />} />
          <Route path="/resources/notices" element={<ResourcesPage />} />
          <Route path="/resources/notices/new" element={<ProtectedEditorRoute><NoticeEditorPage /></ProtectedEditorRoute>} />
          <Route path="/resources/notices/:slug/edit" element={<ProtectedEditorRoute><NoticeEditorPage /></ProtectedEditorRoute>} />
          <Route path="/resources/files" element={<ResourceFilesPage />} />
          <Route path="/resources/files/new" element={<ProtectedEditorRoute><ResourceFileEditorPage /></ProtectedEditorRoute>} />
          <Route path="/resources/files/:slug/edit" element={<ProtectedEditorRoute><ResourceFileEditorPage /></ProtectedEditorRoute>} />
          <Route path="/resources/notices/:slug" element={<NoticeDetailPage />} />
          <Route path="/resources/files/:slug" element={<ResourceDetailPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/about/edit" element={<ProtectedEditorRoute><AboutEditorPage /></ProtectedEditorRoute>} />
          <Route path="/about/overview" element={<AboutPage />} />
          <Route path="/about/overview/edit" element={<ProtectedEditorRoute><AboutEditorPage /></ProtectedEditorRoute>} />
          <Route path="/about/business" element={<AboutPage />} />
          <Route path="/about/business/edit" element={<ProtectedEditorRoute><AboutEditorPage /></ProtectedEditorRoute>} />
          <Route path="/about/process" element={<AboutPage />} />
          <Route path="/about/process/edit" element={<ProtectedEditorRoute><AboutEditorPage /></ProtectedEditorRoute>} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/members/new" element={<ProtectedEditorRoute><MemberEditorPage /></ProtectedEditorRoute>} />
          <Route path="/members/:slug/edit" element={<ProtectedEditorRoute><MemberEditorPage /></ProtectedEditorRoute>} />
          <Route path="/members/:slug" element={<MemberDetailPage />} />
          <Route path="/faq" element={<FAQPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="*" element={<ConfiguredMenuFallback />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
