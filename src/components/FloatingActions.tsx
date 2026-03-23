import { ArrowUp } from 'lucide-react';
import { useSiteContent } from '../context/SiteContentContext';

export function FloatingActions() {
  const { siteContent } = useSiteContent();
  const chatHref = siteContent?.support?.chatHref || 'https://pf.kakao.com/_your_id';

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <div className="floating-actions">
      <a
        href={chatHref}
        target="_blank"
        rel="noopener noreferrer"
        className="floating-actions__btn floating-actions__btn--chat"
        title="카카오톡 상담"
      >
        <img src="/kakao.png" alt="Kakao" className="floating-actions__kakao-icon" />
      </a>
      
      <button
        onClick={scrollToTop}
        className="floating-actions__btn floating-actions__btn--top is-visible"
        title="위로 가기"
      >
        <ArrowUp size={24} />
      </button>
    </div>
  );
}
