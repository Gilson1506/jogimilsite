import { useEffect, useRef, useState } from 'react';
import { href, useTheme } from '../lib/hooks';
import { Icon } from './ui';

export const NAV = [
  { id: 'inicio', label: 'Início', hint: 'O que fazemos' },
  { id: 'servicos', label: 'Serviços', hint: '16 áreas' },
  { id: 'portfolio', label: 'Portfólio', hint: 'Projectos' },
  { id: 'produtos', label: 'Produtos', hint: 'Por subscrição' },
  { id: 'blog', label: 'Blog', hint: 'Artigos e novidades' },
  { id: 'sobre', label: 'Sobre nós', hint: 'Equipa e sede' },
  { id: 'parceiros', label: 'Parceiros', hint: 'Agentes autorizados' },
  { id: 'contacto', label: 'Contacto', hint: 'Orçamento e suporte' },
];

export function Header({ page }: { page: string }) {
  const [open, setOpen] = useState(false);
  const [solid, setSolid] = useState(false);
  const [prog, setProg] = useState(0);
  const { theme, toggle } = useTheme();
  const firstLink = useRef<HTMLAnchorElement>(null);
  const btn = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const on = () => {
      const y = scrollY;
      const max = document.documentElement.scrollHeight - innerHeight;
      setProg(max > 0 ? (y / max) * 100 : 0);
      setSolid(y > 24);
    };
    on();
    addEventListener('scroll', on, { passive: true });
    return () => removeEventListener('scroll', on);
  }, []);

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
        <div className="h-full bg-gradient-to-r from-blue via-sky-400 to-blue transition-[width] duration-150" style={{ width: `${prog}%` }} />
      </div>

      <header
        data-tone="hero"
        className="fixed inset-x-0 top-0 z-[60] px-3 sm:px-6 pt-2.5 sm:pt-3 pointer-events-none"
      >
        <div
          className={`pointer-events-auto mx-auto max-w-[1380px] flex items-center justify-between gap-4 rounded-2xl px-4 sm:px-6 transition-all duration-500 ease-out ${
            solid || open
              ? `nav-glass h-14 sm:h-16 border ${
                  isDark
                    ? 'border-blue/25 text-white shadow-[0_14px_40px_-14px_rgba(0,102,255,0.38)]'
                    : 'border-blue/20 text-slate-950 shadow-[0_14px_38px_-14px_rgba(0,102,255,0.18)]'
                }`
              : `h-16 sm:h-[72px] border border-transparent ${
                  isDark
                    ? 'bg-zinc-950/35 backdrop-blur-md text-white border-white/10'
                    : 'bg-white/60 backdrop-blur-md text-slate-950 border-slate-200/70'
                }`
          }`}
        >
          <a href={href('inicio')} className="inline-flex items-center shrink-0 transition-all duration-300 hover:opacity-85 active:scale-[0.98]" aria-label="JOGIMIL Tecnologias, página inicial">
            <img
              src={isDark ? '/logo-white.png' : '/logo-original.png'}
              alt="JOGIMIL Tecnologias"
              width="380"
              height="295"
              className={`w-auto object-contain transition-all duration-300 ${solid ? 'h-8 sm:h-10' : 'h-9 sm:h-12'}`}
            />
          </a>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={toggle}
              className={`inline-flex h-10 w-10 items-center justify-center rounded-full border transition-all ${
                isDark
                  ? 'border-white/15 bg-white/[0.05] text-white hover:border-blue/50 hover:bg-blue/15'
                  : 'border-slate-200 bg-white/80 text-slate-900 hover:border-blue/40 hover:bg-blue/10'
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
              className={`inline-flex min-h-[40px] h-10 items-center gap-2 rounded-full border px-3.5 sm:px-5 text-xs sm:text-sm font-semibold transition-all duration-200 active:scale-95 ${
                open
                  ? 'bg-blue text-white border-blue shadow-[0_6px_20px_-4px_rgba(0,102,255,0.6)]'
                  : isDark
                  ? 'bg-zinc-900/90 text-white border-white/20 hover:border-blue/60 backdrop-blur-md'
                  : 'bg-white text-slate-900 border-slate-300 hover:border-blue/50 shadow-sm'
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

      {/* Popup Rectangular Estreito e Alto (cantos rectos, apenas links das páginas) */}
      <div
        id="menu-painel"
        role="dialog"
        aria-modal="true"
        aria-label="Menu principal"
        className={`fixed top-[76px] sm:top-[84px] bottom-4 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] max-w-[330px] flex flex-col overflow-y-auto rounded-none border backdrop-blur-2xl transition-all duration-300 ease-out ${
          isDark
            ? 'bg-zinc-950/95 text-white border-blue/30 shadow-[0_24px_64px_-16px_rgba(0,102,255,0.45)]'
            : 'bg-white/95 text-slate-950 border-blue/25 shadow-[0_24px_64px_-16px_rgba(0,102,255,0.22)]'
        } ${
          open
            ? 'translate-x-0 opacity-100 visible pointer-events-auto'
            : 'translate-x-4 opacity-0 invisible pointer-events-none'
        }`}
      >
        <nav aria-label="Principal" className="flex-1 flex flex-col justify-center p-4">
          <ol className={`divide-y ${isDark ? 'divide-white/10' : 'divide-slate-200/80'}`}>
            {[
              ...NAV,
              { id: 'noticias', label: 'Notícias', hint: 'Actualizações e comunicados' },
              { id: 'privacidade', label: 'Privacidade', hint: 'Política de dados' },
            ].map((n, i) => {
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
                    className={`group flex items-center justify-between rounded-none px-4 py-3 transition-all duration-200 ${
                      isActive
                        ? 'bg-blue text-white'
                        : isDark
                        ? 'hover:bg-white/[0.06]'
                        : 'hover:bg-slate-100'
                    }`}
                  >
                    <div className="flex flex-col">
                      <span
                        className={`font-display text-base font-semibold tracking-tight ${
                          isActive ? 'text-white' : isDark ? 'text-white group-hover:text-blue' : 'text-slate-950 group-hover:text-blue'
                        }`}
                      >
                        {n.label}
                      </span>
                      <span className={`text-[11px] ${isActive ? 'text-white/80' : isDark ? 'text-white/50' : 'text-slate-500'}`}>
                        {n.hint}
                      </span>
                    </div>

                    <Icon
                      n="arrow"
                      className={`h-4 w-4 transition-transform duration-200 ${
                        isActive
                          ? 'text-white translate-x-0.5'
                          : isDark
                          ? 'text-white/35 group-hover:text-blue group-hover:translate-x-1'
                          : 'text-slate-400 group-hover:text-blue group-hover:translate-x-1'
                      }`}
                    />
                  </a>
                </li>
              );
            })}
          </ol>
        </nav>
      </div>
    </>
  );
}
