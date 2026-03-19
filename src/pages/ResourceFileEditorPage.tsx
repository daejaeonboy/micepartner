import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteData, uploadAdminImage } from '../lib/api';
import { createContentSlug, getTodayDateInputValue } from '../lib/contentUtils';
import type { ResourceItem } from '../types/siteContent';

type ResourceFileEditorFormState = {
  title: string;
  type: string;
  description: string;
  body: string;
  downloadLabel: string;
  downloadUrl: string;
  fileName: string;
  version: string;
  updatedAt: string;
  coverImageUrl: string;
};

function toDateInputValue(value: string) {
  const normalized = String(value || '').trim().replace(/\.$/, '');
  const matched = normalized.match(/^(\d{4})[.\-/]\s*(\d{1,2})(?:[.\-/]\s*(\d{1,2}))?$/);

  if (!matched) {
    return '';
  }

  const [, year, month, day] = matched;
  if (!day) {
    return '';
  }

  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function getInitialFormState(item?: ResourceItem): ResourceFileEditorFormState {
  return {
    title: item?.title || '',
    type: item?.type || '',
    description: item?.description || '',
    body: item?.body || '',
    downloadLabel: item?.downloadLabel || '',
    downloadUrl: item?.downloadUrl || '',
    fileName: item?.fileName || '',
    version: item?.version || '',
    updatedAt: toDateInputValue(item?.updatedAt || '') || getTodayDateInputValue(),
    coverImageUrl: item?.coverImageUrl || '',
  };
}

export function ResourceFileEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData } = useSiteContent();
  const adminToken = getAdminToken();
  const currentResource = useMemo(
    () => siteData.content.resources.items.find((item) => item.slug === slug),
    [siteData.content.resources.items, slug],
  );
  const isEditMode = Boolean(slug);
  const [formState, setFormState] = useState<ResourceFileEditorFormState>(() => getInitialFormState(currentResource));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  if (isEditMode && !currentResource) {
    return <Navigate to="/resources/files" replace />;
  }

  useEffect(() => {
    setFormState(getInitialFormState(currentResource));
    setUploadFile(null);
    setError('');
  }, [currentResource]);

  const handleFieldChange =
    (field: keyof ResourceFileEditorFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const buildUniqueSlug = (title: string) => {
    const base = createContentSlug(title) || `resource-${Date.now()}`;
    const existingSlugs = new Set(
      siteData.content.resources.items
        .filter((item) => item.slug !== currentResource?.slug)
        .map((item) => item.slug),
    );

    if (!existingSlugs.has(base)) {
      return base;
    }

    let counter = 2;
    while (existingSlugs.has(`${base}-${counter}`)) {
      counter += 1;
    }

    return `${base}-${counter}`;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminToken) {
      setError('편집 권한 확인을 위해 다시 로그인해 주세요.');
      return;
    }

    const title = formState.title.trim();
    const type = formState.type.trim();
    const description = formState.description.trim();

    if (!title || !type || !description || !formState.updatedAt) {
      setError('제목, 자료 유형, 설명, 게시일은 필수입니다.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      let coverImageUrl = formState.coverImageUrl.trim();

      if (uploadFile) {
        coverImageUrl = await uploadAdminImage(uploadFile, 'resources-files', adminToken);
      }

      const nextResource: ResourceItem = {
        slug: currentResource?.slug || buildUniqueSlug(title),
        title,
        type,
        description,
        body: formState.body.trim(),
        downloadLabel: formState.downloadLabel.trim() || '자료 확인',
        downloadUrl: formState.downloadUrl.trim(),
        fileName: formState.fileName.trim(),
        version: formState.version.trim(),
        updatedAt: formState.updatedAt,
        coverImageUrl,
      };

      const nextItems = currentResource
        ? siteData.content.resources.items.map((item) => (item.slug === currentResource.slug ? nextResource : item))
        : [nextResource, ...siteData.content.resources.items];

      const saved = await saveSiteData(
        {
          ...siteData,
          content: {
            ...siteData.content,
            resources: {
              ...siteData.content.resources,
              items: nextItems,
            },
          },
        },
        adminToken,
      );

      updateSiteData(saved);
      navigate(`/resources/files/${nextResource.slug}`, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '자료 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken || !currentResource) {
      return;
    }

    const confirmed = window.confirm('이 자료를 삭제할까요? 삭제 후에는 목록에서 바로 사라집니다.');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    setError('');

    try {
      const saved = await saveSiteData(
        {
          ...siteData,
          content: {
            ...siteData.content,
            resources: {
              ...siteData.content.resources,
              items: siteData.content.resources.items.filter((item) => item.slug !== currentResource.slug),
            },
          },
        },
        adminToken,
      );

      updateSiteData(saved);
      navigate('/resources/files', { replace: true });
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : '자료 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={isEditMode ? `${currentResource?.title || '자료'} 수정` : '자료 등록'}
        description="정보센터 자료를 프론트에서 직접 등록하거나 수정하는 편집 화면입니다."
      />
      <main className="content-editor-page">
        <section className="content-editor-page__inner">
          <div className="content-editor-page__intro">
            <Link
              to={isEditMode && currentResource ? `/resources/files/${currentResource.slug}` : '/resources/files'}
              className="notice-detail-page__back"
            >
              <ChevronLeft size={16} />
              {isEditMode ? '자료 상세로 돌아가기' : '자료 목록으로'}
            </Link>
            <p className="content-editor-page__eyebrow">RESOURCE EDITOR</p>
            <h1>{isEditMode ? '자료 수정' : '자료 등록'}</h1>
            <p className="content-editor-page__lead">
              자료 제목, 설명, 본문, 대표 이미지와 다운로드 메타 정보를 프론트에서 직접 관리합니다. 저장하면 자료 목록과 상세 페이지에 즉시 반영됩니다.
            </p>
          </div>

          <article className="content-editor-card">
            <form className="content-editor-form" onSubmit={handleSave}>
              <div className="content-editor-form__grid">
                <label className="form-field">
                  <span>제목</span>
                  <input value={formState.title} onChange={handleFieldChange('title')} placeholder="자료 제목" />
                </label>

                <label className="form-field">
                  <span>자료 유형</span>
                  <input value={formState.type} onChange={handleFieldChange('type')} placeholder="예: PDF / 보도자료 / 소개서" />
                </label>

                <label className="form-field">
                  <span>게시일</span>
                  <input type="date" value={formState.updatedAt} onChange={handleFieldChange('updatedAt')} />
                </label>

                <label className="form-field">
                  <span>대표 이미지 URL</span>
                  <input value={formState.coverImageUrl} onChange={handleFieldChange('coverImageUrl')} placeholder="https://..." />
                </label>
              </div>

              <label className="form-field">
                <span>새 대표 이미지 업로드</span>
                <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
              </label>

              {formState.coverImageUrl ? (
                <div className="content-editor-form__image-preview">
                  <img src={formState.coverImageUrl} alt="자료 대표 이미지 미리보기" />
                </div>
              ) : null}

              <label className="form-field">
                <span>설명</span>
                <textarea value={formState.description} onChange={handleFieldChange('description')} rows={3} placeholder="목록에서 노출할 설명 문구" />
              </label>

              <label className="form-field">
                <span>본문</span>
                <textarea
                  value={formState.body}
                  onChange={handleFieldChange('body')}
                  rows={8}
                  placeholder={'자료 본문을 입력해 주세요.\n\n줄바꿈 두 번으로 문단을 나눌 수 있습니다.'}
                />
              </label>

              <div className="content-editor-form__grid">
                <label className="form-field">
                  <span>다운로드 버튼 문구</span>
                  <input value={formState.downloadLabel} onChange={handleFieldChange('downloadLabel')} placeholder="예: PDF 다운로드" />
                </label>

                <label className="form-field">
                  <span>다운로드 링크</span>
                  <input value={formState.downloadUrl} onChange={handleFieldChange('downloadUrl')} placeholder="https://..." />
                </label>

                <label className="form-field">
                  <span>파일명</span>
                  <input value={formState.fileName} onChange={handleFieldChange('fileName')} placeholder="예: service-guide.pdf" />
                </label>

                <label className="form-field">
                  <span>버전</span>
                  <input value={formState.version} onChange={handleFieldChange('version')} placeholder="예: v1.2" />
                </label>
              </div>

              {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

              <div className="content-editor-form__actions">
                {isEditMode ? (
                  <button
                    type="button"
                    className="button button--light content-editor-form__delete"
                    onClick={() => void handleDelete()}
                    disabled={isDeleting || isSaving}
                  >
                    {isDeleting ? '삭제 중...' : '자료 삭제'}
                  </button>
                ) : <span />}
                <button type="submit" className="button button--primary" disabled={isSaving || isDeleting}>
                  {isSaving ? '저장 중...' : isEditMode ? '자료 저장' : '자료 등록'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
