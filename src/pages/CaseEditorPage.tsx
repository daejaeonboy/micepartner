import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteData, uploadAdminImage } from '../lib/api';
import { createContentSlug, getTodayDateInputValue } from '../lib/contentUtils';
import type { PortfolioEntry } from '../types/siteContent';

type CaseEditorFormState = {
  title: string;
  category: string;
  updatedAt: string;
  period: string;
  summary: string;
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

function getInitialFormState(entry?: PortfolioEntry): CaseEditorFormState {
  // 기존에 쪼개져 있던 본문 내용들을 하나로 합쳐서 보여줍니다.
  const combinedBody = [
    entry?.summary,
    entry?.challenge,
    entry?.approach,
    entry?.result
  ].filter(Boolean).join('\n\n');

  return {
    title: entry?.title || '',
    category: entry?.category || '포트폴리오',
    updatedAt: toDateInputValue(entry?.updatedAt || '') || getTodayDateInputValue(),
    period: entry?.period || '',
    summary: combinedBody || '',
    coverImageUrl: entry?.coverImageUrl || '',
  };
}

export function CaseEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData, siteContent } = useSiteContent();
  const adminToken = getAdminToken();
  const currentEntry = useMemo(
    () => siteData.content.cases.entries.find((item) => item.slug === slug),
    [siteData.content.cases.entries, slug],
  );
  const isEditMode = Boolean(slug);
  const [formState, setFormState] = useState<CaseEditorFormState>(() => getInitialFormState(currentEntry));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  if (isEditMode && !currentEntry) {
    return <Navigate to="/cases" replace />;
  }

  useEffect(() => {
    setFormState(getInitialFormState(currentEntry));
    setUploadFile(null);
    setFeedback('');
    setError('');
    setIsAddingNewCategory(false);
  }, [currentEntry]);

  const handleFieldChange =
    (field: keyof CaseEditorFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const buildUniqueSlug = (title: string) => {
    const base = createContentSlug(title) || `case-${Date.now()}`;
    const existingSlugs = new Set(
      siteData.content.cases.entries
        .filter((item) => item.slug !== currentEntry?.slug)
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
    if (!title) {
      setError('제목은 필수입니다.');
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      let coverImageUrl = formState.coverImageUrl.trim();

      if (uploadFile) {
        coverImageUrl = await uploadAdminImage(uploadFile, 'cases', adminToken);
      }

      // 간소화된 데이터를 PortfolioEntry 구조에 맞춰 저장합니다.
      const nextEntry: PortfolioEntry = {
        slug: currentEntry?.slug || buildUniqueSlug(title),
        title,
        category: formState.category || '운영사례',
        updatedAt: formState.updatedAt || '',
        period: formState.period.trim() || formState.updatedAt || '',
        summary: formState.summary.trim(),
        coverImageUrl,
        // 아래 필드들은 간소화를 위해 빈 값 또는 기본값을 유지합니다.
        client: '',
        cardDescription: formState.summary.slice(0, 100).trim(), // 본문 앞부분을 요약으로 사용
        outcome: '',
        tags: [],
        scope: [],
        challenge: '',
        approach: '',
        result: '',
        gallery: currentEntry?.gallery || [],
        seoTitle: title,
        seoDescription: formState.summary.slice(0, 160).trim(),
      };

      const nextEntries = currentEntry
        ? siteData.content.cases.entries.map((item) => (item.slug === currentEntry.slug ? nextEntry : item))
        : [nextEntry, ...siteData.content.cases.entries];

      const saved = await saveSiteData(
        {
          ...siteData,
          content: {
            ...siteData.content,
            cases: {
              ...siteData.content.cases,
              entries: nextEntries,
            },
          },
        },
        adminToken,
      );

      updateSiteData(saved);
      navigate(`/cases/${nextEntry.slug}`, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '운영사례 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken || !currentEntry) {
      return;
    }

    const confirmed = window.confirm('이 운영사례를 삭제할까요?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const saved = await saveSiteData(
        {
          ...siteData,
          content: {
            ...siteData.content,
            cases: {
              ...siteData.content.cases,
              entries: siteData.content.cases.entries.filter((item) => item.slug !== currentEntry.slug),
            },
          },
        },
        adminToken,
      );

      updateSiteData(saved);
      navigate('/cases', { replace: true });
    } catch (deleteError) {
      setError('운영사례 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleInsertImage = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    try {
      setIsSaving(true);
      const imageUrl = await uploadAdminImage(file, 'cases-inline', adminToken);
      const imageTag = `\n\n![이미지](${imageUrl})\n\n`;
      
      setFormState((current) => ({
        ...current,
        summary: current.summary + imageTag,
      }));
      setFeedback('본문에 이미지가 삽입되었습니다.');
    } catch (e) {
      setError('이미지 업로드에 실패했습니다.');
    } finally {
      setIsSaving(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <>
      <PageMeta
        title={isEditMode ? `${currentEntry?.title || '운영사례'} 수정` : '운영사례 등록'}
        description="운영사례 편집 화면입니다."
      />
      <main className="content-editor-page">
        <section className="content-editor-page__inner">
          <div className="content-editor-page__intro">
            <Link to={isEditMode && currentEntry ? `/cases/${currentEntry.slug}` : '/cases'} className="notice-detail-page__back">
              <ChevronLeft size={16} />
              {isEditMode ? '돌아가기' : '목록으로'}
            </Link>
            <p className="content-editor-page__eyebrow">CASE EDITOR</p>
            <h1>{isEditMode ? '운영사례 수정' : '운영사례 등록'}</h1>
          </div>

          <article className="content-editor-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <form className="content-editor-form" onSubmit={handleSave}>
              <div className="content-editor-form__grid">
                <label className="form-field">
                  <span>제목</span>
                  <input value={formState.title} onChange={handleFieldChange('title')} placeholder="행사명을 입력하세요" />
                </label>

                <label className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span>카테고리</span>
                    <button 
                      type="button" 
                      onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                      style={{ fontSize: '11px', color: 'var(--brand)', background: 'none', border: 'none', textDecoration: 'underline' }}
                    >
                      {isAddingNewCategory ? '기존 목록에서 선택' : '새 카테고리 추가'}
                    </button>
                  </div>
                  {isAddingNewCategory ? (
                    <input 
                      value={formState.category} 
                      onChange={handleFieldChange('category')} 
                      placeholder="새 카테고리 입력" 
                    />
                  ) : (
                    <select value={formState.category} onChange={handleFieldChange('category')}>
                      <option value="">카테고리 선택</option>
                      {siteContent.cases.categories.map((item) => (
                        <option key={item} value={item}>{item}</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="form-field">
                  <span>행사 시기 (날짜)</span>
                  <input type="date" value={formState.updatedAt} onChange={handleFieldChange('updatedAt')} />
                </label>
              </div>

              {/* datalist는 제거 (select로 대체됨) */}

              <div className="content-editor-form__grid content-editor-form__grid--media">
                <label className="form-field">
                  <span>대표 이미지 URL</span>
                  <input value={formState.coverImageUrl} onChange={handleFieldChange('coverImageUrl')} placeholder="이미지 주소를 입력하거나 파일을 업로드하세요" />
                </label>

                <label className="form-field">
                  <span>새 이미지 업로드</span>
                  <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
                </label>
              </div>

              {formState.coverImageUrl ? (
                <div className="content-editor-form__image-preview">
                  <img src={formState.coverImageUrl} alt="미리보기" />
                </div>
              ) : null}

              <div className="form-field" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '16px', fontWeight: '800', color: 'var(--brand)' }}>상세 내용 (메인 콘텐츠)</span>
                  <label className="button button--primary" style={{ fontSize: '13px', minHeight: '36px', padding: '0 16px', cursor: 'pointer' }}>
                    본문에 사진 삽입하기
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleInsertImage} />
                  </label>
                </div>
                <textarea 
                  value={formState.summary} 
                  onChange={handleFieldChange('summary')} 
                  style={{ 
                    minHeight: '600px', 
                    fontSize: '16px', 
                    lineHeight: '1.8', 
                    padding: '24px',
                    backgroundColor: '#fafbfc',
                    border: '2px solid #e2e8f0',
                    borderRadius: 0
                  }}
                  placeholder="행사의 상세한 내용을 자유롭게 작성하세요. 위 버튼을 눌러 이미지도 중간중간 삽입할 수 있습니다." 
                />
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
                    삭제
                  </button>
                ) : <span />}
                <button type="submit" className="button button--primary" disabled={isSaving || isDeleting}>
                  {isSaving ? '저장 중...' : '운영사례 저장'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
