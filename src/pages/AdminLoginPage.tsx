import { type FormEvent, useEffect, useState } from 'react';
import { Eye, EyeOff, UserPlus } from 'lucide-react';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { getAdminToken, setAdminToken } from '../lib/adminSession';
import { getFirebaseAuth, getFirebaseGoogleProvider, hasFirebaseConfig } from '../lib/firebase';
import { logInAdmin, logInAdminWithGoogle, signUpAdmin } from '../lib/api';

const fadeUp = {
  initial: { opacity: 0, y: 24 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, amount: 0.2 },
  transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] as const },
};

export function AdminLoginPage() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState<'signup' | 'login'>('login');
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [googleMessage, setGoogleMessage] = useState('');
  const [isGoogleAuthenticating, setIsGoogleAuthenticating] = useState(false);
  const [isGoogleEnabled, setIsGoogleEnabled] = useState(false);

  useEffect(() => {
    if (getAdminToken()) {
      navigate('/admin', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!hasFirebaseConfig()) {
      setIsGoogleEnabled(false);
      setGoogleMessage('Google 로그인을 사용하려면 `.env`에 VITE_FIREBASE_* 값을 채워 주세요.');
      return;
    }

    setIsGoogleEnabled(true);
    setGoogleMessage('Firebase Console에서 Authentication > Sign-in method > Google을 활성화해 두어야 합니다.');
  }, [navigate]);

  const handleAuth = async () => {
    setIsAuthenticating(true);
    setAuthError('');

    try {
      const session =
        authMode === 'signup'
          ? await signUpAdmin(authName.trim(), authEmail.trim(), authPassword)
          : await logInAdmin(authEmail.trim(), authPassword);

      setAdminToken(session.token);
      navigate('/admin', { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : '관리자 인증에 실패했습니다.';
      setAuthError(message);
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    void handleAuth();
  };

  const handleSwitchMode = () => {
    setAuthMode((current) => (current === 'login' ? 'signup' : 'login'));
    setAuthError('');
  };

  const handleGoogleLogin = async () => {
    setIsGoogleAuthenticating(true);
    setAuthError('');

    try {
      const auth = getFirebaseAuth();
      const provider = getFirebaseGoogleProvider();
      const result = await signInWithPopup(auth, provider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      const session = await logInAdminWithGoogle(credential?.idToken || '');
      setAdminToken(session.token);
      navigate('/admin', { replace: true });
    } catch (loginError) {
      const message = loginError instanceof Error ? loginError.message : 'Google 로그인에 실패했습니다.';
      setAuthError(message);
    } finally {
      setIsGoogleAuthenticating(false);
    }
  };

  return (
    <>
      <PageMeta title="마이스파트너 관리자 로그인" description="마이스파트너 관리자 계정으로 로그인하거나 초기 계정을 생성하는 전용 페이지입니다." />
      <main className="admin-login-shell">
        <motion.section {...fadeUp} className="admin-login-panel">
          <div className="admin-login-brand">
            <img src="/logo.png" alt="마이스파트너 로고" className="admin-login-brand__logo" />
            <h1>마이스파트너 관리자 로그인</h1>
            <p>마이스파트너 운영 관리 시스템</p>
          </div>

          <motion.article {...fadeUp} className="admin-login-card">
            <form className="admin-login-form" onSubmit={handleSubmit}>
              {authMode === 'signup' ? (
                <label className="form-field admin-login-field">
                  <span>관리자 이름</span>
                  <input
                    type="text"
                    value={authName}
                    onChange={(event) => setAuthName(event.target.value)}
                    placeholder="관리자 이름"
                  />
                </label>
              ) : null}

              <label className="form-field admin-login-field">
                <span>관리자 이메일</span>
                <input
                  type="email"
                  value={authEmail}
                  onChange={(event) => setAuthEmail(event.target.value)}
                  placeholder="admin@micepartner.co.kr"
                />
              </label>

              <label className="form-field admin-login-field">
                <span>비밀번호</span>
                <div className="admin-login-password">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={authPassword}
                    onChange={(event) => setAuthPassword(event.target.value)}
                    placeholder="비밀번호 입력"
                  />
                  <button
                    type="button"
                    className="admin-login-password__toggle"
                    onClick={() => setShowPassword((current) => !current)}
                    aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </label>

              {authError ? <p className="form-feedback form-feedback--error">{authError}</p> : null}

              <button type="submit" className="button button--primary admin-login-submit" disabled={isAuthenticating}>
                {isAuthenticating ? '처리 중...' : authMode === 'signup' ? '관리자 회원가입' : '관리자 로그인'}
              </button>

              <div className="admin-login-google">
                <div className="admin-login-divider" />
                {googleMessage ? <p className="admin-helper-text admin-helper-text--center">{googleMessage}</p> : null}
                {isGoogleEnabled ? (
                  <button
                    type="button"
                    className="button button--light admin-login-google-button"
                    onClick={() => void handleGoogleLogin()}
                    disabled={isGoogleAuthenticating}
                  >
                    {isGoogleAuthenticating ? 'Google 로그인 준비 중...' : 'Google 계정으로 로그인'}
                  </button>
                ) : null}
              </div>
            </form>

            <div className="admin-login-card__footer">
              <p>
                {authMode === 'signup' ? '이미 계정이 있으신가요?' : '아직 계정이 없으신가요?'}{' '}
                <button
                  type="button"
                  className="admin-login-switch"
                  onClick={handleSwitchMode}
                >
                  {authMode === 'signup' ? '로그인' : '회원가입'}
                </button>
              </p>
            </div>
          </motion.article>

          <div className="admin-login-links">
            <Link to="/">← 메인 사이트로 돌아가기</Link>
            <p>© 2026 마이스파트너. All rights reserved.</p>
          </div>
        </motion.section>
      </main>
    </>
  );
}
