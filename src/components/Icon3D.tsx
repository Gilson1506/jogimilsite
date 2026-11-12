/**
 * Ícones 3D Isométricos com Iluminação, Profundidade e Gradientes
 * Paleta da marca: Preto Noite Profunda (#000000), Azul Eléctrico (#0066FF) e Branco Puro (#FFFFFF).
 * Sem fundos fechados ou bordas rectangulares - o ícone flutua livremente com volume 3D.
 */

interface Icon3DProps {
  name: string;
  className?: string;
}

export function Icon3D({ name, className = 'h-12 w-12' }: Icon3DProps) {
  return (
    <div className={`relative inline-flex shrink-0 select-none items-center justify-center transition-all duration-300 group-hover:scale-125 group-hover:-translate-y-2 ${className}`}>
      <svg
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="h-full w-full drop-shadow-[0_8px_16px_rgba(0,102,255,0.25)] transition-all duration-300 group-hover:drop-shadow-[0_16px_30px_rgba(0,102,255,0.55)]"
      >
        <defs>
          {/* Gradientes 3D Compartilhados */}
          <linearGradient id="gradTop" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="40%" stopColor="#99C2FF" />
            <stop offset="100%" stopColor="#0066FF" />
          </linearGradient>

          <linearGradient id="gradLeft" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0066FF" />
            <stop offset="100%" stopColor="#003B99" />
          </linearGradient>

          <linearGradient id="gradRight" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#0047BA" />
            <stop offset="100%" stopColor="#000000" />
          </linearGradient>

          <linearGradient id="gradGlow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#0066FF" stopOpacity="0.1" />
          </linearGradient>

          <linearGradient id="gradGlass" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
            <stop offset="50%" stopColor="#66A3FF" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#003B99" stopOpacity="0.1" />
          </linearGradient>
        </defs>

        {renderIcon3D(name)}
      </svg>
    </div>
  );
}

