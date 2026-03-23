import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { ChevronLeft } from 'lucide-react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { RichTextEditor } from '../components/RichTextEditor';
import { useSiteContent } from '../context/SiteContentContext';
import { getAdminToken } from '../lib/adminSession';
import { saveSiteDataWithTransform, uploadAdminImage } from '../lib/api';
import { createContentSlug, getTodayDateInputValue, resolveMemberCompanySlug } from '../lib/contentUtils';
import { getMenuLinkedCategories } from '../lib/menuCategories';
import type { MemberCompany } from '../types/siteContent';

type MemberEditorFormState = {
  name: string;
  category: string;
  updatedAt: string;
  logoUrl: string;
  body: string;
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

function getInitialFormState(company?: MemberCompany, defaultCategory = ''): MemberEditorFormState {
  return {
    name: company?.name || '',
    category: company?.category || defaultCategory,
    updatedAt: toDateInputValue(company?.updatedAt || '') || getTodayDateInputValue(),
    logoUrl: company?.logoUrl || '',
    body: company?.body || '',
  };
}

export function MemberEditorPage() {
  const { slug } = useParams();
  const navigate = useNavigate();
  const { siteData, updateSiteData, siteContent } = useSiteContent();
  const adminToken = getAdminToken();
  const currentCompany = useMemo(
    () => siteData.content.members.companies.find((item) => resolveMemberCompanySlug(item) === slug),
    [siteData.content.members.companies, slug],
  );
  const isEditMode = Boolean(slug);
  const menuCategories = useMemo(
    () => getMenuLinkedCategories(siteContent.menus.headerItems, '/members'),
    [siteContent.menus.headerItems],
  );
  const isMenuCategoryManaged = menuCategories.length > 0;
  const menuCategoryValues = useMemo(() => menuCategories.map((item) => item.value), [menuCategories]);
  const defaultCategory =
    currentCompany?.category && menuCategoryValues.includes(currentCompany.category)
      ? currentCompany.category
      : menuCategoryValues[0] || '';
  const [formState, setFormState] = useState<MemberEditorFormState>(() => getInitialFormState(currentCompany, defaultCategory));
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');
  const [isAddingNewCategory, setIsAddingNewCategory] = useState(false);

  const categories = useMemo(
    () => {
      const baseCategories = isMenuCategoryManaged
        ? menuCategoryValues
        : siteData.content.members.companies.map((item) => item.category).filter(Boolean);

      return isMenuCategoryManaged
        ? Array.from(new Set(baseCategories.filter(Boolean)))
        : Array.from(new Set([...baseCategories, String(formState.category || '').trim()].filter(Boolean)));
    },
    [formState.category, isMenuCategoryManaged, menuCategoryValues, siteData.content.members.companies],
  );
  const categoryOptions = useMemo(
    () =>
      isMenuCategoryManaged
        ? menuCategories
        : categories.map((item) => ({
            label: item,
            value: item,
            path: '',
          })),
    [categories, isMenuCategoryManaged, menuCategories],
  );

  if (isEditMode && !currentCompany) {
    return <Navigate to="/members" replace />;
  }

  useEffect(() => {
    setFormState(getInitialFormState(currentCompany, defaultCategory));
    setUploadFile(null);
    setError('');
    setIsAddingNewCategory(false);
  }, [currentCompany, defaultCategory]);

  useEffect(() => {
    if (!isMenuCategoryManaged) {
      return;
    }

    setIsAddingNewCategory(false);
    setFormState((current) => {
      if (menuCategoryValues.includes(current.category)) {
        return current;
      }

      return {
        ...current,
        category: defaultCategory,
      };
    });
  }, [defaultCategory, isMenuCategoryManaged, menuCategoryValues]);

  const handleFieldChange =
    (field: keyof MemberEditorFormState) =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      setFormState((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

  const handleInlineBodyImageUpload = async (file: File) => {
    if (!adminToken) {
      throw new Error('편집 권한 확인을 위해 다시 로그인해 주세요.');
    }

    return uploadAdminImage(file, 'members-inline', adminToken);
  };

  const buildUniqueSlug = (name: string, companies = siteData.content.members.companies) => {
    const normalizedTarget = createContentSlug(name) || `member-${Date.now()}`;
    const currentCompanySlug = currentCompany ? resolveMemberCompanySlug(currentCompany) : '';
    const existing = new Set(
      companies
        .filter((item) => resolveMemberCompanySlug(item) !== currentCompanySlug)
        .map((item) => resolveMemberCompanySlug(item)),
    );

    if (!existing.has(normalizedTarget)) {
      return normalizedTarget;
    }

    let counter = 2;
    let nextSlug = `${normalizedTarget}-${counter}`;

    while (existing.has(nextSlug)) {
      counter += 1;
      nextSlug = `${normalizedTarget}-${counter}`;
    }

    return nextSlug;
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!adminToken) {
      setError('편집 권한 확인을 위해 다시 로그인해 주세요.');
      return;
    }

    const name = formState.name.trim();
    const category = (isMenuCategoryManaged ? formState.category : formState.category.trim()) || defaultCategory;

    if (!name || !category) {
      setError('업체명과 카테고리는 필수입니다.');
      return;
    }

    setIsSaving(true);
    setError('');

    try {
      let logoUrl = formState.logoUrl.trim();

      if (uploadFile) {
        logoUrl = await uploadAdminImage(uploadFile, 'members', adminToken);
      }

      const nextCompanyBase: Omit<MemberCompany, 'slug'> = {
        name,
        category,
        secondaryCategory: '',
        address: '',
        phone: '',
        updatedAt: formState.updatedAt || '',
        logoUrl,
        body: formState.body.trim(),
      };

      let savedSlug = currentCompany ? resolveMemberCompanySlug(currentCompany) : '';
      const saved = await saveSiteDataWithTransform(adminToken, (current) => {
        const resolvedSlug = currentCompany
          ? resolveMemberCompanySlug(currentCompany)
          : buildUniqueSlug(name, current.content.members.companies);
        const nextCompany: MemberCompany = {
          slug: resolvedSlug,
          ...nextCompanyBase,
        };
        savedSlug = resolvedSlug;

        return {
          ...current,
          content: {
            ...current.content,
            members: {
              ...current.content.members,
              companies: currentCompany
                ? current.content.members.companies.map((item) =>
                    resolveMemberCompanySlug(item) === resolveMemberCompanySlug(currentCompany) ? nextCompany : item,
                  )
                : [nextCompany, ...current.content.members.companies],
            },
          },
        };
      });

      updateSiteData(saved);
      navigate(`/members/${savedSlug}`, { replace: true });
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : '협력업체 저장에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!adminToken || !currentCompany) {
      return;
    }

    const confirmed = window.confirm('이 협력업체를 삭제할까요?');
    if (!confirmed) {
      return;
    }

    setIsDeleting(true);
    try {
      const saved = await saveSiteDataWithTransform(adminToken, (current) => ({
        ...current,
        content: {
          ...current.content,
          members: {
            ...current.content.members,
            companies: current.content.members.companies.filter(
              (item) => resolveMemberCompanySlug(item) !== resolveMemberCompanySlug(currentCompany),
            ),
          },
        },
      }));

      updateSiteData(saved);
      navigate('/members', { replace: true });
    } catch (deleteError) {
      setError('협력업체 삭제에 실패했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <>
      <PageMeta
        title={isEditMode ? `${currentCompany?.name || '협력업체'} 수정` : '협력업체 등록'}
        description="협력업체 편집 화면입니다."
      />
      <main className="content-editor-page">
        <section className="content-editor-page__inner">
          <div className="content-editor-page__intro">
            <Link to={isEditMode && currentCompany ? `/members/${resolveMemberCompanySlug(currentCompany)}` : '/members'} className="notice-detail-page__back">
              <ChevronLeft size={16} />
              {isEditMode ? '돌아가기' : '목록으로'}
            </Link>
            <p className="content-editor-page__eyebrow">MEMBER EDITOR</p>
            <h1>{isEditMode ? '협력업체 수정' : '협력업체 등록'}</h1>
          </div>

          <article className="content-editor-card" style={{ border: 'none', background: 'transparent', boxShadow: 'none', padding: 0 }}>
            <form className="content-editor-form" onSubmit={handleSave}>
              <div className="content-editor-form__grid">
                <label className="form-field">
                  <span>업체명</span>
                  <input value={formState.name} onChange={handleFieldChange('name')} placeholder="협력업체명" />
                </label>

                <label className="form-field">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span>카테고리</span>
                    {isMenuCategoryManaged ? (
                      <small style={{ fontSize: '11px', color: 'var(--brand)' }}>메뉴 관리 기준</small>
                    ) : (
                      <button 
                        type="button" 
                        onClick={() => setIsAddingNewCategory(!isAddingNewCategory)}
                        style={{ fontSize: '11px', color: 'var(--brand)', background: 'none', border: 'none', textDecoration: 'underline' }}
                      >
                        {isAddingNewCategory ? '기존 목록에서 선택' : '새 카테고리 추가'}
                      </button>
                    )}
                  </div>
                  {isAddingNewCategory ? (
                    <input value={formState.category} onChange={handleFieldChange('category')} placeholder="새 카테고리 입력" />
                  ) : (
                    <select value={formState.category} onChange={handleFieldChange('category')}>
                      <option value="">카테고리 선택</option>
                      {categoryOptions.map((item) => (
                        <option key={`${item.label}-${item.value}`} value={item.value}>{item.label}</option>
                      ))}
                    </select>
                  )}
                </label>

                <label className="form-field">
                  <span>등록 날짜</span>
                  <input type="date" value={formState.updatedAt} onChange={handleFieldChange('updatedAt')} />
                </label>
              </div>

              <div className="content-editor-form__grid content-editor-form__grid--media">
                <label className="form-field">
                  <span>로고 이미지 URL</span>
                  <input value={formState.logoUrl} onChange={handleFieldChange('logoUrl')} placeholder="이미지 주소 또는 파일 업로드" />
                </label>

                <label className="form-field">
                  <span>새 로고 업로드</span>
                  <input type="file" accept="image/*" onChange={(event) => setUploadFile(event.target.files?.[0] || null)} />
                </label>
              </div>

              {formState.logoUrl ? (
                <div className="content-editor-form__image-preview content-editor-form__image-preview--logo" style={{ borderRadius: 0 }}>
                  <img src={formState.logoUrl} alt="로고 미리보기" />
                </div>
              ) : null}

              <div className="form-field" style={{ marginTop: '20px' }}>
                <RichTextEditor
                  label="상세 소개 (본문)"
                  value={formState.body}
                  onChange={(next) =>
                    setFormState((current) => ({
                      ...current,
                      body: next,
                    }))
                  }
                  onUploadImage={handleInlineBodyImageUpload}
                  minHeight={600}
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
                  {isSaving ? '저장 중...' : '협력업체 저장'}
                </button>
              </div>
            </form>
          </article>
        </section>
      </main>
    </>
  );
}
