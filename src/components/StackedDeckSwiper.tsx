import { useState, useEffect } from 'react';
import { COMPANY } from '../data/content';
import { href, useTheme } from '../lib/hooks';
import { Icon } from './ui';

export interface StackItem {
  id: string;
  type: 'produto';
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  description: string;
  features: string[];
  link: string;
  linkLabel: string;
  image: string; // URL da logo transparente oficial
  price: string;
  pdfUrl: string;
  stats: { label: string; value: string };
  gradient: string;
}

export const SHOWCASE_ITEMS: StackItem[] = [
  {
    id: 'soba-gest',
    type: 'produto',
    title: 'SOBA GEST - Faturação & POS',
    subtitle: 'Certificação Oficial AGT Nº FE/402/AGT/2026',
    category: 'Comércio, Retalho & Restauração',
    tag: 'Homologação AGT 100%',
    description: 'Software de faturação e POS com funcionamento 100% offline, emissão de faturas e recibos em menos de 2s, controlo rigoroso de stocks com PMP e exportação oficial do SAF-T (AO).',
    features: ['Certificado AGT FE/402/AGT/2026', 'Modo 100% Offline', 'POS Ultra-rápido (< 2s)', 'Gestão de Stocks & Guias GT/GR'],
    link: href('produtos', 'soba-gest'),
    linkLabel: 'Conhecer SOBA GEST',
    image: '/products/soba-gest-logo.png',
    price: 'A partir de 9.999 Kz / mês',
    pdfUrl: '/docs/Soba_Gest_Apresentacao.pdf',
    stats: { label: 'Tempo de emissão', value: '< 2 seg' },
    gradient: 'from-blue-600/20 via-accent/15 to-transparent',
  },
  {
    id: 'soba-school',
    type: 'produto',
    title: 'SOBA SCHOOL - Plataforma Escolar',
    subtitle: '5 Portais Integrados & Pautas Oficiais MED',
    category: 'Educação & Ensino Superior',
    tag: 'Gestão Académica Inteligente',
    description: 'Plataforma integrada para colégios e universidades. 5 portais (Direção, Secretaria, Financeiro, Professores, Alunos/Pais) com inteligência artificial, propinas e conciliação bancária automática.',
    features: ['5 Portais Integrados', 'Pautas MED & Boletins', 'Propinas & Multicaixa Express', 'Matrícula Digital com IA (OCR)'],
    link: href('produtos', 'soba-school'),
    linkLabel: 'Conhecer SOBA SCHOOL',
    image: '/products/soba-school-logo.png',
    price: 'A partir de 40.000 Kz / mês',
    pdfUrl: '/docs/Soba_School_Apresentacao.pdf',
    stats: { label: 'Portais Conectados', value: '5 em 1' },
    gradient: 'from-cyan-500/20 via-blue-600/15 to-transparent',
  },
];

