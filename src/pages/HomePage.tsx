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
import { Link, NavLink } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { SectionHeading } from '../components/SectionHeading';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';

type ServicePreviewSlide = {
  title: string;
  description: string;
  imageUrl: string;
};

type HeroBannerSlide = {
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

function HomeHeroSlider({
  slides,
  eyebrow,
  badge,
}: {
  slides: HeroBannerSlide[];
  eyebrow: string;
  badge: string;
}) {
  const transitionDurationMs = 1380;
  const autoplayDelayMs = 8200;
  const [current, setCurrent] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [transitionState, setTransitionState] = useState<{
    from: number;
    to: number;
    direction: 1 | -1;
    phase: 'setup' | 'animating';
  } | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    deltaX: 0,
    dragging: false,
  });

  useEffect(() => {
    setCurrent((value) => Math.min(value, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    slides.forEach((slide) => {
      if (!slide.imageUrl) {
        return;
      }

      const image = new Image();
      image.src = slide.imageUrl;
    });
  }, [slides]);

  useEffect(() => {
    if (!transitionState || transitionState.phase !== 'setup') {
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setTransitionState((currentTransition) =>
        currentTransition ? { ...currentTransition, phase: 'animating' } : null,
      );
    });

    return () => window.cancelAnimationFrame(frame);
  }, [transitionState]);

  useEffect(() => {
    if (!transitionState || transitionState.phase !== 'animating') {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrent(transitionState.to);
      setTransitionState(null);
      setDragOffset(0);
    }, transitionDurationMs);

    return () => window.clearTimeout(timer);
  }, [transitionDurationMs, transitionState]);

  const startTransition = useCallback(
    (nextIndex: number, direction: 1 | -1) => {
      if (slides.length < 2 || nextIndex === current || transitionState) {
        return;
      }

      setTransitionState({
        from: current,
        to: nextIndex,
        direction,
        phase: 'setup',
      });
    },
    [current, slides.length, transitionState],
  );

  useEffect(() => {
    if (slides.length < 2 || transitionState || isHovering || isDragging) {
      return;
    }

    const timer = window.setTimeout(() => {
      startTransition((current + 1) % slides.length, 1);
    }, autoplayDelayMs);

    return () => window.clearTimeout(timer);
  }, [autoplayDelayMs, current, isDragging, isHovering, slides.length, startTransition, transitionState]);

  const prev = useCallback(() => {
    startTransition(current === 0 ? slides.length - 1 : current - 1, -1);
  }, [current, slides.length, startTransition]);

  const next = useCallback(() => {
    startTransition((current + 1) % slides.length, 1);
  }, [current, slides.length, startTransition]);

  const goTo = useCallback(
    (index: number) => {
      if (index === current) {
        return;
      }

      const forwardDistance = (index - current + slides.length) % slides.length;
      const backwardDistance = (current - index + slides.length) % slides.length;
      startTransition(index, forwardDistance <= backwardDistance ? 1 : -1);
    },
    [current, slides.length, startTransition],
  );

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (slides.length < 2 || transitionState) {
      return;
    }

    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      deltaX: 0,
      dragging: true,
    };

    viewport.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, [slides.length, transitionState]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) {
      return;
    }

    const viewport = viewportRef.current;
    const viewportWidth = viewport?.clientWidth || 1;
    const nextOffset = event.clientX - dragRef.current.startX;
    const clampedOffset = Math.max(-viewportWidth * 0.92, Math.min(viewportWidth * 0.92, nextOffset));

    dragRef.current.deltaX = clampedOffset;
    setDragOffset(clampedOffset);
  }, []);

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const viewport = viewportRef.current;

    if (!viewport || !dragRef.current.dragging) {
      return;
    }

    if (dragRef.current.pointerId === event.pointerId) {
      viewport.releasePointerCapture(event.pointerId);
    }

    const deltaX = dragRef.current.deltaX;
    const threshold = Math.max(60, viewport.clientWidth * 0.12);

    dragRef.current.dragging = false;
    setIsDragging(false);
    setDragOffset(0);

    if (Math.abs(deltaX) < threshold) {
      return;
    }

    if (deltaX < 0) {
      startTransition((current + 1) % slides.length, 1);
      return;
    }

    startTransition(current === 0 ? slides.length - 1 : current - 1, -1);
  }, [current, slides.length, startTransition]);

  if (!slides[0]) {
    return null;
  }

  const previousIndex = current === 0 ? slides.length - 1 : current - 1;
  const nextIndex = (current + 1) % slides.length;
  const idleIndices = Array.from(new Set([previousIndex, nextIndex, current]));

  return (
    <section className="home-hero">
      <div
        className="home-hero-slider"
        role="region"
        aria-roledescription="carousel"
        aria-label="메인 히어로 배너"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        <div
          ref={viewportRef}
          className={`home-hero-slider__viewport${isDragging ? ' is-dragging' : ''}`}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerEnd}
          onPointerCancel={handlePointerEnd}
        >
          {transitionState
            ? [transitionState.from, transitionState.to].map((index) => {
                const slide = slides[index];
                const isActive = index === transitionState.to;
                const isIncoming = index === transitionState.to;
                const transform =
                  transitionState.phase === 'setup'
                    ? isIncoming
                      ? `translate3d(${transitionState.direction === 1 ? '100%' : '-100%'}, 0, 0)`
                      : 'translate3d(0, 0, 0)'
                    : isIncoming
                      ? 'translate3d(0, 0, 0)'
                      : `translate3d(${transitionState.direction === 1 ? '-100%' : '100%'}, 0, 0)`;

                return (
                  <article
                    key={`${slide.title}-${index}`}
                    className={`home-hero__frame home-hero__slide home-hero--centered${isActive ? ' is-active' : ''}`}
                    style={{
                      transform,
                      transition:
                        transitionState.phase === 'animating'
                          ? `transform ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
                          : 'none',
                      zIndex: isIncoming ? 3 : 2,
                    }}
                    aria-hidden={!isActive}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || '메인 비주얼'}
                      className="home-hero__image"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                    <div className="home-hero__overlay">
                      <p className="home-hero__eyebrow">{eyebrow}</p>
                      <h1 style={{ whiteSpace: 'pre-line' }}>{slide.title}</h1>
                      <p>{slide.description}</p>
                      <p className="home-hero__badge">{badge}</p>
                    </div>
                  </article>
                );
              })
            : idleIndices.map((index) => {
                const slide = slides[index];
                const transform =
                  index === current
                    ? `translate3d(${dragOffset}px, 0, 0)`
                    : index === previousIndex
                      ? `translate3d(calc(-100% + ${dragOffset}px), 0, 0)`
                      : `translate3d(calc(100% + ${dragOffset}px), 0, 0)`;

                return (
                  <article
                    key={`${slide.title}-${index}`}
                    className={`home-hero__frame home-hero__slide home-hero--centered${index === current ? ' is-active' : ''}`}
                    style={{
                      transform,
                      transition: isDragging ? 'none' : 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
                      zIndex: index === current ? 3 : 2,
                    }}
                    aria-hidden={index !== current}
                  >
                    <img
                      src={slide.imageUrl}
                      alt={slide.title || '메인 비주얼'}
                      className="home-hero__image"
                      loading={index === 0 ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                    <div className="home-hero__overlay">
                      <p className="home-hero__eyebrow">{eyebrow}</p>
                      <h1 style={{ whiteSpace: 'pre-line' }}>{slide.title}</h1>
                      <p>{slide.description}</p>
                      <p className="home-hero__badge">{badge}</p>
                    </div>
                  </article>
                );
              })}
        </div>

        {slides.length > 1 ? (
          <div className="home-hero-slider__nav">
            <div className="home-hero-slider__dots" aria-label="메인 히어로 슬라이드 선택">
              {slides.map((slide, index) => (
                <button
                  key={`${slide.title}-${index}`}
                  type="button"
                  className={`home-hero-slider__dot${index === current ? ' is-active' : ''}`}
                  aria-label={`${index + 1}번 배너 보기`}
                  aria-pressed={index === current}
                  onClick={() => goTo(index)}
                />
              ))}
            </div>
            <div className="home-hero-slider__actions">
              <button type="button" className="home-slider__arrow" onClick={prev} aria-label="이전 메인 배너">
                <ArrowLeft size={20} />
              </button>
              <button type="button" className="home-slider__arrow" onClick={next} aria-label="다음 메인 배너">
                <ArrowRight size={20} />
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </section>
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
          borderRadius: 0,
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
              <div className="home-slider__aspect" style={{ overflow: 'hidden', position: 'relative' }}>
                <img
                  src={slide.img}
                  alt={slide.title}
                  draggable={false}
                  style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', pointerEvents: 'none' }}
                />
                <div
                  className="home-slider__overlay-content"
                  style={{
                    position: 'absolute',
                    inset: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'flex-end',
                    padding: '40px',
                    color: '#fff',
                    background: 'linear-gradient(0deg, rgba(0,0,0,0.7), rgba(0,0,0,0.08) 56%, rgba(0,0,0,0.02))',
                  }}
                >
                  <div style={{ display: 'grid', gap: '10px' }}>
                    <strong style={{ fontSize: 'clamp(24px, 3vw, 36px)', lineHeight: 1.15 }}>{slide.title}</strong>
                    <p className="home-slider__desc-text" style={{ margin: 0, maxWidth: '720px', fontSize: '15px', lineHeight: 1.8, opacity: 0.86 }}>{slide.desc}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
        {/* Dots inside image */}
        <div
          className="home-slider__dots-container"
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
                borderRadius: 0,
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

function PortfolioSlider({ items }: { items: { slug: string; title: string; coverImageUrl?: string }[] }) {
  const { siteContent } = useSiteContent();
  const primaryHeroImageUrl = siteContent.home.heroImageUrl;
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({
    pointerId: -1,
    startX: 0,
    startScrollLeft: 0,
    dragging: false,
  });

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track) return;
    
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      dragging: true,
    };
    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    const track = trackRef.current;
    if (!track) return;
    
    const deltaX = event.clientX - dragRef.current.startX;
    track.scrollLeft = dragRef.current.startScrollLeft - deltaX;
  }, []);

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);
    if (trackRef.current) {
      trackRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  return (
    <div className="portfolio-slider-container">
      <div 
        ref={trackRef}
        className={`portfolio-slider${isDragging ? ' is-dragging' : ''}`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        {items.map((item, index) => (
          <div key={item.slug} className="portfolio-slider__item">
            <div className="portfolio-slider__card">
              <img src={item.coverImageUrl || primaryHeroImageUrl} alt={item.title || `포트폴리오 ${index + 1}`} draggable={false} />
              <div className="portfolio-slider__overlay">
                <strong>{item.title}</strong>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function HomePage() {
  const { siteCopy, siteContent } = useSiteContent();
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
  const heroSlides = (Array.isArray(home.heroSlides) ? home.heroSlides : [])
    .map((slide, index) => ({
      title: String(slide?.title || '').trim() || copy.heroTitle,
      description: String(slide?.description || '').trim() || copy.heroDescription,
      imageUrl:
        String(slide?.imageUrl || '').trim() ||
        home.heroImageUrl ||
        placeholderImages[index % placeholderImages.length],
    }))
    .filter((slide) => slide.title || slide.description || slide.imageUrl);
  const resolvedHeroSlides =
    heroSlides.length > 0
      ? heroSlides
      : [
          {
            title: copy.heroTitle,
            description: copy.heroDescription,
            imageUrl: home.heroImageUrl || placeholderImages[0],
          },
        ];
  const primaryHeroImageUrl = resolvedHeroSlides[0]?.imageUrl || home.heroImageUrl || placeholderImages[0];
  const servicePreviewImageUrl =
    home.servicePreviewImageUrl ||
    siteContent.about.heroImageUrl ||
    siteContent.services.heroImageUrl ||
    placeholderImages[1];

  const positioningSource = home.positioningCards.length > 0 ? home.positioningCards : featuredServices;
  const positioningSlides = positioningSource.map((item, index) => ({
    img: item.imageUrl || placeholderImages[index % placeholderImages.length],
    title: item.title,
    desc: item.description,
  }));
  const ctaImageUrl = home.ctaImageUrl || siteContent.contact.heroImageUrl || primaryHeroImageUrl;
  const galleryCases = siteContent.cases.entries.slice(0, 3);
  const resourcesPreview = siteContent.resources.items.slice(0, 3);
  const partnerLogos = home.partnerLogos.filter((item) => item.logoUrl || item.name);
  const midpoint = Math.max(1, Math.ceil(partnerLogos.length / 2));
  const topPartnerRow = partnerLogos.slice(0, midpoint);
  const bottomPartnerRow = partnerLogos.slice(midpoint).length > 0 ? partnerLogos.slice(midpoint) : partnerLogos.slice(0, midpoint);
  const buildPartnerTrack = (items: typeof partnerLogos) => [...items, ...items];
  const sections = {
    hero: (
      <HomeHeroSlider slides={resolvedHeroSlides} eyebrow={heroEyebrow} badge={home.heroBadge} />
    ),
    'service-preview': (
      <section className="home-slogan-section">
        <div className="home-slogan-section__inner">
          <motion.div {...fadeUp} className="hero-slogan-side">
            <span className="hero-slogan__label">{home.servicePreviewEyebrow || 'SLOGAN'}</span>
            <h2 className="hero-slogan__main-text" style={{ whiteSpace: 'pre-line' }}>
              {copy.servicePreviewTitle}
            </h2>
            <p className="hero-slogan__description">{copy.servicePreviewDescription}</p>
            <Link to={home.primaryCtaHref} className="home-outline-button hero-slogan__button">
              {home.primaryCtaLabel}
            </Link>
          </motion.div>
          <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="hero-image-side"
          >
            <img 
              src={servicePreviewImageUrl}
              alt={copy.servicePreviewTitle || '서비스 프리뷰 이미지'}
            />
          </motion.div>
        </div>
      </section>
    ),
    positioning: (
      <section className="home-section">
        <div className="home-section__intro" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '24px',
          width: '100%'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(30px, 4vw, 44px)', 
            fontWeight: 400, 
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--text-strong)'
          }}>
            {copy.positioningTitle || '대전 MICE'}
          </h2>
          <NavLink to="/services" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '16px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </NavLink>
        </div>

        <Section2Slider slides={positioningSlides} />
      </section>
    ),
    'portfolio-preview': (
      <section className="home-section">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '24px',
          width: '100%'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(30px, 4vw, 44px)', 
            fontWeight: 400, 
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--text-strong)'
          }}>
            {copy.portfolioPreviewTitle}
          </h2>
          <NavLink to={home.secondaryCtaHref} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '16px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </NavLink>
        </div>

        <PortfolioSlider items={galleryCases} />
      </section>
    ),
    'resources-preview': (
      <section className="home-section">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '24px',
          width: '100%'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(30px, 4vw, 44px)', 
            fontWeight: 400, 
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--text-strong)'
          }}>
            {copy.resourcesPreviewTitle}
          </h2>
          <NavLink to="/resources" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '16px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </NavLink>
        </div>

        <div className="home-review-grid">
          {resourcesPreview.map((resource) => (
            <div key={resource.slug} className="home-review-card">
              <div className="home-review-card__image">
                <img src={resource.coverImageUrl} alt={resource.title} />
              </div>
              <div className="home-review-card__body">
                <h4>{resource.title}</h4>
                {resource.updatedAt && (
                  <span className="home-review-card__date">{resource.updatedAt.replaceAll('-', '. ')}</span>
                )}
                <p>{resource.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    ),
    partners: (
      <section className="home-section">
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          gap: '24px',
          width: '100%'
        }}>
          <h2 style={{ 
            fontSize: 'clamp(30px, 4vw, 44px)', 
            fontWeight: 400, 
            letterSpacing: '-0.04em',
            margin: 0,
            color: 'var(--text-strong)'
          }}>
            {copy.processTitle}
          </h2>
          <NavLink to="/members" style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '16px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </NavLink>
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
        <motion.article {...fadeUp} className="home-simple-cta">
          <h2>고객센터</h2>
          <div className="home-simple-cta__actions">
            <Link to="/contact" className="home-simple-cta__button">
              1:1 문의하기
            </Link>
          </div>
        </motion.article>
      </section>
    ),
  };

  return (
    <>
      <PageMeta title="메인" description={resolvedHeroSlides[0]?.description || copy.heroDescription} />
      {Object.entries(sections).map(([sectionKey, section]) => (
        <Fragment key={sectionKey}>{section}</Fragment>
      ))}
    </>
  );
}
