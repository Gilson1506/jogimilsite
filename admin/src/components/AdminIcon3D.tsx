import { useId } from 'react';

export type AdminIcon3DName =
  | 'visits'
  | 'users'
  | 'contacts'
  | 'channels'
  | 'campaigns'
  | 'send'
  | 'check'
  | 'chat'
  | 'mail'
  | 'clock'
  | 'radio'
  | 'shield'
  | 'folder'
  | 'calendar'
  | 'tasks'
  | 'dashboard'
  | 'inbox'
  | 'support'
  | 'news'
  | 'portfolio'
  | 'profile'
  | 'settings'
  | 'globe'
  | 'logout';

interface AdminIcon3DProps {
  name: AdminIcon3DName;
  size?: number;
  className?: string;
}

/**
 * Ícones 3D Esculturais do Painel JOGIMIL (sem caixa/background colorido).
 * Paleta harmonizada com o Modo Noturno Clássico (Carbon/Graphite) e Modo Claro:
 * - Royal Blue (#60A5FA → #2575FC → #1D4ED8)
 * - Emerald (#A7F3D0 → #10B981 → #047857)
 * - Sky Cyan (#7DD3FC → #0EA5E9 → #0284C7)
 * - Amber Gold (#FDE68A → #F59E0B → #B45309)
 * - Indigo (#C4B5FD → #6366F1 → #3730A3)
 */
