import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronLeft, Plus, Trash2, Upload } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { RichTextEditor } from '../components/RichTextEditor';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteDataWithTransform, uploadAdminFile, uploadAdminImage } from '../lib/api';
import { createContentSlug, getTodayDateInputValue } from '../lib/contentUtils';
import type { NoticeAttachment, NoticeItem } from '../types/siteContent';

type NoticeEditorFormState = {
  title: string;
  category: string;
  date: string;
  summary: string;
  body: string;
  coverImageUrl: string;
  attachments: NoticeAttachment[];
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

function createEmptyAttachment(): NoticeAttachment {
  return {
    label: '',
    url: '',
  };
}

function getInitialFormState(item?: NoticeItem): NoticeEditorFormState {
  return {
    title: item?.title || '',
    category: item?.category || '',
    date: toDateInputValue(item?.date || '') || getTodayDateInputValue(),
    summary: item?.summary || '',
    body: item?.body || '',
    coverImageUrl: item?.coverImageUrl || '',
    attachments: item?.attachments?.length ? item.attachments : [createEmptyAttachment()],
  };
}

export function NoticeEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData } = useSiteContent();
  const adminToken = getAdminToken();
  const currentNotice = useMemo(
    () => siteData.content.resources.notices.find((item) => item.slug === slug),
    [siteData.content.resources.notices, slug],
  );
  const isEditMode = Boolean(slug);
  const [formState, setFormState] = useState<NoticeEditorFormState>(() => getInitialFormState(currentNotice));
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [error, setError] = useState('');

  if (isEditMode && !currentNotice) {
    return <Navigate to="/resources/notices" replace />;
  }

  useEffect(() => {
    setFormState(getInitialFormState(currentNotice));
    setFeedback('');
    setError('');
  }, [currentNotice]);

  const handleFieldChange =
    (field: Exclude<keyof NoticeEditorFormState, 'attachments'>) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleAttachmentChange =
    (index: number, field: keyof NoticeAttachment) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      const nextValue = event.target.value;
      setFormState((current) => ({
        ...current,
        attachments: current.attachments.map((attachment, attachmentIndex) =>
          attachmentIndex === index ? { ...attachment, [field]: nextValue } : attachment,
        ),
      }));
    };

  const handleCoverImageUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    setIsSaving(true);
    setError('');
    try {
      const url = await uploadAdminImage(file, 'resources/notices', adminToken);
      setFormState((current) => ({
        ...current,
        coverImageUrl: url,
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '이미지 업로드에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInlineBodyImageUpload = async (file: File) => {
    if (!adminToken) {
      throw new Error('편집 권한 확인을 위해 다시 로그인해.');
    }

    return uploadAdminImage(file, 'resources/notices/inline', adminToken);
  };

  const handleAttachmentFileUpload = (index: number) => async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !adminToken) return;

    setIsSaving(true);
    setError('');
    try {
      const url = await uploadAdminFile(file, 'resources/notices/attachments', adminToken);
      setFormState((current) => ({
        ...current,
        attachments: current.attachments.map((attachment, i) =>
          i === index ? { label: attachment.label || file.name, url } : attachment
        ),
      }));
    } catch (e) {
      setError(e instanceof Error ? e.message : '파일 업로드에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const buildUniqueSlug = (title: string, notices = siteData.content.resources.notices) => {
    const base = createContentSlug(title) || `notice-${Date.now()}`;
    const existingSlugs = new Set(
      notices
        .filter((item) => item.slug !== currentNotice?.slug)
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
    if (!title || !formState.date) {
      setError('제목과 게시일은 필수입니다.');
      return;
    }

    setIsSaving(true);
    setError('');
    setFeedback('');

    try {
      const nextNoticeBase: Omit<NoticeItem, 'slug'> = {
        category: formState.category.trim() || '일반',
        title,
        date: formState.date,
        summary: formState.summary.trim(),
        body: formState.body.trim(),
        coverImageUrl: formState.coverImageUrl.trim(),
        attachments: formState.attachments
          .map((attachment) => ({
            label: attachment.label.trim(),
            url: attachment.url.trim(),
          }))
          .filter((attachment) => attachment.label || attachment.url),
      };

      let savedSlug = currentNotice?.slug || '';
      const saved = await saveSiteDataWithTransform(adminToken, (current) => {
        const resolvedSlug = currentNotice?.slug || buildUniqueSlug(title, current.content.resources.notices);
        const nextNotice: NoticeItem = {
          slug: resolvedSlug,
          ...nextNoticeBase,
        };
        savedSlug = resolvedSlug;

        return {
          ...current,
          content: {
            ...current.content,
            resources: {
              ...current.content.resources,
              notices: currentNotice
                ? current.content.resources.notices.map((item) => (item.slug === currentNotice.slug ? nextNotice : item))
                : [nextNotice, ...current.content.resources.notices],
            },
          },
        };
      });

      updateSiteData(saved);
      navigate(`/resources/notices/${savedSlug}`, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '소식 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken || !currentNotice) {
      return;
    }

    const confirmed = window.confirm('이 소식을 삭제할까요?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const saved = await saveSiteDataWithTransform(adminToken, (current) => ({
        ...current,
        content: {
          ...current.content,
          resources: {
            ...current.content.resources,
            notices: current.content.resources.notices.filter((item) => item.slug !== currentNotice.slug),
          },
        },
      }));

      updateSiteData(saved);
      navigate('/resources/notices', { replace: true });
    } catch (deleteError) {
      setError('소식 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={isEditMode ? `${currentNotice?.title || '소식'} 수정` : '소식 등록'}
        description="정보센터 소식 편집 화면입니다."
        noIndex
      />
      <main className="content-editor-page">
        <section className="content-editor-page__inner">
          <div className="content-editor-page__intro">
            <Link to={isEditMode && currentNotice ? `/resources/notices/${currentNotice.slug}` : '/resources/notices'} className="notice-detail-page__back">
              <ChevronLeft size={16} />
              {isEditMode ? '돌아가기' : '목록으로'}
            </Link>
            <p className="content-editor-page__eyebrow">NOTICE EDITOR</p>
            <h1>{isEditMode ? '소식 수정' : '소식 등록'}</h1>
          </div>

          <article className="content-editor-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <form className="content-editor-form" onSubmit={handleSave}>
              <div className="content-editor-form__grid">
                <label className="form-field">
                  <span>제목</span>
                  <input value={formState.title} onChange={handleFieldChange('title')} placeholder="소식 제목" />
                </label>

                <label className="form-field">
                  <span>카테고리</span>
                  <input value={formState.category} onChange={handleFieldChange('category')} placeholder="예: 공지사항, 보도자료" />
                </label>

                <label className="form-field">
                  <span>게시일</span>
                  <input type="date" value={formState.date} onChange={handleFieldChange('date')} />
                </label>
              </div>

              <label className="form-field">
                <span>요약 (목록에 노출)</span>
                <textarea value={formState.summary} onChange={handleFieldChange('summary')} rows={2} placeholder="소식 요약" />
              </label>

              <div className="form-field">
                <span>본문 대표 이미지</span>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input 
                    value={formState.coverImageUrl} 
                    onChange={handleFieldChange('coverImageUrl')} 
                    placeholder="이미지 URL을 직접 입력하거나 파일을 선택하세요." 
                    style={{ flex: 1 }}
                  />
                  <label className="button button--light" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', height: '42px', padding: '0 16px' }}>
                    <Upload size={16} />
                    파일 선택
                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleCoverImageUpload} />
                  </label>
                </div>
                {formState.coverImageUrl && (
                  <div style={{ marginTop: '8px' }}>
                    <img src={formState.coverImageUrl} alt="미리보기" style={{ maxWidth: '200px', display: 'block' }} />
                  </div>
                )}
              </div>

              <RichTextEditor
                label="본문 내용"
                value={formState.body}
                onChange={(next) =>
                  setFormState((current) => ({
                    ...current,
                    body: next,
                  }))
                }
                onUploadImage={handleInlineBodyImageUpload}
                minHeight={560}
              />

              <section className="content-editor-repeat-list">
                <div className="content-editor-repeat-list__header">
                  <strong>첨부파일</strong>
                  <button
                    type="button"
                    className="button button--light"
                    onClick={() =>
                      setFormState((current) => ({
                        ...current,
                        attachments: [...current.attachments, createEmptyAttachment()],
                      }))
                    }
                  >
                    <Plus size={16} />
                    파일 추가
                  </button>
                </div>

                <div className="content-editor-repeat-list__items">
                  {formState.attachments.map((attachment, index) => (
                    <div key={`attachment-${index}`} className="content-editor-repeat-list__item">
                      <div className="content-editor-form__grid">
                        <label className="form-field">
                          <span>파일명</span>
                          <input
                            value={attachment.label}
                            onChange={handleAttachmentChange(index, 'label')}
                            placeholder="예: 안내문.pdf"
                          />
                        </label>

                        <div className="form-field">
                          <span>파일 경로 (URL)</span>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              value={attachment.url}
                              onChange={handleAttachmentChange(index, 'url')}
                              placeholder="https://..."
                              style={{ flex: 1 }}
                            />
                            <label className="button button--light" style={{ cursor: 'pointer', display: 'flex', gap: '8px', alignItems: 'center', height: '42px', padding: '0 12px' }}>
                              <Upload size={16} />
                              <input type="file" style={{ display: 'none' }} onChange={handleAttachmentFileUpload(index)} />
                            </label>
                          </div>
                        </div>
                      </div>

                      <button
                        type="button"
                        className="button button--light content-editor-repeat-list__remove"
                        onClick={() =>
                          setFormState((current) => ({
                            ...current,
                            attachments:
                              current.attachments.length === 1
                                ? [createEmptyAttachment()]
                                : current.attachments.filter((_, attachmentIndex) => attachmentIndex !== index),
                          }))
                        }
                      >
                        <Trash2 size={16} />
                        삭제
                      </button>
                    </div>
                  ))}
                </div>
              </section>

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
                  {isSaving ? '저장 중...' : '소식 저장'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
