interface MascoteAgenteProps {
  onClick?: () => void;
  isOpen?: boolean;
  unreadCount?: number;
  className?: string;
}

export function MascoteAgente({
  onClick,
  isOpen = false,
  unreadCount = 0,
  className = '',
}: MascoteAgenteProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group relative inline-flex items-center justify-center cursor-pointer select-none transition-transform duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-400 rounded-full ${className}`}
      aria-label={isOpen ? 'Fechar assistente JOGIMIL' : 'Falar com o assistente virtual JOGIMIL'}
    >
      {/* Glow Celestial Tridimensional no Fundo */}
      <div className="absolute inset-0 rounded-full bg-sky-400/25 blur-xl opacity-75 group-hover:opacity-100 group-hover:scale-110 transition-all duration-300 pointer-events-none" />

      {/* Tooltip sutil no hover (apenas desktop, sem balões de dicas) */}
      <span className="pointer-events-none absolute right-full mr-3 whitespace-nowrap rounded-lg bg-slate-900/90 border border-white/10 px-2.5 py-1 text-[11px] font-medium text-white shadow-xl backdrop-blur-md opacity-0 transition-opacity duration-200 group-hover:opacity-100 hidden sm:inline-block">
        {isOpen ? 'Fechar chat' : 'Live Chat · Assistente IA'}
      </span>

      {/* Mascote Robô SVG Animado a Acenar */}
      <div className="relative flex items-center justify-center shrink-0 w-20 h-20 sm:w-24 sm:h-24">
        <svg
          viewBox="0 0 160 160"
          className="w-full h-full drop-shadow-[0_10px_22px_rgba(2,132,199,0.4)] transition-transform duration-300 group-hover:scale-105"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="livechat-bodyGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="35%" stopColor="#BAE6FD" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
            <linearGradient id="livechat-screenGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#050B1A" />
              <stop offset="100%" stopColor="#0B132B" />
            </linearGradient>
            <linearGradient id="livechat-glowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38BDF8" />
              <stop offset="100%" stopColor="#0284C7" />
            </linearGradient>
          </defs>

          {/* Sombra de Projeção Flutuante */}
          <ellipse cx="80" cy="148" rx="34" ry="7" fill="#003B99" opacity="0.3" className="animate-pulse" />

          {/* Corpo Flutuante do Robô */}
          <g className="animate-[mascoteFloat_3s_ease-in-out_infinite]">
            {/* Antena com Pulso de Sinal */}
            <line x1="80" y1="36" x2="80" y2="20" stroke="#0284C7" strokeWidth="4" strokeLinecap="round" />
            <circle cx="80" cy="18" r="6" fill="#38BDF8" className="animate-ping opacity-75" />
            <circle cx="80" cy="18" r="5" fill="#38BDF8" />

            {/* Cabeça do Robô */}
            <rect x="44" y="34" width="72" height="52" rx="22" fill="url(#livechat-bodyGrad)" />

            {/* Visor / Tela do Rosto */}
            <rect x="52" y="42" width="56" height="36" rx="14" fill="url(#livechat-screenGrad)" stroke="#0284C7" strokeWidth="1.5" />

            {/* Olhos de LED Ciano */}
            <g className="transition-all duration-300">
              <ellipse cx="68" cy="59" rx="5" ry="6" fill="#38BDF8" />
              <circle cx="69" cy="57" r="1.5" fill="#FFFFFF" />

              <ellipse cx="92" cy="59" rx="5" ry="6" fill="#38BDF8" />
              <circle cx="93" cy="57" r="1.5" fill="#FFFFFF" />
            </g>

            {/* Sorriso Tech em LED */}
            <path d="M74 68 Q80 73 86 68" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" fill="none" />

            {/* Fones Laterais com LEDs */}
            <rect x="37" y="48" width="9" height="24" rx="4" fill="#0284C7" />
            <rect x="114" y="48" width="9" height="24" rx="4" fill="#0284C7" />
            <circle cx="41.5" cy="60" r="2" fill="#38BDF8" />
            <circle cx="118.5" cy="60" r="2" fill="#38BDF8" />

            {/* Tronco / Torso */}
            <path d="M54 90 C54 86 106 86 106 90 L100 128 C100 134 60 134 60 128 Z" fill="url(#livechat-bodyGrad)" />

            {/* Núcleo de Energia AI no Peito */}
            <circle cx="80" cy="108" r="8" fill="#050B1A" />
            <circle cx="80" cy="108" r="5" fill="url(#livechat-glowGrad)" />

            {/* Braço Direito (Repouso) */}
            <path d="M56 94 C44 102 46 118 52 124" stroke="url(#livechat-bodyGrad)" strokeWidth="8" strokeLinecap="round" />

            {/* BRAÇO ESQUERDO A ACENAR "OLÁ" (com transformOrigin no ombro em 104px 95px) */}
            <g
              style={{ transformOrigin: '104px 95px' }}
              className="animate-[mascoteWave_1.4s_ease-in-out_infinite] group-hover:animate-[mascoteWaveFast_0.6s_ease-in-out_infinite]"
            >
              <path d="M104 95 C120 85 130 65 125 45" stroke="url(#livechat-bodyGrad)" strokeWidth="9" strokeLinecap="round" />
              <circle cx="125" cy="45" r="9" fill="#FFFFFF" stroke="#0284C7" strokeWidth="2" />
              <circle cx="120" cy="38" r="3.5" fill="#FFFFFF" />
              <circle cx="128" cy="38" r="3.5" fill="#FFFFFF" />
              <circle cx="134" cy="43" r="3" fill="#38BDF8" />
            </g>
          </g>
        </svg>

        {/* Indicador de Status Online / Fechar */}
        {isOpen ? (
          <span
            title="Fechar chat"
            className="absolute top-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-slate-900/90 text-white shadow-lg border border-white/40 hover:bg-slate-800 transition"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </span>
        ) : (
          <span className="absolute bottom-1 right-2 flex h-3.5 w-3.5" title="Assistente Online">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500 border-2 border-white shadow-xs" />
          </span>
        )}

        {/* Contador de Mensagens Não Lidas */}
        {unreadCount > 0 && !isOpen && (
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold shadow-md bg-blue-600 text-white ring-2 ring-white">
            {unreadCount}
          </span>
        )}
      </div>

      <style>{`
        @keyframes mascoteFloat {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        @keyframes mascoteWave {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-26deg); }
        }
        @keyframes mascoteWaveFast {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(-36deg); }
        }
      `}</style>
    </button>
  );
}