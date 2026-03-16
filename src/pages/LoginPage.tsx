import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('회원 로그인 기능은 현재 준비 중입니다. 필요하신 경우 고객센터로 먼저 문의해 주세요.');
  };

  return (
    <>
      <PageMeta
        title="로그인"
        description="마이스파트너 로그인 페이지입니다. 회원 기능은 순차적으로 연결될 예정입니다."
      />
      <main className="public-login-page">
        <section className="public-login-page__inner">
          <div className="public-login-page__intro">
            <p className="public-login-page__eyebrow">LOGIN</p>
            <h1>마이스파트너 로그인</h1>
            <p className="public-login-page__lead">
              회원 전용 기능과 자료 접근 권한은 이 페이지를 기준으로 순차적으로 연결될 예정입니다.
              지금은 로그인 진입 화면과 기본 동선부터 먼저 정리해 두었습니다.
            </p>
            <ul className="public-login-page__points">
              <li>회원사 전용 자료</li>
              <li>운영 요청 내역 확인</li>
              <li>상담 진행 상태 확인</li>
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
                  placeholder="member@micepartner.co.kr"
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

              {message ? <p className="public-login-form__message">{message}</p> : null}

              <button type="submit" className="button button--primary public-login-form__submit">
                로그인
              </button>
            </form>

            <div className="public-login-card__links">
              <Link to="/faq" className="button button--light">
                고객센터 이동
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
