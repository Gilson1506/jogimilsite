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

/** Revelar ao rolar (com suporte imediato dentro do palco lateral e fallback seguro). */
export function useReveal() {
  const [el, setEl] = useState<HTMLElement | null>(null);
  const ref = useCallback((n: HTMLElement | null) => setEl(n), []);
  useEffect(() => {
    if (!el) return;
    if (el.closest('[data-lateral-stage]') || !('IntersectionObserver' in window)) {
      el.classList.add('in');
      return;
    }

    let revealed = false;
    const reveal = () => {
      if (revealed) return;
      revealed = true;
      el.classList.add('in');
    };

    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          reveal();
          io.disconnect();
        }
      },
      { threshold: 0.01, rootMargin: '120px 0px 120px 0px' }
    );
    io.observe(el);

    const checkPosition = () => {
      const rect = el.getBoundingClientRect();
      if (rect.top <= window.innerHeight + 120 && rect.bottom >= -120) {
        reveal();
        io.disconnect();
      }
    };

    const rafId = requestAnimationFrame(checkPosition);
    const fallbackTimer = window.setTimeout(reveal, 1200);

    return () => {
      io.disconnect();
      cancelAnimationFrame(rafId);
      window.clearTimeout(fallbackTimer);
    };
  }, [el]);
  return ref;
}

export function useTheme() {
  const [t, setT] = useState(() => document.documentElement.getAttribute('data-theme') || 'dark');

  useEffect(() => {
    const onThemeChange = (e: Event) => {
      const detail = (e as CustomEvent<{ theme?: string }>).detail;
      const next = detail?.theme || document.documentElement.getAttribute('data-theme') || 'dark';
      setT(next);
    };
    window.addEventListener('themechange', onThemeChange);
    return () => window.removeEventListener('themechange', onThemeChange);
  }, []);

  const applyTheme = (next: 'dark' | 'light') => {
    const root = document.documentElement;
    root.setAttribute('data-theme', next);
    try {
      localStorage.setItem('jm-theme', next);
    } catch {
      /* ignore */
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', next === 'dark' ? '#000000' : '#ffffff');
    setT(next);
    window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: next } }));
  };

  const toggle = () => {
    const next: 'dark' | 'light' = t === 'dark' ? 'light' : 'dark';
    const doc = document as Document & {
      startViewTransition?: (cb: () => void) => { finished: Promise<void> };
    };
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!reduced && typeof doc.startViewTransition === 'function') {
      doc.startViewTransition(() => applyTheme(next));
      return;
    }

    const root = document.documentElement;
    root.classList.add('theme-transitioning');
    applyTheme(next);
    window.setTimeout(() => {
      root.classList.remove('theme-transitioning');
    }, 500);
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
