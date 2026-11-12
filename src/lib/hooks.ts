import { useEffect, useState, useCallback } from 'react';

/** Router mínimo por hash (#/servicos/web). Funciona em qualquer alojamento estático. */
export function parse(hash: string) {
  const p = hash.replace(/^#\/?/, '').split('?')[0].split('/').filter(Boolean);
  return { page: p[0] || 'inicio', id: p[1] };
}

export function useRoute() {
  const [r, setR] = useState(() => parse(location.hash));
  useEffect(() => {
    const on = () => {
      setR(parse(location.hash));
      window.scrollTo({ top: 0 });
    };
    addEventListener('hashchange', on);
    return () => removeEventListener('hashchange', on);
  }, []);
  return r;
}

export const href = (...p: string[]) => `#/${p.join('/')}`;

export function useReducedMotion() {
  const [v, setV] = useState(() => matchMedia('(prefers-reduced-motion: reduce)').matches);
  useEffect(() => {
    const m = matchMedia('(prefers-reduced-motion: reduce)');
    const f = () => setV(m.matches);
    m.addEventListener('change', f);
    return () => m.removeEventListener('change', f);
  }, []);
  return v;
}

/** Revelar ao rolar. */
export function useReveal() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const ref = useCallback((n: HTMLElement | null) => setEl(n), []);
  useEffect(() => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { el.classList.add('in'); return; }
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) { el.classList.add('in'); io.disconnect(); }
    }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' });
    io.observe(el);
    return () => io.disconnect();
  }, [el]);
  return ref;
}

export function useTheme() {
  const [t, setT] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');
  const toggle = () => {
    const n = t === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', n);
    try { localStorage.setItem('jm-theme', n); } catch { /* ignore */ }
    setT(n);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: n } }));
  };
  return { theme: t, toggle };
}

/** Equipamento fraco / poupança de dados: não carregar 3D. */
export function lowEnd() {
  const n = navigator as Navigator & { deviceMemory?: number; connection?: { saveData?: boolean } };
  if (n.connection?.saveData) return true;
  if (n.deviceMemory && n.deviceMemory <= 2) return true;
  if (n.hardwareConcurrency && n.hardwareConcurrency <= 2) return true;
  try {
    const c = document.createElement('canvas');
    return !(c.getContext('webgl2') || c.getContext('webgl'));
  } catch { return true; }
}
