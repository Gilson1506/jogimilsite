import { useEffect, useMemo, useState } from 'react';
import { CATEGORIES, PROJECTS } from '../data/content';
import { fetchPublicPortfolio, PublicPortfolioItem } from '../lib/api';
import { href } from '../lib/hooks';
import { BeforeAfter, Img, Lightbox } from '../components/Media';
import { PortfolioSwiper } from '../components/PortfolioSwiper';
import { Reveal } from '../components/ui';
import { Body, PageHead } from './shared';
import { NotFound } from './Services';

function staticToPublicPortfolio(): PublicPortfolioItem[] {
  return PROJECTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    client: 'Cliente JOGIMIL',
    category: CATEGORIES.find((c) => c.id === p.category)?.label || p.category,
    description: p.summary,
    image: p.gallery[0] || '',
    metrics: p.result,
    tags: p.tech,
  }));
}

export function Portfolio() {
  const [items, setItems] = useState<PublicPortfolioItem[]>(() => staticToPublicPortfolio());
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  useEffect(() => {
    let active = true;
    fetchPublicPortfolio()
      .then((dynamic) => {
        if (!active) return;
        if (dynamic.length > 0) {
          setItems(dynamic);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [items]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((p) => {
      const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
      const matchQ =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.client.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q));
      return matchCat && matchQ;
    });
  }, [items, activeCategory, search]);

  return (
    <>
      <PageHead
        eyebrow="Portfólio"
        title="Projectos & Casos Reais"
        lead="Soluções de engenharia, ERP, Inteligência Artificial e infraestruturas desenvolvidas pela JOGIMIL."
        crumbs={[['Portfólio']]}
      />
      <Body>
        {/* Destaque Contínuo em Swiper (sem botões manuais nem bordas excessivas) */}
        {items.length > 0 && (
          <Reveal className="mb-16 pb-12 border-b border-line/40">
            <PortfolioSwiper
              items={items}
              eyebrow="Destaques"
              title="Vitrine de Projectos"
            />
          </Reveal>
        )}

        {/* Filtros e Pesquisa minimalistas */}
        <div className="mb-12 flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar projectos, clientes ou tecnologias..."
            className="w-full max-w-md border-b border-line bg-transparent py-2.5 text-sm text-fg placeholder:text-muted/70 transition focus:border-blue focus:outline-none"
          />

          <div className="flex flex-wrap items-center gap-5">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`relative pb-1 text-xs font-semibold tracking-wide transition-colors duration-200 ${
                    isActive ? 'text-blue' : 'text-muted hover:text-fg'
                  }`}
                >
                  {cat}
                  <span
                    className={`absolute inset-x-0 bottom-0 h-[2px] bg-blue transition-transform duration-300 origin-left ${
                      isActive ? 'scale-x-100' : 'scale-x-0'
                    }`}
                  />
                </button>
              );
            })}
          </div>
        </div>

        {loading && items.length === 0 ? (
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-72 bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <h2 className="font-display text-2xl font-semibold">Nenhum projecto encontrado</h2>
            <p className="mt-2 text-sm text-muted">Ajuste a pesquisa ou escolha outra categoria.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory('Todos');
              }}
              className="mt-6 text-sm font-semibold text-blue hover:underline underline-offset-4"
            >
              Mostrar todos
            </button>
          </div>
        ) : (
          <div className="grid gap-x-8 gap-y-12 md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((item, idx) => (
              <Reveal key={item.slug} delay={(idx % 3) * 80}>
                <article className="group flex h-full flex-col">
                  <a
                    href={href('portfolio', item.slug)}
                    className="card-sheen relative block h-56 w-full overflow-hidden bg-gradient-to-br from-blue/12 via-card to-cyan-500/8"
                  >
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.title}
                        loading="lazy"
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <span className="font-display text-3xl font-bold text-fg/20">
                          {item.title.slice(0, 2).toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
                    <span className="absolute left-4 bottom-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                      {item.category}
                    </span>
                    {item.metrics && (
                      <span className="absolute right-4 bottom-3.5 text-[11px] font-semibold text-sky-300">
                        {item.metrics}
                      </span>
                    )}
                  </a>

                  <div className="flex flex-1 flex-col pt-4">
                    {item.client && (
                      <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{item.client}</p>
                    )}
                    <a href={href('portfolio', item.slug)}>
                      <h2 className="mt-1 font-display text-xl font-semibold leading-snug text-fg transition-colors group-hover:text-blue">
                        {item.title}
                      </h2>
                    </a>
                    {item.description && (
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
                        {item.description}
                      </p>
                    )}

                    {item.tags.length > 0 && (
                      <p className="mt-3 text-xs text-muted/80">
                        {item.tags.slice(0, 4).join(' · ')}
                      </p>
                    )}

                    <div className="mt-4 flex items-center gap-5 text-xs font-semibold">
                      <a
                        href={href('portfolio', item.slug)}
                        className="text-blue hover:underline underline-offset-4"
                      >
                        Ver detalhes →
                      </a>
                      {item.link && (
                        <a
                          href={item.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-muted hover:text-fg transition-colors"
                        >
                          Visitar ↗
                        </a>
                      )}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        )}
      </Body>
    </>
  );
}

