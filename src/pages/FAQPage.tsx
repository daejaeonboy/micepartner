import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { PageHeaderBlock, PageSectionBlock } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';
import { createBreadcrumbJsonLd, createFaqJsonLd, truncateText } from '../lib/seo';

export function FAQPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.support;
  const content = siteContent.support;
  const seoTitle = '자주 묻는 질문';
  const seoDescription = truncateText(
    'MICE 행사 운영, 견적, 상담, 준비 절차와 관련해 자주 묻는 질문을 정리한 고객센터 페이지입니다.',
  );
  const faqJsonLd = content.faqs.length > 0 ? createFaqJsonLd(content.faqs) : null;
  
  const [activeCategory, setActiveCategory] = useState(
    content.faqCategories[0] || '',
  );
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

  const filteredFaqs = content.faqs.filter(
    (faq) => activeCategory === '전체' || faq.category === activeCategory
  );

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <>
      <PageMeta
        title={seoTitle}
        description={seoDescription}
        canonicalPath="/faq"
        jsonLd={[
          createBreadcrumbJsonLd([
            { name: '홈', path: '/' },
            { name: '자주 묻는 질문', path: '/faq' },
          ]),
          ...(faqJsonLd ? [faqJsonLd] : []),
        ]}
      />
      
      <PageHeaderBlock
        title={copy.introTitle}
        description={copy.introDescription}
        align="left"
        width="content"
      />
      
      <PageSectionBlock>
        <div className="support-content-container">
          <motion.div {...fadeUp} className="support-contact-box">
            <div className="support-contact-info">
              <div className="support-contact-details">
                <h2>{content.phone}</h2>
                <p>{content.hours}</p>
              </div>
            </div>
            <a
              href={content.chatHref}
              target="_blank"
              rel="noopener noreferrer"
              className="support-chat-button"
            >
              <MessageSquare size={18} />
              <span>{content.chatLabel}</span>
            </a>
          </motion.div>

          <section className="faq-section">
            <div className="faq-categories">
              {content.faqCategories.map((category) => (
                <button
                  key={category}
                  className={`faq-category-button ${activeCategory === category ? 'is-active' : ''}`}
                  onClick={() => {
                    setActiveCategory(category);
                    setOpenFaqIndex(null);
                  }}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="faq-list">
              {filteredFaqs.map((faq, index) => (
                <div key={index} className="faq-item">
                  <button className="faq-question" onClick={() => toggleFaq(index)}>
                    <div className="faq-question-text">
                      <span className="faq-q-prefix">Q</span>
                      <strong>{faq.question}</strong>
                    </div>
                    {openFaqIndex === index ? (
                      <ChevronUp size={20} className="faq-chevron" />
                    ) : (
                      <ChevronDown size={20} className="faq-chevron" />
                    )}
                  </button>
                  <AnimatePresence>
                    {openFaqIndex === index && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        style={{ overflow: 'hidden' }}
                      >
                        <div className="faq-answer-content">
                          <div className="faq-answer">{faq.answer}</div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </section>
        </div>
      </PageSectionBlock>
    </>
  );
}
