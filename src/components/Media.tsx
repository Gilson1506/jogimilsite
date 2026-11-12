import { useEffect, useRef, useState } from 'react';
import { Icon } from './ui';

/** Imagem com carregamento preguiçoso, versão leve (srcSet se existir) e placeholder. */
export function Img({ src, alt, className = '', ratio = '16/10' }: { src: string; alt: string; className?: string; ratio?: string }) {
  const [ok, setOk] = useState(false);
  const small = src.replace(/(\.\w+)$/, '-480$1'); // versão leve opcional: nome-480.webp
  return (
    <div className={`relative overflow-hidden bg-line ${className}`} style={{ aspectRatio: ratio }}>
      <img
        src={src}
        srcSet={`${small} 480w, ${src} 1200w`}
        sizes="(max-width: 640px) 90vw, 600px"
        alt={alt} loading="lazy" decoding="async"
        onLoad={() => setOk(true)}
        className={`h-full w-full object-cover transition-opacity duration-500 ${ok ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

/** Galeria em ecrã inteiro que se passa com o dedo. */
export function Lightbox({ images, start, onClose }: { images: string[]; start: number; onClose: () => void }) {
  const [i, setI] = useState(start);
  const x0 = useRef<number | null>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const go = (d: number) => setI((v) => (v + d + images.length) % images.length);

  useEffect(() => {
    closeBtn.current?.focus();
    document.body.style.overflow = 'hidden';
    const k = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') go(1);
      if (e.key === 'ArrowLeft') go(-1);
    };
    addEventListener('keydown', k);
    return () => { document.body.style.overflow = ''; removeEventListener('keydown', k); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div role="dialog" aria-modal="true" aria-label="Galeria de imagens" className="fixed inset-0 z-[80] flex flex-col bg-black/95 text-white">
      <div className="flex items-center justify-between p-4">
        <p className="text-sm" aria-live="polite">{i + 1} / {images.length}</p>
        <button ref={closeBtn} onClick={onClose} className="inline-flex h-11 w-11 items-center justify-center rounded-full hover:bg-white/10" aria-label="Fechar galeria"><Icon n="close" /></button>
      </div>
      <div
        className="relative flex flex-1 items-center justify-center overflow-hidden px-2 touch-pan-y"
        onPointerDown={(e) => { x0.current = e.clientX; }}
        onPointerUp={(e) => { if (x0.current !== null) { const d = e.clientX - x0.current; if (Math.abs(d) > 50) go(d < 0 ? 1 : -1); } x0.current = null; }}
      >
        <img src={images[i]} alt={`Imagem ${i + 1} de ${images.length}`} className="max-h-full max-w-full select-none object-contain" draggable={false} />
        {images.length > 1 && (<>
          <button onClick={() => go(-1)} className="absolute left-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Imagem anterior"><Icon n="arrow" className="h-5 w-5 rotate-180" /></button>
          <button onClick={() => go(1)} className="absolute right-2 inline-flex h-12 w-12 items-center justify-center rounded-full bg-white/10 hover:bg-white/20" aria-label="Imagem seguinte"><Icon n="arrow" className="h-5 w-5" /></button>
        </>)}
      </div>
    </div>
  );
}

/** Comparação "antes e depois" com cursor deslizante (rato, toque e teclado). */
export function BeforeAfter({ before, after }: { before: string; after: string }) {
  const [p, setP] = useState(50);
  const box = useRef<HTMLDivElement>(null);
  const set = (cx: number) => {
    const r = box.current!.getBoundingClientRect();
    setP(Math.max(0, Math.min(100, ((cx - r.left) / r.width) * 100)));
  };
  return (
    <div
      ref={box}
      className="relative aspect-[16/10] w-full select-none overflow-hidden rounded-xl2 touch-pan-y"
      onPointerDown={(e) => { (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); set(e.clientX); }}
      onPointerMove={(e) => { if (e.buttons || e.pointerType === 'touch') set(e.clientX); }}
    >
      <img src={after} alt="Depois" loading="lazy" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img src={before} alt="Antes" loading="lazy" className="absolute inset-0 h-full w-full object-cover" style={{ clipPath: `inset(0 ${100 - p}% 0 0)` }} draggable={false} />
      <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Antes</span>
      <span className="absolute right-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-semibold text-white">Depois</span>
      <div className="absolute inset-y-0 w-0.5 bg-white" style={{ left: `${p}%` }}>
        <button
          role="slider" aria-label="Comparar antes e depois" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(p)}
          onKeyDown={(e) => { if (e.key === 'ArrowLeft') setP(Math.max(0, p - 5)); if (e.key === 'ArrowRight') setP(Math.min(100, p + 5)); }}
          className="absolute left-1/2 top-1/2 inline-flex h-11 w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-black shadow-lg"
        ><span aria-hidden="true">↔</span></button>
      </div>
    </div>
  );
}
