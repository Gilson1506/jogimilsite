import { useEffect, useState } from 'react';
import {
  COMPANY,
  SERVICES,
  PRODUCTS,
  PROJECTS,
  CATEGORIES,
  POSTS,
  TEAM_MEMBERS,
} from '../data/content';
import {
  fetchPublicNews,
  fetchPublicPortfolio,
  fetchPublicTeam,
  PublicNewsPost,
  PublicPortfolioItem,
  PublicTeamMember,
} from '../lib/api';
import { href, useReducedMotion } from '../lib/hooks';
import { Counter, Icon, Icon3D, Reveal, Typewriter } from '../components/ui';
import ParticleLogo from '../components/ParticleLogo';
import { PageScene3D } from '../components/PageScene3D';

const HOME_SECTIONS = [
  { id: 'sec-inicio', label: 'Início' },
  { id: 'sec-impacto', label: 'Impacto' },
  { id: 'sec-servicos', label: 'Serviços' },
  { id: 'sec-produtos', label: 'Produtos' },
  { id: 'sec-portfolio', label: 'Portfólio' },
  { id: 'sec-sobre', label: 'Sobre nós' },
  { id: 'sec-blog', label: 'Blog' },
  { id: 'sec-contacto', label: 'Contacto' },
];

function SectionRail() {
  const [active, setActive] = useState('sec-inicio');

  useEffect(() => {
    const ids = HOME_SECTIONS.map((s) => s.id);
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    if (els.length === 0) return;

    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        if (visible[0]?.target.id) {
          setActive(visible[0].target.id);
        }
      },
      { rootMargin: '-30% 0px -45% 0px', threshold: [0.1, 0.35, 0.6] }
    );

    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  const jump = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <nav
      aria-label="Secções da página"
      className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 xl:flex flex-col items-end gap-3"
    >
      {HOME_SECTIONS.map((s) => {
        const isCurrent = active === s.id;
        return (
          <button
            key={s.id}
            type="button"
            onClick={() => jump(s.id)}
            className="group flex items-center gap-2.5 py-0.5 text-right focus:outline-none"
          >
            <span
              className={`text-[11px] font-medium tracking-wide transition-all duration-300 ${
                isCurrent
                  ? 'opacity-100 translate-x-0 text-blue'
                  : 'opacity-0 translate-x-2 text-muted group-hover:opacity-100 group-hover:translate-x-0'
              }`}
            >
              {s.label}
            </span>
            <span
              className={`block h-[2px] transition-all duration-300 ${
                isCurrent
                  ? 'w-7 bg-blue'
                  : 'w-3 bg-muted/40 group-hover:w-5 group-hover:bg-fg/70'
              }`}
            />
          </button>
        );
      })}
    </nav>
  );
}

