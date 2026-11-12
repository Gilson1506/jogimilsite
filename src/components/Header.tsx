import { useEffect, useRef, useState } from 'react';
import { COMPANY, wa } from '../data/content';
import { href, useTheme } from '../lib/hooks';
import { Icon } from './ui';

export const NAV = [
  { id: 'inicio', label: 'Início', hint: 'O que fazemos' },
  { id: 'servicos', label: 'Serviços', hint: '16 áreas' },
  { id: 'portfolio', label: 'Portfólio', hint: 'Projectos' },
  { id: 'produtos', label: 'Produtos', hint: 'Por subscrição' },
  { id: 'sobre', label: 'Sobre nós', hint: 'Luanda' },
  { id: 'parceiros', label: 'Parceiros', hint: 'Agentes autorizados' },
  { id: 'contacto', label: 'Contacto', hint: 'Orçamento e suporte' },
];

export function Header({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [prog, setProg] = useState(0);
  const { theme, toggle } = useTheme();
  const last = useRef(0);
  const firstLink = useRef<HTMLAnchorElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      setProg(max > 0 ? (y / max) * 100 : 0);
      setSolid(y > 24);
      if (y > 140) setHidden(y > last.current + 4 ? true : y < last.current - 4 ? false : hidden);
      else setHidden(false);
      last.current = y;
    };
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, [hidden]);

  useEffect(() => { setOpen(false); }, [page]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = 'hidden';
    firstLink.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btn.current?.focus(); } };
    addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', k); };
  }, [open]);

  const isDark = theme === 'dark';

  return (
    <>
      <div className="fixed inset-x-0 top-0 z-[70] h-[3px]" aria-hidden="true">
        <div className="h-full bg-accent" style={{ width: `${prog}%` }} />
      </div>

      <header
        data-tone="hero"
        className={`fixed inset-x-0 top-0 z-[60] transition-all duration-300 ${hidden && !open ? '-translate-y-full' : ''} ${
          solid || open
            ? isDark
              ? 'border-b border-white/10 bg-black/90 backdrop-blur-xl text-white'
              : 'border-b border-black/10 bg-white/90 backdrop-blur-xl text-black shadow-sm'
            : isDark
            ? 'bg-transparent text-white'
            : 'bg-transparent text-black'
        }`}
        style={{ background: solid || open ? undefined : 'transparent' }}
      >
        <div className={`container-x flex items-center justify-between transition-all duration-300 ${solid ? 'h-14 sm:h-18' : 'h-16 sm:h-22'}`}>
          <a href={href('inicio')} className="inline-flex items-center transition-opacity hover:opacity-85" aria-label="JOGIMIL Tecnologias, página inicial">
            <img
              src={isDark ? '/logo-white.png' : '/logo-original.png'}
              alt="JOGIMIL Tecnologias"
              width="380"
              height="295"
              className={`w-auto object-contain transition-all duration-300 ${solid ? 'h-8 sm:h-11' : 'h-10 sm:h-14'}`}
            />
          </a>

          <div className="flex items-center gap-2">
            <button
              onClick={toggle}
              className={`inline-flex h-10 w-10 sm:h-11 sm:w-11 items-center justify-center rounded-full transition-colors ${
                isDark ? 'text-white hover:bg-white/10' : 'text-black hover:bg-black/10'
              }`}
              aria-label={isDark ? 'Mudar para modo claro' : 'Mudar para modo escuro'}
            >
              <Icon n={isDark ? 'sun' : 'moon'} />
            </button>
            <a href={href('contacto')} className="btn btn-accent hidden sm:inline-flex">Fale connosco</a>
            <button
              ref={btn}
              onClick={() => setOpen(!open)}
              aria-expanded={open}
              aria-controls="menu-painel"
              aria-label={open ? 'Fechar menu de navegação' : 'Abrir menu de navegação'}
              className={`inline-flex min-h-[42px] h-10 sm:h-11 items-center gap-2 rounded-full border px-3.5 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-200 shadow-xs active:scale-95 ${
                isDark
                  ? 'bg-zinc-900/95 text-white border-white/25 hover:border-white/50 backdrop-blur-md'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-slate-400 shadow-sm'
              }`}
            >
              <span>{open ? 'Fechar' : 'Menu'}</span>
              {open ? (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-current shrink-0" aria-hidden="true">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5 text-current shrink-0" aria-hidden="true">
                  <path d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop overlay para fechar ao clicar fora em mobile */}
      <div
        className={`fixed inset-0 z-50 bg-black/60 backdrop-blur-xs transition-opacity duration-300 ${
          open ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Painel / Sidebar móvel e editorial com transição suave sem bloqueios */}
      <div
        id="menu-painel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={`fixed inset-y-0 right-0 z-50 w-full sm:max-w-md lg:max-w-none lg:inset-0 overflow-y-auto transition-all duration-300 ease-out shadow-2xl ${
          isDark
            ? 'bg-zinc-950 text-white border-l border-white/10 lg:border-none'
            : 'bg-white text-black border-l border-slate-200 lg:border-none'
        } ${
          open
            ? 'translate-x-0 opacity-100 visible pointer-events-auto'
            : 'translate-x-full lg:translate-x-0 opacity-0 invisible pointer-events-none'
        }`}
      >
        {/* Barra superior de topo exclusiva em ecrãs móveis com fecho instantâneo */}
        <div className="flex lg:hidden items-center justify-between px-5 pt-4 pb-3 border-b border-black/10 dark:border-white/10 sticky top-0 z-10 bg-inherit backdrop-blur-md">
          <a
            href={href('inicio')}
            onClick={() => { setOpen(false); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            className="inline-flex items-center"
            aria-label="JOGIMIL página inicial"
          >
            <img
              src={isDark ? '/logo-white.png' : '/logo-original.png'}
              alt="JOGIMIL"
              className="h-8 w-auto object-contain"
            />
          </a>
          <button
            onClick={() => setOpen(false)}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition active:scale-95 ${
              isDark ? 'border-white/20 hover:bg-white/10 text-white' : 'border-black/20 hover:bg-black/10 text-black'
            }`}
            aria-label="Fechar menu"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="container-x grid min-h-full gap-8 pb-10 pt-6 sm:pt-10 lg:pt-36 lg:grid-cols-12">
          <nav aria-label="Principal" className="lg:col-span-8">
            <ol className={`border-y divide-y ${isDark ? 'border-white/10 divide-white/10' : 'border-black/10 divide-black/10'}`}>
              {NAV.map((n, i) => {
                const isActive = page === n.id;
                return (
                  <li key={n.id}>
                    <a
                      ref={i === 0 ? firstLink : undefined}
                      href={href(n.id)}
                      onClick={() => {
                        setOpen(false);
                        window.scrollTo({ top: 0, behavior: 'smooth' });
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex min-h-[48px] sm:min-h-[58px] items-center justify-between py-2.5 sm:py-4 px-2 rounded-lg transition-all duration-200 ${
                        isActive
                          ? 'bg-accent/10 text-accent font-semibold'
                          : isDark
                          ? 'hover:bg-white/5'
                          : 'hover:bg-black/5'
                      }`}
                    >
                      {/* Texto do item */}
                      <div className="flex flex-col gap-0.5 transition-transform duration-300 group-hover:translate-x-2">
                        <span
                          className={`font-display text-xl sm:text-3xl lg:text-5xl font-semibold tracking-tight transition-colors duration-200 ${
                            isActive
                              ? 'text-accent'
                              : isDark
                              ? 'text-white group-hover:text-accent'
                              : 'text-black group-hover:text-accent'
                          }`}
                        >
                          {n.label}
                        </span>
                        <span className={`text-xs sm:text-sm transition-colors duration-200 ${
                          isActive
                            ? 'text-accent/80'
                            : isDark
                            ? 'text-white/50 group-hover:text-white/80'
                            : 'text-black/50 group-hover:text-black/80'
                        }`}>
                          {n.hint}
                        </span>
                      </div>

                      {/* Seta indicadora à direita */}
                      <div className="flex items-center gap-2 sm:gap-3">
                        {isActive && (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] text-accent">
                            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
                            Actual
                          </span>
                        )}
                        <Icon
                          n="arrow"
                          className={`h-4 w-4 sm:h-5 sm:w-5 transition-all duration-200 ${
                            isActive
                              ? 'text-accent translate-x-1'
                              : isDark
                              ? 'text-white/40 group-hover:text-accent group-hover:translate-x-1'
                              : 'text-black/40 group-hover:text-accent group-hover:translate-x-1'
                          }`}
                        />
                      </div>
                    </a>
                  </li>
                );
              })}
            </ol>
            <p className={`mt-6 text-sm ${isDark ? 'text-white/60' : 'text-black/60'}`}>
              Também: <a onClick={() => setOpen(false)} className={`underline underline-offset-4 ${isDark ? 'hover:text-white' : 'hover:text-black'}`} href={href('noticias')}>Notícias</a> ·{' '}
              <a onClick={() => setOpen(false)} className={`underline underline-offset-4 ${isDark ? 'hover:text-white' : 'hover:text-black'}`} href={href('privacidade')}>Política de privacidade</a>
            </p>
          </nav>

          <aside className={`flex flex-col justify-between gap-6 lg:col-span-4 ${isDark ? 'text-white' : 'text-black'}`}>
            <div className={`p-5 rounded-2xl border ${isDark ? 'bg-white/[0.03] border-white/10' : 'bg-black/[0.02] border-black/10'}`}>
              <p className="eyebrow text-accent">Fale connosco</p>
              <a href={`tel:+${COMPANY.phoneRaw}`} className="mt-2 block font-display text-2xl sm:text-3xl font-semibold hover:text-accent">{COMPANY.phone}</a>
              <p className={`mt-2 text-xs sm:text-sm ${isDark ? 'text-white/70' : 'text-black/70'}`}>{COMPANY.address}</p>
            </div>
            <a href={wa('Olá JOGIMIL! Gostaria de falar com a equipa.')} target="_blank" rel="noopener noreferrer" className="btn btn-primary w-full py-3.5">
              <Icon n="wa" /> Abrir WhatsApp
            </a>
          </aside>
        </div>
      </div>
    </>
  );
}
