import { useEffect, useMemo, useRef, useState } from 'react';
import { COMPANY, PRODUCTS } from '../data/content';
import { fetchPublicProducts, PublicProduct } from '../lib/api';
import { href } from '../lib/hooks';
import { Icon, Reveal } from '../components/ui';
import { Body, Crumbs } from './shared';

type VitrineProduct = {
  slug: string;
  name: string;
  category: string;
  tag: string;
  tagline: string;
  description: string;
  fullDescription: string[];
  features: string[];
  image: string;
  gallery: string[];
  pdfUrl?: string;
  starterPriceValue: string;
  starterPeriod: string;
};

function toVitrineList(dynamic: PublicProduct[]): VitrineProduct[] {
  const dynList: VitrineProduct[] = dynamic.map((p) => ({
    slug: p.slug,
    name: p.name,
    category: p.category,
    tag: p.tag,
    tagline: p.tagline,
    description: p.description,
    fullDescription: p.fullDescription,
    features: p.features,
    image: p.image,
    gallery: p.gallery && p.gallery.length > 0 ? p.gallery : [p.image],
    pdfUrl: p.pdfUrl,
    starterPriceValue: p.starterPriceValue || p.priceStarting || 'Sob consulta',
    starterPeriod: p.starterPeriod || '/mês',
  }));

  const dynSlugs = new Set(dynList.map((d) => d.slug));
  const staticList: VitrineProduct[] = PRODUCTS.filter((s) => !dynSlugs.has(s.slug)).map((s) => ({
    slug: s.slug,
    name: s.name,
    category: s.category,
    tag: s.tag,
    tagline: s.tagline,
    description: s.description,
    fullDescription: s.fullDescription,
    features: s.features,
    image: s.image,
    gallery: [s.image],
    pdfUrl: s.pdfUrl,
    starterPriceValue: s.starterPriceValue || s.priceStarting,
    starterPeriod: s.starterPeriod || '/mês',
  }));

  return [...dynList, ...staticList];
}

/**
 * Cartão de Vitrine com inclinação 3D reativa ao cursor + luz radial dinâmica
 */
