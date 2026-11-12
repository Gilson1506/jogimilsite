import { useState } from 'react';
import { CATEGORIES, PROJECTS } from '../data/content';
import { href } from '../lib/hooks';
import { BeforeAfter, Img, Lightbox } from '../components/Media';
import { Icon } from '../components/ui';
import { Body, PageHead } from './shared';
import { NotFound } from './Services';

export function Portfolio() {
  const [cat, setCat] = useState('all');
  const list = PROJECTS.filter((p) => cat === 'all' || p.category === cat);
  return (<>
    <PageHead
      eyebrow="Portfólio & Casos de Estudo"
      title="Projectos e Soluções"
      lead="Casos reais e soluções empresariais desenvolvidas pela JOGIMIL para o mercado angolano."
      crumbs={[['Portfólio']]}
    />
    <Body>
      {/* Efeito Visual Moderno: Página em Desenvolvimento */}
      <div className="relative overflow-hidden rounded-3xl border border-blue/30 bg-gradient-to-br from-card via-[#001033] to-slate-950 p-8 sm:p-12 shadow-2xl mb-12">
        {/* Glow de fundo */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue/25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />

        <div className="relative z-10 max-w-3xl">
          {/* Badge com radar pulsante */}
          <div className="inline-flex items-center gap-2.5 rounded-full border border-blue/40 bg-blue/10 px-3.5 py-1 text-xs font-mono font-semibold text-accent">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-accent"></span>
            </span>
            PÁGINA EM DESENVOLVIMENTO & HOMOLOGAÇÃO
          </div>

          <h2 className="mt-5 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-tight">
            Estamos a preparar a nova galeria de projectos reais.
          </h2>

          <p className="mt-4 text-base sm:text-lg leading-relaxed text-slate-300">
            A equipa da JOGIMIL está a compilar e validar os estudos de caso mais recentes de implementação do <strong className="text-white">SOBA GEST</strong> (faturação homologada AGT), do <strong className="text-white">SOBA SCHOOL</strong> (gestão académica integrada) e das nossas operações de infraestrutura e NOC 24/7.
          </p>

          {/* Barra de Progresso Futurista */}
          <div className="mt-8 rounded-2xl border border-white/10 bg-black/40 p-5 backdrop-blur-sm">
            <div className="flex items-center justify-between text-xs font-mono text-slate-300 mb-2">
              <span className="flex items-center gap-2">
                <Icon n="bolt" className="h-4 w-4 text-accent" /> Curadoria de Casos de Estudo
              </span>
              <span className="text-accent font-bold">85% Pronto</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-white/10">
              <div className="h-full rounded-full bg-gradient-to-r from-blue to-accent transition-all duration-1000 w-[85%]" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2 pt-1 text-[11px] font-mono text-slate-400">
              <span className="rounded bg-white/5 px-2 py-0.5">✓ Faturação AGT SAF-T</span>
              <span className="rounded bg-white/5 px-2 py-0.5">✓ Gestão Escolar 5 Portais</span>
              <span className="rounded bg-white/5 px-2 py-0.5">✓ NOC 24/7 & Redes</span>
              <span className="rounded bg-white/5 px-2 py-0.5 text-accent">⚡ Autorizações de Clientes em Curso</span>
            </div>
          </div>

          {/* Botões de Ação Imediata */}
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href={`https://wa.me/244926564998?text=${encodeURIComponent('Olá JOGIMIL! Gostaria de conhecer demonstrações práticas e casos de estudo.')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary inline-flex items-center gap-2 shadow-lg"
            >
              <Icon n="wa" className="h-4 w-4" /> Solicitar Demonstração no WhatsApp
            </a>
            <a
              href={href('produtos')}
              className="btn btn-ghost inline-flex items-center gap-2 border border-white/20 text-white hover:border-white"
            >
              Ver os Produtos Próprios <Icon n="arrow" className="h-4 w-4" />
            </a>
          </div>
        </div>
      </div>

      {/* Filtro e Listagem de Prévia */}
      <div className="mt-8">
        <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
              className={`inline-flex min-h-[44px] items-center rounded-none border px-5 text-sm font-semibold transition ${cat === c.id ? 'border-blue bg-blue text-white' : 'border-line hover:border-blue'}`}>{c.label}</button>
          ))}
        </div>

        {list.length === 0 ? (
          <p className="mt-10 text-muted" role="status">Ainda não há projectos nesta categoria.</p>
        ) : (
          <ul className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8" aria-label="Projectos" tabIndex={0}>
            {list.map((p) => (
              <li key={p.slug} className="w-[85%] shrink-0 snap-start sm:w-[420px]">
                <a href={href('portfolio', p.slug)} className="card card-hover block overflow-hidden rounded-none border border-line">
                  {p.gallery[0]
                    ? <Img src={p.gallery[0]} alt={`Captura de ecrã de ${p.title}`} />
                    : <div className="flex aspect-[16/10] items-center justify-center bg-blue/10 text-blue"><Icon n="layout" className="h-10 w-10" /></div>}
                  <div className="p-6">
                    <p className="text-xs font-semibold uppercase tracking-wider text-accent">{CATEGORIES.find((c) => c.id === p.category)?.label}</p>
                    <h2 className="mt-2 text-xl font-semibold">{p.title}</h2>
                    <p className="mt-2 text-sm text-muted">{p.summary}</p>
                  </div>
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </Body>
  </>);
}

export function ProjectDetail({ id }: { id: string }) {
  const p = PROJECTS.find((x) => x.slug === id);
  const [lb, setLb] = useState<number | null>(null);
  if (!p) return <NotFound />;
  return (<>
    <PageHead eyebrow={CATEGORIES.find((c) => c.id === p.category)?.label || ''} title={p.title} lead={p.summary} crumbs={[['Portfólio', href('portfolio')], [p.title]]} />
    <Body>
      {p.gallery.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-3">
          {p.gallery.map((g, i) => (
            <button key={g} onClick={() => setLb(i)} className="overflow-hidden rounded-none text-left" aria-label={`Abrir imagem ${i + 1} em ecrã inteiro`}>
              <Img src={g} alt={`Captura de ecrã ${i + 1} de ${p.title}`} />
            </button>
          ))}
        </div>
      )}
      {p.before && p.after && <div className="mt-10"><h2 className="h2 mb-6">Antes e depois</h2><BeforeAfter before={p.before} after={p.after} /></div>}
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {([['O problema', p.problem], ['A solução', p.solution], ['O resultado', p.result]] as const).map(([t, d]) => (
          <div key={t} className="card p-7"><p className="eyebrow">{t}</p><p className="mt-3">{d}</p></div>
        ))}
      </div>
      <h2 className="mt-12 text-2xl font-semibold">Tecnologias usadas</h2>
      <ul className="mt-4 flex flex-wrap gap-2">{p.tech.map((t) => <li key={t} className="rounded-full border border-line px-4 py-1.5 text-sm">{t}</li>)}</ul>
      {p.testimonial && <blockquote className="card mt-12 p-8 text-xl">“{p.testimonial.quote}”<footer className="mt-3 text-sm text-muted">{p.testimonial.author}</footer></blockquote>}
    </Body>
    {lb !== null && <Lightbox images={p.gallery} start={lb} onClose={() => setLb(null)} />}
  </>);
}
