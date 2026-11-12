import { useState } from 'react';
import { href, useTheme } from '../lib/hooks';
import { Icon } from './ui';

export interface StackItem {
  id: string;
  type: 'produto' | 'projecto';
  title: string;
  subtitle: string;
  category: string;
  tag: string;
  description: string;
  features: string[];
  link: string;
  linkLabel: string;
  image: string; // URL da foto / mockup
  stats?: { label: string; value: string };
  gradient: string;
}

export const SHOWCASE_ITEMS: StackItem[] = [
  {
    id: 'faturacao-saft',
    type: 'produto',
    title: 'SOBA GEST - Faturação & POS',
    subtitle: 'Certificação Oficial AGT Nº FE/402/AGT/2026',
    category: 'Produto por Subscrição',
    tag: 'Conformidade AGT 100%',
    description: 'Sistema completo de faturação, emissão de recibos, guias de transporte e extracção oficial do ficheiro SAF-T (AO) para empresas em Angola.',
    features: ['Homologado AGT', 'Ponto de Venda (POS)', 'Modo 100% Offline', 'Gestão de Stocks'],
    link: href('produtos', 'soba-gest'),
    linkLabel: 'Conhecer planos',
    image: 'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    stats: { label: 'Tempo de emissão', value: '< 2 seg' },
    gradient: 'from-blue-600/30 via-accent/20 to-transparent',
  },
  {
    id: 'portal-web',
    type: 'projecto',
    title: 'Portal Web & Gestão Online',
    subtitle: 'Plataforma Institucional em Nuvem',
    category: 'Desenvolvimento Web',
    tag: 'Carregamento Ultra-rápido',
    description: 'Portal corporativo com área reservada para clientes, pagamentos integrados e optimização para conexões lentas 3G/4G em Luanda.',
    features: ['Design Responsivo', 'Painel Administrativo', 'Segurança SSL', 'SEO Luanda'],
    link: href('servicos', 'web'),
    linkLabel: 'Ver detalhes web',
    image: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    stats: { label: 'Performance Lighthouse', value: '98/100' },
    gradient: 'from-cyan-500/30 via-blue-600/20 to-transparent',
  },
  {
    id: 'mobile-app',
    type: 'projecto',
    title: 'App Mobile Android & iOS',
    subtitle: 'Solução Móvel de Atendimento & Vendas',
    category: 'Desenvolvimento Mobile',
    tag: 'Multi-plataforma',
    description: 'Aplicações para smartphones com arquitectura offline-first, integração com Multicaixa Express e notificações em tempo real.',
    features: ['Android & iOS nativo', 'Offline-first', 'Biometria FaceID/Digital', 'Notificações Push'],
    link: href('servicos', 'mobile'),
    linkLabel: 'Ver solução mobile',
    image: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=1200&q=80',
    stats: { label: 'Consumo de dados', value: 'Ultra-baixo' },
    gradient: 'from-blue-700/30 via-indigo-600/20 to-transparent',
  },
  {
    id: 'hub-integracoes',
    type: 'projecto',
    title: 'Hub de Integrações & APIs',
    subtitle: 'Conexão Bancária & Pagamentos',
    category: 'Integrações e APIs',
    tag: 'Automação B2B',
    description: 'Interligação directa de sistemas empresariais com plataformas de pagamento em kwanzas, ERPs legados e serviços governamentais.',
    features: ['APIs REST/GraphQL', 'Webhooks em Tempo Real', 'Logs de Auditoria', 'Encriptação de Ponta'],
    link: href('servicos', 'integracoes'),
    linkLabel: 'Ver integrações',
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1200&q=80',
    stats: { label: 'Disponibilidade', value: '99.98%' },
    gradient: 'from-sky-500/30 via-blue-700/20 to-transparent',
  },
  {
    id: 'desktop-pos',
    type: 'projecto',
    title: 'Sistema Desktop de Armazém',
    subtitle: 'Software Local sem Dependência de Internet',
    category: 'Desenvolvimento Desktop',
    tag: 'Operação Offline 100%',
    description: 'Software desenhado para postos de venda e armazéns com emissão rápida de talões térmicos, leitores de código de barras e relatórios diários.',
    features: ['Funciona sem Internet', 'Leitor de Códigos', 'Impressoras Térmicas', 'Backup Automático'],
    link: href('servicos', 'desktop'),
    linkLabel: 'Ver software desktop',
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1200&q=80',
    stats: { label: 'Velocidade de caixa', value: '< 1 seg' },
    gradient: 'from-blue-600/30 via-blue-900/20 to-transparent',
  },
];