function TiltShowcaseStage({
  product,
  activePhotoIdx,
  onSelectPhoto,
}: {
  product: VitrineProduct;
  activePhotoIdx: number;
  onSelectPhoto: (idx: number) => void;
}) {
  const stageRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });

  const handleMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = stageRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const ry = (px - 0.5) * 14;
    const rx = -(py - 0.5) * 10;
    setTilt({ rx, ry, gx: px * 100, gy: py * 100, active: true });
  };

  const resetTilt = () => setTilt({ rx: 0, ry: 0, gx: 50, gy: 50, active: false });
  const currentImg = product.gallery[activePhotoIdx] || product.image;

  return (
    <div
      ref={stageRef}
      onMouseMove={handleMove}
      onMouseLeave={resetTilt}
      className="relative overflow-hidden border border-line/60 bg-card/70 backdrop-blur-xl transition-shadow duration-500 hover:shadow-[0_30px_90px_-30px_rgba(0,102,255,0.32)]"
      style={{ perspective: '1200px' }}
    >
      {/* Reflexo luminoso radial que segue o cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: tilt.active ? 1 : 0.45,
          background: `radial-gradient(560px circle at ${tilt.gx}% ${tilt.gy}%, rgba(0,102,255,0.16), transparent 65%)`,
        }}
      />

      <div className="relative z-10 grid gap-8 p-7 sm:p-10 lg:grid-cols-12 lg:items-center">
        {/* Esquerda: Palco 3D Flutuante do Produto */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center">
          <div
            className="relative flex h-64 sm:h-80 w-full items-center justify-center transition-transform duration-300 ease-out"
            style={{
              transform: `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg)`,
              transformStyle: 'preserve-3d',
            }}
          >
            {/* Halo luminoso orbital */}
            <div className="pointer-events-none absolute h-52 w-52 rounded-full bg-blue/20 blur-3xl animate-pulse" />
            <div
              className="pointer-events-none absolute h-64 w-64 rounded-full border border-blue/20 transition-transform duration-700"
              style={{ transform: 'translateZ(-20px)' }}
            />

            <img
              key={currentImg}
              src={currentImg}
              alt={product.name}
              className="relative z-10 max-h-56 sm:max-h-72 max-w-[82%] w-auto object-contain drop-shadow-[0_24px_32px_rgba(0,0,0,0.35)] animate-scale-up"
              style={{ transform: 'translateZ(42px)' }}
            />
          </div>

          {/* Galeria interativa (quando o produto tem várias fotos) */}
          {product.gallery.length > 1 && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {product.gallery.slice(0, 5).map((src, idx) => (
                <button
                  key={`${idx}_${src.slice(0, 20)}`}
                  type="button"
                  onClick={() => onSelectPhoto(idx)}
                  className={`h-12 w-12 p-1 border transition-all duration-300 ${
                    activePhotoIdx === idx
                      ? 'border-blue bg-blue/15 scale-105'
                      : 'border-line/60 bg-bg/50 opacity-65 hover:opacity-100'
                  }`}
                >
                  <img src={src} alt={`${product.name} ${idx + 1}`} className="h-full w-full object-contain" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Direita: Especificações Editoriais & Ações */}
        <div className="lg:col-span-6 space-y-5">
          <div className="flex flex-wrap items-center gap-3">
            <span className="eyebrow">{product.category}</span>
            <span className="text-xs text-muted">·</span>
            <span className="font-mono text-[11px] font-semibold uppercase tracking-wider text-fg/80">
              {product.tag}
            </span>
          </div>

          <h2 className="font-display text-3xl sm:text-4xl font-bold leading-[1.08] tracking-tight text-fg">
            {product.name}
          </h2>

          <p className="text-sm sm:text-base leading-relaxed text-muted">
            {product.description}
          </p>

          {product.features.length > 0 && (
            <div className="grid gap-2 sm:grid-cols-2 pt-1">
              {product.features.slice(0, 4).map((f) => (
                <div key={f} className="border-l-2 border-blue/60 pl-3 py-0.5 text-xs text-fg/90">
                  {f}
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-baseline justify-between gap-4 border-y border-line/50 py-4">
            <span className="text-xs uppercase tracking-[0.14em] text-muted">Subscrição a partir de</span>
            <div className="flex items-baseline gap-1.5">
              <span className="font-mono text-3xl font-bold text-blue">{product.starterPriceValue}</span>
              <span className="text-xs text-muted">{product.starterPeriod}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-1">
            <a
              href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(
                `Olá JOGIMIL! Gostaria de solicitar informações sobre o ${product.name}.`
              )}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary text-xs sm:text-sm"
            >
              <Icon n="wa" className="h-4 w-4" /> Solicitar Info
            </a>

            <a
              href={href('produtos', product.slug)}
              className="btn btn-ghost text-xs sm:text-sm"
            >
              Explorar detalhes <Icon n="arrow" className="h-3.5 w-3.5" />
            </a>

            {product.pdfUrl && (
              <a
                href={product.pdfUrl}
                download
                className="text-xs font-semibold text-muted hover:text-blue transition-colors ml-auto inline-flex items-center gap-1.5"
              >
                <Icon n="download" className="h-4 w-4 text-blue" /> PDF
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Cartão interativo do catálogo completo com efeito 3D subtil e pré-visualização de galeria
 */
function VitrineCatalogCard({ product }: { product: VitrineProduct }) {
  const [imgIdx, setImgIdx] = useState(0);
  const currentImg = product.gallery[imgIdx] || product.image;

  return (
    <article className="card-sheen group relative flex h-full flex-col justify-between border border-line/60 bg-card/70 backdrop-blur-md transition-all duration-500 hover:-translate-y-1.5 hover:border-blue/60 hover:shadow-[0_24px_60px_-24px_rgba(0,102,255,0.28)] p-6">
      <div>
        <div className="relative flex h-44 w-full items-center justify-center py-4 overflow-hidden">
          <div className="pointer-events-none absolute h-28 w-28 rounded-full bg-blue/12 blur-2xl transition-transform duration-700 group-hover:scale-125" />
          <img
            src={currentImg}
            alt={product.name}
            loading="lazy"
            className="relative z-10 max-h-full max-w-[240px] w-auto object-contain drop-shadow-lg transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </div>

        {product.gallery.length > 1 && (
          <div className="mb-3 flex items-center justify-center gap-1.5">
            {product.gallery.slice(0, 5).map((_, idx) => (
              <button
                key={idx}
                type="button"
                onMouseEnter={() => setImgIdx(idx)}
                onClick={() => setImgIdx(idx)}
                aria-label={`Ver imagem ${idx + 1}`}
                className={`h-1.5 transition-all duration-300 ${
                  imgIdx === idx ? 'w-6 bg-blue' : 'w-2 bg-line hover:bg-muted'
                }`}
              />
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-2 text-[11px] font-mono uppercase tracking-wider text-muted">
          <span className="truncate">{product.category}</span>
          <span className="text-blue font-semibold shrink-0">{product.tag}</span>
        </div>

        <a href={href('produtos', product.slug)}>
          <h3 className="mt-2 font-display text-2xl font-bold tracking-tight text-fg transition-colors group-hover:text-blue">
            {product.name}
          </h3>
        </a>

        <p className="mt-2.5 text-sm leading-relaxed text-muted line-clamp-3">
          {product.description}
        </p>
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between border-y border-line/40 py-3">
          <span className="text-xs text-muted">A partir de</span>
          <div className="flex items-baseline gap-1">
            <span className="font-mono text-xl font-bold text-blue">{product.starterPriceValue}</span>
            <span className="text-[11px] text-muted">{product.starterPeriod}</span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3 text-xs font-semibold">
          <a
            href={href('produtos', product.slug)}
            className="text-blue hover:underline underline-offset-4 inline-flex items-center gap-1"
          >
            Ver detalhes <Icon n="arrow" className="h-3.5 w-3.5" />
          </a>
          <a
            href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(
              `Olá JOGIMIL! Gostaria de solicitar informações sobre o ${product.name}.`
            )}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted hover:text-fg transition-colors"
          >
            Solicitar Info ↗
          </a>
        </div>
      </div>
    </article>
  );
}

export function ProductsShowcase() {
  const [products, setProducts] = useState<VitrineProduct[]>(() => toVitrineList([]));
  const [activeIdx, setActiveIdx] = useState(0);
  const [activePhotoIdx, setActivePhotoIdx] = useState(0);
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    let mounted = true;
    fetchPublicProducts().then((dynamic) => {
      if (mounted && dynamic.length > 0) {
        setProducts(toVitrineList(dynamic));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filtered = useMemo(
    () => (activeCategory === 'Todos' ? products : products.filter((p) => p.category === activeCategory)),
    [products, activeCategory]
  );

  const spotlight = products[activeIdx] || products[0];

  const handleSelectSpotlight = (idx: number) => {
    setActiveIdx(idx);
    setActivePhotoIdx(0);
  };

  return (
    <>
      {/* Hero Editorial da Vitrine de Produtos */}
      <section data-tone="hero" className="relative pb-16 pt-36 sm:pt-44">
        <div className="container-x relative z-10">
          <Crumbs items={[['Produtos']]} />
          <p className="eyebrow">Vitrine Tecnológica JOGIMIL</p>
          <h1 className="mt-3 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl animate-slide-up">
            Software Próprio,{' '}
            <span className="bg-gradient-to-r from-blue via-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Engenharia de Precisão
            </span>
          </h1>
          <p className="lead mt-5 max-w-2xl animate-slide-up" style={{ animationDelay: '80ms' }}>
            Explore a nossa vitrine interativa de plataformas prontas por subscrição — homologadas para o mercado angolano, com operação offline e suporte contínuo em Luanda.
          </p>
        </div>
      </section>

      <Body>
        {/* 1. Palco Interativo 3D (Vitrine em Destaque) */}
        {spotlight && (
          <Reveal>
            {/* Seletor editorial horizontal dos produtos em destaque */}
            {products.length > 1 && (
              <div className="mb-6 flex flex-wrap items-center gap-6 border-b border-line/50 pb-3">
                {products.map((prod, idx) => {
                  const isCurrent = idx === activeIdx;
                  return (
                    <button
                      key={prod.slug}
                      type="button"
                      onClick={() => handleSelectSpotlight(idx)}
                      className={`relative pb-2 text-xs sm:text-sm font-semibold transition-colors ${
                        isCurrent ? 'text-blue' : 'text-muted hover:text-fg'
                      }`}
                    >
                      <span className="font-mono text-[11px] opacity-60 mr-2">
                        {String(idx + 1).padStart(2, '0')}
                      </span>
                      {prod.name}
                      <span
                        className={`absolute inset-x-0 -bottom-[13px] h-[2px] bg-blue transition-transform duration-300 origin-left ${
                          isCurrent ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}

            <TiltShowcaseStage
              product={spotlight}
              activePhotoIdx={activePhotoIdx}
              onSelectPhoto={setActivePhotoIdx}
            />
          </Reveal>
        )}

        {/* 2. Catálogo Completo com Filtros Minimalistas */}
        <div className="mt-20 pt-14 border-t border-line/50">
          <div className="mb-10 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="eyebrow">Catálogo Completo</p>
              <h2 className="mt-2 font-display text-2xl sm:text-4xl font-bold tracking-tight">
                Todas as soluções disponíveis
              </h2>
            </div>

            {categories.length > 2 && (
              <div className="flex flex-wrap items-center gap-5">
                {categories.map((cat) => {
                  const isAct = activeCategory === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setActiveCategory(cat)}
                      className={`relative pb-1 text-xs font-semibold transition-colors ${
                        isAct ? 'text-blue' : 'text-muted hover:text-fg'
                      }`}
                    >
                      {cat}
                      <span
                        className={`absolute inset-x-0 bottom-0 h-[2px] bg-blue transition-transform duration-300 origin-left ${
                          isAct ? 'scale-x-100' : 'scale-x-0'
                        }`}
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid gap-7 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((prod, idx) => (
              <Reveal key={prod.slug} delay={(idx % 3) * 80}>
                <VitrineCatalogCard product={prod} />
              </Reveal>
            ))}
          </div>
        </div>
      </Body>
    </>
  );
}
