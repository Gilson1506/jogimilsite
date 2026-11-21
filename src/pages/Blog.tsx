import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Check,
  Clock,
  Search,
  Share2,
  Sparkles,
  User,
} from 'lucide-react';
import { COMPANY, POSTS } from '../data/content';
import { fetchPublicNews, PublicNewsPost } from '../lib/api';
import { href } from '../lib/hooks';
import { Reveal } from '../components/ui';
import { Body, Crumbs } from './shared';
import { NotFound } from './Services';

function formatDate(d: string): string {
  const parsed = new Date(d);
  if (Number.isNaN(parsed.getTime())) return d;
  return parsed.toLocaleDateString('pt-AO', { day: 'numeric', month: 'long', year: 'numeric' });
}

function estimateReadMinutes(post: PublicNewsPost): number {
  const text = `${post.title} ${post.excerpt} ${post.body.join(' ')}`;
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 190));
}

function staticToPublicPosts(): PublicNewsPost[] {
  return POSTS.map((p) => ({
    slug: p.slug,
    title: p.title,
    tag: p.tag,
    category: p.tag,
    date: p.date,
    excerpt: p.excerpt,
    body: p.body,
    author: 'Equipa JOGIMIL',
  }));
}

export function Blog() {
  const [posts, setPosts] = useState<PublicNewsPost[]>(() => staticToPublicPosts());
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Todos');

  useEffect(() => {
    let active = true;
    fetchPublicNews()
      .then((dynamic) => {
        if (!active) return;
        if (dynamic.length > 0) {
          const dynamicSlugs = new Set(dynamic.map((d) => d.slug));
          const fallback = staticToPublicPosts().filter((s) => !dynamicSlugs.has(s.slug));
          setPosts([...dynamic, ...fallback]);
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
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['Todos', ...Array.from(set)];
  }, [posts]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      const matchCat = activeCategory === 'Todos' || p.category === activeCategory;
      const matchQuery =
        !q ||
        p.title.toLowerCase().includes(q) ||
        p.excerpt.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        (p.author || '').toLowerCase().includes(q);
      return matchCat && matchQuery;
    });
  }, [posts, search, activeCategory]);

  const featured = filtered[0] || null;
  const rest = featured ? filtered.slice(1) : [];

  return (
    <>
      {/* Hero Cinematográfico Animado */}
      <section data-tone="hero" className="relative overflow-hidden pb-20 pt-36 sm:pt-44">
        {/* Orbes luminosos animados */}
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/4 h-96 w-96 rounded-full bg-blue/20 blur-[120px] animate-pulse" />
          <div
            className="absolute top-20 right-1/5 h-72 w-72 rounded-full bg-cyan-500/15 blur-[110px] animate-pulse"
            style={{ animationDelay: '1.2s', animationDuration: '5s' }}
          />
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                'linear-gradient(to right, currentColor 1px, transparent 1px), linear-gradient(to bottom, currentColor 1px, transparent 1px)',
              backgroundSize: '56px 56px',
            }}
          />
        </div>

        <div className="container-x relative z-10">
          <Crumbs items={[['Blog & Notícias']]} />

          <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl animate-slide-up">
            Ideias, Engenharia &amp;{' '}
            <span className="bg-gradient-to-r from-blue via-sky-400 to-cyan-300 bg-clip-text text-transparent">
              Futuro Digital
            </span>
          </h1>

          <p className="lead mt-5 max-w-2xl animate-slide-up" style={{ animationDelay: '90ms' }}>
            Artigos, novidades e análises práticas sobre Inteligência Artificial, faturação SAF-T (AO), software corporativo e transformação digital em Angola.
          </p>

          {/* Barra de pesquisa e filtros animados */}
          <div className="mt-9 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between animate-slide-up" style={{ animationDelay: '160ms' }}>
            <div className="relative w-full max-w-md">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Pesquisar artigos, temas ou autores..."
                className="w-full rounded-full border border-line bg-card/80 py-3 pl-11 pr-5 text-sm text-fg backdrop-blur-md transition focus:border-blue focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {categories.map((cat) => {
                const isActive = activeCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setActiveCategory(cat)}
                    className={`rounded-full px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                      isActive
                        ? 'bg-blue text-white shadow-lg shadow-blue/25 scale-[1.03]'
                        : 'border border-line bg-card/60 text-muted hover:border-blue/50 hover:text-fg'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <Body>
        {loading && posts.length === 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-80 rounded-none border border-line bg-card/50 animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-none border border-line bg-card/60 p-14 text-center">
            <BookOpen className="mx-auto h-10 w-10 text-blue/60" />
            <h2 className="mt-4 font-display text-2xl font-bold">Nenhum artigo encontrado</h2>
            <p className="mt-2 text-sm text-muted">Tente pesquisar por outro termo ou selecione outra categoria.</p>
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveCategory('Todos');
              }}
              className="btn btn-primary mt-6"
            >
              Ver todos os artigos
            </button>
          </div>
        ) : (
          <div className="space-y-12">
            {/* Artigo em Destaque (Spotlight) */}
            {featured && (
              <Reveal>
                <a
                  href={href('blog', featured.slug)}
                  className="group relative grid overflow-hidden rounded-none border border-line/70 bg-card/80 transition-all duration-500 hover:-translate-y-1 hover:border-blue/60 hover:shadow-2xl hover:shadow-blue/10 lg:grid-cols-12"
                >
                  <div className="relative min-h-[260px] overflow-hidden bg-gradient-to-br from-blue/20 via-card to-cyan-500/10 lg:col-span-6 lg:min-h-[380px]">
                    {featured.image ? (
                      <img
                        src={featured.image}
                        alt={featured.title}
                        className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center p-10">
                        <div className="relative flex h-28 w-28 items-center justify-center rounded-none border border-blue/30 bg-blue/10">
                          <Sparkles className="h-12 w-12 text-blue" />
                        </div>
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent lg:bg-gradient-to-r lg:from-transparent lg:to-black/20" />
                    <span className="absolute left-5 top-5 inline-flex items-center gap-1.5 rounded-full bg-blue px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider text-white shadow-lg">
                      <Sparkles className="h-3 w-3" /> Destaque
                    </span>
                  </div>

                  <div className="flex flex-col justify-between p-7 sm:p-10 lg:col-span-6">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                        <span className="rounded-full border border-blue/30 bg-blue/10 px-3 py-1 font-semibold uppercase tracking-wider text-blue">
                          {featured.category}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Calendar className="h-3.5 w-3.5" />
                          <time dateTime={featured.date}>{formatDate(featured.date)}</time>
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" />
                          {estimateReadMinutes(featured)} min de leitura
                        </span>
                      </div>

                      <h2 className="mt-5 font-display text-2xl font-bold leading-tight text-fg transition-colors group-hover:text-blue sm:text-4xl">
                        {featured.title}
                      </h2>

                      <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base line-clamp-4">
                        {featured.excerpt}
                      </p>
                    </div>

                    <div className="mt-8 flex items-center justify-between border-t border-line/60 pt-5">
                      <div className="flex items-center gap-2.5 text-xs text-muted">
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue/15 font-bold text-blue">
                          <User className="h-4 w-4" />
                        </span>
                        <span className="font-medium text-fg">{featured.author || 'Equipa JOGIMIL'}</span>
                      </div>

                      <span className="inline-flex items-center gap-2 text-sm font-semibold text-blue">
                        Ler artigo
                        <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1.5" />
                      </span>
                    </div>
                  </div>
                </a>
              </Reveal>
            )}

            {/* Grelha Editorial Animada */}
            {rest.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {rest.map((post, idx) => (
                  <Reveal key={post.slug} delay={(idx % 3) * 80}>
                    <a
                      href={href('blog', post.slug)}
                      className="group flex h-full flex-col overflow-hidden rounded-none border border-line/70 bg-card/70 transition-all duration-400 hover:-translate-y-1.5 hover:border-blue/50 hover:shadow-xl hover:shadow-blue/10"
                    >
                      <div className="relative h-48 w-full overflow-hidden bg-gradient-to-br from-blue/15 via-card to-cyan-500/10">
                        {post.image ? (
                          <img
                            src={post.image}
                            alt={post.title}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <BookOpen className="h-10 w-10 text-blue/40 transition-transform duration-500 group-hover:scale-110" />
                          </div>
                        )}
                        <span className="absolute left-4 top-4 rounded-full bg-black/70 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white backdrop-blur-md">
                          {post.category}
                        </span>
                      </div>

                      <div className="flex flex-1 flex-col p-6">
                        <div className="flex items-center gap-3 text-[11px] text-muted">
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            <time dateTime={post.date}>{formatDate(post.date)}</time>
                          </span>
                          <span>·</span>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {estimateReadMinutes(post)} min
                          </span>
                        </div>

                        <h3 className="mt-3 font-display text-xl font-bold leading-snug text-fg transition-colors group-hover:text-blue">
                          {post.title}
                        </h3>

                        <p className="mt-2.5 flex-1 text-sm leading-relaxed text-muted line-clamp-3">
                          {post.excerpt}
                        </p>

                        <div className="mt-5 flex items-center justify-between border-t border-line/50 pt-4 text-xs">
                          <span className="text-muted truncate">{post.author || 'Equipa JOGIMIL'}</span>
                          <span className="inline-flex items-center gap-1 font-semibold text-blue">
                            Ler mais
                            <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                          </span>
                        </div>
                      </div>
                    </a>
                  </Reveal>
                ))}
              </div>
            )}
          </div>
        )}
      </Body>
    </>
  );
}

export function BlogPostDetail({ id }: { id: string }) {
  const [posts, setPosts] = useState<PublicNewsPost[]>(() => staticToPublicPosts());
  const [loading, setLoading] = useState(true);
  const [readProgress, setReadProgress] = useState(0);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    fetchPublicNews()
      .then((dynamic) => {
        if (!active) return;
        if (dynamic.length > 0) {
          const dynamicSlugs = new Set(dynamic.map((d) => d.slug));
          const fallback = staticToPublicPosts().filter((s) => !dynamicSlugs.has(s.slug));
          setPosts([...dynamic, ...fallback]);
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setReadProgress(h > 0 ? Math.min(100, Math.max(0, (window.scrollY / h) * 100)) : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const post = posts.find((x) => x.slug === id);
  const related = posts.filter((x) => x.slug !== id).slice(0, 3);

  if (!post && loading) {
    return (
      <section data-tone="hero" className="min-h-[60vh] flex items-center justify-center pt-32">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue/20 border-t-blue" />
      </section>
    );
  }

  if (!post) return <NotFound />;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      /* ignore */
    }
  };

  const whatsappShareUrl = `https://wa.me/?text=${encodeURIComponent(`${post.title} — ${window.location.href}`)}`;

  return (
    <>
      {/* Barra de progresso de leitura */}
      <div className="fixed inset-x-0 top-0 z-[75] h-[3px] bg-transparent" aria-hidden="true">
        <div
          className="h-full bg-gradient-to-r from-blue via-sky-400 to-cyan-300 transition-[width] duration-150"
          style={{ width: `${readProgress}%` }}
        />
      </div>

      <section data-tone="hero" className="relative overflow-hidden pb-16 pt-36 sm:pt-44">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-24 left-1/3 h-80 w-80 rounded-full bg-blue/15 blur-[120px]" />
        </div>

        <div className="container-x relative z-10 max-w-4xl">
          <Crumbs items={[['Blog', href('blog')], [post.title]]} />

          <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
            <span className="rounded-full border border-blue/30 bg-blue/10 px-3.5 py-1 font-semibold uppercase tracking-wider text-blue">
              {post.category}
            </span>
            <span className="inline-flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5" />
              <time dateTime={post.date}>{formatDate(post.date)}</time>
            </span>
            <span className="inline-flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {estimateReadMinutes(post)} min de leitura
            </span>
            <span className="inline-flex items-center gap-1">
              <User className="h-3.5 w-3.5" />
              {post.author || 'Equipa JOGIMIL'}
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl font-bold leading-[1.08] tracking-tight sm:text-5xl animate-slide-up">
            {post.title}
          </h1>

          {post.excerpt && (
            <p className="lead mt-5 text-base sm:text-xl animate-slide-up" style={{ animationDelay: '70ms' }}>
              {post.excerpt}
            </p>
          )}
        </div>
      </section>

      <Body>
        <div className="mx-auto max-w-3xl">
          {post.image && (
            <div className="mb-10 overflow-hidden rounded-none border border-line/60 shadow-2xl animate-scale-up">
              <img src={post.image} alt={post.title} className="max-h-[460px] w-full object-cover" />
            </div>
          )}

          <article className="space-y-6 text-base leading-[1.85] text-fg/90 sm:text-lg">
            {post.body.map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </article>

          {/* Barra de partilha e navegação */}
          <div className="mt-14 flex flex-wrap items-center justify-between gap-4 border-y border-line/60 py-6">
            <a href={href('blog')} className="btn btn-ghost text-sm">
              <ArrowLeft className="h-4 w-4" /> Voltar ao Blog
            </a>

            <div className="flex flex-wrap items-center gap-2.5">
              <button type="button" onClick={handleCopyLink} className="btn btn-ghost text-xs py-2 px-4">
                {copied ? <Check className="h-4 w-4 text-emerald-400" /> : <Share2 className="h-4 w-4" />}
                {copied ? 'Link copiado' : 'Copiar link'}
              </button>
              <a
                href={whatsappShareUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary text-xs py-2 px-4"
              >
                Partilhar no WhatsApp
              </a>
            </div>
          </div>

          {/* CTA institucional */}
          <div className="mt-10 rounded-none border border-blue/25 bg-gradient-to-br from-blue/10 via-card to-card p-7 sm:p-8 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-blue">Precisa de apoio técnico?</p>
              <h3 className="mt-1 font-display text-xl font-bold">Fale com os engenheiros da {COMPANY.short}</h3>
              <p className="mt-1 text-sm text-muted">Ajudamos a implementar soluções digitais, IA e faturação SAF-T (AO).</p>
            </div>
            <a href={href('contacto')} className="btn btn-primary shrink-0">
              Falar connosco <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Artigos relacionados */}
        {related.length > 0 && (
          <div className="mt-20 border-t border-line/60 pt-14">
            <h2 className="font-display text-2xl font-bold sm:text-3xl">Continue a ler</h2>
            <div className="mt-6 grid gap-6 md:grid-cols-3">
              {related.map((r) => (
                <a
                  key={r.slug}
                  href={href('blog', r.slug)}
                  className="group flex flex-col overflow-hidden rounded-none border border-line/70 bg-card/60 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-blue/50"
                >
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-blue">{r.category}</span>
                  <h3 className="mt-2 font-display text-lg font-bold leading-snug group-hover:text-blue transition-colors">
                    {r.title}
                  </h3>
                  <p className="mt-2 flex-1 text-xs text-muted line-clamp-2">{r.excerpt}</p>
                  <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue">
                    Ler artigo <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        )}
      </Body>
    </>
  );
}
