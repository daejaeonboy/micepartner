import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';
import { defaultSiteData } from '../content/defaultSiteData';
import { fetchSiteData, normalizeSiteData } from '../lib/api';
import type { SitePageContent } from '../types/siteContent';
import type { SiteData } from '../types/siteData';
import type { SiteCopy } from '../types/siteCopy';

type SiteContentContextValue = {
  siteCopy: SiteCopy;
  siteContent: SitePageContent;
  siteData: SiteData;
  loading: boolean;
  ready: boolean;
  refreshSiteData: () => Promise<void>;
  updateSiteData: (next: SiteData) => void;
};

const SiteContentContext = createContext<SiteContentContextValue | null>(null);
const SITE_DATA_CACHE_KEY = 'micepartner.site-data.v1';

function readCachedSiteData() {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = window.localStorage.getItem(SITE_DATA_CACHE_KEY);

    if (!raw) {
      return null;
    }

    return normalizeSiteData(JSON.parse(raw) as Record<string, unknown>);
  } catch {
    return null;
  }
}

function writeCachedSiteData(next: SiteData) {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(SITE_DATA_CACHE_KEY, JSON.stringify(next));
  } catch {
    // Ignore cache write failures and keep runtime state only.
  }
}

export function SiteContentProvider({ children }: { children: ReactNode }) {
  const [siteData, setSiteData] = useState<SiteData | null>(() => readCachedSiteData());
  const [loading, setLoading] = useState(() => siteData === null);

  const applySiteData = (next: SiteData) => {
    setSiteData(next);
    writeCachedSiteData(next);
  };

  const refreshSiteData = async () => {
    if (!siteData) {
      setLoading(true);
    }

    try {
      const next = await fetchSiteData();
      applySiteData(next);
    } catch {
      if (!siteData) {
        applySiteData(defaultSiteData);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refreshSiteData();
  }, []);

  const resolvedSiteData = siteData ?? defaultSiteData;

  return (
    <SiteContentContext.Provider
      value={{
        siteCopy: resolvedSiteData.copy,
        siteContent: resolvedSiteData.content,
        siteData: resolvedSiteData,
        loading,
        ready: siteData !== null,
        refreshSiteData,
        updateSiteData: applySiteData,
      }}
    >
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent() {
  const context = useContext(SiteContentContext);

  if (!context) {
    throw new Error('useSiteContent must be used within SiteContentProvider.');
  }

  return context;
}