export function AdminIcon3D({ name, size = 38, className = '' }: AdminIcon3DProps) {
  const uid = useId().replace(/:/g, '');

  const blueA = `${uid}_bA`;
  const blueR = `${uid}_bR`;
  const emA = `${uid}_eA`;
  const emR = `${uid}_eR`;
  const emSub = `${uid}_eS`;
  const skyA = `${uid}_sA`;
  const skyB = `${uid}_sB`;
  const ambA = `${uid}_aA`;
  const ambR = `${uid}_aR`;
  const indT = `${uid}_iT`;
  const indL = `${uid}_iL`;
  const indR = `${uid}_iR`;
  const roseA = `${uid}_rA`;

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      className={`icon-3d shrink-0 select-none ${className}`}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={blueA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="55%" stopColor="#2575FC" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
        <radialGradient id={blueR} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#E0F2FE" />
          <stop offset="45%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#1E40AF" />
        </radialGradient>

        <linearGradient id={emA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#34D399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <radialGradient id={emR} cx="35%" cy="28%" r="72%">
          <stop offset="0%" stopColor="#A7F3D0" />
          <stop offset="50%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#047857" />
        </radialGradient>
        <radialGradient id={emSub} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#6EE7B7" />
          <stop offset="100%" stopColor="#065F46" />
        </radialGradient>

        <linearGradient id={skyA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#7DD3FC" />
          <stop offset="50%" stopColor="#0EA5E9" />
          <stop offset="100%" stopColor="#0284C7" />
        </linearGradient>
        <linearGradient id={skyB} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#38BDF8" />
          <stop offset="100%" stopColor="#0369A1" />
        </linearGradient>

        <linearGradient id={ambA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDE68A" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#B45309" />
        </linearGradient>
        <radialGradient id={ambR} cx="35%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#FEF3C7" />
          <stop offset="55%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#92400E" />
        </radialGradient>

        <linearGradient id={indT} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#C4B5FD" />
          <stop offset="100%" stopColor="#818CF8" />
        </linearGradient>
        <linearGradient id={indL} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366F1" />
          <stop offset="100%" stopColor="#4338CA" />
        </linearGradient>
        <linearGradient id={indR} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#4F46E5" />
          <stop offset="100%" stopColor="#312E81" />
        </linearGradient>

        <linearGradient id={roseA} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FDA4AF" />
          <stop offset="50%" stopColor="#F43F5E" />
          <stop offset="100%" stopColor="#BE123C" />
        </linearGradient>
      </defs>

      {name === 'visits' && (
        <g>
          <path
            d="M4.5 21.5C8 13.5 13.6 9.5 20 9.5s12 4 15.5 12c-3.5 8-9.1 12-15.5 12s-12-4-15.5-12Z"
            fill={`url(#${blueA})`}
          />
          <path
            d="M6.5 20.5C9.8 14.2 14.5 11 20 11s10.2 3.2 13.5 9.5"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle cx="20" cy="21" r="6.8" fill={`url(#${blueR})`} />
          <circle cx="20" cy="21" r="2.8" fill="#0F172A" opacity="0.85" />
          <circle cx="17.8" cy="18.6" r="1.5" fill="#FFFFFF" opacity="0.9" />
        </g>
      )}

      {name === 'users' && (
        <g>
          <circle cx="28.5" cy="15.5" r="4.5" fill={`url(#${emSub})`} opacity="0.85" />
          <path
            d="M23.5 29.5c.6-4.2 3.4-6.8 6.8-6.8 3.2 0 5.5 2.4 6 6.8a1.2 1.2 0 0 1-1.2 1.3H24.6"
            fill={`url(#${emSub})`}
            opacity="0.8"
          />
          <circle cx="16.5" cy="14" r="6.2" fill={`url(#${emR})`} />
          <path
            d="M6.5 31.2c.8-5.9 4.7-9.4 10-9.4s9.2 3.5 10 9.4a1.6 1.6 0 0 1-1.6 1.8H8.1a1.6 1.6 0 0 1-1.6-1.8Z"
            fill={`url(#${emA})`}
          />
          <circle cx="14.5" cy="12" r="1.6" fill="#FFFFFF" opacity="0.55" />
        </g>
      )}

      {name === 'contacts' && (
        <g>
          <rect
            x="8"
            y="6"
            width="27"
            height="24"
            rx="5"
            fill={`url(#${skyB})`}
            opacity="0.55"
            transform="rotate(6 21 18)"
          />
          <rect x="5" y="9" width="28" height="23" rx="5.5" fill={`url(#${skyA})`} />
          <path d="M9 11.5h20" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="14.5" cy="19.5" r="3.2" fill="#FFFFFF" opacity="0.92" />
          <path d="M10.5 26.8c.5-2.3 2-3.6 4-3.6s3.5 1.3 4 3.6" fill="#FFFFFF" opacity="0.9" />
          <rect x="21" y="17.5" width="8.5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.88" />
          <rect x="21" y="22" width="6.2" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.65" />
        </g>
      )}

      {name === 'channels' && (
        <g>
          <polygon points="20,5 34,12.5 20,20 6,12.5" fill={`url(#${indT})`} />
          <polygon points="6,12.5 20,20 20,35 6,27.5" fill={`url(#${indL})`} />
          <polygon points="34,12.5 20,20 20,35 34,27.5" fill={`url(#${indR})`} />
          <polyline
            points="6,12.5 20,20 34,12.5"
            fill="none"
            stroke="rgba(255,255,255,0.45)"
            strokeWidth="1.2"
          />
          <line x1="20" y1="20" x2="20" y2="35" stroke="rgba(255,255,255,0.22)" strokeWidth="1.1" />
        </g>
      )}

      {name === 'campaigns' && (
        <g>
          <path
            d="M11 6.5h18a3.5 3.5 0 0 1 3.5 3.5v23.5l-12.5-6.8-12.5 6.8V10A3.5 3.5 0 0 1 11 6.5Z"
            fill={`url(#${blueA})`}
          />
          <path d="M12.5 9h15" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" strokeLinecap="round" />
          <circle cx="20" cy="17.5" r="4.2" fill={`url(#${blueR})`} />
        </g>
      )}

      {name === 'send' && (
        <g>
          <path d="M6 19.5 34 7.5 26 33.5 18.8 24.2 6 19.5Z" fill={`url(#${emA})`} />
          <path d="M34 7.5 18.8 24.2 18.2 31.8 23.5 26.2" fill={`url(#${emSub})`} />
          <path d="M9.5 18.8 31.5 9.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}

      {name === 'check' && (
        <g>
          <circle cx="20" cy="20" r="14" fill={`url(#${emR})`} />
          <path
            d="M12 12a11 11 0 0 1 16 0"
            fill="none"
            stroke="rgba(255,255,255,0.4)"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
          <path
            d="M13.5 20.5 18 25l8.5-9.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {name === 'chat' && (
        <g>
          <rect x="13" y="7" width="21" height="16" rx="5" fill={`url(#${skyB})`} opacity="0.7" />
          <path
            d="M6 16a5 5 0 0 1 5-5h14a5 5 0 0 1 5 5v8a5 5 0 0 1-5 5h-9l-6 4.5V29a4.5 4.5 0 0 1-4-4.5V16Z"
            fill={`url(#${blueA})`}
          />
          <circle cx="13.5" cy="20" r="1.6" fill="#FFFFFF" opacity="0.92" />
          <circle cx="18.5" cy="20" r="1.6" fill="#FFFFFF" opacity="0.92" />
          <circle cx="23.5" cy="20" r="1.6" fill="#FFFFFF" opacity="0.92" />
        </g>
      )}

      {name === 'mail' && (
        <g>
          <rect x="5" y="10" width="30" height="21" rx="4.5" fill={`url(#${skyA})`} />
          <path
            d="M6.5 12 20 22.5 33.5 12"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity="0.9"
          />
        </g>
      )}

      {name === 'clock' && (
        <g>
          <circle cx="20" cy="20" r="14" fill={`url(#${ambR})`} />
          <circle cx="20" cy="20" r="10.5" fill="rgba(255,255,255,0.14)" />
          <path
            d="M20 13.5V20l4.8 3"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {name === 'radio' && (
        <g>
          <circle cx="20" cy="20" r="14" fill="none" stroke={`url(#${emA})`} strokeWidth="2.2" opacity="0.35" />
          <circle cx="20" cy="20" r="9.5" fill="none" stroke={`url(#${emA})`} strokeWidth="2.4" opacity="0.65" />
          <circle cx="20" cy="20" r="5.2" fill={`url(#${emR})`} />
          <circle cx="18.4" cy="18.4" r="1.4" fill="#FFFFFF" opacity="0.75" />
        </g>
      )}

      {name === 'shield' && (
        <g>
          <path
            d="M20 5.5 32.5 10.5v9c0 7.6-5.2 13.2-12.5 15.5C12.7 32.7 7.5 27.1 7.5 19.5v-9L20 5.5Z"
            fill={`url(#${indL})`}
          />
          <path
            d="M20 5.5 32.5 10.5v9c0 7.6-5.2 13.2-12.5 15.5V5.5Z"
            fill={`url(#${indT})`}
            opacity="0.55"
          />
          <path
            d="M14.5 20.2 18.3 24l7.5-8"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}

      {name === 'folder' && (
        <g>
          <path
            d="M5.5 12a3.5 3.5 0 0 1 3.5-3.5h6.5l3 3.2H31a3.5 3.5 0 0 1 3.5 3.5v13.8a3.5 3.5 0 0 1-3.5 3.5H9a3.5 3.5 0 0 1-3.5-3.5V12Z"
            fill={`url(#${skyA})`}
          />
          <path d="M9 15h22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" strokeLinecap="round" />
        </g>
      )}

      {name === 'calendar' && (
        <g>
          <rect x="6" y="9" width="28" height="25" rx="5" fill={`url(#${blueA})`} />
          <rect x="6" y="9" width="28" height="8" rx="4" fill={`url(#${skyA})`} />
          <rect x="12" y="5.5" width="3" height="6" rx="1.5" fill="#E0F2FE" />
          <rect x="25" y="5.5" width="3" height="6" rx="1.5" fill="#E0F2FE" />
          <circle cx="14" cy="23" r="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="20" cy="23" r="2" fill="#FFFFFF" opacity="0.9" />
          <circle cx="26" cy="23" r="2" fill="#FFFFFF" opacity="0.6" />
          <circle cx="14" cy="29" r="2" fill="#FFFFFF" opacity="0.6" />
          <circle cx="20" cy="29" r="2" fill="#FFFFFF" opacity="0.6" />
        </g>
      )}

      {name === 'tasks' && (
        <g>
          <rect x="7" y="6" width="26" height="28" rx="5" fill={`url(#${ambA})`} />
          <path d="M13 15l2 2 4-4" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="21.5" y="14" width="7" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.9" />
          <path d="M13 23l2 2 4-4" fill="none" stroke="#FFFFFF" strokeWidth="2.2" strokeLinecap="round" />
          <rect x="21.5" y="22" width="7" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.7" />
        </g>
      )}

      {name === 'dashboard' && (
        <g>
          <rect x="6" y="6" width="12.5" height="12.5" rx="3.5" fill={`url(#${blueA})`} />
          <rect x="21.5" y="6" width="12.5" height="12.5" rx="3.5" fill={`url(#${skyA})`} />
          <rect x="6" y="21.5" width="12.5" height="12.5" rx="3.5" fill={`url(#${indL})`} />
          <rect x="21.5" y="21.5" width="12.5" height="12.5" rx="3.5" fill={`url(#${emA})`} />
          <path d="M9 9h6.5M24.5 9h6.5" stroke="rgba(255,255,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}

      {name === 'inbox' && (
        <g>
          <path
            d="M7 11.5A3.5 3.5 0 0 1 10.5 8h19A3.5 3.5 0 0 1 33 11.5l2 14.5a4 4 0 0 1-4 4.5H9a4 4 0 0 1-4-4.5l2-14.5Z"
            fill={`url(#${indL})`}
          />
          <path
            d="M5.5 22h8.5l2.2 3.2h7.6L26 22h8.5v4a4 4 0 0 1-4 4.5h-21a4 4 0 0 1-4-4.5v-4Z"
            fill={`url(#${skyA})`}
          />
          <path d="M12 13.5h16" stroke="rgba(255,255,255,0.45)" strokeWidth="1.4" strokeLinecap="round" />
        </g>
      )}

      {name === 'support' && (
        <g>
          <path
            d="M9 22v-2a11 11 0 0 1 22 0v2"
            fill="none"
            stroke={`url(#${emA})`}
            strokeWidth="3.2"
            strokeLinecap="round"
          />
          <rect x="6" y="20" width="6.5" height="11" rx="3.2" fill={`url(#${emR})`} />
          <rect x="27.5" y="20" width="6.5" height="11" rx="3.2" fill={`url(#${skyA})`} />
          <path
            d="M30.5 30.5c0 2.5-2.2 4-5.5 4h-3.5"
            fill="none"
            stroke={`url(#${skyA})`}
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx="20.5" cy="34.5" r="2.2" fill={`url(#${blueR})`} />
        </g>
      )}

      {name === 'news' && (
        <g>
          <rect x="8.5" y="7" width="25" height="26" rx="4.5" fill={`url(#${indL})`} opacity="0.65" transform="rotate(4 21 20)" />
          <rect x="6" y="8" width="25" height="25" rx="4.5" fill={`url(#${blueA})`} />
          <rect x="10" y="12" width="11" height="8" rx="2" fill={`url(#${skyA})`} />
          <rect x="23" y="12.5" width="4.5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.9" />
          <rect x="23" y="16.8" width="4.5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.7" />
          <rect x="10" y="23" width="17" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.88" />
          <rect x="10" y="27.2" width="12.5" height="2.2" rx="1.1" fill="#FFFFFF" opacity="0.65" />
        </g>
      )}

      {name === 'portfolio' && (
        <g>
          <path
            d="M14.5 11.5V9.2A2.7 2.7 0 0 1 17.2 6.5h5.6a2.7 2.7 0 0 1 2.7 2.7v2.3"
            fill="none"
            stroke={`url(#${ambA})`}
            strokeWidth="2.6"
            strokeLinecap="round"
          />
          <rect x="5.5" y="11.5" width="29" height="21.5" rx="5" fill={`url(#${ambA})`} />
          <path d="M5.5 20.5h29" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          <rect x="17" y="18.2" width="6" height="4.8" rx="1.5" fill="#FFFFFF" opacity="0.92" />
        </g>
      )}

      {name === 'profile' && (
        <g>
          <circle cx="20" cy="20" r="14.5" fill={`url(#${blueA})`} />
          <circle cx="20" cy="15.5" r="4.8" fill="#FFFFFF" opacity="0.95" />
          <path
            d="M11.8 28.5c1.5-4 4.6-6 8.2-6s6.7 2 8.2 6"
            fill="#FFFFFF"
            opacity="0.9"
          />
        </g>
      )}

      {name === 'settings' && (
        <g>
          <circle cx="20" cy="20" r="13" fill="none" stroke={`url(#${indT})`} strokeWidth="4.2" strokeDasharray="5.2 4.1" />
          <circle cx="20" cy="20" r="10.2" fill={`url(#${indL})`} />
          <circle cx="20" cy="20" r="4.6" fill={`url(#${skyA})`} />
          <circle cx="18.5" cy="18.5" r="1.4" fill="#FFFFFF" opacity="0.8" />
        </g>
      )}

      {name === 'globe' && (
        <g>
          <circle cx="20" cy="20" r="14" fill={`url(#${skyA})`} />
          <ellipse cx="20" cy="20" rx="6.5" ry="13.5" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1.4" />
          <path d="M6.5 20h27M9 13.5h22M9 26.5h22" stroke="rgba(255,255,255,0.45)" strokeWidth="1.3" />
        </g>
      )}

      {name === 'logout' && (
        <g>
          <rect x="6" y="7" width="16" height="26" rx="4" fill={`url(#${roseA})`} opacity="0.85" />
          <path
            d="M18 20h14.5m0 0-4.5-4.5m4.5 4.5-4.5 4.5"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.8"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </g>
      )}
    </svg>
  );
}
