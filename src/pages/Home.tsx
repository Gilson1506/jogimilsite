import { useState } from 'react';
import { COMPANY, SERVICES, PRODUCTS } from '../data/content';
import { href, useReducedMotion } from '../lib/hooks';
import { Counter, Icon, Icon3D, Reveal, Typewriter } from '../components/ui';
import ParticleLogo from '../components/ParticleLogo';
import { StackedDeckSwiper } from '../components/StackedDeckSwiper';

function Hero() {
  const reduce = useReducedMotion();

  return (
    <section data-tone="hero" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-20 sm:pt-36">
      {/* Canvas 3D posicionado desde o topo absoluto (atrás do cabeçalho) para a explosão atingir o topo */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[52svh] min-h-[340px] sm:h-[72svh] z-0 overflow-visible">
        {!reduce && <ParticleLogo />}
      </div>
      {/* Espaço reservado para manter a posição dos títulos perfeitamente alinhada */}
      <div className="relative h-[20svh] min-h-[130px] sm:h-[38svh] sm:min-h-[180px] pointer-events-none" aria-hidden="true" />
      <div className="container-x relative z-10 flex flex-1 flex-col justify-center pb-20 sm:pb-28 pt-2 sm:pt-4">
        <p className="eyebrow">Luanda · Angola</p>
        <h1 className="mt-3 sm:mt-4 max-w-4xl text-3xl font-semibold leading-[1.12] sm:text-6xl sm:leading-[1.05] lg:text-7xl">
          Software & IA à medida para <Typewriter words={['agentes de IA', 'web & mobile', 'automação', 'NOC 24/7', 'desktop']} />
        </h1>
        <p className="lead mt-3 sm:mt-5 max-w-2xl text-base sm:text-xl">{COMPANY.tagline}</p>
        
        {/* Ações da Hero */}
        <div className="mt-8 sm:mt-10 flex flex-wrap gap-3">
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
  return (
    <section data-tone="b" aria-label="Factos sobre a JOGIMIL" className="slope relative pb-16">
      <div className="container-x grid gap-8 sm:grid-cols-3">
        {facts.map((f, i) => (
          <Reveal key={f.l} delay={i * 80}>
            <p className="font-display text-6xl font-semibold text-accent"><Counter to={f.n} suffix={f.s} /></p>
            <p className="mt-1 text-lg font-semibold">{f.l}</p>
            <p className="text-muted">{f.d}</p>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

/**
 * Seção de Serviços & Produtos na Home
 * Divide 50% / 50% em telas maiores com Serviços de um lado e Produtos do outro.
 * Em telas menores permite alternar entre cada parte com apenas um clique.
 */
function Services() {
  // Configuração rápida dos itens exibidos na Home (fácil de alterar ou reordenar)
  const displayedServices = SERVICES.filter((s) => s.main).slice(0, 6);
  const displayedProducts = PRODUCTS;

  // Estado de visualização para alternância simples:
  // 'both': 50% Serviços e 50% Produtos (padrão em telas maiores lg:)
  // 'services': apenas Serviços
  // 'products': apenas Produtos
  const [viewMode, setViewMode] = useState<'both' | 'services' | 'products'>('both');
  const [mobileTab, setMobileTab] = useState<'services' | 'products'>('services');

  return (
    <section data-tone="a" className="slope slope-r pb-24">
      <div className="container-x">
        {/* Cabeçalho da Seção com Seletor de Modo */}
        <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <Reveal>
            <p className="eyebrow">Soluções & Tecnologia</p>
            <h2 className="h2 mt-3 max-w-2xl">
              Serviços Sob Medida <span className="text-blue">&</span> Produtos Prontos
            </h2>
            <p className="lead mt-3 max-w-2xl text-base sm:text-lg">
              Escolha entre o desenvolvimento à medida para o seu fluxo específico ou soluções de software prontas por subscrição para o mercado angolano.
            </p>
          </Reveal>

          {/* Alternador em Telas Médias e Grandes (Desktop / lg:) */}
          <div className="hidden lg:flex items-center gap-1.5 rounded-full border border-line bg-card/80 p-1.5 shadow-sm backdrop-blur-sm shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('both')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === 'both'
                  ? 'bg-blue text-white shadow-md'
                  : 'text-muted hover:text-fg'
              }`}
            >
              <span className="flex h-2 w-2 rounded-full bg-emerald-400" />
              Ambos (50% / 50%)
            </button>
            <button
              type="button"
              onClick={() => setViewMode('services')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === 'services'
                  ? 'bg-blue text-white shadow-md'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Apenas Serviços ({SERVICES.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('products')}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold transition-all ${
                viewMode === 'products'
                  ? 'bg-blue text-white shadow-md'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Apenas Produtos ({displayedProducts.length})
            </button>
          </div>

          {/* Alternador em Telas Menores (Mobile & Tablet) */}
          <div className="flex lg:hidden w-full rounded-xl border border-line bg-card/80 p-1 shadow-sm">
            <button
              type="button"
              onClick={() => setMobileTab('services')}
              className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
                mobileTab === 'services'
                  ? 'bg-blue text-white shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Serviços ({SERVICES.length})
            </button>
            <button
              type="button"
              onClick={() => setMobileTab('products')}
              className={`flex-1 rounded-lg py-2.5 text-center text-sm font-semibold transition-all ${
                mobileTab === 'products'
                  ? 'bg-blue text-white shadow-sm'
                  : 'text-muted hover:text-fg'
              }`}
            >
              Produtos ({displayedProducts.length})
            </button>
          </div>
        </div>

        {/* =========================================================================
            LAYOUT PRINCIPAL:
            - Em telas maiores (lg:):
              - Se viewMode === 'both': Grid 50% / 50% lado a lado
              - Se viewMode === 'services': Apenas Serviços (largura total)
              - Se viewMode === 'products': Apenas Produtos (largura total)
            - Em telas menores (< lg:):
              - Exibe conforme a aba ativa (mobileTab: 'services' ou 'products')
           ========================================================================= */}
        <div className="mt-12">
          {/* MODO DESKTOP: AMBOS 50% / 50% DIVIDIDOS AO MEIO */}
          <div className={`hidden lg:grid ${viewMode === 'both' ? 'grid-cols-2 gap-10 xl:gap-14' : 'grid-cols-1'}`}>
            
            {/* --- PARTE 1 (50%): SERVIÇOS (SEM BORDAS NOS CARDS) --- */}
            {(viewMode === 'both' || viewMode === 'services') && (
              <div className={`flex flex-col ${viewMode === 'both' ? 'border-r border-line/50 pr-0 xl:pr-10' : ''}`}>
                <div className="flex items-center justify-between pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue/10 text-blue font-bold">
                      <Icon n="ia" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-muted">Desenvolvimento & TI</p>
                      <h3 className="text-xl font-bold text-fg">Serviços Especializados</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-bg px-2.5 py-0.5 font-mono text-xs text-muted">
                    {SERVICES.length} disponíveis
                  </span>
                </div>

                {/* Grade de Serviços: Sem bordas nos cards, estilo fluido e limpo */}
                <div className={`mt-6 grid gap-5 ${viewMode === 'services' ? 'sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2'}`}>
                  {(viewMode === 'services' ? SERVICES.filter((s) => s.main) : displayedServices).map((s, i) => (
                    <Reveal key={s.slug} delay={(i % 3) * 60}>
                      <a
                        href={href('servicos', s.slug)}
                        className="group flex h-full flex-col justify-between rounded-2xl bg-card/40 hover:bg-card/90 p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg shadow-sm"
                      >
                        <div>
                          <div className="h-12 w-12 flex items-center justify-center">
                            <Icon3D name={s.icon} className="h-12 w-12" />
                          </div>
                          <h4 className="mt-4 text-base font-semibold tracking-tight text-fg group-hover:text-blue transition-colors">
                            {s.title}
                          </h4>
                          <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted line-clamp-3">
                            {s.short}
                          </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-blue">
                          Saber mais <Icon n="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                        </span>
                      </a>
                    </Reveal>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <a href={href('servicos')} className="btn btn-ghost w-full sm:w-auto">
                    Ver todos os {SERVICES.length} serviços <Icon n="arrow" className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}

            {/* --- PARTE 2 (50%): PRODUTOS (CARD RETANGULAR COM IMAGEM, SEM ÍCONE, SEM BORDAS) --- */}
            {(viewMode === 'both' || viewMode === 'products') && (
              <div className="flex flex-col">
                <div className="flex items-center justify-between pb-4 border-b border-line">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent font-bold">
                      <Icon n="box" className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">Software Pronto & Subscrição</p>
                      <h3 className="text-xl font-bold text-fg">Produtos Próprios JOGIMIL</h3>
                    </div>
                  </div>
                  <span className="rounded-full bg-accent/10 px-2.5 py-0.5 font-mono text-xs text-accent font-medium">
                    Homologados
                  </span>
                </div>

                {/* Grade de Produtos: Cards Retangulares Horizontais, Imagem Real, Sem Ícone, Sem Bordas */}
                <div className="mt-6 flex flex-col gap-5">
                  {displayedProducts.map((p, i) => (
                    <Reveal key={p.slug} delay={i * 70}>
                      <a
                        href={href('produtos', p.slug)}
                        className="group flex flex-col sm:flex-row items-stretch rounded-2xl bg-card/50 hover:bg-card/90 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-xl shadow-sm p-4 sm:p-4.5 gap-4.5"
                      >
                        {/* Imagem Retangular do Produto (Sem Ícone) */}
                        <div className="w-full sm:w-48 lg:w-44 xl:w-52 shrink-0 aspect-[16/10] sm:aspect-auto sm:min-h-[140px] rounded-xl overflow-hidden bg-slate-950 relative shadow-inner">
                          <img
                            src={p.image}
                            alt={p.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          />
                          <span className="absolute top-2 left-2 rounded-md bg-black/80 backdrop-blur-sm px-2 py-0.5 font-mono text-[10px] font-semibold text-accent">
                            {p.tag}
                          </span>
                        </div>

                        {/* Conteúdo: Título, Parágrafo e Preço */}
                        <div className="flex-1 flex flex-col justify-between py-1">
                          <div>
                            <span className="font-mono text-[11px] uppercase tracking-wider text-muted">
                              {p.category}
                            </span>
                            <h4 className="mt-1 text-base sm:text-lg font-bold tracking-tight text-fg group-hover:text-blue transition-colors">
                              {p.name}
                            </h4>
                            <p className="mt-2 text-xs sm:text-sm leading-relaxed text-muted line-clamp-3">
                              {p.description}
                            </p>
                          </div>

                          <div className="mt-3.5 pt-3 border-t border-line/40 flex items-center justify-between text-xs">
                            <span className="font-mono font-bold text-fg">
                              {p.priceStarting}
                            </span>
                            <span className="inline-flex items-center gap-1 font-semibold text-blue group-hover:text-accent">
                              Ver detalhes <Icon n="arrow" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                            </span>
                          </div>
                        </div>
                      </a>
                    </Reveal>
                  ))}
                </div>

                <div className="mt-8 pt-4">
                  <a href={href('produtos')} className="btn btn-primary w-full sm:w-auto">
                    Ver catálogo de produtos <Icon n="arrow" className="h-4 w-4" />
                  </a>
                </div>
              </div>
            )}
          </div>

          {/* MODO MOBILE & TABLET (< lg:) - SEM BORDAS */}
          <div className="block lg:hidden">
            {mobileTab === 'services' ? (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
                  <h3 className="text-lg font-bold text-fg">Serviços Especializados</h3>
                  <span className="font-mono text-xs text-muted">{SERVICES.length} disponíveis</span>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  {SERVICES.filter((s) => s.main).map((s, i) => (
                    <Reveal key={s.slug} delay={(i % 2) * 50}>
                      <a
                        href={href('servicos', s.slug)}
                        className="group flex h-full flex-col justify-between rounded-2xl bg-card/50 hover:bg-card/80 p-5 transition-all duration-200 shadow-sm"
                      >
                        <div>
                          <Icon3D name={s.icon} className="h-12 w-12" />
                          <h4 className="mt-3 text-base font-semibold text-fg group-hover:text-blue">
                            {s.title}
                          </h4>
                          <p className="mt-1.5 text-xs text-muted leading-relaxed">
                            {s.short}
                          </p>
                        </div>
                        <span className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-blue">
                          Saber mais <Icon n="arrow" className="h-3.5 w-3.5" />
                        </span>
                      </a>
                    </Reveal>
                  ))}
                </div>
                <div className="mt-6">
                  <a href={href('servicos')} className="btn btn-ghost w-full justify-center">
                    Ver todos os {SERVICES.length} serviços
                  </a>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-line mb-5">
                  <h3 className="text-lg font-bold text-fg">Produtos Próprios JOGIMIL</h3>
                  <span className="font-mono text-xs text-accent">Homologados</span>
                </div>
                <div className="flex flex-col gap-4">
                  {displayedProducts.map((p, i) => (
                    <Reveal key={p.slug} delay={i * 60}>
                      <a
                        href={href('produtos', p.slug)}
                        className="group block rounded-2xl bg-card/60 p-4 transition-all duration-200 shadow-sm"
                      >
                        <div className="aspect-[16/10] w-full rounded-xl overflow-hidden bg-slate-950 mb-3">
                          <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                        </div>
                        <span className="font-mono text-[10px] uppercase tracking-wider text-muted">
                          {p.category}
                        </span>
                        <h4 className="mt-0.5 text-base font-bold text-fg group-hover:text-blue">
                          {p.name}
                        </h4>
                        <p className="mt-1.5 text-xs text-muted leading-relaxed line-clamp-3">
                          {p.description}
                        </p>
                        <div className="mt-3 pt-3 border-t border-line/40 flex items-center justify-between text-xs font-semibold text-blue">
                          <span className="font-mono text-fg">{p.priceStarting}</span>
                          <span className="inline-flex items-center gap-1">Ver produto <Icon n="arrow" className="h-3.5 w-3.5" /></span>
                        </div>
                      </a>
                    </Reveal>
                  ))}
                </div>
                <div className="mt-6">
                  <a href={href('produtos')} className="btn btn-primary w-full justify-center">
                    Ver catálogo de produtos
                  </a>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function Process() {
  const steps = [
    ['Descoberta', 'Percebemos o seu negócio e o que precisa.'],
    ['Desenho', 'Definimos a solução e os ecrãs.'],
    ['Desenvolvimento', 'Construímos e mostramos o progresso.'],
    ['Entrega', 'Instalamos e formamos a sua equipa.'],
    ['Suporte', 'Corrigimos, actualizamos e apoiamos.'],
  ];
  return (
    <section data-tone="b" className="slope pb-24">
      <div className="container-x">
        <Reveal><p className="eyebrow">Como trabalhamos</p><h2 className="h2 mt-3 max-w-2xl">Do primeiro contacto ao suporte</h2></Reveal>
        <ol className="mt-12 grid gap-px overflow-hidden rounded-none border border-line bg-line sm:grid-cols-5">
          {steps.map(([t, d], i) => (
            <li key={t} className="bg-bg p-6 rounded-none">
              <span className="font-mono text-sm text-accent">{String(i + 1).padStart(2, '0')}</span>
              <h3 className="mt-3 text-lg font-semibold">{t}</h3>
              <p className="mt-1 text-sm text-muted">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

function Featured() {
  return (
    <section data-tone="a" className="slope slope-r pb-24 overflow-hidden">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Trabalhos em destaque</p>
              <h2 className="h2 mt-3 max-w-2xl">Produtos e Projectos JOGIMIL</h2>
            </div>
            <a href={href('portfolio')} className="text-sm font-semibold text-accent hover:underline">
              Ver todos no portfólio →
            </a>
          </div>
        </Reveal>

        {/* Swiper em Estilo Deck 3D: Fotos Sobrepostas uma em cima da outra */}
        <Reveal className="mt-8">
          <StackedDeckSwiper />
        </Reveal>
      </div>
    </section>
  );
}

function Cta() {
  return (
    <section data-tone="hero" className="slope pb-20">
      <div className="container-x text-center">
        <Reveal>
          <h2 className="h2 mx-auto max-w-3xl">Vamos falar sobre o seu projecto?</h2>
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

export default function Home() {
  return (<><Hero /><Trust /><Services /><Process /><Featured /><Cta /></>);
}
