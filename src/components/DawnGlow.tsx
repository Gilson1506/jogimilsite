import { useEffect, useState } from 'react';

/**
 * Efeito de Luz Celestial / "Sol a Nascer"
 * - Nasce bem devagar ao abrir o site (fade-in gradual de 2.8s) em tons de azul eléctrico e branco puro.
 * - Fixo no horizonte superior para acompanhar toda a rolagem da página.
 * - Camadas puras em RGBA (sem mix-blend-mode e sem filtros pesados de blur), garantindo 0 falhas, 0 cintilações e máxima fluidez gráfica em qualquer dispositivo.
 * - Desactiva suavemente no modo claro para manter o fundo limpo.
 */
export function DawnGlow({ theme }: { theme: string }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Inicia a transição suave de "nascer do sol" logo após a montagem
    const timer = setTimeout(() => {
      setMounted(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  const isDark = theme === 'dark';

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none fixed inset-x-0 top-0 z-0 overflow-hidden transition-opacity duration-[2800ms] ease-out select-none ${
        mounted && isDark ? 'opacity-100' : 'opacity-0'
      }`}
      style={{ height: '82vh', maxHeight: '800px' }}
    >
      {/* 1. Grande atmosfera de céu azul eléctrico profundo */}
      <div
        className="absolute inset-0 transition-transform duration-[3200ms] ease-out"
        style={{
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-50px) scale(0.92)',
          background:
            'radial-gradient(ellipse 95% 65% at 50% -8%, rgba(0, 102, 255, 0.42) 0%, rgba(0, 70, 220, 0.22) 32%, rgba(0, 30, 120, 0.08) 60%, transparent 85%)',
        }}
      />

      {/* 2. Coroa média celestial de luz azul celeste vibrante */}
      <div
        className="absolute inset-0 transition-transform duration-[2800ms] ease-out delay-150"
        style={{
          transform: mounted ? 'translateY(0) scale(1)' : 'translateY(-35px) scale(0.95)',
          background:
            'radial-gradient(ellipse 65% 45% at 50% -5%, rgba(90, 175, 255, 0.48) 0%, rgba(0, 102, 255, 0.28) 38%, transparent 75%)',
        }}
      />

      {/* 3. Núcleo brilhante branco puro ("o coração do sol a nascer / facho iluminador") */}
      <div
        className="absolute left-1/2 top-0 -translate-x-1/2 transition-all duration-[3000ms] ease-out delay-200"
        style={{
          width: 'clamp(280px, 45vw, 680px)',
          height: 'clamp(140px, 22vw, 320px)',
          transform: mounted ? 'translate(-50%, 0) scale(1)' : 'translate(-50%, -35px) scale(0.88)',
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255, 255, 255, 0.96) 0%, rgba(215, 238, 255, 0.82) 20%, rgba(0, 102, 255, 0.52) 50%, transparent 78%)',
        }}
      />

      {/* 4. Arco nítido do horizonte / feixe de aurora solar */}
      <div className="absolute inset-x-0 top-0 flex justify-center">
        <svg
          viewBox="0 0 1200 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full max-w-6xl transition-all duration-[3200ms] ease-out"
          style={{
            opacity: mounted ? 0.95 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(-20px)',
          }}
        >
          <path
            d="M0,0 C350,75 850,75 1200,0"
            stroke="url(#sunBeamHorizon)"
            strokeWidth="3"
            strokeLinecap="round"
          />
          <path
            d="M200,0 C450,55 750,55 1000,0"
            stroke="#FFFFFF"
            strokeWidth="1.5"
            strokeOpacity="0.9"
            strokeLinecap="round"
          />
          <defs>
            <linearGradient id="sunBeamHorizon" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0066FF" stopOpacity="0" />
              <stop offset="25%" stopColor="#0066FF" stopOpacity="0.6" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="75%" stopColor="#0066FF" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0066FF" stopOpacity="0" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* 5. Pulsação subtil contínua de respiração da luz celestial */}
      <div
        className="absolute inset-0 animate-pulse pointer-events-none"
        style={{
          background:
            'radial-gradient(circle at 50% 0%, rgba(0, 102, 255, 0.16) 0%, transparent 65%)',
          animationDuration: '6s',
        }}
      />
    </div>
  );
}
