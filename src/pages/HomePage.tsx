import { ArrowLeft, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  Fragment,
  useState,
  useCallback,
  useEffect,
  useRef,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react';
import { Link } from 'react-router-dom';
import { PageMeta } from '../components/PageMeta';
import { SectionHeading } from '../components/SectionHeading';
import { useSiteContent } from '../context/SiteContentContext';
import { fadeUp } from '../lib/motion';
import {
  createOrganizationJsonLd,
  createWebSiteJsonLd,
  truncateText,
} from '../lib/seo';

type ServicePreviewSlide = {
  title: string;
  description: string;
  imageUrl: string;
};

type HeroBannerSlide = {
  title: string;
  description: string;
  imageUrl: string;
  mobileImageUrl: string;
  linkUrl: string;
  hasText: boolean;
};

function resolveHeroSlideLink(linkUrl: string) {
  const trimmedLink = String(linkUrl || '').trim();

  if (!trimmedLink || /^(javascript|data):/i.test(trimmedLink)) {
    return '';
  }

  if (
    trimmedLink.startsWith('/') ||
    trimmedLink.startsWith('#') ||
    /^(https?:\/\/|mailto:|tel:)/i.test(trimmedLink)
  ) {
    return trimmedLink;
  }

  if (/^[\w/-]+$/i.test(trimmedLink) && !trimmedLink.includes('.')) {
    return `/${trimmedLink.replace(/^\/+/, '')}`;
  }

  return `https://${trimmedLink}`;
}

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

function HeroSlideMedia({ slide, priority }: { slide: HeroBannerSlide; priority: boolean }) {
  const altText = slide.title || '메인 비주얼';

  return (
    <picture className="home-hero__media">
      {slide.mobileImageUrl ? <source media="(max-width: 768px)" srcSet={slide.mobileImageUrl} /> : null}
      <img
        src={slide.imageUrl}
        alt={altText}
        className="home-hero__image"
        loading={priority ? 'eager' : 'lazy'}
        decoding="async"
      />
    </picture>
  );
}

function HeroSlideOverlay({
  slide,
  eyebrow,
  badge,
}: {
  slide: HeroBannerSlide;
  eyebrow: string;
  badge: string;
}) {
  if (!slide.hasText) {
    return null;
  }

  return (
    <div className="home-hero__overlay">
      {eyebrow ? <p className="home-hero__eyebrow">{eyebrow}</p> : null}
      {slide.title ? <h1 style={{ whiteSpace: 'pre-line' }}>{slide.title}</h1> : null}
      {slide.description ? <p>{slide.description}</p> : null}
      {badge ? <p className="home-hero__badge">{badge}</p> : null}
    </div>
  );
}

function HeroSlideContent({
  slide,
  priority,
  eyebrow,
  badge,
}: {
  slide: HeroBannerSlide;
  priority: boolean;
  eyebrow: string;
  badge: string;
}) {
  return (
    <>
      <HeroSlideMedia slide={slide} priority={priority} />
      <HeroSlideOverlay slide={slide} eyebrow={eyebrow} badge={badge} />
    </>
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
  const autoplayDelayMs = 4000;
  const clickNavigationThreshold = 12;
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
    pointerType: 'mouse',
    startX: 0,
    deltaX: 0,
    dragging: false,
  });
  const suppressClickRef = useRef(false);

  const getDragThreshold = useCallback((viewportWidth: number, pointerType: string) => {
    if (pointerType === 'mouse') {
      return Math.max(28, Math.min(72, viewportWidth * 0.06));
    }

    return Math.max(48, Math.min(110, viewportWidth * 0.1));
  }, []);

  useEffect(() => {
    setCurrent((value) => Math.min(value, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    slides.forEach((slide) => {
      [slide.imageUrl, slide.mobileImageUrl].filter(Boolean).forEach((url) => {
        const image = new Image();
        image.src = url;
      });
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
      pointerType: event.pointerType || 'mouse',
      startX: event.clientX,
      deltaX: 0,
      dragging: true,
    };
    suppressClickRef.current = false;

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
    if (Math.abs(clampedOffset) >= clickNavigationThreshold) {
      suppressClickRef.current = true;
    }
    setDragOffset(clampedOffset);
  }, [clickNavigationThreshold]);

  const navigateToSlideLink = useCallback((linkUrl: string) => {
    const resolvedLink = resolveHeroSlideLink(linkUrl);

    if (!resolvedLink || typeof window === 'undefined') {
      return;
    }

    window.location.assign(resolvedLink);
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
    const threshold = getDragThreshold(viewport.clientWidth, dragRef.current.pointerType);

    dragRef.current.dragging = false;
    setIsDragging(false);
    setDragOffset(0);

    if (event.type === 'pointercancel') {
      return;
    }

    if (Math.abs(deltaX) < threshold) {
      return;
    }

    if (deltaX < 0) {
      startTransition((current + 1) % slides.length, 1);
      return;
    }

    startTransition(current === 0 ? slides.length - 1 : current - 1, -1);
  }, [current, getDragThreshold, slides.length, startTransition]);

  const handleSlideClick = useCallback(
    (linkUrl: string) => {
      const resolvedLink = resolveHeroSlideLink(linkUrl);

      if (!resolvedLink || transitionState || suppressClickRef.current) {
        suppressClickRef.current = false;
        return;
      }

      navigateToSlideLink(resolvedLink);
    },
    [navigateToSlideLink, transitionState],
  );

  const handleViewportClick = useCallback(() => {
    handleSlideClick(slides[current]?.linkUrl || '');
  }, [current, handleSlideClick, slides]);

  const handleSlideKeyDown = useCallback(
    (event: ReactKeyboardEvent<HTMLElement>, linkUrl: string) => {
      if (!linkUrl) {
        return;
      }

      if (event.key !== 'Enter' && event.key !== ' ') {
        return;
      }

      event.preventDefault();
      handleSlideClick(linkUrl);
    },
    [handleSlideClick],
  );

  if (!slides[0]) {
    return null;
  }

  const previousIndex = current === 0 ? slides.length - 1 : current - 1;
  const nextIndex = (current + 1) % slides.length;
  const idleIndices = Array.from(new Set([previousIndex, nextIndex, current]));
  const activeDotIndex = transitionState?.to ?? current;

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
          onClick={handleViewportClick}
        >
          {transitionState
            ? [transitionState.from, transitionState.to].map((index) => {
                const slide = slides[index];
                const isActive = index === transitionState.to;
                const isIncoming = index === transitionState.to;
                const slideLinkUrl = resolveHeroSlideLink(slide.linkUrl);
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
                    className={`home-hero__frame home-hero__slide home-hero--centered${isActive ? ' is-active' : ''}${slideLinkUrl ? ' home-hero__frame--interactive' : ''}`}
                    role={slideLinkUrl ? 'link' : undefined}
                    tabIndex={slideLinkUrl ? (isActive ? 0 : -1) : undefined}
                    style={{
                      transform,
                      transition:
                        transitionState.phase === 'animating'
                          ? `transform ${transitionDurationMs}ms cubic-bezier(0.22, 1, 0.36, 1)`
                          : 'none',
                      zIndex: isIncoming ? 3 : 2,
                    }}
                    aria-hidden={!isActive}
                    aria-label={slideLinkUrl ? (slide.title ? `${slide.title} 페이지로 이동` : '메인 배너 페이지로 이동') : undefined}
                    onKeyDown={slideLinkUrl ? (event) => handleSlideKeyDown(event, slideLinkUrl) : undefined}
                  >
                    <HeroSlideContent
                      slide={slide}
                      priority={index === 0}
                      eyebrow={eyebrow}
                      badge={badge}
                    />
                  </article>
                );
              })
            : idleIndices.map((index) => {
                const slide = slides[index];
                const slideLinkUrl = resolveHeroSlideLink(slide.linkUrl);
                const isCurrentSlide = index === current;
                const transform =
                  isCurrentSlide
                    ? `translate3d(${dragOffset}px, 0, 0)`
                    : index === previousIndex
                      ? `translate3d(calc(-100% + ${dragOffset}px), 0, 0)`
                      : `translate3d(calc(100% + ${dragOffset}px), 0, 0)`;

                return (
                  <article
                    key={`${slide.title}-${index}`}
                    className={`home-hero__frame home-hero__slide home-hero--centered${isCurrentSlide ? ' is-active' : ''}${slideLinkUrl ? ' home-hero__frame--interactive' : ''}`}
                    role={slideLinkUrl ? 'link' : undefined}
                    tabIndex={slideLinkUrl ? (isCurrentSlide ? 0 : -1) : undefined}
                    style={{
                      transform,
                      transition: isDragging ? 'none' : 'transform 620ms cubic-bezier(0.22, 1, 0.36, 1)',
                      zIndex: isCurrentSlide ? 3 : 2,
                    }}
                    aria-hidden={!isCurrentSlide}
                    aria-label={slideLinkUrl ? (slide.title ? `${slide.title} 페이지로 이동` : '메인 배너 페이지로 이동') : undefined}
                    onKeyDown={slideLinkUrl ? (event) => handleSlideKeyDown(event, slideLinkUrl) : undefined}
                  >
                    <HeroSlideContent
                      slide={slide}
                      priority={index === 0}
                      eyebrow={eyebrow}
                      badge={badge}
                    />
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
                  className={`home-hero-slider__dot${index === activeDotIndex ? ' is-active' : ''}`}
                  aria-label={`${index + 1}번 배너 보기`}
                  aria-pressed={index === activeDotIndex}
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
  const autoplayDelayMs = 4000;
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

  useEffect(() => {
    setCurrent((value) => Math.min(value, Math.max(slides.length - 1, 0)));
  }, [slides.length]);

  useEffect(() => {
    if (slides.length < 2 || isDragging) {
      return;
    }

    const timer = window.setTimeout(() => {
      setCurrent((value) => (value === slides.length - 1 ? 0 : value + 1));
    }, autoplayDelayMs);

    return () => window.clearTimeout(timer);
  }, [autoplayDelayMs, current, isDragging, slides.length]);

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
    <div className="home-slider-container section2-slider" style={{ position: 'relative' }}>
      <div
        className="section2-slider__viewport"
        style={{
          position: 'relative',
          overflow: 'hidden',
          userSelect: 'none',
          WebkitUserSelect: 'none',
        }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerEnd}
        onPointerCancel={handlePointerEnd}
      >
        <div
          className={`section2-slider__track${isDragging ? ' is-dragging' : ''}`}
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
        {slides.length > 1 ? (
          <>
            <div
              className="home-slider__dots-container home-hero-slider__dots section2-slider__dots"
              style={{
                position: 'absolute',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                zIndex: 10,
              }}
              aria-label="대전 MICE 슬라이드 선택"
            >
              {slides.map((slide, i) => (
                <button
                  key={`${slide.title}-${i}`}
                  type="button"
                  className={`home-hero-slider__dot${i === current ? ' is-active' : ''}`}
                  onClick={() => setCurrent(i)}
                  aria-label={`${i + 1}번 슬라이드 보기`}
                  aria-pressed={i === current}
                />
              ))}
            </div>
          </>
        ) : null}
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
    deltaX: 0,
    dragging: false,
  });

  const isMobilePortfolioSlider = useCallback(() => {
    if (typeof window === 'undefined') {
      return false;
    }

    return window.innerWidth <= 768;
  }, []);

  const handlePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const track = trackRef.current;
    if (!track || !isMobilePortfolioSlider()) return;
    
    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startScrollLeft: track.scrollLeft,
      deltaX: 0,
      dragging: true,
    };
    track.setPointerCapture(event.pointerId);
    setIsDragging(true);
  }, [isMobilePortfolioSlider]);

  const handlePointerMove = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging || !isMobilePortfolioSlider()) return;
    const track = trackRef.current;
    if (!track) return;
    
    const deltaX = event.clientX - dragRef.current.startX;
    dragRef.current.deltaX = deltaX;
    track.scrollLeft = dragRef.current.startScrollLeft - deltaX;
  }, [isMobilePortfolioSlider]);

  const handlePointerEnd = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.dragging) return;
    dragRef.current.dragging = false;
    setIsDragging(false);
    if (trackRef.current) {
      trackRef.current.releasePointerCapture(event.pointerId);
    }
  }, []);

  const handleCardClick = useCallback((event: ReactMouseEvent<HTMLAnchorElement>) => {
    if (Math.abs(dragRef.current.deltaX) > 8) {
      event.preventDefault();
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
            <Link to={`/cases/${item.slug}`} className="portfolio-slider__card" onClick={handleCardClick} aria-label={`${item.title} 상세 보기`}>
              <img src={item.coverImageUrl || primaryHeroImageUrl} alt={item.title || `포트폴리오 ${index + 1}`} draggable={false} />
              <div className="portfolio-slider__overlay">
                <strong>{item.title}</strong>
              </div>
            </Link>
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
    .map((slide, index) => {
      const title = String(slide?.title || '').trim();
      const description = String(slide?.description || '').trim();
      const desktopImageUrl = String(slide?.imageUrl || '').trim();
      const mobileImageUrl = String(slide?.mobileImageUrl || '').trim();
      const linkUrl = String(slide?.linkUrl || '').trim();
      const fallbackImageUrl = home.heroImageUrl || placeholderImages[index % placeholderImages.length];

      return {
        title,
        description,
        imageUrl: desktopImageUrl || mobileImageUrl || fallbackImageUrl,
        mobileImageUrl: mobileImageUrl || desktopImageUrl || fallbackImageUrl,
        linkUrl,
        hasText: Boolean(title || description),
        isConfigured: Boolean(title || description || desktopImageUrl || mobileImageUrl || linkUrl),
      };
    })
    .filter((slide) => slide.isConfigured)
    .map(({ isConfigured, ...slide }) => slide);
  const resolvedHeroSlides =
    heroSlides.length > 0
      ? heroSlides
      : [
          {
            title: copy.heroTitle,
            description: copy.heroDescription,
            imageUrl: home.heroImageUrl || placeholderImages[0],
            mobileImageUrl: home.heroImageUrl || placeholderImages[0],
            linkUrl: '',
            hasText: Boolean(String(copy.heroTitle || '').trim() || String(copy.heroDescription || '').trim()),
          },
        ];
  const primaryHeroImageUrl =
    resolvedHeroSlides[0]?.imageUrl || resolvedHeroSlides[0]?.mobileImageUrl || home.heroImageUrl || placeholderImages[0];
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
  const servicePreviewHref = home.primaryCtaHref || '/cases';
  const positioningCtaHref = home.positioningCtaHref || '/cases';
  const portfolioPreviewHref = home.secondaryCtaHref || '/cases';
  const resourcesCtaHref = home.resourcesCtaHref || '/resources';
  const partnersCtaHref = home.partnersCtaHref || '/members';
  const finalCtaHref = home.ctaButtonHref || '/faq';
  const finalCtaTitle = copy.ctaTitle || '고객센터';
  const finalCtaDescription = copy.ctaDescription || '';
  const finalCtaLabel = home.ctaButtonLabel || '1:1 문의하기';
  const homeSeoTitle = 'MICE 행사기획·운영 전문';
  const homeSeoDescription = truncateText(
    '마이스파트너는 MICE 행사기획, 컨퍼런스, 포럼, 세미나, 기업행사 운영 사례와 협업 프로세스를 소개합니다.',
  );
  const homeJsonLd = [
    createOrganizationJsonLd({
      description: homeSeoDescription,
      telephone: siteContent.support.phone,
    }),
    createWebSiteJsonLd({
      description: homeSeoDescription,
    }),
  ];
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
            <Link to={servicePreviewHref} className="home-outline-button hero-slogan__button">
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
          <h2 className="home-main-section-title">
            {copy.positioningTitle || '대전 MICE'}
          </h2>
          <Link to={positioningCtaHref} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '15px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </Link>
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
          <h2 className="home-main-section-title">
            {copy.portfolioPreviewTitle}
          </h2>
          <Link to={portfolioPreviewHref} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '15px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </Link>
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
          <h2 className="home-main-section-title">
            {copy.resourcesPreviewTitle}
          </h2>
          <Link to={resourcesCtaHref} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '15px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </Link>
        </div>

        <div className="home-review-grid">
          {resourcesPreview.map((resource) => (
            <div key={resource.slug} className="home-review-card">
              <Link
                to={`/resources/files/${resource.slug}`}
                className="home-review-card__image home-review-card__image-link"
                aria-label={`${resource.title} 상세 보기`}
              >
                <img src={resource.coverImageUrl} alt={resource.title} />
              </Link>
              <div className="home-review-card__body">
                <h4>{resource.title}</h4>
                {resource.updatedAt && (
                  <span className="home-review-card__date">{resource.updatedAt.replaceAll('-', '. ')}</span>
                )}
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
          <h2 className="home-main-section-title">
            {copy.processTitle}
          </h2>
          <Link to={partnersCtaHref} style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            color: '#444444', 
            fontSize: '15px', 
            fontWeight: 500,
            whiteSpace: 'nowrap'
          }}>
            자세히 보기 <ArrowRight size={16} />
          </Link>
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
          <h2>{finalCtaTitle}</h2>
          {finalCtaDescription ? <p className="home-simple-cta__description">{finalCtaDescription}</p> : null}
          <div className="home-simple-cta__actions">
            <Link to={finalCtaHref} className="home-simple-cta__button">
              {finalCtaLabel}
            </Link>
          </div>
        </motion.article>
      </section>
    ),
  };

  return (
    <>
      <PageMeta
        title={homeSeoTitle}
        description={homeSeoDescription}
        canonicalPath="/"
        image={primaryHeroImageUrl}
        jsonLd={homeJsonLd}
      />
      {Object.entries(sections).map(([sectionKey, section]) => (
        <Fragment key={sectionKey}>{section}</Fragment>
      ))}
    </>
  );
}
