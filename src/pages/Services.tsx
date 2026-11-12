import { SERVICES } from '../data/content';
import { href } from '../lib/hooks';
import { Icon, Icon3D, Reveal } from '../components/ui';
import { Body, PageHead } from './shared';

export function Services() {
  return (<>
    <PageHead eyebrow="Serviços" title="Do pedido à entrega, e depois o suporte" lead="Dezasseis áreas de especialização, com a mesma forma de trabalhar: perceber o problema, propor a solução e acompanhar até funcionar." crumbs={[['Serviços']]} />
    <Body>
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {SERVICES.map((s, i) => (
          <Reveal key={s.slug} delay={(i % 3) * 60}>
            <a
              href={href('servicos', s.slug)}
              className="group relative flex h-full flex-col p-4 sm:p-6 transition-all duration-300 hover:-translate-y-1"
            >
              {/* Ícone 3D flutuante: sem bordas, sem fundo cinzento, sem aspecto de card */}
              <Icon3D name={s.icon} className="h-16 w-16" />
              <h2 className="mt-6 text-xl font-semibold tracking-tight transition-colors duration-200 group-hover:text-blue">
                {s.title}
              </h2>
              <p className="mt-3 flex-1 text-sm sm:text-[0.95rem] leading-relaxed text-muted">
                {s.short}
              </p>
              <span className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-blue">
                Ver detalhes <Icon n="arrow" className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-2" />
              </span>
            </a>
          </Reveal>
        ))}
      </div>
    </Body>
  </>);
}

/** Mesma estrutura em todas: problema, solução, processo, entregas, perguntas frequentes, chamada à acção. */
export function ServiceDetail({ id }: { id: string }) {
  const s = SERVICES.find((x) => x.slug === id);
  if (!s) return <NotFound />;
  const i = SERVICES.indexOf(s), next = SERVICES[(i + 1) % SERVICES.length];
  return (<>
    <PageHead eyebrow="Serviço" title={s.title} lead={s.short} crumbs={[['Serviços', href('servicos')], [s.title]]} />
    <Body>
      <div className="mb-10 flex items-center gap-6">
        <Icon3D name={s.icon} className="h-20 w-20" />
        <div>
          <span className="eyebrow">Solução JOGIMIL</span>
          <p className="mt-1 font-display text-2xl font-semibold">{s.title}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Reveal><div className="h-full rounded-none border border-line/70 border-l-4 border-l-blue-600 bg-card p-8 shadow-sm transition hover:shadow-md"><p className="eyebrow">O problema</p><p className="mt-3 text-lg leading-relaxed">{s.problem}</p></div></Reveal>
        <Reveal delay={80}><div className="h-full rounded-none border border-line/70 border-l-4 border-l-blue-500 bg-card p-8 shadow-sm transition hover:shadow-md"><p className="eyebrow">A nossa solução</p><p className="mt-3 text-lg leading-relaxed">{s.solution}</p></div></Reveal>
      </div>
      <Reveal className="mt-16"><h2 className="h2">Como trabalhamos</h2></Reveal>
      <ol className="mt-8 grid gap-4 sm:grid-cols-4">
        {s.process.map((p, k) => (<li key={p} className="rounded-none border border-line/70 bg-card p-6 shadow-sm transition hover:border-blue/60"><span className="font-mono text-sm text-accent">{String(k + 1).padStart(2, '0')}</span><p className="mt-3 font-semibold">{p}</p></li>))}
      </ol>
      <div className="mt-16 grid gap-10 lg:grid-cols-2">
        <div>
          <h2 className="h2">O que recebe</h2>
          <ul className="mt-6 space-y-3">{s.deliverables.map((d) => (<li key={d} className="flex gap-3"><Icon n="check" className="mt-1 h-5 w-5 shrink-0 text-blue" />{d}</li>))}</ul>
        </div>
        <div>
          <h2 className="h2">Perguntas frequentes</h2>
          <div className="mt-6 divide-y divide-line/60 rounded-none border border-line/70 bg-card shadow-sm">
            {s.faq.map((f) => (
              <details key={f.q} className="group p-5"><summary className="flex min-h-[44px] cursor-pointer items-center justify-between font-semibold">{f.q}<Icon n="plus" className="h-5 w-5 transition group-open:rotate-45" /></summary><p className="mt-2 text-muted">{f.a}</p></details>
            ))}
          </div>
        </div>
      </div>
    </Body>
    <section data-tone="hero" className="slope slope-r pb-20">
      <div className="container-x flex flex-wrap items-center justify-between gap-6">
        <h2 className="h2 max-w-xl">Precisa de {s.title.toLowerCase()}?</h2>
        <div className="flex flex-wrap gap-3"><a href={href('contacto', 'orcamento')} className="btn btn-accent">Pedir orçamento</a><a href={href('servicos', next.slug)} className="btn btn-ghost">Seguinte: {next.title}</a></div>
      </div>
    </section>
  </>);
}

export function NotFound() {
  return (<>
    <PageHead eyebrow="Erro 404" title="Esta página não existe" lead="O endereço pode estar errado ou a página mudou de sítio." />
    <Body><div className="flex flex-wrap gap-3"><a href={href('inicio')} className="btn btn-primary">Ir para o início</a><a href={href('servicos')} className="btn btn-ghost">Ver serviços</a><a href={href('contacto')} className="btn btn-ghost">Contacto</a></div></Body>
  </>);
}
