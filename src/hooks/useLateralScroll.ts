import { RefObject, useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

interface UseLateralScrollOptions {
  stageRef: RefObject<HTMLDivElement>;
  trackRef: RefObject<HTMLDivElement>;
  panelCount?: number;
  reducedMotion?: boolean;
}

/**
 * Hook de Scroll Lateral Sincronizado (GSAP + ScrollTrigger + matchMedia):
 * - Em Desktop (>= 768px): fixa (pin) o palco das 3 primeiras secções e move o eixo X
 *   exclusivamente via GPU (xPercent / translate3d) com scrub suave.
 * - Em Mobile (< 768px) ou prefers-reduced-motion: libera scroll vertical nativo sem bloqueio de toque.
 * - Cleanup garantido via gsap.matchMedia().revert() e ScrollTrigger.kill().
 */
export function useLateralScroll({
  stageRef,
  trackRef,
  panelCount = 3,
  reducedMotion = false,
}: UseLateralScrollOptions) {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' ? window.innerWidth >= 768 : true
  );
  const [lateralActive, setLateralActive] = useState<number | null>(0);
  const [triggerInstance, setTriggerInstance] = useState<ScrollTrigger | null>(null);
  const lastActiveRef = useRef<number | null>(0);

  const updateActive = (next: number | null) => {
    if (lastActiveRef.current !== next) {
      lastActiveRef.current = next;
      setLateralActive(next);
    }
  };

  useEffect(() => {
    const stageEl = stageRef.current;
    const trackEl = trackRef.current;
    if (!stageEl || !trackEl) return;

    if (reducedMotion) {
      setIsDesktop(false);
      updateActive(null);
      return;
    }

    const mm = gsap.matchMedia();

    mm.add('(min-width: 768px)', () => {
      setIsDesktop(true);
      const panels = gsap.utils.toArray<HTMLElement>(trackEl.children);

      const applyPanelDepth = (p: number) => {
        panels.forEach((panel, idx) => {
          const dist = Math.abs(p - idx);
          const opacity = Math.max(0.88, 1 - dist * 0.12);
          const scale = Math.max(0.97, 1 - dist * 0.03);
          panel.style.opacity = String(opacity);
          panel.style.transform = `translate3d(0,0,0) scale(${scale})`;
        });
      };

      applyPanelDepth(0);

      const tween = gsap.to(trackEl, {
        xPercent: -((panelCount - 1) / panelCount) * 100,
        ease: 'none',
        force3D: true,
        scrollTrigger: {
          trigger: stageEl,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          end: () => `+=${Math.round(window.innerHeight * (panelCount - 0.35))}`,
          onUpdate: (self) => {
            const p = self.progress * (panelCount - 1);
            if (self.progress >= 0.995) {
              updateActive(null);
            } else {
              updateActive(Math.min(panelCount - 1, Math.round(p)));
            }
            applyPanelDepth(p);
          },
          onLeave: () => updateActive(null),
          onEnterBack: () => updateActive(panelCount - 1),
        },
      });

      const st = tween.scrollTrigger || null;
      setTriggerInstance(st);

      return () => {
        st?.kill();
        tween.kill();
        setTriggerInstance(null);
        panels.forEach((panel) => {
          panel.style.opacity = '';
          panel.style.transform = '';
        });
      };
    });

    mm.add('(max-width: 767px)', () => {
      setIsDesktop(false);
      updateActive(null);
      gsap.set(trackEl, { clearProps: 'transform' });
    });

    return () => {
      mm.revert();
    };
  }, [stageRef, trackRef, panelCount, reducedMotion]);

  const jumpToPanel = (idx: number, fallbackIds: string[]) => {
    if (!isDesktop || reducedMotion || !triggerInstance) {
      const targetId = fallbackIds[idx];
      if (targetId) {
        document.getElementById(targetId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
      return;
    }

    const start = triggerInstance.start;
    const end = triggerInstance.end;
    const ratio = panelCount > 1 ? idx / (panelCount - 1) : 0;
    const y = start + ratio * (end - start);
    window.scrollTo({ top: y, behavior: 'smooth' });
  };

  return {
    isDesktop: isDesktop && !reducedMotion,
    lateralActive,
    jumpToPanel,
  };
}