function Hero() {
  const reduce = useReducedMotion();

  return (
    <section id="sec-inicio" data-tone="hero" className="relative flex h-full min-h-[100svh] flex-col justify-between overflow-hidden pt-16 sm:pt-20">
      {/* Canvas 3D posicionado no topo sem cortar títulos */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[44svh] min-h-[250px] sm:h-[52svh] z-0 overflow-visible">
        {!reduce && <ParticleLogo />}
      </div>
      {/* Espaço reservado proporcional ao ParticleLogo */}
      <div className="relative h-[24svh] min-h-[140px] sm:h-[30svh] sm:min-h-[190px] pointer-events-none shrink-0" aria-hidden="true" />
      <div className="container-x relative z-10 flex flex-1 flex-col justify-center pb-14 sm:pb-20 pt-2">
        <p className="eyebrow">Luanda · Angola</p>
        <h1 className="mt-2.5 sm:mt-3 max-w-4xl text-2xl font-semibold leading-[1.12] sm:text-5xl sm:leading-[1.06] lg:text-[3.5rem]">
          Software & IA à medida para <Typewriter words={['agentes de IA', 'web & mobile', 'automação', 'NOC 24/7', 'desktop']} />
        </h1>
        <p className="lead mt-3 sm:mt-4 max-w-2xl text-sm sm:text-lg">{COMPANY.tagline}</p>

        {/* Ações da Hero */}
        <div className="mt-6 sm:mt-8 flex flex-wrap gap-3">
          <a href={href('servicos')} className="btn btn-primary">Ver serviços <Icon n="arrow" className="h-4 w-4" /></a>
          <a href={href('contacto')} className="btn btn-ghost">Falar connosco</a>
        </div>
      </div>
    </section>
  );
}

function Trust() {
  const facts = [
    { n: 16, s: '', l: 'áreas de serviço', d: 'da IA e consultoria ao NOC e suporte' },
    { n: 4, s: '', l: 'plataformas', d: 'web, Android, iOS e desktop' },
    { n: 1, s: '', l: 'sede em Luanda', d: 'Nova Vida, Kilamba Kiaxi' },
  ];
  const steps = [
    ['Descoberta', 'Percebemos o seu negócio e o que precisa.'],
    ['Desenho', 'Definimos a solução e os ecrãs.'],
    ['Desenvolvimento', 'Construímos e mostramos o progresso.'],
    ['Entrega', 'Instalamos e formamos a sua equipa.'],
    ['Suporte', 'Corrigimos, actualizamos e apoiamos.'],
  ];
  return (
    <section
      id="sec-impacto"
      data-tone="b"
      aria-label="Factos sobre a JOGIMIL"
      className="slope relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-14 lg:py-16"
    >
      <PageScene3D page="parceiros" positioning="absolute" />

      {/* Iluminação ambiente em tons de azul (ativa em modo escuro e modo claro) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,255,0.18),transparent_55%),radial-gradient(ellipse_at_bottom_left,rgba(56,189,248,0.12),transparent_50%)]"
      />

      <div className="container-x relative z-10 space-y-8 lg:space-y-9">
        {/* Topo: Métricas sem bordas + Imagens de dispositivos sem background e sem bordas */}
        <div className="grid gap-6 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-6 space-y-4">
            <Reveal>
              <p className="eyebrow">02 · Impacto &amp; Alcance</p>
              <h2 className="mt-1 font-display text-xl sm:text-2xl font-semibold tracking-tight">
                Engenharia Multiplataforma em Angola
              </h2>
            </Reveal>

            <div className="grid gap-3 sm:grid-cols-3">
              {facts.map((f, i) => (
                <Reveal key={f.l} delay={i * 80}>
                  <div className="group h-full rounded-2xl bg-card/55 backdrop-blur-md p-4 transition-all duration-300 hover:-translate-y-1 hover:bg-card/85 hover:shadow-[0_12px_32px_-12px_rgba(0,102,255,0.38)]">
                    <p className="font-display text-3xl sm:text-4xl font-semibold bg-gradient-to-br from-sky-400 via-blue to-blue-600 bg-clip-text text-transparent">
                      <Counter to={f.n} suffix={f.s} />
                    </p>
                    <p className="mt-1 text-sm font-semibold text-fg">{f.l}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{f.d}</p>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>

          {/* Campos limpos sem bordas nem background para ícones PNG das 5 plataformas */}
          <div className="lg:col-span-6">
            <Reveal delay={120}>
              <div className="relative py-4 select-none">
                {/* Aura azul subtil atrás dos ícones */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-x-8 bottom-2 top-2 rounded-full bg-blue/15 blur-3xl"
                />

                <div className="relative z-10 grid grid-cols-3 sm:grid-cols-5 gap-4 sm:gap-5 items-center justify-items-center">
                  {[
                    { name: 'Windows', src: '/platforms/windows.png' },
                    { name: 'Android', src: '/platforms/android.png' },
                    { name: 'Mac', src: '/platforms/mac.png' },
                    { name: 'iPhone', src: '/platforms/iphone.png' },
                    { name: 'Web', src: '/platforms/web.png' },
                  ].map((plat) => (
                    <div
                      key={plat.name}
                      className="group flex flex-col items-center justify-center bg-transparent transition-transform duration-300 hover:-translate-y-1.5"
                    >
                      <img
                        src={plat.src}
                        alt={plat.name}
                        loading="lazy"
                        className="h-16 w-16 sm:h-20 sm:w-20 object-contain drop-shadow-[0_12px_24px_rgba(0,102,255,0.28)] transition-transform duration-300 group-hover:scale-110"
                      />
                      <span className="mt-2 font-mono text-[11px] font-semibold tracking-wider text-fg/80 group-hover:text-blue transition-colors">
                        {plat.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>
          </div>
        </div>

        {/* Base: Como trabalhamos (01 Descoberta -> 05 Suporte) sem bordas */}
        <div className="pt-5">
          <Reveal>
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2">
              <div>
                <p className="eyebrow">Como trabalhamos</p>
                <h3 className="mt-1 font-display text-lg sm:text-xl font-semibold">
                  Do primeiro contacto ao suporte
                </h3>
              </div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-blue/90">
                Processo contínuo · 01 — 05
              </span>
            </div>
          </Reveal>

          <div className="relative mt-4">
            <div
              aria-hidden="true"
              className="pointer-events-none hidden sm:block absolute inset-x-6 top-0 h-[2px] bg-gradient-to-r from-blue/20 via-sky-400/75 to-blue/20"
            />
            <ol className="grid gap-3 sm:grid-cols-5">
              {steps.map(([t, d], i) => (
                <li
                  key={t}
                  className="group relative rounded-xl bg-card/55 backdrop-blur-md p-3.5 transition-all duration-300 hover:-translate-y-1 hover:bg-blue/[0.08] hover:shadow-[0_10px_26px_-10px_rgba(0,102,255,0.4)]"
                >
                  <span className="font-mono text-[11px] font-semibold text-blue group-hover:text-sky-400 transition-colors">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h4 className="mt-1 text-sm font-semibold text-fg">{t}</h4>
                  <p className="mt-0.5 text-[11px] leading-relaxed text-muted">{d}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * Secção 3 (Palco Lateral): Serviços Especializados (separada de Produtos).
 */
function Services() {
  const displayedServices = SERVICES.filter((s) => s.main).slice(0, 6);

  return (
    <section id="sec-servicos" data-tone="a" className="slope slope-r relative flex min-h-[100svh] flex-col justify-center py-14 lg:py-16 overflow-hidden">
      <PageScene3D page="servicos" positioning="absolute" />
      <div className="container-x relative z-10">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line/60 pb-5">
          <Reveal>
            <p className="eyebrow">03 · Serviços Especializados</p>
            <h2 className="mt-1.5 max-w-2xl text-2xl font-semibold leading-tight sm:text-4xl">
              Engenharia &amp; Desenvolvimento à Medida
            </h2>
            <p className="mt-1.5 max-w-xl text-xs sm:text-sm text-muted">
              Arquitectura de software, inteligência artificial, sistemas corporativos e suporte operacional para empresas em Angola.
            </p>
          </Reveal>
          <a href={href('servicos')} className="btn btn-ghost shrink-0 self-start sm:self-auto">
            Ver todos os {SERVICES.length} serviços <Icon n="arrow" className="h-4 w-4" />
          </a>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedServices.map((s, i) => (
            <Reveal key={s.slug} delay={(i % 3) * 60}>
              <a
                href={href('servicos', s.slug)}
                className="group flex h-full flex-col justify-between rounded-2xl bg-card/55 backdrop-blur-md hover:bg-card/90 p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_12px_30px_-12px_rgba(0,102,255,0.32)]"
              >
                <div>
                  <div className="h-16 w-16 flex items-center justify-center">
                    <Icon3D name={s.icon} className="h-16 w-16" />
                  </div>
                  <h3 className="mt-2.5 text-sm sm:text-[15px] font-semibold tracking-tight text-fg group-hover:text-blue transition-colors">
                    {s.title}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-muted line-clamp-2">
                    {s.short}
                  </p>
                </div>
                <span className="mt-2.5 inline-flex items-center gap-1.5 text-[11px] font-semibold text-blue">
                  Saber mais <Icon n="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Secção 4 (Capítulo Dedicado): Produtos Próprios JOGIMIL.
 */
function ProductsChapter() {
  return (
    <section id="sec-produtos" data-tone="b" className="slope relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-20">
      <PageScene3D page="produtos" positioning="absolute" />
      <div className="container-x relative z-10">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line/60 pb-6">
            <div>
              <p className="eyebrow">04 · Produtos Próprios</p>
              <h2 className="h2 mt-2 max-w-2xl">Plataformas Homologadas &amp; Software por Subscrição</h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-muted">
                Soluções prontas a operar com conformidade fiscal em Angola, actualizações contínuas e suporte dedicado.
              </p>
            </div>
            <a href={href('produtos')} className="btn btn-primary shrink-0 self-start sm:self-auto">
              Explorar catálogo de produtos <Icon n="arrow" className="h-4 w-4" />
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-5 lg:grid-cols-2">
          {PRODUCTS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 80}>
              <a
                href={href('produtos', p.slug)}
                className="group relative flex h-full flex-col sm:flex-row items-center gap-6 rounded-sm bg-card/60 backdrop-blur-md p-6 transition-all duration-300 hover:-translate-y-1 hover:bg-card/90 hover:shadow-[0_16px_38px_-14px_rgba(0,102,255,0.35)]"
              >
                {/* Destaque mínimo lateral em azul ao passar o cursor */}
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute left-0 top-0 bottom-0 w-[2px] bg-blue/40 transition-all duration-300 group-hover:w-[3px] group-hover:bg-blue"
                />

                <div className="flex h-32 w-full sm:w-44 shrink-0 items-center justify-center bg-transparent p-2">
                  <img
                    src={p.image}
                    alt={p.name}
                    loading="lazy"
                    className="h-28 max-w-full w-auto object-contain drop-shadow-[0_10px_24px_rgba(0,102,255,0.28)] transition-transform duration-500 group-hover:scale-105"
                  />
                </div>

                <div className="flex flex-1 flex-col justify-between self-stretch">
                  <div>
                    <p className="font-mono text-[10px] uppercase tracking-wider text-blue font-semibold">
                      {p.category}
                    </p>
                    <h3 className="mt-1 font-display text-lg font-bold tracking-tight text-fg group-hover:text-blue transition-colors">
                      {p.name}
                    </h3>
                    <p className="mt-1.5 text-xs sm:text-[13px] leading-relaxed text-muted line-clamp-2">
                      {p.description}
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs">
                    <span className="font-mono font-bold text-fg">{p.priceStarting}</span>
                    <span className="inline-flex items-center gap-1 font-semibold text-blue">
                      Ver detalhes <Icon n="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                    </span>
                  </div>
                </div>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PortfolioChapter() {
  const [items, setItems] = useState<PublicPortfolioItem[]>(() =>
    PROJECTS.slice(0, 3).map((p) => ({
      slug: p.slug,
      title: p.title,
      client: 'Cliente JOGIMIL',
      category: CATEGORIES.find((c) => c.id === p.category)?.label || p.category,
      description: p.summary,
      image: p.gallery[0] || '',
      metrics: p.result,
      tags: p.tech,
    }))
  );

  useEffect(() => {
    let active = true;
    fetchPublicPortfolio().then((dynamic) => {
      if (active && dynamic.length > 0) {
        setItems(dynamic.slice(0, 3));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="sec-portfolio" data-tone="b" className="slope relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-20">
      <PageScene3D page="portfolio" positioning="absolute" />
      <div className="container-x relative z-10">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line/60 pb-6">
            <div>
              <p className="eyebrow">05 · Portfólio</p>
              <h2 className="h2 mt-2 max-w-2xl">Projectos entregues</h2>
              <p className="mt-2 max-w-xl text-sm sm:text-base text-muted">
                Casos reais de engenharia digital, sistemas corporativos e infraestruturas desenvolvidas em Angola.
              </p>
            </div>
            <a href={href('portfolio')} className="text-sm font-semibold text-blue hover:underline underline-offset-4 shrink-0">
              Abrir página de Portfólio →
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {items.map((proj, idx) => (
            <Reveal key={proj.slug} delay={idx * 90}>
              <article className="group flex h-full flex-col">
                <a
                  href={href('portfolio', proj.slug)}
                  className="card-sheen relative block h-52 w-full overflow-hidden bg-gradient-to-br from-blue/12 via-card to-cyan-500/8"
                >
                  {proj.image ? (
                    <img
                      src={proj.image}
                      alt={proj.title}
                      loading="lazy"
                      className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <span className="font-display text-3xl font-bold text-fg/20">
                        {proj.title.slice(0, 2).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                  <span className="absolute left-4 bottom-3.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-white/90">
                    {proj.category}
                  </span>
                </a>

                <div className="flex flex-1 flex-col pt-4">
                  <p className="text-[11px] uppercase tracking-[0.14em] text-muted">{proj.client}</p>
                  <a href={href('portfolio', proj.slug)}>
                    <h3 className="mt-1 font-display text-xl font-semibold text-fg transition-colors group-hover:text-blue">
                      {proj.title}
                    </h3>
                  </a>
                  <p className="mt-2 flex-1 text-sm text-muted line-clamp-2">{proj.description}</p>
                  <a href={href('portfolio', proj.slug)} className="mt-4 text-xs font-semibold text-blue hover:underline underline-offset-4">
                    Ver detalhes →
                  </a>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function AboutChapter() {
  const [team, setTeam] = useState<PublicTeamMember[]>(() =>
    TEAM_MEMBERS.slice(0, 3).map((m) => ({
      id: m.id,
      name: m.name,
      role: m.role,
      department: m.department,
      bio: m.bio,
      photo: m.photo || '',
      email: m.email,
      initials: m.initials,
    }))
  );

  useEffect(() => {
    let active = true;
    fetchPublicTeam().then((dynamic) => {
      if (active && dynamic.length > 0) {
        setTeam(dynamic.slice(0, 3));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="sec-sobre" data-tone="a" className="slope slope-r relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-20">
      <PageScene3D page="sobre" positioning="absolute" />
      <div className="container-x relative z-10">
        <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
          <div className="lg:col-span-5">
            <Reveal>
              <p className="eyebrow">06 · Sobre nós &amp; Equipa</p>
              <h2 className="h2 mt-2">Engenharia Angolana em Luanda</h2>
              <p className="mt-4 text-sm sm:text-base leading-relaxed text-muted">
                {COMPANY.about}
              </p>
              <div className="mt-6 flex flex-wrap gap-6 text-sm font-semibold">
                <a href={href('sobre')} className="text-blue hover:underline underline-offset-4">
                  Conhecer a empresa e equipa →
                </a>
                <a href={href('parceiros')} className="text-muted hover:text-fg transition-colors">
                  Programa de parceiros
                </a>
              </div>
            </Reveal>
          </div>

          <div className="lg:col-span-7 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {team.map((m, idx) => (
              <Reveal key={m.id} delay={idx * 80}>
                <a href={href('sobre')} className="group block border border-line/60 bg-card/70 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:border-blue/50">
                  <div className="h-44 w-full overflow-hidden bg-gradient-to-br from-blue/12 via-card to-cyan-500/8 flex items-center justify-center">
                    {m.photo ? (
                      <img src={m.photo} alt={m.name} loading="lazy" className="h-full w-full object-cover object-top transition-transform duration-500 group-hover:scale-105" />
                    ) : (
                      <span className="font-display text-2xl font-bold text-fg/40">{m.initials}</span>
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-display text-base font-semibold text-fg group-hover:text-blue transition-colors truncate">{m.name}</p>
                    <p className="text-xs text-blue truncate mt-0.5">{m.role}</p>
                    <p className="text-[11px] text-muted truncate mt-1">{m.department}</p>
                  </div>
                </a>
              </Reveal>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function BlogChapter() {
  const [posts, setPosts] = useState<PublicNewsPost[]>(() =>
    POSTS.slice(0, 3).map((p) => ({
      slug: p.slug,
      title: p.title,
      tag: p.tag,
      category: p.tag,
      date: p.date,
      excerpt: p.excerpt,
      body: p.body,
      author: 'Equipa JOGIMIL',
    }))
  );

  useEffect(() => {
    let active = true;
    fetchPublicNews().then((dynamic) => {
      if (active && dynamic.length > 0) {
        setPosts(dynamic.slice(0, 3));
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section id="sec-blog" data-tone="b" className="slope relative overflow-hidden min-h-[100svh] flex flex-col justify-center py-20">
      <PageScene3D page="blog" positioning="absolute" />
      <div className="container-x relative z-10">
        <Reveal>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between border-b border-line/60 pb-6">
            <div>
              <p className="eyebrow">07 · Blog &amp; Notícias</p>
              <h2 className="h2 mt-2 max-w-2xl">Artigos, Fiscalidade &amp; Inovação</h2>
            </div>
            <a href={href('blog')} className="text-sm font-semibold text-blue hover:underline underline-offset-4 shrink-0">
              Explorar todo o Blog →
            </a>
          </div>
        </Reveal>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {posts.map((post, idx) => (
            <Reveal key={post.slug} delay={idx * 80}>
              <a href={href('blog', post.slug)} className="group flex h-full flex-col border border-line/60 bg-card/70 p-6 transition-all duration-300 hover:-translate-y-1 hover:border-blue/50">
                <div className="flex items-center justify-between text-[11px] font-mono uppercase tracking-wider text-muted">
                  <span className="text-blue font-semibold">{post.category}</span>
                  <span>{post.date}</span>
                </div>
                <h3 className="mt-3 font-display text-xl font-semibold leading-snug text-fg group-hover:text-blue transition-colors">
                  {post.title}
                </h3>
                <p className="mt-2.5 flex-1 text-sm text-muted line-clamp-3">{post.excerpt}</p>
                <span className="mt-5 text-xs font-semibold text-blue">Ler artigo →</span>
              </a>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section id="sec-contacto" data-tone="hero" className="slope relative overflow-hidden min-h-[85svh] flex flex-col justify-center py-20">
      <PageScene3D page="contacto" positioning="absolute" />
      <div className="container-x relative z-10 text-center">
        <Reveal>
          <p className="eyebrow">08 · Contacto</p>
          <h2 className="h2 mx-auto mt-2 max-w-3xl">Vamos falar sobre o seu projecto?</h2>
          <p className="lead mx-auto mt-4 max-w-xl">Diga-nos o que precisa. Respondemos com uma proposta clara.</p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href={href('contacto', 'orcamento')} className="btn btn-accent">Pedir orçamento</a>
            <a href={href('parceiros')} className="btn btn-ghost">Ser parceiro</a>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

const PARTNER_LOGOS = [
  { name: 'AGT · SAF-T (AO)', sub: 'Conformidade Fiscal' },
  { name: 'EMIS · Multicaixa', sub: 'Pagamentos' },
  { name: 'SOBA GEST', logo: '/products/soba-gest-logo.png' },
  { name: 'SOBA SCHOOL', logo: '/products/soba-school-logo.png' },
  { name: 'Angola Cables', sub: 'Cloud & Conectividade' },
  { name: 'Unitel Empresas', sub: 'Telecomunicações' },
  { name: 'Microsoft Azure', sub: 'Infraestrutura' },
  { name: 'AWS Cloud', sub: 'Escalabilidade' },
];

function PartnersStrip() {
  const track = [...PARTNER_LOGOS, ...PARTNER_LOGOS];

  return (
    <section
      aria-label="Parceiros e Ecossistema"
      className="relative overflow-hidden py-10 sm:py-12 bg-transparent"
    >
      <div className="container-x mb-6 flex items-center justify-between">
        <p className="eyebrow">Parceiros &amp; Ecossistema</p>
        <a href={href('parceiros')} className="text-xs font-semibold text-blue hover:underline underline-offset-4">
          Tornar-se parceiro →
        </a>
      </div>

      <div className="relative w-full overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
        <div className="flex w-max items-center gap-12 sm:gap-16 animate-marquee hover:[animation-play-state:paused]">
          {track.map((item, idx) => (
            <div
              key={`${item.name}-${idx}`}
              className="flex shrink-0 items-center justify-center opacity-65 transition-opacity duration-300 hover:opacity-100 select-none"
            >
              {item.logo ? (
                <img
                  src={item.logo}
                  alt={item.name}
                  loading="lazy"
                  className="h-10 sm:h-12 w-auto object-contain grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
                />
              ) : (
                <div className="flex flex-col items-start">
                  <span className="font-display text-lg sm:text-xl font-bold tracking-tight text-fg">
                    {item.name}
                  </span>
                  <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-blue">
                    {item.sub}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default function Home() {
  return (
    <>
      <SectionRail />
      <Hero />
      <Trust />
      <Services />
      <ProductsChapter />
      <PortfolioChapter />
      <AboutChapter />
      <BlogChapter />
      <Cta />
      <PartnersStrip />
    </>
  );
}
