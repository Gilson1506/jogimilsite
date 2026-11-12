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
    <PageHead eyebrow="Portfólio" title="Projectos e produtos" lead="Só publicamos casos reais autorizados pelos clientes. Para já, mostramos os nossos produtos próprios." crumbs={[['Portfólio']]} />
    <Body>
      <div role="group" aria-label="Filtrar por categoria" className="flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button key={c.id} onClick={() => setCat(c.id)} aria-pressed={cat === c.id}
            className={`inline-flex min-h-[44px] items-center rounded-none border px-5 text-sm font-semibold transition ${cat === c.id ? 'border-blue bg-blue text-white' : 'border-line hover:border-blue'}`}>{c.label}</button>
        ))}
      </div>

      {list.length === 0 ? (
        <p className="mt-10 text-muted" role="status">Ainda não há projectos nesta categoria.</p>
      ) : (
        /* Rolagem horizontal em linha */
        <ul className="-mx-5 mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto px-5 pb-4 sm:-mx-8 sm:px-8" aria-label="Projectos" tabIndex={0}>
          {list.map((p) => (
            <li key={p.slug} className="w-[85%] shrink-0 snap-start sm:w-[420px]">
              <a href={href('portfolio', p.slug)} className="card card-hover block overflow-hidden rounded-none">
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
      <div className="card mt-10 p-6 text-sm text-muted rounded-none">
        <strong className="text-fg">Para a equipa:</strong> para adicionar um projecto, edite <code>PROJECTS</code> em <code>src/data/content.ts</code> e coloque as imagens em <code>public/portfolio/</code> (formato WebP, com versão <code>-480</code>).
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
