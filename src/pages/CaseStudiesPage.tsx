import { BarChart3, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Link, useSearchParams } from 'react-router-dom';
import { PageIntroBlock, PageOwnerNoteBlock, PageSectionBlock, PublicPageTemplate } from '../components/PublicPageTemplate';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';

export function CaseStudiesPage() {
  const { siteCopy, siteContent } = useSiteContent();
  const copy = siteCopy.cases;
  const content = siteContent.cases;
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>(content.allCategoryLabel);

  useEffect(() => {
    const category = searchParams.get('category');
    const nextCategory = category && content.categories.includes(category) ? category : content.allCategoryLabel;
    setSelectedCategory(nextCategory);
  }, [content.allCategoryLabel, content.categories, searchParams]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    if (category === content.allCategoryLabel) {
      setSearchParams({});
      return;
    }

    setSearchParams({ category });
  };

  const filteredEntries =
    selectedCategory === content.allCategoryLabel
      ? content.entries
      : content.entries.filter((item) => item.tags.includes(selectedCategory) || item.category === selectedCategory);
  const blocks = {
    intro: <PageIntroBlock eyebrow={content.introEyebrow} title={copy.introTitle} description={copy.introDescription} />,
    categories: (
      <PageSectionBlock
        id="portfolio-categories"
        eyebrow={content.categoriesEyebrow}
        title={copy.categoriesTitle}
        description={copy.categoriesDescription}
      >
        <div className="pill-list">
          <button
            type="button"
            className={selectedCategory === content.allCategoryLabel ? 'pill-list__item is-active' : 'pill-list__item'}
            onClick={() => handleCategoryChange(content.allCategoryLabel)}
          >
            {content.allCategoryLabel}
          </button>
          {content.categories.map((item) => (
            <button
              key={item}
              type="button"
              className={selectedCategory === item ? 'pill-list__item is-active' : 'pill-list__item'}
              onClick={() => handleCategoryChange(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </PageSectionBlock>
    ),
    cards: (
      <PageSectionBlock
        id="portfolio-list"
        variant="alt"
        eyebrow={content.cardsEyebrow}
        title={copy.cardsTitle}
        description={copy.cardsDescription}
      >
        <div className="cases-grid">
          {filteredEntries.map((item) => (
            <motion.article key={item.slug} {...fadeUp} className="case-card">
              {item.coverImageUrl ? <img src={item.coverImageUrl} alt={item.title} className="case-card__image" /> : null}
              <p className="case-card__category">{item.category}</p>
              <h3>{item.title}</h3>
              <p className="case-card__description">{item.cardDescription}</p>
              <div className="case-card__outcome">
                <BarChart3 size={18} />
                <span>{item.outcome}</span>
              </div>
              <Link to={`/cases/${item.slug}`} className="case-card__link">
                {content.detailLinkLabel}
                <ChevronRight size={16} />
              </Link>
            </motion.article>
          ))}
        </div>
        {filteredEntries.length === 0 ? <p className="admin-empty">{content.emptyStateMessage}</p> : null}
      </PageSectionBlock>
    ),
    'owner-note': <PageOwnerNoteBlock title={copy.ownerTitle} description={copy.ownerDescription} />,
  };

  return (
    <>
      <PageMeta title="포트폴리오" description={copy.introDescription} />
      <PublicPageTemplate page="cases" blocks={blocks} />
    </>
  );
}