export function ProjectDetail({ id }: { id: string }) {
  const targetSlug = (() => {
    try {
      return decodeURIComponent(id || '').trim().toLowerCase();
    } catch {
      return (id || '').trim().toLowerCase();
    }
  })();

  const staticProj = PROJECTS.find((x) => x.slug.toLowerCase() === targetSlug);
  const [dynamicProj, setDynamicProj] = useState<PublicPortfolioItem | null>(null);
  const [nextDynamicProj, setNextDynamicProj] = useState<PublicPortfolioItem | null>(null);
  const [loading, setLoading] = useState(!staticProj);
  const [lb, setLb] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(!staticProj);
    setDynamicProj(null);
    setNextDynamicProj(null);
    fetchPublicPortfolio()
      .then((list) => {
        if (!active) return;
        const idx = list.findIndex(
          (x) => (x.slug || '').trim().toLowerCase() === targetSlug
        );
        if (idx >= 0) {
          setDynamicProj(list[idx]);
          if (list.length > 1) {
            setNextDynamicProj(list[(idx + 1) % list.length]);
          }
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [targetSlug, staticProj]);

  if (loading && !staticProj && !dynamicProj) {
    return (
      <section data-tone="hero" className="min-h-[60vh] flex items-center justify-center pt-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue/20 border-t-blue" />
      </section>
    );
  }

  if (dynamicProj) {
    const images = dynamicProj.image ? [dynamicProj.image] : [];
    return (
      <>
        <PageHead
          eyebrow={dynamicProj.category || 'Projecto Entregue'}
          title={dynamicProj.title}
          lead={dynamicProj.client ? `Cliente: ${dynamicProj.client}` : dynamicProj.description}
          crumbs={[['Portfólio', href('portfolio')], [dynamicProj.title]]}
        />
        <Body>
          <div className="mx-auto max-w-5xl space-y-10">
            {dynamicProj.image && (
              <button
                type="button"
                onClick={() => setLb(0)}
                className="group relative block w-full overflow-hidden rounded-none border border-line/60 shadow-2xl text-left"
                aria-label={`Ampliar imagem de ${dynamicProj.title}`}
              >
                <img
                  src={dynamicProj.image}
                  alt={dynamicProj.title}
                  className="max-h-[520px] w-full object-cover transition-transform duration-700 group-hover:scale-[1.02]"
                />
                <span className="absolute bottom-4 right-4 bg-black/70 px-3 py-1.5 text-xs font-medium text-white backdrop-blur-sm">
                  Ampliar imagem
                </span>
              </button>
            )}

            <div className="grid gap-5 sm:grid-cols-3">
              <div className="card rounded-none p-6">
                <p className="eyebrow">Categoria</p>
                <p className="mt-2 font-display text-lg font-bold">{dynamicProj.category || 'Engenharia Digital'}</p>
              </div>
              {dynamicProj.client && (
                <div className="card rounded-none p-6">
                  <p className="eyebrow">Cliente</p>
                  <p className="mt-2 font-display text-lg font-bold">{dynamicProj.client}</p>
                </div>
              )}
              {dynamicProj.metrics && (
                <div className="card rounded-none p-6">
                  <p className="eyebrow">Resultado / Destaque</p>
                  <p className="mt-2 font-display text-lg font-bold text-blue">{dynamicProj.metrics}</p>
                </div>
              )}
            </div>

            {dynamicProj.description && (
              <div className="card rounded-none p-7 sm:p-9">
                <p className="eyebrow">Sobre o Projecto</p>
                <p className="mt-3 text-base sm:text-lg leading-relaxed text-muted whitespace-pre-line">{dynamicProj.description}</p>
              </div>
            )}

            {dynamicProj.tags.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold">Tecnologias &amp; Competências</h2>
                <ul className="mt-4 flex flex-wrap gap-2">
                  {dynamicProj.tags.map((t) => (
                    <li key={t} className="rounded-full border border-line px-4 py-1.5 text-sm">
                      {t}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line/40 pt-6 text-sm font-semibold">
              <a href={href('portfolio')} className="text-muted hover:text-fg transition-colors">
                ← Voltar ao Portfólio
              </a>
              <div className="flex flex-wrap items-center gap-5">
                {nextDynamicProj && nextDynamicProj.slug !== dynamicProj.slug && (
                  <a href={href('portfolio', nextDynamicProj.slug)} className="text-muted hover:text-fg transition-colors">
                    Próximo: {nextDynamicProj.title} →
                  </a>
                )}
                {dynamicProj.link && (
                  <a href={dynamicProj.link} target="_blank" rel="noopener noreferrer" className="text-muted hover:text-fg transition-colors">
                    Visitar projecto ↗
                  </a>
                )}
                <a href={href('contacto', 'orcamento')} className="btn btn-primary text-sm">
                  Pedir projecto semelhante →
                </a>
              </div>
            </div>
          </div>
        </Body>
        {lb !== null && images.length > 0 && (
          <Lightbox images={images} start={lb} onClose={() => setLb(null)} />
        )}
      </>
    );
  }

  if (!staticProj) return <NotFound />;

  const staticIdx = PROJECTS.indexOf(staticProj);
  const nextStatic = PROJECTS[(staticIdx + 1) % PROJECTS.length];

  return (
    <>
      <PageHead
        eyebrow={CATEGORIES.find((c) => c.id === staticProj.category)?.label || ''}
        title={staticProj.title}
        lead={staticProj.summary}
        crumbs={[['Portfólio', href('portfolio')], [staticProj.title]]}
      />
      <Body>
        {staticProj.gallery.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-3">
            {staticProj.gallery.map((g, i) => (
              <button
                key={g}
                onClick={() => setLb(i)}
                className="overflow-hidden rounded-none text-left"
                aria-label={`Abrir imagem ${i + 1} em ecrã inteiro`}
              >
                <Img src={g} alt={`Captura de ecrã ${i + 1} de ${staticProj.title}`} />
              </button>
            ))}
          </div>
        )}
        {staticProj.before && staticProj.after && (
          <div className="mt-10">
            <h2 className="h2 mb-6">Antes e depois</h2>
            <BeforeAfter before={staticProj.before} after={staticProj.after} />
          </div>
        )}
        <div className="mt-12 grid gap-5 md:grid-cols-3">
          {([
            ['O problema', staticProj.problem],
            ['A solução', staticProj.solution],
            ['O resultado', staticProj.result],
          ] as const).map(([t, d]) => (
            <div key={t} className="card p-7">
              <p className="eyebrow">{t}</p>
              <p className="mt-3">{d}</p>
            </div>
          ))}
        </div>
        <h2 className="mt-12 text-2xl font-semibold">Tecnologias usadas</h2>
        <ul className="mt-4 flex flex-wrap gap-2">
          {staticProj.tech.map((t) => (
            <li key={t} className="rounded-full border border-line px-4 py-1.5 text-sm">
              {t}
            </li>
          ))}
        </ul>
        {staticProj.testimonial && (
          <blockquote className="card mt-12 p-8 text-xl">
            “{staticProj.testimonial.quote}”
            <footer className="mt-3 text-sm text-muted">{staticProj.testimonial.author}</footer>
          </blockquote>
        )}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-line/40 pt-6 text-sm font-semibold">
          <a href={href('portfolio')} className="text-muted hover:text-fg transition-colors">
            ← Voltar ao Portfólio
          </a>
          <div className="flex flex-wrap items-center gap-5">
            {nextStatic && nextStatic.slug !== staticProj.slug && (
              <a href={href('portfolio', nextStatic.slug)} className="text-muted hover:text-fg transition-colors">
                Próximo: {nextStatic.title} →
              </a>
            )}
            <a href={href('contacto', 'orcamento')} className="btn btn-primary text-sm">
              Pedir projecto semelhante →
            </a>
          </div>
        </div>
      </Body>
      {lb !== null && <Lightbox images={staticProj.gallery} start={lb} onClose={() => setLb(null)} />}
    </>
  );
}
