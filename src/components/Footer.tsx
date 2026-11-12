import { useState } from 'react';
import { COMPANY, SERVICES, wa } from '../data/content';
import { href, useTheme } from '../lib/hooks';
import { Icon } from './ui';

export function Footer() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(COMPANY.phone);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };
  const col = `space-y-1.5 sm:space-y-2 text-xs sm:text-sm ${
    isDark ? 'text-white/70 [&_a:hover]:text-white' : 'text-slate-600 [&_a:hover]:text-slate-900'
  } [&_a]:inline-flex [&_a]:min-h-[26px] [&_a]:items-center`;

  return (
    <footer className={`relative mt-0 overflow-hidden border-t transition-colors duration-300 ${
      isDark ? 'border-white/10 bg-black text-white' : 'border-slate-200 bg-slate-50 text-slate-900'
    }`}>
      {/* 1. Chamada de Alto Impacto Compacta */}
      <div className="container-x pb-8 pt-12 sm:pb-12 sm:pt-20">
        <p className="eyebrow text-accent">Vamos trabalhar juntos</p>
        <h2 className="mt-3 sm:mt-4 max-w-3xl font-display text-3xl font-semibold leading-[1.08] sm:text-5xl lg:text-6xl">
          Tem um projecto?{' '}
          <a href={href('contacto')} className="group inline-flex items-center gap-2 sm:gap-3 text-accent underline decoration-2 underline-offset-[8px]">
            Fale connosco
            <Icon n="arrow" className="h-6 w-6 transition group-hover:translate-x-2 sm:h-10 sm:w-10" />
          </a>
        </h2>

        <div className={`mt-8 sm:mt-10 grid gap-px overflow-hidden rounded-xl border ${
          isDark ? 'border-white/10 bg-white/10' : 'border-slate-200 bg-slate-200'
        } sm:grid-cols-3`}>
          <div className={`${isDark ? 'bg-black' : 'bg-white'} p-4 sm:p-5`}>
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Telefone</p>
            <div className="mt-1 flex items-center gap-2.5">
              <a href={`tel:+${COMPANY.phoneRaw}`} className="font-display text-lg font-semibold hover:text-accent sm:text-xl">{COMPANY.phone}</a>
              <button
                onClick={copy}
                className={`inline-flex h-8 w-8 items-center justify-center rounded-lg border ${
                  isDark ? 'border-white/20 hover:border-white' : 'border-slate-300 hover:border-slate-900'
                }`}
                aria-label="Copiar número"
              >
                <Icon n={copied ? 'check' : 'copy'} className="h-3.5 w-3.5" />
              </button>
              <span role="status" className="text-xs text-accent">{copied ? 'Copiado' : ''}</span>
            </div>
          </div>
          <a
            href={wa('Olá JOGIMIL! Gostaria de falar com a equipa.')}
            target="_blank"
            rel="noopener noreferrer"
            className={`group ${isDark ? 'bg-black hover:bg-white/[0.04]' : 'bg-white hover:bg-slate-100/60'} p-4 sm:p-5`}
          >
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>WhatsApp Directo</p>
            <p className="mt-1 flex items-center gap-1.5 font-display text-lg font-semibold group-hover:text-accent sm:text-xl">
              Enviar mensagem <Icon n="arrow" className="h-4 w-4" />
            </p>
          </a>
          <a
            href={COMPANY.maps}
            target="_blank"
            rel="noopener noreferrer"
            className={`group ${isDark ? 'bg-black hover:bg-white/[0.04]' : 'bg-white hover:bg-slate-100/60'} p-4 sm:p-5`}
          >
            <p className={`text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>Sede em Luanda</p>
            <p className="mt-1 font-display text-lg font-semibold group-hover:text-accent sm:text-xl">Nova Vida, Kilamba Kiaxi</p>
            <p className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>Ver no mapa ↗</p>
          </a>
        </div>
      </div>

      {/* 2. Directório Compacto (Empresa e Ajuda & Legal alinhados à direita) */}
      <div className={`container-x grid gap-8 border-t ${
        isDark ? 'border-white/10' : 'border-slate-200'
      } py-8 sm:py-10 grid-cols-1 sm:grid-cols-12`}>
        {/* Coluna 1: Marca & Identidade */}
        <div className="sm:col-span-12 lg:col-span-4">
          <a href={href('inicio')} className="inline-block transition-opacity hover:opacity-85" aria-label="JOGIMIL Tecnologias">
            <img
              src={isDark ? '/logo-white.png' : '/logo-original.png'}
              alt="JOGIMIL Tecnologias"
              width="380"
              height="295"
              loading="lazy"
              className="h-12 w-auto object-contain sm:h-16"
            />
          </a>
          <p className={`mt-3 max-w-xs text-xs sm:text-sm leading-relaxed ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
            {COMPANY.tagline}
          </p>
          <p className={`mt-2 text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            {COMPANY.name} · {COMPANY.address}
          </p>
        </div>

        {/* Coluna 2: Serviços */}
        <nav aria-label="Serviços" className="sm:col-span-5 lg:col-span-3">
          <h3 className={`mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider text-accent`}>
            Serviços
          </h3>
          <ul className={col}>
            {SERVICES.filter((s) => s.main).map((s) => (
              <li key={s.slug}><a href={href('servicos', s.slug)}>{s.title}</a></li>
            ))}
            <li><a href={href('servicos')} className="!text-accent font-semibold">Ver os 16 serviços →</a></li>
          </ul>
        </nav>

        {/* Coluna 3: Empresa e Ajuda/Legal alinhados horizontalmente lado a lado no lado direito */}
        <div className="sm:col-span-7 lg:col-span-5 grid grid-cols-2 gap-4 sm:gap-6">
          <nav aria-label="Empresa">
            <h3 className={`mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Empresa
            </h3>
            <ul className={col}>
              <li><a href={href('sobre')}>Sobre nós</a></li>
              <li><a href={href('portfolio')}>Portfólio</a></li>
              <li><a href={href('produtos')}>Produtos</a></li>
              <li><a href={href('parceiros')}>Parceiros</a></li>
              <li><a href={href('noticias')}>Notícias</a></li>
            </ul>
          </nav>

          <nav aria-label="Ajuda e legal">
            <h3 className={`mb-3 text-xs sm:text-sm font-semibold uppercase tracking-wider ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Ajuda e Legal
            </h3>
            <ul className={col}>
              <li><a href={href('contacto', 'suporte')}>Suporte</a></li>
              <li><a href={href('contacto', 'orcamento')}>Orçamento</a></li>
              <li><a href={href('contacto', 'demonstracao')}>Demonstração</a></li>
              <li><a href={href('privacidade')}>Privacidade</a></li>
            </ul>
          </nav>
        </div>
      </div>

      {/* 3. Marca monumental com altura otimizada */}
      <div aria-hidden="true" className={`pointer-events-none select-none overflow-hidden border-t ${
        isDark ? 'border-white/10' : 'border-slate-200'
      } leading-none`}>
        <p
          className="whitespace-nowrap text-center font-display font-bold tracking-tighter"
          style={{
            fontSize: '17vw',
            lineHeight: 0.75,
            marginBottom: '-0.08em',
            color: 'transparent',
            WebkitTextStroke: isDark ? '1.5px rgba(255,255,255,.14)' : '1.5px rgba(0,102,255,.12)'
          }}
        >
          JOGIMIL
        </p>
      </div>

      {/* 4. Barra de Direitos e Topo */}
      <div className={`relative border-t ${
        isDark ? 'border-white/10 bg-black text-white/60' : 'border-slate-200 bg-slate-100 text-slate-600'
      }`}>
        <div className="container-x flex flex-wrap items-center justify-between gap-2 py-4 text-xs sm:text-sm">
          <div className="flex flex-wrap items-center gap-4">
            <p>© {new Date().getFullYear()} {COMPANY.name}. Todos os direitos reservados.</p>
          </div>
          <button
            onClick={() => scrollTo({ top: 0, behavior: 'smooth' })}
            className={`inline-flex min-h-[36px] items-center gap-1.5 ${
              isDark ? 'hover:text-white' : 'hover:text-slate-900'
            }`}
          >
            Voltar ao topo <Icon n="arrow" className="h-3.5 w-3.5 -rotate-90" />
          </button>
        </div>
      </div>
    </footer>
  );
}

export function WhatsAppFab() {
  return (
    <a
      href={wa('Olá JOGIMIL! Gostaria de mais informações.')}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 inline-flex h-14 w-14 items-center justify-center rounded-full bg-brand text-white shadow-lg transition hover:scale-105"
      aria-label="Falar connosco no WhatsApp"
    >
      <Icon n="wa" className="h-7 w-7" />
    </a>
  );
}