export function StackedDeckSwiper() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeIdx, setActiveIdx] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const total = SHOWCASE_ITEMS.length;

  // Rotação dinâmica suave a cada 5 segundos (pausa quando o utilizador passa o rato)
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      setActiveIdx((prev) => (prev + 1) % total);
    }, 5000);
    return () => clearInterval(interval);
  }, [isPaused, total]);

  const next = () => {
    setActiveIdx((prev) => (prev + 1) % total);
  };

  const prev = () => {
    setActiveIdx((prev) => (prev - 1 + total) % total);
  };

  return (
    <div
      className="relative mx-auto w-full max-w-5xl py-4 select-none"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* 1. Selector Superior de Produtos com Transição Dinâmica e Suave */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className={`flex items-center gap-2 rounded-xl border p-1.5 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-white/10 bg-white/[0.03]'
            : 'border-slate-200 bg-slate-100/80 shadow-sm'
        }`}>
          {SHOWCASE_ITEMS.map((item, idx) => (
            <button
              key={item.id}
              onClick={() => setActiveIdx(idx)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition-all duration-300 ${
                activeIdx === idx
                  ? 'bg-blue text-white shadow-md shadow-blue/30 scale-[1.02]'
                  : isDark
                  ? 'text-white/60 hover:text-white hover:bg-white/5'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
              }`}
            >
              <span>{idx === 0 ? '👑' : '🎓'}</span>
              <span>{item.id === 'soba-gest' ? 'SOBA GEST' : 'SOBA SCHOOL'}</span>
              {activeIdx === idx && (
                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
              )}
            </button>
          ))}
        </div>

        {/* Controlos de Navegação Suaves */}
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            <span className="font-bold text-accent">{activeIdx + 1}</span> / {total}
          </span>
          <button
            onClick={prev}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent active:scale-95 ${
              isDark
                ? 'border-white/15 bg-white/5 text-white hover:bg-accent/20'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-blue-50 hover:text-accent'
            }`}
            aria-label="Produto anterior"
          >
            <Icon n="arrow" className="h-4 w-4 rotate-180" />
          </button>
          <button
            onClick={next}
            className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border shadow-sm backdrop-blur-md transition-all duration-200 hover:border-accent active:scale-95 ${
              isDark
                ? 'border-white/15 bg-white/5 text-white hover:bg-accent/20'
                : 'border-slate-200 bg-white text-slate-800 hover:bg-blue-50 hover:text-accent'
            }`}
            aria-label="Próximo produto"
          >
            <Icon n="arrow" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Área do Carrossel Dinâmico Suave */}
      <div className="relative mx-auto h-[540px] sm:h-[480px] md:h-[440px] w-full max-w-4xl">
        {SHOWCASE_ITEMS.map((item, idx) => {
          const isActive = idx === activeIdx;

          return (
            <div
              key={item.id}
              className={`absolute inset-0 flex flex-col md:flex-row items-center justify-between overflow-hidden rounded-3xl border transition-all duration-700 ease-out backdrop-blur-2xl ${
                isActive
                  ? 'opacity-100 translate-y-0 scale-100 pointer-events-auto z-20 shadow-2xl'
                  : 'opacity-0 translate-y-4 scale-[0.98] pointer-events-none z-10'
              } ${
                isDark
                  ? 'border-white/10 bg-card/75 shadow-[0_25px_60px_rgba(0,0,0,0.8),0_0_35px_rgba(0,102,255,0.12)]'
                  : 'border-slate-200/80 bg-white/95 shadow-[0_20px_45px_rgba(0,102,255,0.08)]'
              }`}
            >
              {/* Lado Esquerdo: Apenas o Logotipo Limpo, Sem Bordas, Sem Fundo Escuro de Caixa */}
              <div className="relative flex h-48 sm:h-56 md:h-full w-full md:w-[45%] shrink-0 items-center justify-center p-6 overflow-hidden">
                {/* Glow atmosférico suave */}
                <div className="absolute h-40 w-40 rounded-full bg-blue/15 blur-3xl pointer-events-none" />

                <img
                  src={item.image}
                  alt={item.title}
                  className="relative z-10 max-h-36 sm:max-h-48 md:max-h-56 max-w-[220px] sm:max-w-[280px] md:max-w-[320px] w-auto object-contain drop-shadow-xl transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />

                {/* Badge Flutuante */}
                <div className="absolute top-4 left-4 z-10">
                  <span className="rounded-lg border border-accent/25 bg-black/80 backdrop-blur-md px-3 py-1 font-mono text-[11px] font-semibold text-accent shadow-sm">
                    {item.tag}
                  </span>
                </div>
              </div>

              {/* Lado Direito: Informações e Ações do Produto */}
              <div className={`flex flex-1 flex-col justify-between p-6 sm:p-8 md:p-10 w-full md:w-[55%] ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs uppercase tracking-wider text-accent font-semibold">
                      {item.category}
                    </span>
                    <span className="font-mono text-xs font-bold text-fg bg-bg/80 px-2.5 py-1 rounded-md">
                      {item.price}
                    </span>
                  </div>

                  <h3 className={`mt-2 font-display text-2xl sm:text-3xl font-bold leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`mt-1 text-xs sm:text-sm font-medium ${
                    isDark ? 'text-accent' : 'text-blue'
                  }`}>
                    {item.subtitle}
                  </p>

                  <p className={`mt-3 text-xs sm:text-sm leading-relaxed ${
                    isDark ? 'text-white/70' : 'text-slate-600'
                  }`}>
                    {item.description}
                  </p>

                  {/* Funcionalidades */}
                  <div className="mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                    {item.features.map((feat) => (
                      <span
                        key={feat}
                        className={`rounded-md border px-2.5 py-1 text-[11px] font-medium ${
                          isDark
                            ? 'border-white/10 bg-white/5 text-white/80'
                            : 'border-slate-200 bg-slate-50 text-slate-700'
                        }`}
                      >
                        ✓ {feat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Botões de Ação Direta */}
                <div className={`mt-6 flex flex-wrap items-center gap-2.5 border-t pt-4 ${
                  isDark ? 'border-white/10' : 'border-slate-100'
                }`}>
                  <a
                    href={`https://wa.me/${COMPANY.phoneRaw}?text=${encodeURIComponent(`Olá JOGIMIL! Gostaria de solicitar informações sobre o ${item.title}.`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 rounded-xl bg-blue px-4 py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-blue/30 transition-all hover:bg-blue/90 active:scale-95"
                  >
                    <Icon n="wa" className="h-4 w-4" /> Solicitar Info
                  </a>

                  {item.pdfUrl && (
                    <a
                      href={item.pdfUrl}
                      download
                      className={`inline-flex items-center gap-1.5 rounded-xl border px-3 py-2.5 text-xs font-semibold transition-all ${
                        isDark
                          ? 'border-white/20 text-white/80 hover:border-white hover:text-white'
                          : 'border-slate-300 text-slate-700 hover:border-slate-900'
                      }`}
                      title="Download da Apresentação em PDF"
                    >
                      <Icon n="download" className="h-4 w-4 text-accent" /> PDF
                    </a>
                  )}

                  <a
                    href={item.link}
                    className={`ml-auto inline-flex items-center gap-1 text-xs font-semibold text-blue hover:text-accent transition`}
                  >
                    Ver detalhes <Icon n="arrow" className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Indicadores de Paginação Suaves */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {SHOWCASE_ITEMS.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-2 rounded-full transition-all duration-500 ${
              i === activeIdx
                ? 'w-10 bg-accent'
                : isDark
                ? 'w-2.5 bg-white/20 hover:bg-white/40'
                : 'w-2.5 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Ir para produto ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