export function StackedDeckSwiper() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const [activeIdx, setActiveIdx] = useState(0);
  const [swiping, setSwiping] = useState(false);
  const [filter, setFilter] = useState<'todos' | 'produto' | 'projecto'>('todos');

  const filteredItems = SHOWCASE_ITEMS.filter((item) =>
    filter === 'todos' ? true : item.type === filter
  );

  const total = filteredItems.length;

  const next = () => {
    if (swiping) return;
    setSwiping(true);
    setTimeout(() => {
      setActiveIdx((prev) => (prev + 1) % total);
      setSwiping(false);
    }, 280);
  };

  const prev = () => {
    if (swiping) return;
    setSwiping(true);
    setTimeout(() => {
      setActiveIdx((prev) => (prev - 1 + total) % total);
      setSwiping(false);
    }, 280);
  };

  return (
    <div className="relative mx-auto w-full max-w-5xl py-6 select-none">
      {/* 1. Selector de Categoria Superior com Bordas Retangulares */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className={`flex items-center gap-2 rounded-none border p-1.5 backdrop-blur-md transition-colors ${
          isDark
            ? 'border-white/10 bg-white/[0.03]'
            : 'border-slate-200 bg-slate-100/80 shadow-sm'
        }`}>
          <button
            onClick={() => { setFilter('todos'); setActiveIdx(0); }}
            className={`rounded-none px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filter === 'todos'
                ? 'bg-accent text-white shadow-md shadow-accent/40'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Todos os Trabalhos
          </button>
          <button
            onClick={() => { setFilter('produto'); setActiveIdx(0); }}
            className={`rounded-none px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filter === 'produto'
                ? 'bg-accent text-white shadow-md shadow-accent/40'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Produtos Próprios
          </button>
          <button
            onClick={() => { setFilter('projecto'); setActiveIdx(0); }}
            className={`rounded-none px-4 py-1.5 text-xs font-semibold transition-all duration-200 ${
              filter === 'projecto'
                ? 'bg-accent text-white shadow-md shadow-accent/40'
                : isDark
                ? 'text-white/60 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Projectos Desenvolvidos
          </button>
        </div>

        {/* Controlos de Navegação 3D Retangulares */}
        <div className="flex items-center gap-3">
          <span className={`font-mono text-xs ${isDark ? 'text-white/50' : 'text-slate-500'}`}>
            <span className="font-bold text-accent">{activeIdx + 1}</span> / {total}
          </span>
          <button
            onClick={prev}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-none border shadow-md backdrop-blur-md transition-all duration-200 hover:border-accent active:scale-90 ${
              isDark
                ? 'border-white/15 bg-white/5 text-white hover:bg-accent/20'
                : 'border-slate-200 bg-white text-slate-800 shadow-slate-200/60 hover:bg-blue-50 hover:text-accent'
            }`}
            aria-label="Item anterior"
          >
            <Icon n="arrow" className="h-4 w-4 rotate-180" />
          </button>
          <button
            onClick={next}
            className={`inline-flex h-10 w-10 items-center justify-center rounded-none border shadow-md backdrop-blur-md transition-all duration-200 hover:border-accent active:scale-90 ${
              isDark
                ? 'border-white/15 bg-white/5 text-white hover:bg-accent/20'
                : 'border-slate-200 bg-white text-slate-800 shadow-slate-200/60 hover:bg-blue-50 hover:text-accent'
            }`}
            aria-label="Item seguinte"
          >
            <Icon n="arrow" className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* 2. Área do Deck com Cartões 3D Sobrepostos */}
      <div className="relative mx-auto h-[530px] sm:h-[500px] md:h-[480px] w-full max-w-4xl perspective-[1200px]">
        {filteredItems.map((item, idx) => {
          // Posição na pilha em relação ao cartão activo
          const offset = (idx - activeIdx + total) % total;

          // Se for o topo e estiver a passar, desliza para a direita
          const isTop = offset === 0;
          const isSecond = offset === 1;
          const isThird = offset === 2;
          const isVisible = offset <= 3;

          // Estilo de sobreposição 3D (uma em cima da outra com rotação e profundidade)
          let transform = '';
          let opacity = 0;
          let zIndex = 0;

          if (isTop) {
            transform = swiping
              ? 'translateX(110%) translateY(-10px) rotate(16deg) scale(0.92)'
              : 'translateY(0px) scale(1) rotate(0deg)';
            opacity = swiping ? 0 : 1;
            zIndex = 30;
          } else if (isSecond) {
            transform = isTop && swiping
              ? 'translateY(0px) scale(1) rotate(0deg)'
              : 'translateY(-22px) scale(0.95) rotate(2.5deg)';
            opacity = 0.9;
            zIndex = 20;
          } else if (isThird) {
            transform = 'translateY(-44px) scale(0.90) rotate(-2deg)';
            opacity = 0.7;
            zIndex = 10;
          } else if (offset === 3) {
            transform = 'translateY(-64px) scale(0.85) rotate(3deg)';
            opacity = 0.4;
            zIndex = 5;
          } else {
            transform = 'translateY(-80px) scale(0.8) rotate(0deg)';
            opacity = 0;
            zIndex = 1;
          }

          if (!isVisible && !isTop) return null;

          return (
            <div
              key={item.id}
              onClick={() => {
                if (!isTop) {
                  setActiveIdx(idx);
                }
              }}
              style={{
                transform,
                opacity,
                zIndex,
                transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
              }}
              className={`absolute inset-x-0 top-8 sm:top-12 mx-auto flex h-[490px] sm:h-[460px] md:h-[450px] w-full cursor-pointer flex-col overflow-hidden rounded-xl sm:rounded-2xl border backdrop-blur-2xl md:flex-row transition-shadow duration-300 ${
                isDark
                  ? 'border-white/15 bg-black/90 shadow-[0_30px_70px_rgba(0,0,0,0.8),0_0_40px_rgba(0,102,255,0.15)]'
                  : 'border-slate-200/90 bg-white shadow-[0_24px_50px_rgba(0,102,255,0.08),0_10px_25px_rgba(15,23,42,0.08)]'
              } ${
                isTop
                  ? 'ring-1 ring-accent/30'
                  : isDark
                  ? 'hover:border-accent/40'
                  : 'hover:border-accent/60'
              }`}
            >
              {/* Foto / Imagem Mockup do Projecto com Luz Volumétrica */}
              <div className="relative h-40 sm:h-48 w-full shrink-0 overflow-hidden md:h-full md:w-1/2">
                <img
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
                <div className={`absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r ${
                  isDark
                    ? 'from-black via-black/40 to-transparent'
                    : 'from-white/90 via-white/20 to-transparent'
                } ${item.gradient}`} />
                
                {/* Etiqueta Flutuante na Foto */}
                <div className="absolute top-3 left-3 sm:top-4 sm:left-4 flex flex-wrap gap-2">
                  <span className="rounded-lg border border-white/25 bg-black/75 px-2.5 py-1 font-mono text-[11px] sm:text-xs font-semibold text-accent backdrop-blur-md shadow-sm">
                    {item.tag}
                  </span>
                  {item.stats && (
                    <span className="hidden sm:inline-flex rounded-lg border border-white/20 bg-black/60 px-2.5 py-1 font-mono text-xs text-white backdrop-blur-md shadow-sm">
                      {item.stats.label}: <strong className="ml-1 text-accent">{item.stats.value}</strong>
                    </span>
                  )}
                </div>
              </div>

              {/* Informação e Conteúdo do Cartão */}
              <div className={`flex flex-1 flex-col justify-between p-4 sm:p-6 md:p-8 ${
                isDark ? 'text-white' : 'text-slate-900'
              }`}>
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] sm:text-xs uppercase tracking-wider text-accent font-semibold">
                      {item.category}
                    </span>
                    <span className={`rounded-md px-2 py-0.5 text-[10px] font-semibold ${
                      isDark ? 'bg-white/10 text-white/70' : 'bg-slate-100 text-slate-600'
                    }`}>
                      Arrastar / Clicar ↗
                    </span>
                  </div>

                  <h3 className={`mt-2 sm:mt-3 font-display text-xl sm:text-2xl md:text-3xl font-bold leading-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}>
                    {item.title}
                  </h3>
                  <p className={`mt-0.5 sm:mt-1 text-xs sm:text-sm font-medium ${
                    isDark ? 'text-white/50' : 'text-slate-500'
                  }`}>
                    {item.subtitle}
                  </p>

                  <p className={`mt-2 sm:mt-4 text-xs sm:text-sm leading-relaxed line-clamp-3 sm:line-clamp-none ${
                    isDark ? 'text-white/70' : 'text-slate-600'
                  }`}>
                    {item.description}
                  </p>

                  {/* Lista de Especificações */}
                  <div className="mt-3 sm:mt-5 flex flex-wrap gap-1.5 sm:gap-2">
                    {item.features.map((feat) => (
                      <span
                        key={feat}
                        className={`rounded-md border px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-[11px] font-medium ${
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

                {/* Botões de Acção do Cartão */}
                <div className={`mt-4 sm:mt-6 flex items-center justify-between border-t pt-3 sm:pt-4 ${
                  isDark ? 'border-white/10' : 'border-slate-100'
                }`}>
                  <a
                    href={item.link}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-lg bg-accent px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white shadow-md shadow-accent/30 transition-all hover:bg-blue-600 active:scale-95"
                  >
                    {item.linkLabel} <Icon n="arrow" className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </a>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      next();
                    }}
                    className={`text-xs font-semibold transition ${
                      isDark ? 'text-white/60 hover:text-white' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    Próximo →
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. Indicadores Retangulares / Paginação do Deck */}
      <div className="mt-6 flex items-center justify-center gap-2">
        {filteredItems.map((_, i) => (
          <button
            key={i}
            onClick={() => setActiveIdx(i)}
            className={`h-1.5 rounded-none transition-all duration-300 ${
              i === activeIdx
                ? 'w-8 bg-accent'
                : isDark
                ? 'w-2 bg-white/20 hover:bg-white/40'
                : 'w-2 bg-slate-300 hover:bg-slate-400'
            }`}
            aria-label={`Ir para cartão ${i + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
