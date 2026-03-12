import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Fragment,
  useState,
  useCallback,
  useEffect,
  useRef,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { resolveTemplateIdForPage, resolveTemplateSectionsForPage } from '../content/publicPageLayouts';
import { PageMeta } from '../components/PageMeta';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';

type ServicePreviewSlide = {
  title: string;
  description: string;
  imageUrl: string;
};

function ServicePreviewSlider({ items }: { items: ServicePreviewSlide[] }) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    deltaX: 0,
    startIndex: 0,
    dragging: false,
  });
  const [activeIndex, setActiveIndex] = useState(0);
  const [pageCount, setPageCount] = useState(1);
  const [isDragging, setIsDragging] = useState(false);

  const getStep = useCallback(() => {
    const track = trackRef.current;
    const firstItem = track?.querySelector<HTMLElement>('.home-slider__item');

    if (!track || !firstItem) {
      return 0;
    }

    const gap = Number.parseFloat(window.getComputedStyle(track).gap || '0');
    return firstItem.offsetWidth + gap;
  }, []);

  const getMaxIndex = useCallback(() => {
    const track = trackRef.current;
    const step = getStep();

    if (!track || !step) {
      return 0;
    }

    return Math.max(0, Math.round((track.scrollWidth - track.clientWidth) / step));
  }, [getStep]);

  const syncSlider = useCallback(() => {
    const track = trackRef.current;
    const step = getStep();
    const maxIndex = getMaxIndex();

    if (!track || !step) {
      setActiveIndex(0);
      setPageCount(1);
      return;
    }

    setPageCount(maxIndex + 1);
    setActiveIndex(Math.min(maxIndex, Math.max(0, Math.round(track.scrollLeft / step))));
  }, [getMaxIndex, getStep]);

  const scrollToIndex = useCallback(
    (index: number) => {
      const track = trackRef.current;
      const step = getStep();
      const maxIndex = getMaxIndex();

      if (!track || !step) {
        return;
      }

      const nextIndex = Math.min(maxIndex, Math.max(0, index));
      track.scrollTo({
        left: nextIndex * step,
        behavior: 'smooth',
      });
      setActiveIndex(nextIndex);
    },
    [getMaxIndex, getStep],
  );

  useEffect(() => {
    syncSlider();
    window.addEventListener('resize', syncSlider);

    return () => window.removeEventListener('resize', syncSlider);
  }, [syncSlider]);

  const prev = useCallback(() => scrollToIndex(activeIndex - 1), [activeIndex, scrollToIndex]);
  const next = useCallback(() => scrollToIndex(activeIndex + 1), [activeIndex, scrollToIndex]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    event.preventDefault();

    const step = getStep();
    const startIndex = step ? Math.round(track.scrollLeft / step) : 0;

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      deltaX: 0,
      startIndex,
      dragging: true,
    };

    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, [getStep]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    const dragState = dragRef.current;

    if (!track || !dragState.dragging) {
      return;
    }

    event.preventDefault();
    dragState.deltaX = event.clientX - dragState.startX;
    track.scrollLeft = dragState.startScrollLeft - dragState.deltaX;
  }, []);

  const handlePointerEnd = useCallback(
    (event: ReactPointerEvent<HTMLDivElement>) => {
      const track = trackRef.current;
      const dragState = dragRef.current;

      if (!track || !dragState.dragging) {
        return;
      }

      dragRef.current.dragging = false;
      setIsDragging(false);

      if (dragState.pointerId === event.pointerId) {
        track.releasePointerCapture(event.pointerId);
      }

      const step = getStep();

      if (!step) {
        return;
      }

      const threshold = Math.max(18, Math.min(42, step * 0.06));
      const direction =
        Math.abs(dragState.deltaX) >= threshold ? (dragState.deltaX < 0 ? 1 : -1) : 0;

      scrollToIndex(dragState.startIndex + direction);
    },
    [getStep, scrollToIndex],
  );

  return (
    <div className="home-slider-container">
      <div
        ref={trackRef}
        className={`home-slider${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
        onScroll={syncSlider}
      >
        {items.map((item, index) => (
          <article key={`${item.title}-${index}`} className="home-slider__item">
            <div className="home-slider__card">
              <img src={item.imageUrl} alt={item.title} draggable={false} />
              <div className="home-slider__overlay home-slider__overlay--visible">
                <strong>{item.title}</strong>
                <p>{item.description}</p>
              </div>
            </div>
          </article>
        ))}
      </div>

      {pageCount > 1 ? (
        <>
          <div className="home-slider__controls">
            <button
              type="button"
              className="home-slider__arrow"
              onClick={prev}
              aria-label="이전 서비스 보기"
            >
              <ArrowLeft size={20} />
            </button>
            <button
              type="button"
              className="home-slider__arrow"
              onClick={next}
              aria-label="다음 서비스 보기"
            >
              <ArrowRight size={20} />
            </button>
          </div>

          <div className="home-slider__progress" aria-hidden="true">
            <div
              className="home-slider__progress-bar"
              style={{
                width: `${100 / pageCount}%`,
                transform: `translateX(${activeIndex * 100}%)`,
              }}
            />
          </div>
        </>
      ) : null}
    </div>
  );
}

function Section2Slider({ slides }: { slides: { img: string; title: string; desc: string }[] }) {
  const [current, setCurrent] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    deltaX: 0,
    dragging: false,
  });
  const prev = useCallback(() => setCurrent((c) => (c === 0 ? slides.length - 1 : c - 1)), [slides.length]);
  const next = useCallback(() => setCurrent((c) => (c === slides.length - 1 ? 0 : c + 1)), [slides.length]);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    event.preventDefault();
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0,
      dragging: true,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    event.preventDefault();
    const deltaX = event.clientX - dragRef.current.startX;
    dragRef.current.deltaX = deltaX;
    setDragOffset(deltaX);
  }, []);

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    const deltaX = dragRef.current.deltaX;
    dragRef.current.dragging = false;
    setIsDragging(false);
    setDragOffset(0);

    if (dragRef.current.pointerId === event.pointerId) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }

    if (deltaX >= 80) {
      prev();
      return;
    }

    if (deltaX <= -80) {
      next();
    }
  }, [next, prev]);

  return (
    <div className="home-slider-container" style={{ position: 'relative' }}>
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: 'var(--radius)',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          style={{
            display: 'flex',
            transition: isDragging ? 'none' : 'transform 0.5s cubic-bezier(0.22,1,0.36,1)',
            transform: `translateX(calc(-${current * 100}% + ${dragOffset}px))`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'pan-y',
          }}
        >
          {slides.map((slide, i) => (
            <div key={i} style={{ flex: '0 0 100%', minWidth: '100%' }}>
              <div style={{ aspectRatio: '21 / 9', overflow: 'hidden', position: 'relative' }}>
                <img
                  src={slide.img}
                  alt={slide.title}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'grid',
                    alignContent: 'end',
                    gap: '10px',
                    padding: '40px',
                    color: '#fff',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.08) 56%, rgba(0,0,0,0.02))',
                  }}
                >
                  <strong style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15 }}>{slide.title}</strong>
                  <p style={{ margin: 0, maxWidth: '720px', fontSize: '15px', lineHeight: 1.8, opacity: 0.86 }}>{slide.desc}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Dots inside image */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '8px',
            zIndex: 10,
          }}
        >
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => setCurrent(i)}
              style={{
                width: i === current ? '24px' : '8px',
                height: '8px',
                borderRadius: i === current ? '4px' : '50%',
                background: i === current ? 'var(--brand)' : 'rgba(255,255,255,0.6)',
                border: 'none',
                cursor: 'pointer',
                padding: 0,
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
      </div>
      {/* Arrow controls */}
      <div className="home-slider__controls">
        <button type="button" className="home-slider__arrow" onClick={prev}><ArrowLeft size={20} /></button>
        <button type="button" className="home-slider__arrow" onClick={next}><ArrowRight size={20} /></button>
      </div>
    </div>
  );
}

export function HomePage() {
  const { siteCopy, siteContent, siteData } = useSiteContent();
  const copy = siteCopy.home;
  const home = siteContent.home;
  const heroEyebrow = /human partner/i.test(home.heroEyebrow) ? 'MICEPARTNER' : home.heroEyebrow;

  const placeholderImages = [
    'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=800&q=80',
    'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=800&q=80',
  ];

  const featuredServices = siteContent.services.modules.slice(0, 4).map((item, index) => ({
    ...item,
    imageUrl: item.imageUrl || placeholderImages[index],
  }));

  const positioningSource = home.positioningCards.length > 0 ? home.positioningCards : featuredServices;
  const positioningSlides = positioningSource.map((item, index) => ({
    img: item.imageUrl || placeholderImages[index % placeholderImages.length],
    title: item.title,
    desc: item.description,
  }));
  const ctaImageUrl = home.ctaImageUrl || siteContent.contact.heroImageUrl || home.heroImageUrl;
  const galleryCases = siteContent.cases.entries.slice(0, 3);
  const resourcesPreview = siteContent.resources.items.slice(0, 3);
  const partnerLogos = home.partnerLogos.filter((item) => item.logoUrl || item.name);
  const midpoint = Math.max(1, Math.ceil(partnerLogos.length / 2));
  const topPartnerRow = partnerLogos.slice(0, midpoint);
  const bottomPartnerRow = partnerLogos.slice(midpoint).length > 0 ? partnerLogos.slice(midpoint) : partnerLogos.slice(0, midpoint);
  const homeTemplateId = resolveTemplateIdForPage('home', siteData.templates);
  const layoutSections = resolveTemplateSectionsForPage('home', homeTemplateId, siteData.templateLayouts);

  const buildPartnerTrack = (items: typeof partnerLogos) => [...items, ...items];
  const blocks = {
    hero: (
      <section className="home-hero">
        <motion.article {...fadeUp} className="home-hero__frame home-hero--centered">
          <img src={home.heroImageUrl} alt="메인 비주얼" className="home-hero__image" />
          <div className="home-hero__overlay">
            <p className="home-hero__eyebrow">{heroEyebrow}</p>
            <h1 style={{ whiteSpace: 'pre-line' }}>{copy.heroTitle}</h1>
            <p>{copy.heroDescription}</p>
            <p style={{ fontSize: '14px', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.74 }}>
              {home.heroBadge}
            </p>
          </div>
        </motion.article>
      </section>
    ),
    'service-preview': (
      <section className="home-section" style={{ paddingTop: '100px' }}>
        <div className="home-section__intro">
          <p className="section-eyebrow">{home.servicePreviewEyebrow}</p>
          <h2>{copy.servicePreviewTitle}</h2>
          <p style={{ margin: 0, fontSize: '16px', lineHeight: 1.8, color: 'var(--text-muted)', maxWidth: '480px' }}>
            {copy.servicePreviewDescription}
          </p>
          <Link to={home.primaryCtaHref} className="button button--primary" style={{ marginTop: '8px' }}>
            {home.primaryCtaLabel}
          </Link>
        </div>

        <ServicePreviewSlider items={featuredServices} />
      </section>
    ),
    positioning: (
      <section className="home-section">
        <div className="home-section__intro home-section__intro--center">
          <h2>{copy.positioningTitle}</h2>
        </div>

        <Section2Slider slides={positioningSlides} />

        <div style={{ textAlign: 'center', marginTop: '24px' }}>
          <p className="home-section__summary" style={{ fontSize: '14px', color: 'var(--text-muted)' }}>
            {copy.positioningDescription}
          </p>
        </div>
      </section>
    ),
    'portfolio-preview': (
      <section className="home-section">
        <div className="home-section__intro home-section__intro--split">
          <div className="home-section__intro-left">
            <h2>{copy.portfolioPreviewTitle}</h2>
            <Link to={home.secondaryCtaHref} className="button button--light" style={{ padding: '0 32px', height: '48px' }}>
              {home.secondaryCtaLabel}
            </Link>
          </div>
          <div className="home-section__summary" style={{ alignSelf: 'flex-start' }}>
            <p>{copy.portfolioPreviewDescription}</p>
          </div>
        </div>

        <div className="home-grid-gallery">
          {galleryCases.map((item, index) => (
            <div key={item.slug} className="home-grid-gallery__item">
              <img src={item.coverImageUrl || home.heroImageUrl} alt={item.title || `포트폴리오 ${index + 1}`} />
            </div>
          ))}
        </div>
      </section>
    ),
    'resources-preview': (
      <section className="home-section">
        <div className="home-section__intro">
          <h2>{copy.resourcesPreviewTitle}</h2>
          <div className="home-section__summary">
            <p>{copy.resourcesPreviewDescription}</p>
          </div>
        </div>

        <div className="home-review-grid">
          {resourcesPreview.map((resource) => (
            <div key={resource.slug} className="home-review-card">
              <div className="home-review-card__image">
                <img src={resource.coverImageUrl} alt={resource.title} />
              </div>
              <div className="home-review-card__body">
                <h4>{resource.title}</h4>
                <p>{resource.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    partners: (
      <section className="home-section">
        <div className="home-section__intro home-section__intro--center">
          <h2>{copy.processTitle}</h2>
          <div className="home-section__summary">
            <p>{copy.processDescription}</p>
          </div>
        </div>

        <div className="home-logo-marquee-group">
          <div className="home-logo-marquee home-logo-marquee--left">
            <div className="home-logo-marquee__track">
              {buildPartnerTrack(topPartnerRow).map((item, index) => (
                <div key={`top-${item.name}-${index}`} className="home-logo-marquee__item">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.name || '협력업체 로고'} />
                  ) : (
                    <span>{item.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="home-logo-marquee home-logo-marquee--right">
            <div className="home-logo-marquee__track">
              {buildPartnerTrack(bottomPartnerRow).map((item, index) => (
                <div key={`bottom-${item.name}-${index}`} className="home-logo-marquee__item">
                  {item.logoUrl ? (
                    <img src={item.logoUrl} alt={item.name || '협력업체 로고'} />
                  ) : (
                    <span>{item.name}</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    ),
    cta: (
      <section className="home-section home-section--last">
        <motion.article {...fadeUp} className="home-cta-banner home-cta-banner--centered">
          <img src={ctaImageUrl} alt="상담 문의 배너" className="home-cta-banner__image" />
          <div className="home-cta-banner__overlay">
            <h2 style={{ fontSize: '32px', fontWeight: 600 }}>{copy.ctaTitle}</h2>
            <p style={{ fontSize: '14px', letterSpacing: '0.02em', opacity: 0.9 }}>{copy.ctaDescription}</p>
            <div className="home-hero__actions" style={{ marginTop: '24px' }}>
              <Link to="/contact" className="button button--ghost" style={{ minWidth: '160px', borderColor: 'rgba(255,255,255,0.3)' }}>
                {home.ctaButtonLabel}
              </Link>
              <Link to={home.secondaryCtaHref} className="button button--ghost" style={{ minWidth: '160px', borderColor: 'rgba(255,255,255,0.3)' }}>
                {home.secondaryCtaLabel}
              </Link>
            </div>
          </div>
        </motion.article>
      </section>
    ),
  };

  return (
    <>
      <PageMeta title="메인" description={copy.heroDescription} />
      {layoutSections
        .filter((section) => section.visible)
        .map((section) => (
          <Fragment key={section.id}>{blocks[section.id as keyof typeof blocks]}</Fragment>
        ))}
    </>
  );
}
