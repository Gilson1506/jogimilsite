import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { lowEnd, useReducedMotion } from '../../lib/hooks';

export interface SceneThemePalette {
  isDark: boolean;
  primaryHex: number;
  accentHex: number;
  particleHex: number;
}

export interface BaseSceneContext {
  scene: THREE.Scene;
  root: THREE.Group;
  palette: SceneThemePalette;
  registerDisposable: (...items: Array<{ dispose: () => void }>) => void;
  onUpdate: (fn: (t: number, scrollRatio: number) => void) => void;
  onThemeSync: (fn: (palette: SceneThemePalette) => void) => void;
}

interface BaseScene3DProps {
  sceneKey: string;
  buildScene: (ctx: BaseSceneContext) => void;
  className?: string;
  positioning?: 'fixed' | 'absolute';
}

function readPalette(): SceneThemePalette {
  const isDark = (document.documentElement.getAttribute('data-theme') || 'dark') === 'dark';
  return {
    isDark,
    primaryHex: isDark ? 0x0066ff : 0x0052cc,
    accentHex: isDark ? 0x38bdf8 : 0x0284c7,
    particleHex: isDark ? 0x60a5fa : 0x0066ff,
  };
}

/**
 * Componente base reutilizável WebGL (Three.js) de alta performance (60fps):
 * - DPR limitado a [1, 1.5] para GPUs móveis
 * - Pausa automática via IntersectionObserver e document.hidden
 * - Reatividade suave (lerp) ao cursor e ao scroll
 * - Adaptação instantânea ao tema Light / Dark
 * - Dispose rigoroso na desmontagem
 */
export function BaseScene3D({ sceneKey, buildScene, className = '', positioning = 'fixed' }: BaseScene3DProps) {
  const hostRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [readyToMount, setReadyToMount] = useState(() => positioning === 'fixed');

  // Adia a criação do contexto WebGL em secções fora do viewport inicial (evita múltiplos WebGLRenderers no mount da Home)
  useEffect(() => {
    if (readyToMount || reduced || lowEnd()) return;
    const host = hostRef.current;
    if (!host) return;
    if (!('IntersectionObserver' in window)) {
      setReadyToMount(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setReadyToMount(true);
          observer.disconnect();
        }
      },
      { rootMargin: '350px 350px 350px 350px', threshold: 0.01 }
    );
    observer.observe(host);
    return () => observer.disconnect();
  }, [readyToMount, reduced]);

  useEffect(() => {
    if (!readyToMount || reduced || lowEnd()) return;
    const host = hostRef.current;
    if (!host) return;

    const width = host.clientWidth || window.innerWidth;
    const height = host.clientHeight || window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(48, width / height, 0.1, 100);
    camera.position.set(0, 0.35, 9.2);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5));
    renderer.setSize(width, height);
    renderer.setClearColor(0x000000, 0);
    host.appendChild(renderer.domElement);

    const root = new THREE.Group();
    scene.add(root);

    const disposables: Array<{ dispose: () => void }> = [];
    const updaters: Array<(t: number, scrollRatio: number) => void> = [];
    const themeSyncers: Array<(palette: SceneThemePalette) => void> = [];

    const initialPalette = readPalette();
    buildScene({
      scene,
      root,
      palette: initialPalette,
      registerDisposable: (...items) => disposables.push(...items),
      onUpdate: (fn) => updaters.push(fn),
      onThemeSync: (fn) => themeSyncers.push(fn),
    });

    // Estado de pausa inteligente (aba inativa ou canvas fora de vista)
    let isVisible = true;
    let isTabActive = !document.hidden;
    let rafId = 0;

    // Cursor + Scroll lerp
    let targetX = 0;
    let targetY = 0;
    let scrollTarget = 0;
    let scrollCurrent = 0;

    const onMouseMove = (e: MouseEvent) => {
      targetX = (e.clientX / window.innerWidth - 0.5) * 0.72;
      targetY = -(e.clientY / window.innerHeight - 0.5) * 0.5;
    };

    const onScroll = () => {
      const max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      scrollTarget = Math.min(1, Math.max(0, window.scrollY / max));
    };

    const onResize = () => {
      if (!host) return;
      const w = host.clientWidth || window.innerWidth;
      const h = host.clientHeight || window.innerHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setPixelRatio(Math.min(Math.max(window.devicePixelRatio || 1, 1), 1.5));
      renderer.setSize(w, h);
    };

    const onThemeChange = () => {
      const nextPalette = readPalette();
      themeSyncers.forEach((fn) => fn(nextPalette));
    };

    const start = performance.now();
    const tick = (now: number) => {
      if (!isVisible || !isTabActive) {
        rafId = 0;
        return;
      }
      rafId = requestAnimationFrame(tick);
      const t = (now - start) * 0.001;
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.06;
      root.position.x += (targetX - root.position.x) * 0.045;
      root.position.y += (targetY - scrollCurrent * 0.65 - root.position.y) * 0.045;

      for (let i = 0; i < updaters.length; i++) {
        updaters[i](t, scrollCurrent);
      }
      renderer.render(scene, camera);
    };

    const ensureLoop = () => {
      if (!rafId && isVisible && isTabActive) {
        rafId = requestAnimationFrame(tick);
      }
    };

    const onVisibilityChange = () => {
      isTabActive = !document.hidden;
      if (isTabActive) ensureLoop();
    };

    let io: IntersectionObserver | null = null;
    if ('IntersectionObserver' in window) {
      io = new IntersectionObserver(
        ([entry]) => {
          isVisible = Boolean(entry?.isIntersecting);
          if (isVisible) ensureLoop();
        },
        { threshold: 0.01 }
      );
      io.observe(host);
    }

    onScroll();
    window.addEventListener('mousemove', onMouseMove, { passive: true });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    window.addEventListener('themechange', onThemeChange);
    document.addEventListener('visibilitychange', onVisibilityChange);
    ensureLoop();

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      io?.disconnect();
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('themechange', onThemeChange);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      disposables.forEach((d) => d.dispose());
      renderer.dispose();
      if (renderer.domElement.parentNode === host) {
        host.removeChild(renderer.domElement);
      }
    };
  }, [sceneKey, buildScene, reduced, readyToMount]);

  if (reduced) return null;

  return (
    <div
      ref={hostRef}
      aria-hidden="true"
      className={`pointer-events-none ${positioning} inset-0 z-0 overflow-hidden opacity-90 transition-opacity duration-700 ${className}`}
    />
  );
}
