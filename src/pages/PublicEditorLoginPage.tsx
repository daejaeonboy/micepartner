import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { getAdminToken, setAdminToken } from '../lib/adminSession';
import { getFirebaseAuth, getFirebaseGoogleProvider, hasFirebaseConfig } from '../lib/firebase';
import { ADMIN_APPROVAL_PENDING_MESSAGE, logInAdmin, logInAdminWithGoogle } from '../lib/api';

export function PublicEditorLoginPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const redirectTo = useMemo(() => searchParams.get('redirect') || '/cases', [searchParams]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [helper, setHelper] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      navigate(redirectTo, { replace: true });
    }
  }, [navigate, redirectTo]);

  useEffect(() => {
    if (searchParams.get('approval') === 'pending') {
      setError(ADMIN_APPROVAL_PENDING_MESSAGE);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setHelper('Firebase 설정이 연결되면 이 페이지에서 바로 편집 로그인할 수 있습니다.');
      return;
    }

    setHelper('승인된 관리자 계정으로 로그인하면 운영사례를 프론트에서 바로 등록하거나 수정할 수 있습니다.');
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      const session = await logInAdmin(email.trim(), password);
      setAdminToken(session.token);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : '로그인에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleSubmitting(true);
    setError('');

    try {
      const auth = getFirebaseAuth();
      const provider = getFirebaseGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const session = await logInAdminWithGoogle(credential?.idToken || '');
      setAdminToken(session.token);
      navigate(redirectTo, { replace: true });
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : 'Google 로그인에 실패했습니다.');
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  return (
    <>
      <PageMeta
        title="로그인"
        description="운영사례와 정보성 콘텐츠를 프론트에서 직접 작성하거나 수정하기 위한 로그인 페이지입니다."
      />
      <main className="public-login-page">
        <section className="public-login-page__inner">
          <div className="public-login-page__intro">
            <p className="public-login-page__eyebrow">EDITOR LOGIN</p>
            <h1>프론트 편집 로그인</h1>
            <p className="public-login-page__lead">
              운영사례, 협력업체, 정보센터처럼 반복형 콘텐츠는 공개 페이지 흐름 안에서 관리하되, 승인된 관리자 계정만 접근할 수 있게 분리하고 있습니다.
            </p>
            <ul className="public-login-page__points">
              <li>운영사례 등록 및 수정</li>
              <li>협력업체, 소식, 자료 등록 및 수정</li>
              <li>대표 이미지 업로드와 목록/상세 즉시 반영</li>
            </ul>
          </div>

          <article className="public-login-card">
            <form className="public-login-form" onSubmit={handleSubmit}>
              <label className="public-login-field">
                <span>이메일</span>
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="admin@micepartner.co.kr"
                />
              </label>

              <label className="public-login-field">
                <span>비밀번호</span>
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="비밀번호 입력"
                />
              </label>

              {helper ? <p className="public-login-form__helper">{helper}</p> : null}
              {error ? <p className="form-feedback form-feedback--error">{error}</p> : null}

              <button type="submit" className="button button--primary public-login-form__submit" disabled={isSubmitting}>
                {isSubmitting ? '로그인 중...' : '로그인'}
              </button>

              {hasFirebaseConfig() ? (
                <button
                  type="button"
                  className="button button--light public-login-form__google"
                  onClick={() => void handleGoogleLogin()}
                  disabled={isGoogleSubmitting}
                >
                  {isGoogleSubmitting ? 'Google 로그인 중...' : 'Google 계정으로 로그인'}
                </button>
              ) : null}
            </form>

            <div className="public-login-card__links">
              <Link to="/admin/login" className="button button--light">
                관리자 로그인 이동
              </Link>
              <Link to="/" className="public-login-card__home-link">
                메인으로 돌아가기
              </Link>
            </div>
          </article>
        </section>
      </main>
    </>
  );
}
