import { ReactNode, useEffect, useState } from 'react';
import { useReducedMotion, useReveal } from '../lib/hooks';

const P: Record<string, string> = {
  compass: 'M12 2a10 10 0 100 20 10 10 0 000-20zm4 6l-2 6-6 2 2-6 6-2z',
  globe: 'M12 2a10 10 0 100 20 10 10 0 000-20zM2 12h20M12 2c3 3 4 6.5 4 10s-1 7-4 10c-3-3-4-6.5-4-10s1-7 4-10z',
  phone: 'M8 2h8a2 2 0 012 2v16a2 2 0 01-2 2H8a2 2 0 01-2-2V4a2 2 0 012-2zm4 17h.01',
  monitor: 'M3 4h18v12H3zM8 20h8M12 16v4',
  plug: 'M9 2v6M15 2v6M6 8h12v3a6 6 0 01-12 0zM12 17v5',
  box: 'M21 8l-9-5-9 5v8l9 5 9-5zM3 8l9 5 9-5M12 13v9',
  ruler: 'M3 17L17 3l4 4L7 21zM8 12l2 2M11 9l2 2M14 6l2 2',
  lifebuoy: 'M12 2a10 10 0 100 20 10 10 0 000-20zm0 6a4 4 0 100 8 4 4 0 000-8zM5 5l4 4M15 15l4 4M19 5l-4 4M9 15l-4 4',
  cloud: 'M7 18a5 5 0 01-.5-9.97A6 6 0 0118 10a4 4 0 010 8z',
  shield: 'M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5zM9 12l2 2 4-4',
  database: 'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3zm0 0v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  bolt: 'M13 2L4 14h7l-1 8 9-12h-7z',
  layout: 'M3 3h18v18H3zM3 9h18M9 21V9',
  cap: 'M2 9l10-5 10 5-10 5zM6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5',
  ia: 'M12 2a3 3 0 00-3 3c0 .3.05.6.14.87A7 7 0 004 12a7 7 0 005.14 6.13A3 3 0 1012 22a3 3 0 002.86-3.87A7 7 0 0020 12a7 7 0 00-5.14-6.13A3 3 0 0012 2zm0 4a6 6 0 016 6 6 6 0 01-6 6 6 6 0 01-6-6 6 6 0 016-6zm0 3a3 3 0 100 6 3 3 0 000-6z',
  noc: 'M2 12h3l2-4 3 8 3-6 2 4 2-2h5M4 4h16a2 2 0 012 2v12a2 2 0 01-2 2H4a2 2 0 01-2-2V6a2 2 0 012-2z',
  arrow: 'M5 12h14M13 6l6 6-6 6',
  check: 'M5 12l5 5 9-10',
  copy: 'M9 9h11v11H9zM5 15V4h11',
  menu: 'M4 8h16M4 16h16',
  close: 'M5 5l14 14M19 5L5 19',
  sun: 'M12 4V2M12 22v-2M4 12H2M22 12h-2M6 6L4.6 4.6M19.4 19.4L18 18M6 18l-1.4 1.4M19.4 4.6L18 6M12 8a4 4 0 100 8 4 4 0 000-8z',
  moon: 'M21 13A9 9 0 1111 3a7 7 0 0010 10z',
  wa: 'M3 21l1.6-5A9 9 0 1112 21a9 9 0 01-4.4-1.2zM9 8c0 4 3 7 7 7l1-2-2-1-1 1c-1-.5-2-1.500-2.500-2.500l1-1-1-2z',
  map: 'M12 22s7-6.500 7-12a7 7 0 10-14 0c0 5.500 7 12 7 12zM12 12a2.500 2.500 0 100-5 2.500 2.500 0 000 5z',
  clip: 'M20 11l-8.500 8.500a5 5 0 01-7-7L13 4a3.500 3.500 0 015 5l-8.500 8.500a2 2 0 01-3-3L14 7',
  plus: 'M12 5v14M5 12h14',
  download: 'M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3',
};

export const Icon = ({ n, className = 'h-5 w-5' }: { n: string; className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d={P[n] || P.box} />
  </svg>
);

export { Icon3D } from './Icon3D';

export const Logo = ({ className = 'h-10 w-auto' }: { className?: string }) => (
  <img src="/logo-white.png" alt="JOGIMIL" width="380" height="295" className={`shrink-0 object-contain ${className}`} />
);

export const Reveal = ({ children, delay = 0, className = '' }: { children: ReactNode; delay?: number; className?: string }) => {
  const ref = useReveal();
  return (
    <div ref={ref} className={`reveal ${className}`} style={{ ['--d' as string]: `${delay}ms` }}>
      {children}
    </div>
  );
};

/** Números que contam de zero até ao valor. */
export const Counter = ({ to, suffix = '' }: { to: number; suffix?: string }) => {
  const reduce = useReducedMotion();
  const [v, setV] = useState(reduce ? to : 0);
  const [el, setEl] = useState<HTMLElement | null>(null);
  useEffect(() => {
    if (reduce || !el) return;
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const f = (t: number) => {
        const k = Math.min(1, (t - t0) / 1400);
        setV(Math.round(to * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(f);
      };
      requestAnimationFrame(f);
    });
    io.observe(el);
    return () => io.disconnect();
  }, [el, to, reduce]);
  return <span ref={setEl}>{v}{suffix}</span>;
};

/** Texto que se escreve sozinho, a alternar áreas de serviço. */
export const Typewriter = ({ words }: { words: string[] }) => {
  const reduce = useReducedMotion();
  const [i, setI] = useState(0);
  const [n, setN] = useState(reduce ? words[0].length : 0);
  const [del, setDel] = useState(false);
  useEffect(() => {
    if (reduce) return;
    const w = words[i];
    const t = setTimeout(() => {
      if (!del && n < w.length) setN(n + 1);
      else if (!del) setDel(true);
      else if (n > 0) setN(n - 1);
      else { setDel(false); setI((i + 1) % words.length); }
    }, !del && n === w.length ? 1400 : del ? 35 : 70);
    return () => clearTimeout(t);
  }, [n, del, i, words, reduce]);
  return (
    <span className="text-accent">
      <span aria-hidden="true">{words[i].slice(0, n)}</span>
      <span className="caret" aria-hidden="true">|</span>
      <span className="sr-only">{words.join(', ')}</span>
    </span>
  );
};
