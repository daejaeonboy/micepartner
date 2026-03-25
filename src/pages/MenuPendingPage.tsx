import { Link } from 'react-router-dom';
import { PageSectionBlock } from '../components/PublicPageTemplate';
import { PageIntro } from '../components/PageIntro';
import { PageMeta } from '../components/PageMeta';

type MenuPendingPageProps = {
  label: string;
  parentLabel?: string;
};

export function MenuPendingPage({ label, parentLabel }: MenuPendingPageProps) {
  return (
    <>
      <PageMeta
        title={`${label} 준비중`}
        description={`${label} 페이지는 현재 준비 중입니다. 메뉴 구조는 먼저 열어 두었고 콘텐츠를 순차적으로 연결하고 있습니다.`}
        noIndex
      />
      <PageIntro
        eyebrow={parentLabel || 'Coming Soon'}
        title={`${label} 페이지를 준비중입니다.`}
        description="메뉴는 먼저 열어두었고, 화면 구성과 콘텐츠 연결은 순차적으로 반영하고 있습니다."
      />
      <PageSectionBlock>
        <article className="stack-card stack-card--rich">
          <h3>현재 상태</h3>
          <p>이 메뉴는 사이트 구조상 먼저 노출되어 있지만, 실제 화면은 아직 준비 단계입니다.</p>
          <p>콘텐츠가 연결되면 같은 주소에서 바로 운영 가능한 페이지로 전환됩니다.</p>
          <div className="inline-link-list">
            <Link to="/" className="button button--primary">
              홈으로 이동
            </Link>
            <Link to="/faq" className="button button--ghost">
              문의하기
            </Link>
          </div>
        </article>
      </PageSectionBlock>
    </>
  );
}
