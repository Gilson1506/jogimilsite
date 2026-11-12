import { useState } from 'react';
import { CATEGORIES, PROJECTS } from '../data/content';
import { href } from '../lib/hooks';
import { BeforeAfter, Img, Lightbox } from '../components/Media';
import { Body, PageHead } from './shared';
import { NotFound } from './Services';

export function Portfolio() {
  return (
    <>
      <PageHead
        eyebrow="Portfólio"
        title="Projectos"
        lead="Casos e soluções desenvolvidas pela JOGIMIL."
        crumbs={[['Portfólio']]}
      />
      <Body>
        <div className="flex min-h-[50vh] flex-col items-center justify-center py-16 text-center">
          {/* Efeito de Loader Simples */}
          <div className="relative mb-6 flex items-center justify-center">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-blue/20 border-t-blue" />
            <div className="absolute h-3 w-3 rounded-full bg-accent animate-pulse" />
          </div>

          <h2 className="font-display text-2xl sm:text-3xl font-bold text-fg">
            Página em desenvolvimento
          </h2>

          <p className="mt-2.5 max-w-md text-sm sm:text-base text-muted leading-relaxed">
            Estamos a preparar esta secção com os nossos projectos e casos de estudo. Em breve estará disponível.
          </p>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a href={href('inicio')} className="btn btn-primary">
              Voltar ao início
            </a>
            <a href={href('contacto')} className="btn btn-ghost">
              Falar connosco
            </a>
          </div>
        </div>
      </Body>
    </>
  );
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
