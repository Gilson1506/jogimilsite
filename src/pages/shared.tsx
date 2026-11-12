import { ReactNode } from 'react';
import { href } from '../lib/hooks';

export const Crumbs = ({ items }: { items: [string, string?][] }) => (
  <nav aria-label="Migalhas de pão" className="mb-6 text-sm text-muted">
    <ol className="flex flex-wrap items-center gap-2">
      <li><a className="hover:text-fg" href={href('inicio')}>Início</a></li>
      {items.map(([l, h], i) => (
        <li key={l} className="flex items-center gap-2"><span aria-hidden="true">/</span>{h ? <a className="hover:text-fg" href={h}>{l}</a> : <span aria-current={i === items.length - 1 ? 'page' : undefined} className="text-fg">{l}</span>}</li>
      ))}
    </ol>
  </nav>
);

export const PageHead = ({ eyebrow, title, lead, crumbs }: { eyebrow: string; title: string; lead?: ReactNode; crumbs?: [string, string?][] }) => (
  <section data-tone="hero" className="pb-20 pt-40 sm:pt-48">
    <div className="container-x">
      {crumbs && <Crumbs items={crumbs} />}
      <p className="eyebrow">{eyebrow}</p>
      <h1 className="mt-3 max-w-4xl text-4xl font-semibold leading-[1.05] sm:text-6xl">{title}</h1>
      {lead && <p className="lead mt-5 max-w-2xl">{lead}</p>}
    </div>
  </section>
);

export const Body = ({ tone = 'a', children, cls = '' }: { tone?: 'a' | 'b'; children: ReactNode; cls?: string }) => (
  <section data-tone={tone} className={`slope pb-24 ${cls}`}><div className="container-x">{children}</div></section>
);
