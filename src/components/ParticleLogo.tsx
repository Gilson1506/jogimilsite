import { useEffect, useRef } from 'react';
import * as THREE from 'three';

const WORDS = ['JOGIMIL', 'AI-FIRST', 'TECNOLOGIAS'];
const HOLD = 3.2; // segundos parado em cada palavra
const MORPH = 2.0; // duração da transição
const SPREAD = 0.5; // fracção da transição usada no atraso em varredura

/**
 * Logótipo 3D em partículas 100% responsivo para mobile e desktop.
 * - Calcula a posição da câmara (Z e Y) dinamicamente para que palavras longas como "TECNOLOGIAS"
 *   nunca sejam cortadas nas bordas em telemóveis.
 * - Suporta rotação orgânica contínua (idle floating) e gestos de toque em mobile.
 * - Modo Claro & Escuro com partículas nítidas e contrastadas.
 */
export default function ParticleLogo() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = host.current!;
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, 2.0);
    // Passo de amostragem: mais denso para maior corpo visual
    const step = isMobile ? 3 : 3;

    // 1) Textura esférica circular anti-aliasing de alta definição
    const particleTexture = (() => {
      const cv = document.createElement('canvas');
      cv.width = 64;
      cv.height = 64;
      const ctx = cv.getContext('2d')!;
      const grad = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
      grad.addColorStop(0, 'rgba(255,255,255,1)');
      grad.addColorStop(0.65, 'rgba(255,255,255,0.95)');
      grad.addColorStop(0.85, 'rgba(255,255,255,0.35)');
      grad.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 64);
      const tex = new THREE.CanvasTexture(cv);
      tex.generateMipmaps = false;
      tex.minFilter = THREE.LinearFilter;
      return tex;
    })();

    // 2) Amostrar os pixels de cada palavra com tipografia perfeitamente ajustada
    const W = 900, H = 260, UNIT = 60;
    const c = document.createElement('canvas');
    c.width = W; c.height = H;
    const g = c.getContext('2d', { willReadFrequently: true })!;
    const sample = (word: string) => {
      g.clearRect(0, 0, W, H);
      g.fillStyle = '#fff';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let size = 200;
      g.font = `800 ${size}px "Space Grotesk Variable", system-ui, sans-serif`;
      const w = g.measureText(word).width;
      if (w > W - 60) {
        size = Math.floor((size * (W - 60)) / w);
        g.font = `800 ${size}px "Space Grotesk Variable", system-ui, sans-serif`;
      }
      g.fillText(word, W / 2, H / 2 + size * 0.04);
      const d = g.getImageData(0, 0, W, H).data;
      const pts: [number, number][] = [];
      for (let y = 0; y < H; y += step)
        for (let x = 0; x < W; x += step)
          if (d[(y * W + x) * 4 + 3] > 80) pts.push([(x - W / 2) / UNIT, -(y - H / 2) / UNIT]);
      return pts;
    };
    const sets = WORDS.map(sample);
    const N = Math.max(...sets.map((s) => s.length));
    
    // Cada palavra recebe N alvos ordenados por x para transição fluida
    const targets = sets.map((s) => {
      const out: [number, number][] = [];
      for (let i = 0; i < N; i++) out.push(i < s.length ? s[i] : s[(Math.random() * s.length) | 0]);
      return out.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    });

    const order = new Float32Array(N);
    for (let i = 0; i < N; i++) order[i] = Math.min(1, Math.max(0, (targets[0][i][0] + W / 2 / UNIT) / (W / UNIT)));

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    cam.position.z = 13;
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(dpr);
    el.appendChild(renderer.domElement);

    const pos = new Float32Array(N * 3);
    const from = new Float32Array(N * 3);
    const seed = new Float32Array(N);
    const col = new Float32Array(N * 3);

    for (let i = 0; i < N; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 32;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 20;
      from.set([pos[i * 3], pos[i * 3 + 1], pos[i * 3 + 2]], i * 3);
      seed[i] = Math.random();
    }

    const geo = new THREE.BufferGeometry();
    const colAttr = new THREE.BufferAttribute(col, 3);
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color', colAttr);

    const mat = new THREE.PointsMaterial({
      size: 0.16,
      map: particleTexture,
      vertexColors: true,
      transparent: true,
      opacity: 1.0,
      alphaTest: 0.02,
      depthWrite: false,
    });
    const pts = new THREE.Points(geo, mat);
    scene.add(pts);

    // Ajuste responsivo de cor e tamanho de partícula com base no tema e distância Z
    const updateColors = () => {
      const isLight = document.documentElement.getAttribute('data-theme') === 'light';
      const cPrimary = new THREE.Color(isLight ? '#0052ff' : '#2f80ff');
      const cSecondary = new THREE.Color(isLight ? '#000000' : '#ffffff');
      const cAi = new THREE.Color(isLight ? '#0070f3' : '#38bdf8');
      
      for (let i = 0; i < N; i++) {
        const k = seed[i] < 0.12 ? cAi : seed[i] < 0.38 ? cPrimary : cSecondary;
        col[i * 3] = k.r;
        col[i * 3 + 1] = k.g;
        col[i * 3 + 2] = k.b;
      }
      colAttr.needsUpdate = true;

      // Escala do tamanho das partículas proporcional à distância Z da câmara para consistência em mobile
      const zRatio = cam.position.z / 12;
      const base = isLight ? 0.16 : 0.11;
      mat.size = base * Math.max(1, zRatio * 0.95);
      mat.opacity = 1.0;
      mat.needsUpdate = true;
    };

    // 3) Redimensionamento Responsivo Preciso (Mobile Portrait & Desktop)
    const resize = () => {
      const w = el.clientWidth || window.innerWidth;
      const h = el.clientHeight || window.innerHeight;
      renderer.setSize(w, h);
      cam.aspect = w / h;

      // Largura 3D das letras com margem de segurança para nunca cortar em telemóveis
      const halfFovRad = (cam.fov / 2) * (Math.PI / 180);
      const tanHalfFov = Math.tan(halfFovRad);

      // Largura alvo em unidades 3D da palavra mais longa (aprox 15 unidades + margem de 10% nas bordas)
      const targetWidth3D = window.innerWidth < 640 ? 16.8 : window.innerWidth < 1024 ? 15.5 : 14.5;
      const zForWidth = targetWidth3D / (2 * tanHalfFov * cam.aspect);
      const targetHeight3D = window.innerWidth < 640 ? 7.0 : 6.0;
      const zForHeight = targetHeight3D / (2 * tanHalfFov);

      cam.position.z = Math.max(zForWidth, zForHeight, 11);
      // No mobile, elevar ligeiramente para harmonizar com os títulos do Hero
      cam.position.y = window.innerWidth < 640 ? 0.6 : 0;
      cam.updateProjectionMatrix();

      updateColors();
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    const themeObserver = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.attributeName === 'data-theme') {
          updateColors();
          break;
        }
      }
    });
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
    window.addEventListener('themechange', updateColors);

    // 4) Interatividade: Rato e Toque Mobile
    const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        mouse.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
        mouse.ty = -(((e.clientY - r.top) / r.height) * 2 - 1);
      }
    };
    addEventListener('pointermove', onMove, { passive: true });

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        const t = e.touches[0];
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          mouse.tx = ((t.clientX - r.left) / r.width) * 2 - 1;
          mouse.ty = -(((t.clientY - r.top) / r.height) * 2 - 1);
        }
      }
    };
    window.addEventListener('touchmove', onTouchMove, { passive: true });

    let visible = true, tabOn = true, raf = 0;
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0 });
    io.observe(el);
    const vis = () => { tabOn = !document.hidden; };
    document.addEventListener('visibilitychange', vis);

    let clock = 0, last = performance.now();
    let cur = 0;
    let phase: 'morph' | 'hold' = 'morph';
    let phaseT = 0;
    let first = true;
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    const v = new THREE.Vector3();

    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min(0.05, (now - last) / 1000);
      last = now;
      if (!visible || !tabOn) return;
      clock += dt;
      phaseT += dt;

      const dur = first ? 2.4 : MORPH;
      if (phase === 'morph' && phaseT >= dur + SPREAD * dur) {
        phase = 'hold'; phaseT = 0; first = false;
      } else if (phase === 'hold' && phaseT >= HOLD) {
        from.set(pos);
        cur = (cur + 1) % WORDS.length;
        for (let i = 0; i < N; i++) order[i] = Math.min(1, Math.max(0, (pos[i * 3] + W / 2 / UNIT) / (W / UNIT)));
        phase = 'morph'; phaseT = 0;
      }

      mouse.x += (mouse.tx - mouse.x) * 0.06;
      mouse.y += (mouse.ty - mouse.y) * 0.06;
      v.set(mouse.x, mouse.y, 0.5).unproject(cam).sub(cam.position).normalize();
      const dd = -cam.position.z / (v.z || 1);
      const mx = cam.position.x + v.x * dd, my = cam.position.y + v.y * dd;

      const tg = targets[cur];
      const morphing = phase === 'morph';
      let fade = 1;
      const isNarrow = window.innerWidth < 768;
      const burstScale = isNarrow ? 0.7 : 1.0;

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        let tx = tg[i][0], ty = tg[i][1], tz = 0;
        let x: number, y: number, z: number;
        if (morphing) {
          const delay = order[i] * SPREAD * dur;
          const t = Math.min(1, Math.max(0, (phaseT - delay) / dur));
          const e = ease(t);
          const arc = first ? 0 : Math.sin(Math.PI * t);
          const a = seed[i] * 6.283 + clock * 0.7;
          
          // Efeito de dispersão volumétrica ajustado para não fugir do ecrã em mobile
          const upBias = seed[i] > 0.3 ? 1.0 : -0.25;
          const burstY = first ? 0 : (Math.abs(Math.sin(a)) * upBias * (3.5 + seed[i] * 3.2) * burstScale) * arc;
          const burstX = first ? 0 : (Math.cos(a) * arc * (2.2 + seed[i] * 2.5) * burstScale);
          const burstZ = first ? 0 : (Math.sin(a * 1.4) * arc * (2.4 + seed[i] * 2.2) * burstScale);

          x = from[i3] + (tx - from[i3]) * e + burstX;
          y = from[i3 + 1] + (ty - from[i3 + 1]) * e + burstY;
          z = from[i3 + 2] * (1 - e) + burstZ;
        } else {
          tz = Math.sin(clock * 0.8 + i) * 0.04;
          const dx = tx - mx, dy = ty - my, dist = Math.hypot(dx, dy);
          if (dist < 1.4) {
            const f = (1.4 - dist) / 1.4;
            tx += (dx / (dist || 1)) * f * 0.9;
            ty += (dy / (dist || 1)) * f * 0.9;
          }
          x = pos[i3] + (tx - pos[i3]) * 0.14;
          y = pos[i3 + 1] + (ty - pos[i3 + 1]) * 0.14;
          z = pos[i3 + 2] + (tz - pos[i3 + 2]) * 0.14;
        }
        pos[i3] = x; pos[i3 + 1] = y; pos[i3 + 2] = z;
      }

      if (morphing && !first) {
        const p = Math.min(1, phaseT / (dur * (1 + SPREAD)));
        fade = 1 - 0.22 * Math.sin(Math.PI * p);
      }
      mat.opacity = 1.0 * fade;
      geo.attributes.position.needsUpdate = true;

      // Oscilação orgânica contínua (mesmo sem interação directa no telemóvel)
      const idleY = Math.sin(clock * 0.75) * (isNarrow ? 0.09 : 0.05);
      const idleX = Math.cos(clock * 0.55) * (isNarrow ? 0.06 : 0.04);
      pts.rotation.y = mouse.x * 0.18 + idleY;
      pts.rotation.x = -mouse.y * 0.1 + idleX;

      renderer.render(scene, cam);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove);
      window.removeEventListener('touchmove', onTouchMove);
      document.removeEventListener('visibilitychange', vis);
      themeObserver.disconnect();
      window.removeEventListener('themechange', updateColors);
      io.disconnect(); ro.disconnect();
      geo.dispose(); mat.dispose(); particleTexture.dispose(); renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="absolute inset-0" aria-hidden="true" />;
}
