import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { RichTextEditor } from '../components/RichTextEditor';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { getAboutHeaderItem, getAboutResolvedPage, getAboutSidebarItems, ABOUT_CHILD_PAGE_CONFIGS } from '../lib/aboutConfig';
import { saveSiteDataWithTransform, uploadAdminImage } from '../lib/api';

type AboutEditorFormState = {
  menuLabel: string;
  title: string;
  description: string;
};

function getInitialFormState(pathname: string, siteData: ReturnType<typeof useSiteContent>['siteData']): AboutEditorFormState | null {
  const currentPage = getAboutResolvedPage(
    pathname,
    siteData.content.menus.headerItems,
    siteData.copy.about,
    siteData.content.about,
  );

  if (!currentPage) {
    return null;
  }

  return {
    menuLabel: currentPage.key === 'intro' ? '' : currentPage.label,
    title: currentPage.title,
    description: currentPage.description,
  };
}

export function AboutEditorPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { siteData, updateSiteData } = useSiteContent();
  const adminToken = getAdminToken();
  const currentPage = getAboutResolvedPage(
    location.pathname,
    siteData.content.menus.headerItems,
    siteData.copy.about,
    siteData.content.about,
  );
  const [formState, setFormState] = useState<AboutEditorFormState | null>(() => getInitialFormState(location.pathname, siteData));
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setFormState(getInitialFormState(location.pathname, siteData));
    setError('');
  }, [location.pathname, siteData]);

  const aboutMenuTitle = useMemo(() => {
    return getAboutHeaderItem(siteData.content.menus.headerItems)?.label || '회사소개';
  }, [siteData.content.menus.headerItems]);

  if (!currentPage || !formState) {
    return <Navigate to="/about" replace />;
  }

  const handleFieldChange =
    (field: keyof AboutEditorFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) =>
        current
          ? {
              ...current,
              [field]: event.target.value,
            }
          : current,
      );
    };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminToken || !formState) {
      setError('편집 권한 확인을 위해 다시 로그인해.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      const saved = await saveSiteDataWithTransform(adminToken, (current) => {
        const nextSiteData = {
          ...current,
          copy: {
            ...current.copy,
            about: { ...current.copy.about },
          },
          content: {
            ...current.content,
            about: { ...current.content.about },
            menus: {
              ...current.content.menus,
              headerItems: [...current.content.menus.headerItems],
            },
          },
        };

        if (currentPage.key === 'intro') {
          nextSiteData.copy.about.introTitle = formState.title.trim();
          nextSiteData.copy.about.introDescription = formState.description;
          return nextSiteData;
        }

        const config = ABOUT_CHILD_PAGE_CONFIGS.find((item) => item.key === currentPage.key);

        if (!config) {
          throw new Error('회사소개 페이지 구성을 찾을 수 없어.');
        }

        nextSiteData.copy.about[config.titleField] = formState.title.trim();
        nextSiteData.copy.about[config.descriptionField] = formState.description;

        nextSiteData.content.menus.headerItems = nextSiteData.content.menus.headerItems.map((item) =>
          item.path === '/about'
            ? {
                ...item,
                children: getAboutSidebarItems(nextSiteData.content.menus.headerItems)
                  .filter((sidebarItem) => sidebarItem.key !== 'intro')
                  .map((sidebarItem, index) => ({
                    label:
                      index === ABOUT_CHILD_PAGE_CONFIGS.findIndex((section) => section.key === currentPage.key)
                        ? formState.menuLabel.trim() || config.defaultLabel
                        : String(item.children[index]?.label || ABOUT_CHILD_PAGE_CONFIGS[index]?.defaultLabel || '').trim(),
                    path: ABOUT_CHILD_PAGE_CONFIGS[index]?.path || sidebarItem.path,
                  })),
              }
            : item,
        );

        return nextSiteData;
      });
      updateSiteData(saved);
      navigate(currentPage.path, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '회사소개 저장에 실패했어.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineBodyImageUpload = async (file: File) => {
    if (!adminToken) {
      throw new Error('편집 권한 확인을 위해 다시 로그인해.');
    }

    return uploadAdminImage(file, 'about-inline', adminToken);
  };

  return (
    <>
      <PageMeta
        title={`${currentPage.label} 수정`}
        description={`${currentPage.label} 페이지를 수정하는 편집 화면이야.`}
        noIndex
      />
      <main className="content-editor-page">
        <section className="content-editor-page__inner">
          <div className="content-editor-page__intro">
            <Link to={currentPage.path} className="notice-detail-page__back">
              <ChevronLeft size={16} />
              {currentPage.label}로 돌아가기
            </Link>
            <p className="content-editor-page__eyebrow">ABOUT EDITOR</p>
            <h1>{currentPage.label} 수정</h1>
            <p className="content-editor-page__lead">
              {aboutMenuTitle} 안에서 이 페이지에 필요한 제목, 본문{currentPage.key !== 'intro' ? ', 카테고리명' : ''}만 수정하면 돼.
            </p>
          </div>

          <article className="content-editor-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <form className="content-editor-form" onSubmit={handleSave}>
              {currentPage.key !== 'intro' ? (
                <label className="form-field">
                  <span>카테고리명</span>
                  <input value={formState.menuLabel} onChange={handleFieldChange('menuLabel')} />
                </label>
              ) : null}

              <label className="form-field">
                <span>제목</span>
                <textarea rows={3} value={formState.title} onChange={handleFieldChange('title')} />
              </label>

              <RichTextEditor
                label="본문"
                value={formState.description}
                onChange={(next) =>
                  setFormState((current) =>
                    current
                      ? {
                          ...current,
                          description: next,
                        }
                      : current,
                  )
                }
                onUploadImage={handleInlineBodyImageUpload}
                minHeight={640}
              />

              {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

              <div className="content-editor-form__actions">
                <button type="submit" className="button button--primary" disabled={isSaving}>
                  {isSaving ? '저장 중...' : `${currentPage.label} 저장`}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
