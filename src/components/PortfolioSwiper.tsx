import { useCallback, useEffect, useRef, useState } from 'react';
import { PublicPortfolioItem } from '../lib/api';
import { href } from '../lib/hooks';

interface PortfolioSwiperProps {
  items: PublicPortfolioItem[];
  title?: string;
  eyebrow?: string;
  autoPlayMs?: number;
}

export function PortfolioSwiper({
  items,
  title = 'Projectos entregues',
  eyebrow = 'Portfólio',
  autoPlayMs = 5200,
}: PortfolioSwiperProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [activeIdx, setActiveIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const dragStartX = useRef(0);
  const dragScrollLeft = useRef(0);

  const total = items.length;

  const scrollToIndex = useCallback(
    (index: number) => {
      const container = trackRef.current;
      if (!container || total === 0) return;
      const safeIdx = ((index % total) + total) % total;
      const card = container.children[safeIdx] as HTMLElement | undefined;
      if (card) {
        const left = card.offsetLeft - Math.max(0, (container.clientWidth - card.clientWidth) / 2);
        container.scrollTo({ left, behavior: 'smooth' });
      }
      setActiveIdx(safeIdx);
    },
    [total]
  );

  // Detectar cartão centrado ao deslizar / scroll horizontal
  useEffect(() => {
    const container = trackRef.current;
    if (!container || total === 0) return;
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const center = container.scrollLeft + container.clientWidth / 2;
        let closest = 0;
        let minDist = Infinity;
        Array.from(container.children).forEach((el, idx) => {
          const node = el as HTMLElement;
          const nodeCenter = node.offsetLeft + node.clientWidth / 2;
          const dist = Math.abs(center - nodeCenter);
          if (dist < minDist) {
            minDist = dist;
            closest = idx;
          }
        });
        setActiveIdx(closest);
      });
    };
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener('scroll', onScroll);
    };
  }, [total]);

  // Auto-play fluido (pausa ao passar o rato ou arrastar)
  useEffect(() => {
    if (paused || isDragging || total <= 1 || autoPlayMs <= 0) return;
    const timer = setInterval(() => {
      scrollToIndex(activeIdx + 1);
    }, autoPlayMs);
    return () => clearInterval(timer);
  }, [paused, isDragging, total, autoPlayMs, activeIdx, scrollToIndex]);

  const handleMouseDown = (e: React.MouseEvent) => {
    const container = trackRef.current;
    if (!container) return;
    setIsDragging(true);
    dragStartX.current = e.pageX - container.offsetLeft;
    dragScrollLeft.current = container.scrollLeft;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !trackRef.current) return;
    e.preventDefault();
    const x = e.pageX - trackRef.current.offsetLeft;
    const walk = (x - dragStartX.current) * 1.35;
    trackRef.current.scrollLeft = dragScrollLeft.current - walk;
  };

  const endDrag = () => setIsDragging(false);

  if (total === 0) return null;

  return (
    <div
      className="relative select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => {
        setPaused(false);
        endDrag();
      }}
    >
      {(eyebrow || title) && (
        <div className="mb-8">
          {eyebrow && <p className="eyebrow">{eyebrow}</p>}
          {title && (
            <h3 className="mt-1.5 font-display text-2xl sm:text-3xl font-semibold tracking-tight text-fg">
              {title}
            </h3>
          )}
        </div>
      )}

      {/* Pista horizontal contínua: deslize natural sem botões manuais, sem bordas pesadas e sem ícones excessivos */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={endDrag}
        className={`flex gap-8 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4 pt-1 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
        style={{ scrollPaddingInline: '1rem' }}
      >
        {items.map((proj, idx) => {
          const isActive = idx === activeIdx;
          return (
            <article
              key={proj.slug}
              onClick={() => {
                if (!isActive) scrollToIndex(idx);
              }}
              className={`group relative snap-center shrink-0 w-[84vw] sm:w-[440px] lg:w-[500px] flex flex-col transition-all duration-700 ease-out ${
                isActive ? 'opacity-100 scale-100' : 'opacity-65 scale-[0.96] hover:opacity-90'
              }`}
            >
              {/* Imagem editorial limpa em destaque */}
              <a
                href={href('portfolio', proj.slug)}
                draggable={false}
                className="card-sheen relative block h-64 sm:h-72 w-full overflow-hidden bg-gradient-to-br from-blue/12 via-card to-cyan-500/8"
              >
                {proj.image ? (
                  <img
                    src={proj.image}
                    alt={proj.title}
                    loading="lazy"
                    draggable={false}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <span className="font-display text-3xl font-bold tracking-tight text-fg/20">
                      {proj.title.slice(0, 2).toUpperCase()}
                    </span>
                  </div>
                )}
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <span className="absolute left-5 bottom-4 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
                  {proj.category}
                </span>
                {proj.metrics && (
                  <span className="absolute right-5 bottom-4 text-xs font-semibold text-sky-300">
                    {proj.metrics}
                  </span>
                )}
              </a>

              {/* Linha de progresso subtil no cartão ativo */}
              <div className="h-[2px] w-full bg-line/30 overflow-hidden">
                {isActive && !paused && total > 1 && (
                  <div
                    key={`${activeIdx}-${proj.slug}`}
                    className="h-full w-full bg-blue animate-slide-progress"
                  />
                )}
              </div>

              {/* Conteúdo editorial sem caixas nem ícones desnecessários */}
              <div className="flex flex-1 flex-col pt-5">
                {proj.client && (
                  <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-muted">
                    {proj.client}
                  </p>
                )}
                <a href={href('portfolio', proj.slug)} draggable={false}>
                  <h4 className="mt-1.5 font-display text-xl sm:text-2xl font-semibold leading-snug text-fg transition-colors group-hover:text-blue">
                    {proj.title}
                  </h4>
                </a>
                {proj.description && (
                  <p className="mt-2 text-sm leading-relaxed text-muted line-clamp-2">
                    {proj.description}
                  </p>
                )}

                {proj.tags.length > 0 && (
                  <p className="mt-3 text-xs text-muted/80">
                    {proj.tags.slice(0, 4).join(' · ')}
                  </p>
                )}

                <div className="mt-4 flex items-center gap-5 text-xs font-semibold">
                  <a
                    href={href('portfolio', proj.slug)}
                    draggable={false}
                    className="text-blue hover:underline underline-offset-4"
                  >
                    Ver projecto →
                  </a>
                  {proj.link && (
                    <a
                      href={proj.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      draggable={false}
                      className="text-muted hover:text-fg transition-colors"
                    >
                      Visitar ↗
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