function renderIcon3D(name: string) {
  switch (name) {
    // 0. Inteligência Artificial & Agentes (AI-First): Núcleo Neural 3D Isométrico com Sinapses
    case 'ia':
    case 'ai':
    case 'neural':
    case 'agent':
      return (
        <g>
          {/* Sombra de projeção inferior */}
          <ellipse cx="32" cy="54" rx="18" ry="6" fill="#003B99" opacity="0.3" />
          
          {/* Anéis orbitais de sinapse 3D inclinados */}
          <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(-28 32 32)" fill="none" stroke="url(#gradTop)" strokeWidth="1.5" opacity="0.8" />
          <ellipse cx="32" cy="32" rx="26" ry="10" transform="rotate(32 32 32)" fill="none" stroke="url(#gradLeft)" strokeWidth="1.4" opacity="0.6" />
          
          {/* Nódulos de rede neural nos anéis orbitais */}
          <circle cx="11" cy="22" r="2.5" fill="#FFFFFF" />
          <circle cx="53" cy="42" r="2.5" fill="#0066FF" />
          <circle cx="50" cy="20" r="2.2" fill="#FFFFFF" />
          <circle cx="14" cy="44" r="2.2" fill="#99C2FF" />
          
          {/* Cristaloide / Octaedro Central de IA 3D */}
          <polygon points="32,10 18,28 32,34" fill="url(#gradLeft)" />
          <polygon points="32,10 46,28 32,34" fill="url(#gradTop)" />
          <polygon points="32,50 18,28 32,34" fill="url(#gradRight)" />
          <polygon points="32,50 46,28 32,34" fill="#002266" />
          
          {/* Núcleo Central de Inteligência / Brilho Quântico */}
          <circle cx="32" cy="31" r="5" fill="url(#gradTop)" opacity="0.9" />
          <circle cx="32" cy="31" r="2.5" fill="#FFFFFF" />
          
          {/* Feixes de conexão sináptica */}
          <line x1="18" y1="28" x2="11" y2="22" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1="46" y1="28" x2="50" y2="20" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.7" />
          <line x1="32" y1="50" x2="53" y2="42" stroke="#99C2FF" strokeWidth="1" strokeDasharray="1.5 1.5" opacity="0.6" />
        </g>
      );

    // NOC & Monitorização 24/7: Centro de Operações Isométrico 3D com Telemetria e Radar
    case 'noc':
    case 'radar':
    case 'network':
    case 'telemetry':
      return (
        <g>
          {/* Sombra de base */}
          <ellipse cx="32" cy="52" rx="20" ry="7" fill="#003B99" opacity="0.35" />
          
          {/* Base da consola de operações 3D */}
          <polygon points="32,38 52,46 32,54 12,46" fill="url(#gradRight)" />
          <polygon points="12,46 32,54 32,57 12,49" fill="#001F4D" />
          <polygon points="32,54 52,46 52,49 32,57" fill="#000000" />
          
          {/* Suporte central */}
          <rect x="29" y="32" width="6" height="10" fill="url(#gradLeft)" />
          
          {/* Ecrã Monitor Principal Panorâmico Curvo 3D */}
          <path d="M14,14 L50,14 C52,14 53,16 53,18 L51,34 C51,36 49,37 47,37 L17,37 C15,37 13,36 13,34 L11,18 C11,16 12,14 14,14 Z" fill="url(#gradRight)" />
          <path d="M15,16 L49,16 C50,16 51,17 51,18 L49,32 C49,33 48,34 47,34 L17,34 C16,34 15,33 15,32 L13,18 C13,17 14,16 15,16 Z" fill="#000D1A" />
          
          {/* Grelha de telemetria / Gráfico de pulso 24/7 verde/azul */}
          <path d="M17,26 L23,26 L26,20 L29,30 L33,23 L36,27 L47,27" fill="none" stroke="url(#gradTop)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          
          {/* Varredura de radar circular no canto */}
          <circle cx="21" cy="20" r="3.5" fill="none" stroke="#66A3FF" strokeWidth="0.8" opacity="0.8" />
          <circle cx="21" cy="20" r="1" fill="#FFFFFF" />
          
          {/* Barras de telemetria e status 24/7 */}
          <line x1="39" y1="19" x2="47" y2="19" stroke="#0066FF" strokeWidth="2" strokeLinecap="round" />
          <line x1="39" y1="22" x2="45" y2="22" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          
          {/* LEDs de estado 24/7 (Alta Disponibilidade) */}
          <circle cx="16" cy="48" r="1.5" fill="#22C55E" />
          <circle cx="22" cy="49" r="1.5" fill="#FFFFFF" />
          <circle cx="28" cy="50" r="1.5" fill="#0066FF" />
          <circle cx="44" cy="49" r="1.5" fill="#22C55E" />
          
          {/* Anel de alerta de rede flutuante */}
          <ellipse cx="32" cy="11" rx="14" ry="4" fill="none" stroke="url(#gradTop)" strokeWidth="1.2" opacity="0.75" />
          <circle cx="32" cy="9" r="1.8" fill="#FFFFFF" />
        </g>
      );

    // 1. Consultoria: Giroscópio / Bússola Isométrica 3D
    case 'compass':
      return (
        <g>
          {/* Anel exterior 3D */}
          <ellipse cx="32" cy="38" rx="24" ry="12" fill="url(#gradRight)" />
          <ellipse cx="32" cy="36" rx="24" ry="12" fill="url(#gradLeft)" />
          <ellipse cx="32" cy="34" rx="20" ry="10" fill="#000000" />
          {/* Agulha 3D flutuante */}
          <polygon points="32,10 40,32 32,36 30,32" fill="url(#gradTop)" />
          <polygon points="32,10 24,32 32,36 34,32" fill="url(#gradLeft)" />
          <polygon points="32,54 40,36 32,32 30,36" fill="url(#gradRight)" />
          <polygon points="32,54 24,36 32,32 34,36" fill="#002966" />
          {/* Núcleo central brilhante */}
          <circle cx="32" cy="34" r="3.5" fill="#FFFFFF" />
          <circle cx="32" cy="34" r="1.5" fill="#0066FF" />
        </g>
      );

    // 2. Web: Globo Cibernético 3D Isométrico com Anéis Orbitais
    case 'globe':
      return (
        <g>
          {/* Sombra da esfera */}
          <ellipse cx="32" cy="50" rx="18" ry="6" fill="#003B99" opacity="0.3" />
          {/* Esfera 3D com gradiente volumétrico */}
          <circle cx="32" cy="32" r="18" fill="url(#gradLeft)" />
          <circle cx="28" cy="28" r="16" fill="url(#gradTop)" opacity="0.25" />
          {/* Meridianos e Paralelos 3D */}
          <ellipse cx="32" cy="32" rx="8" ry="18" fill="none" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.8" />
          <ellipse cx="32" cy="32" rx="18" ry="7" fill="none" stroke="#99C2FF" strokeWidth="1.2" opacity="0.9" />
          <line x1="14" y1="32" x2="50" y2="32" stroke="#FFFFFF" strokeWidth="1.2" opacity="0.6" />
          {/* Anel orbital 3D inclinado */}
          <ellipse cx="32" cy="32" rx="26" ry="9" transform="rotate(-25 32 32)" fill="none" stroke="url(#gradTop)" strokeWidth="2" />
          <circle cx="53" cy="22" r="2.5" fill="#FFFFFF" />
        </g>
      );

    // 3. Mobile: Smartphone Isométrico 3D com Vidro Flutuante
    case 'phone':
      return (
        <g>
          {/* Corpo do telemóvel 3D */}
          <path d="M22,12 L42,12 C44,12 46,14 46,16 L46,50 C46,52 44,54 42,54 L22,54 C20,54 18,52 18,50 L18,16 C18,14 20,12 22,12 Z" fill="url(#gradRight)" />
          <path d="M21,10 L41,10 C43,10 45,12 45,14 L45,48 C45,50 43,52 41,52 L21,52 C19,52 17,50 17,48 L17,14 C17,12 19,10 21,10 Z" fill="url(#gradLeft)" />
          {/* Ecrã com reflexo */}
          <rect x="20" y="14" width="22" height="34" rx="2" fill="#000000" />
          <rect x="21" y="15" width="20" height="32" rx="1" fill="url(#gradGlass)" />
          {/* Barra de interface e botão flutuante */}
          <line x1="28" y1="12" x2="34" y2="12" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="31" cy="46" r="1.8" fill="#FFFFFF" />
          {/* Cartão UI 3D a sair do ecrã */}
          <path d="M28,24 L48,20 L48,34 L28,38 Z" fill="url(#gradTop)" opacity="0.95" />
          <line x1="32" y1="26" x2="44" y2="23" stroke="#000000" strokeWidth="1.5" />
          <line x1="32" y1="30" x2="40" y2="28" stroke="#000000" strokeWidth="1.5" />
        </g>
      );

    // 4. Desktop & POS / Terminal de Vendas: Ecrã Workstation 3D Isométrico
    case 'monitor':
    case 'pos':
    case 'store':
      return (
        <g>
          {/* Base e suporte 3D */}
          <polygon points="24,54 40,54 44,57 20,57" fill="url(#gradRight)" />
          <polygon points="29,42 35,42 34,54 30,54" fill="url(#gradLeft)" />
          {/* Moldura traseira (extrusão) */}
          <polygon points="12,16 52,16 56,19 56,43 16,43 12,40" fill="url(#gradRight)" />
          {/* Moldura frontal */}
          <rect x="10" y="14" width="42" height="28" rx="3" fill="url(#gradLeft)" />
          {/* Ecrã de vidro e linhas de código */}
          <rect x="13" y="17" width="36" height="22" rx="1.5" fill="#000000" />
          <line x1="17" y1="22" x2="28" y2="22" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="26" x2="36" y2="26" stroke="#99C2FF" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="17" y1="30" x2="24" y2="30" stroke="#0066FF" strokeWidth="1.5" strokeLinecap="round" />
          {/* Brilho superior */}
          <polygon points="13,17 49,17 38,28 13,28" fill="url(#gradGlass)" />
        </g>
      );

    // 5. Integrações & APIs: Conector e Nó Hexagonal 3D
    case 'plug':
      return (
        <g>
          {/* Nó hexagonal 3D de destino */}
          <polygon points="42,26 54,33 54,47 42,54 30,47 30,33" fill="url(#gradRight)" />
          <polygon points="42,24 54,31 42,38 30,31" fill="url(#gradTop)" />
          <polygon points="30,31 42,38 42,52 30,45" fill="url(#gradLeft)" />
          {/* Conector/Cabo de dados 3D a ligar */}
          <path d="M12,42 C16,42 20,24 28,24" fill="none" stroke="url(#gradLeft)" strokeWidth="4" strokeLinecap="round" />
          {/* Ficha 3D com pinos de alta velocidade */}
          <polygon points="26,18 36,18 38,28 24,28" fill="url(#gradTop)" />
          <rect x="25" y="28" width="12" height="6" rx="1" fill="#FFFFFF" />
          <line x1="28" y1="12" x2="28" y2="18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <line x1="34" y1="12" x2="34" y2="18" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          {/* Pulso de dados brilhante */}
          <circle cx="42" cy="38" r="3" fill="#FFFFFF" />
        </g>
      );

    // 6. Subscrição / SaaS: Placas de Arquitetura 3D Sobrepostas
    case 'box':
    case 'layers':
      return (
        <g>
          {/* Placa inferior 3D */}
          <polygon points="32,44 54,33 32,22 10,33" fill="url(#gradRight)" />
          <polygon points="32,41 54,30 32,19 10,30" fill="url(#gradLeft)" opacity="0.6" />
          {/* Placa intermediária 3D */}
          <polygon points="32,34 54,23 32,12 10,23" fill="url(#gradRight)" />
          <polygon points="32,31 54,20 32,9 10,20" fill="url(#gradLeft)" />
          {/* Placa superior com topo luminoso */}
          <polygon points="32,24 54,13 32,2 10,13" fill="url(#gradTop)" />
          <polygon points="10,13 32,24 32,28 10,17" fill="url(#gradLeft)" />
          <polygon points="32,24 54,13 54,17 32,28" fill="url(#gradRight)" />
          {/* Ponto de sincronização */}
          <circle cx="32" cy="13" r="3" fill="#FFFFFF" />
        </g>
      );

    // 7. Software à Medida: Cubo Modular 3D / Blueprint
    case 'ruler':
    case 'code':
      return (
        <g>
          {/* Cubo Isométrico 3D */}
          <polygon points="32,8 54,20 32,32 10,20" fill="url(#gradTop)" />
          <polygon points="10,20 32,32 32,54 10,42" fill="url(#gradLeft)" />
          <polygon points="32,32 54,20 54,42 32,54" fill="url(#gradRight)" />
          {/* Linhas de precisão e esquadria */}
          <line x1="21" y1="14" x2="43" y2="26" stroke="#000000" strokeWidth="1.5" strokeDasharray="2 2" />
          <line x1="21" y1="26" x2="21" y2="48" stroke="#FFFFFF" strokeWidth="1.5" opacity="0.7" />
          <line x1="43" y1="26" x2="43" y2="48" stroke="#99C2FF" strokeWidth="1.5" opacity="0.7" />
          {/* Bloco flutuante encaixado */}
          <polygon points="32,16 42,22 32,28 22,22" fill="#FFFFFF" />
        </g>
      );

    // 8. Manutenção & Suporte: Engrenagem 3D Isométrica
    case 'lifebuoy':
    case 'wrench':
      return (
        <g>
          {/* Sombra da engrenagem */}
          <ellipse cx="32" cy="48" rx="20" ry="8" fill="#003B99" opacity="0.3" />
          {/* Roda dentada exterior 3D */}
          <ellipse cx="32" cy="34" rx="22" ry="12" fill="url(#gradRight)" />
          <ellipse cx="32" cy="30" rx="22" ry="12" fill="url(#gradLeft)" />
          <ellipse cx="32" cy="28" rx="20" ry="11" fill="url(#gradTop)" />
          {/* Dentes 3D ao redor */}
          <polygon points="30,14 34,14 34,18 30,18" fill="#FFFFFF" />
          <polygon points="50,26 54,28 52,32 48,30" fill="url(#gradRight)" />
          <polygon points="10,28 14,26 16,30 12,32" fill="url(#gradLeft)" />
          <polygon points="30,40 34,40 34,44 30,44" fill="url(#gradRight)" />
          {/* Furo central com profundidade */}
          <ellipse cx="32" cy="28" rx="9" ry="5" fill="#000000" />
          <ellipse cx="32" cy="30" rx="7" ry="4" fill="#000000" />
          {/* Chave de precisão a interagir */}
          <polygon points="20,16 38,34 34,38 16,20" fill="url(#gradGlass)" stroke="#FFFFFF" strokeWidth="1" />
        </g>
      );

    // 9. Nuvem & Infraestrutura: Volume 3D com Servidores
    case 'cloud':
      return (
        <g>
          {/* Lâminas de Servidores em Rack 3D na base */}
          <polygon points="18,44 46,44 50,48 14,48" fill="url(#gradRight)" />
          <polygon points="14,48 50,48 46,52 18,52" fill="url(#gradLeft)" />
          <circle cx="22" cy="46" r="1.5" fill="#FFFFFF" />
          <circle cx="28" cy="46" r="1.5" fill="#0066FF" />
          {/* Nuvem Volumétrica 3D */}
          <path
            d="M20,38 C14,38 10,34 10,28 C10,22 15,18 21,18 C23,12 30,9 37,12 C43,14 47,19 46,24 C51,24 54,28 54,33 C54,38 49,41 44,41 L20,41 Z"
            fill="url(#gradRight)"
          />
          <path
            d="M20,35 C14,35 11,31 11,26 C11,20 15,16 21,16 C23,10 30,7 37,10 C43,12 47,17 46,22 C51,22 54,26 54,31 C54,36 49,38 44,38 L20,38 Z"
            fill="url(#gradLeft)"
          />
          {/* Cúpula superior de luz */}
          <path
            d="M21,16 C23,10 30,7 37,10 C42,12 45,16 45,21 C41,20 37,21 34,23 C29,18 24,17 21,16 Z"
            fill="url(#gradTop)"
          />
          <circle cx="37" cy="18" r="2" fill="#FFFFFF" />
        </g>
      );

    // 10. Segurança: Escudo Cibernético 3D com Facetas
    case 'shield':
      return (
        <g>
          {/* Sombra de profundidade */}
          <path d="M32,10 L48,16 L48,32 C48,44 32,54 32,54 C32,54 16,44 16,32 L16,16 Z" fill="url(#gradRight)" opacity="0.6" />
          {/* Metade Esquerda 3D (Face Iluminada) */}
          <path d="M32,8 L16,14 L16,30 C16,42 32,52 32,52 Z" fill="url(#gradLeft)" />
          <path d="M32,8 L16,14 L20,30 C20,38 32,46 32,46 Z" fill="url(#gradTop)" opacity="0.4" />
          {/* Metade Direita 3D (Face Sombreada) */}
          <path d="M32,8 L48,14 L48,30 C48,42 32,52 32,52 Z" fill="url(#gradRight)" />
          {/* Núcleo de Segurança / Cadeado 3D */}
          <rect x="27" y="27" width="10" height="9" rx="1.5" fill="#FFFFFF" />
          <path d="M29,27 L29,23 C29,21 30,19 32,19 C34,19 35,21 35,23 L35,27" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="32" cy="31" r="1.5" fill="#0066FF" />
        </g>
      );

    // 11. Dados & ERP / Armazéns: Cilindros de Base de Dados 3D
    case 'database':
    case 'server':
    case 'stock':
    case 'erp':
      return (
        <g>
          {/* Disco inferior */}
          <path d="M16,40 C16,44 23,48 32,48 C41,48 48,44 48,40 L48,48 C48,52 41,56 32,56 C23,56 16,52 16,48 Z" fill="url(#gradRight)" />
          <ellipse cx="32" cy="40" rx="16" ry="6" fill="url(#gradLeft)" />
          {/* Disco intermédio */}
          <path d="M16,27 C16,31 23,35 32,35 C41,35 48,31 48,27 L48,35 C48,39 41,43 32,43 C23,43 16,39 16,35 Z" fill="url(#gradRight)" />
          <ellipse cx="32" cy="27" rx="16" ry="6" fill="url(#gradLeft)" />
          {/* Disco superior com luz */}
          <path d="M16,14 C16,18 23,22 32,22 C41,22 48,18 48,14 L48,22 C48,26 41,30 32,30 C23,30 16,26 16,22 Z" fill="url(#gradRight)" />
          <ellipse cx="32" cy="14" rx="16" ry="6" fill="url(#gradTop)" />
          {/* LEDs de estado 3D */}
          <circle cx="24" cy="28" r="1.5" fill="#FFFFFF" />
          <circle cx="29" cy="29" r="1.5" fill="#99C2FF" />
          <circle cx="24" cy="41" r="1.5" fill="#FFFFFF" />
          <circle cx="29" cy="42" r="1.5" fill="#99C2FF" />
        </g>
      );

    // 12. Automação & CPU: Microprocessador 3D com Trilhos
    case 'bolt':
    case 'cpu':
      return (
        <g>
          {/* Placa de circuito de base 3D */}
          <polygon points="32,8 54,20 32,32 10,20" fill="url(#gradRight)" opacity="0.5" />
          <polygon points="10,20 32,32 32,36 10,24" fill="#000000" />
          <polygon points="32,32 54,20 54,24 32,36" fill="#000000" />
          {/* Chip central 3D elevado */}
          <polygon points="32,16 46,24 32,32 18,24" fill="url(#gradTop)" />
          <polygon points="18,24 32,32 32,38 18,30" fill="url(#gradLeft)" />
          <polygon points="32,32 46,24 46,30 32,38" fill="url(#gradRight)" />
          {/* Raio de energia / Automação em relevo */}
          <polygon points="33,18 26,27 31,27 29,33 37,24 32,24" fill="#FFFFFF" />
          {/* Pinos metálicos 3D */}
          <line x1="14" y1="21" x2="16" y2="23" stroke="#99C2FF" strokeWidth="1.5" />
          <line x1="20" y1="17" x2="22" y2="19" stroke="#99C2FF" strokeWidth="1.5" />
          <line x1="44" y1="19" x2="46" y2="21" stroke="#99C2FF" strokeWidth="1.5" />
          <line x1="50" y1="23" x2="52" y2="25" stroke="#99C2FF" strokeWidth="1.5" />
        </g>
      );

    // 13. UI/UX: Prancheta de Design 3D com Camadas e Caneta
    case 'layout':
    case 'figma':
      return (
        <g>
          {/* Prancheta 3D inclinada */}
          <polygon points="26,12 50,22 40,52 16,42" fill="url(#gradRight)" />
          <polygon points="25,10 49,20 39,50 15,40" fill="url(#gradLeft)" />
          {/* Camada vítrea superior */}
          <polygon points="27,14 47,22 39,46 19,38" fill="url(#gradGlass)" />
          {/* Elementos de interface na prancheta */}
          <line x1="23" y1="20" x2="35" y2="25" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
          <circle cx="25" cy="30" r="3" fill="#99C2FF" />
          <rect x="32" y="29" width="10" height="6" rx="1" transform="rotate(23 32 29)" fill="url(#gradTop)" />
          {/* Caneta vector 3D a desenhar */}
          <polygon points="46,14 52,20 40,36 36,34" fill="#FFFFFF" />
          <polygon points="36,34 40,36 34,40" fill="#0066FF" />
        </g>
      );

    // 15. Live Chat: Balão de Conversa 3D Isométrico com Reflexos Vítreos
    case 'chat':
    case 'livechat':
      return (
        <g>
          {/* Sombra de contacto */}
          <ellipse cx="32" cy="52" rx="20" ry="6" fill="#003B99" opacity="0.35" />
          {/* Corpo do balão 3D com cauda */}
          <path
            d="M14,14 C14,9 18,5 24,5 L44,5 C50,5 54,9 54,14 L54,34 C54,39 50,43 44,43 L28,43 L16,53 L18,43 C15,43 14,40 14,36 Z"
            fill="url(#gradRight)"
          />
          <path
            d="M13,12 C13,7 17,3 23,3 L43,3 C49,3 53,7 53,12 L53,32 C53,37 49,41 43,41 L27,41 L15,51 L17,41 C14,41 13,38 13,34 Z"
            fill="url(#gradLeft)"
          />
          {/* Face frontal com chanfro de luz */}
          <path
            d="M15,13 C15,8.5 18.5,5 23,5 L43,5 C47.5,5 51,8.5 51,13 L51,31 C51,35.5 47.5,39 43,39 L26,39 L17,47 L18.5,39 C16,39 15,36.5 15,33 Z"
            fill="url(#gradTop)"
            opacity="0.9"
          />
          {/* Reflexo de vidro diagonal */}
          <path
            d="M16,14 L42,6 L34,22 L16,28 Z"
            fill="url(#gradGlass)"
          />
          {/* 3 Esferas 3D brilhantes dentro do balão (indicador de conversa) */}
          <circle cx="25" cy="22" r="3.2" fill="#FFFFFF" />
          <circle cx="26" cy="21" r="1.2" fill="#FFFFFF" />
          <circle cx="33" cy="22" r="3.2" fill="#FFFFFF" />
          <circle cx="34" cy="21" r="1.2" fill="#FFFFFF" />
          <circle cx="41" cy="22" r="3.2" fill="#FFFFFF" />
          <circle cx="42" cy="21" r="1.2" fill="#FFFFFF" />
          {/* Brilho de ponto de luz superior */}
          <circle cx="22" cy="7" r="1.8" fill="#FFFFFF" opacity="0.9" />
        </g>
      );

    // 14. Formação & Gestão Escolar: Livro/Códice Académico 3D com Feixe de Saber
    case 'cap':
    case 'book':
    case 'school':
    case 'edugest':
    default:
      return (
        <g>
          {/* Livro 3D Isométrico aberto */}
          <polygon points="32,24 52,14 52,36 32,46" fill="url(#gradRight)" />
          <polygon points="12,14 32,24 32,46 12,36" fill="url(#gradLeft)" />
          {/* Páginas superiores iluminadas */}
          <polygon points="12,14 32,24 32,27 12,17" fill="url(#gradTop)" />
          <polygon points="32,24 52,14 52,17 32,27" fill="#E6F0FF" />
          {/* Linhas de conhecimento */}
          <line x1="16" y1="22" x2="28" y2="28" stroke="#000000" strokeWidth="1.2" opacity="0.7" />
          <line x1="16" y1="26" x2="28" y2="32" stroke="#000000" strokeWidth="1.2" opacity="0.7" />
          <line x1="36" y1="28" x2="48" y2="22" stroke="#000000" strokeWidth="1.2" opacity="0.7" />
          <line x1="36" y1="32" x2="48" y2="26" stroke="#000000" strokeWidth="1.2" opacity="0.7" />
          {/* Chapéu de graduação / Feixe de luz 3D flutuante */}
          <polygon points="32,6 42,11 32,16 22,11" fill="url(#gradTop)" />
          <polygon points="22,11 32,16 32,19 22,14" fill="#003B99" />
          <circle cx="32" cy="11" r="1.5" fill="#FFFFFF" />
        </g>
      );
  }
}
