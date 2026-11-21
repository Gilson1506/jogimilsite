import { useCallback } from 'react';
import * as THREE from 'three';
import { BaseScene3D, BaseSceneContext } from './three/BaseScene3D';

export type Page3DVariant =
  | 'servicos'
  | 'portfolio'
  | 'produtos'
  | 'blog'
  | 'noticias'
  | 'sobre'
  | 'parceiros'
  | 'contacto'
  | 'privacidade'
  | string;

interface PageScene3DProps {
  page: Page3DVariant;
  positioning?: 'fixed' | 'absolute';
}

/**
 * Variações modulares de cena 3D por objetivo de página.
 * Utiliza InstancedMesh e geometrias low-poly para manter draw calls mínimos a 60fps.
 */
export function PageScene3D({ page, positioning = 'fixed' }: PageScene3DProps) {
  const variant = page === 'noticias' ? 'blog' : page;

  const buildScene = useCallback(
    (ctx: BaseSceneContext) => {
      const { root, palette, registerDisposable, onUpdate, onThemeSync } = ctx;

      const primaryMat = new THREE.MeshBasicMaterial({
        color: palette.primaryHex,
        wireframe: true,
        transparent: true,
        opacity: palette.isDark ? 0.25 : 0.22,
      });
      const accentMat = new THREE.MeshBasicMaterial({
        color: palette.accentHex,
        wireframe: true,
        transparent: true,
        opacity: palette.isDark ? 0.17 : 0.16,
      });
      const pointsMat = new THREE.PointsMaterial({
        color: palette.particleHex,
        size: 0.055,
        transparent: true,
        opacity: palette.isDark ? 0.65 : 0.55,
        depthWrite: false,
      });
      registerDisposable(primaryMat, accentMat, pointsMat);

      onThemeSync((next) => {
        primaryMat.color.setHex(next.primaryHex);
        primaryMat.opacity = next.isDark ? 0.25 : 0.22;
        accentMat.color.setHex(next.accentHex);
        accentMat.opacity = next.isDark ? 0.17 : 0.16;
        pointsMat.color.setHex(next.particleHex);
        pointsMat.opacity = next.isDark ? 0.65 : 0.55;
      });

      if (variant === 'servicos') {
        // Engenharia & Arquitetura: Icosaedro low-poly + anéis orbitais
        const coreGeo = new THREE.IcosahedronGeometry(2.55, 1);
        const core = new THREE.Mesh(coreGeo, primaryMat);
        core.position.set(2.8, 0.2, -1);
        root.add(core);

        const ringGeo = new THREE.TorusGeometry(3.75, 0.025, 8, 64);
        const ring1 = new THREE.Mesh(ringGeo, accentMat);
        ring1.position.copy(core.position);
        ring1.rotation.x = Math.PI * 0.36;
        const ring2 = new THREE.Mesh(ringGeo, accentMat);
        ring2.position.copy(core.position);
        ring2.rotation.y = Math.PI * 0.32;
        root.add(ring1, ring2);
        registerDisposable(coreGeo, ringGeo);

        onUpdate((t, scroll) => {
          core.rotation.y = t * 0.22 + scroll * 1.4;
          core.rotation.x = t * 0.12;
          ring1.rotation.z = t * 0.18 + scroll * 0.8;
          ring2.rotation.x = Math.PI * 0.4 + Math.sin(t * 0.3) * 0.2;
        });
      } else if (variant === 'portfolio') {
        // Portfólio: Onda paramétrica low-poly reativa ao scroll
        const planeGeo = new THREE.PlaneGeometry(16, 9, 36, 20);
        const wave = new THREE.Mesh(planeGeo, primaryMat);
        wave.rotation.x = -Math.PI * 0.36;
        wave.position.set(0, -1.6, -2);
        root.add(wave);
        registerDisposable(planeGeo);

        const pos = planeGeo.attributes.position as THREE.BufferAttribute;
        onUpdate((t, scroll) => {
          const amp = 0.38 + scroll * 0.24;
          for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            pos.setZ(i, Math.sin(x * 0.55 + t * 0.9) * amp + Math.cos(y * 0.7 + t * 0.7) * 0.28);
          }
          pos.needsUpdate = true;
        });
      } else if (variant === 'produtos') {
        // Produtos: Matriz de cubos com InstancedMesh (1 único draw call!)
        const boxGeo = new THREE.BoxGeometry(1.05, 1.05, 1.05);
        const count = 9;
        const instanced = new THREE.InstancedMesh(boxGeo, primaryMat, count);
        root.add(instanced);
        registerDisposable(boxGeo);

        const dummy = new THREE.Object3D();
        onUpdate((t, scroll) => {
          for (let i = 0; i < count; i++) {
            const col = (i % 3) - 1;
            const row = Math.floor(i / 3) - 1;
            const phase = i * 0.65;
            dummy.position.set(2.6 + col * 1.85, row * 1.7 + Math.sin(t * 0.8 + phase) * 0.24, -1.5 - (i % 3) * 0.55);
            dummy.rotation.set(t * 0.26 + phase + scroll, t * 0.34 + phase, 0);
            dummy.updateMatrix();
            instanced.setMatrixAt(i, dummy.matrix);
          }
          instanced.instanceMatrix.needsUpdate = true;
        });
      } else if (variant === 'blog') {
        // Blog: TorusKnot + constelação editorial
        const knotGeo = new THREE.TorusKnotGeometry(1.85, 0.3, 72, 10, 2, 3);
        const knot = new THREE.Mesh(knotGeo, accentMat);
        knot.position.set(3.1, 0.25, -2.4);
        root.add(knot);
        registerDisposable(knotGeo);

        onUpdate((t, scroll) => {
          knot.rotation.y = t * 0.18 + scroll * 1.2;
          knot.rotation.x = t * 0.11;
        });
      } else if (variant === 'sobre') {
        // Sobre Nós: Globo meridiano low-poly + anel equatorial
        const globeGeo = new THREE.SphereGeometry(2.85, 22, 16);
        const globe = new THREE.Mesh(globeGeo, primaryMat);
        globe.position.set(2.9, 0.1, -1.4);
        const eqGeo = new THREE.TorusGeometry(3.55, 0.02, 8, 64);
        const eq = new THREE.Mesh(eqGeo, accentMat);
        eq.position.copy(globe.position);
        eq.rotation.x = Math.PI * 0.42;
        root.add(globe, eq);
        registerDisposable(globeGeo, eqGeo);

        onUpdate((t, scroll) => {
          globe.rotation.y = t * 0.16 + scroll * 1.5;
          eq.rotation.z = -t * 0.14;
        });
      } else if (variant === 'parceiros') {
        // Parceiros: Anéis interligados
        const tGeo = new THREE.TorusGeometry(2.15, 0.38, 12, 48);
        const a = new THREE.Mesh(tGeo, primaryMat);
        a.position.set(2.1, 0.2, -1.5);
        const b = new THREE.Mesh(tGeo, accentMat);
        b.position.set(3.8, -0.2, -1.5);
        b.rotation.x = Math.PI / 2;
        root.add(a, b);
        registerDisposable(tGeo);

        onUpdate((t, scroll) => {
          a.rotation.y = t * 0.22 + scroll;
          a.rotation.x = Math.sin(t * 0.35) * 0.3;
          b.rotation.y = -t * 0.2;
          b.rotation.z = t * 0.15;
        });
      } else if (variant === 'contacto') {
        // Contacto: Anéis concêntricos de sinal com InstancedMesh (1 draw call)
        const rGeo = new THREE.TorusGeometry(1, 0.018, 8, 56);
        const ringCount = 5;
        const rings = new THREE.InstancedMesh(rGeo, primaryMat, ringCount);
        root.add(rings);
        registerDisposable(rGeo);

        const dummy = new THREE.Object3D();
        onUpdate((t, scroll) => {
          for (let i = 0; i < ringCount; i++) {
            const baseScale = 1.1 + i * 0.85;
            const pulse = 1 + Math.sin(t * 1.1 - i * 0.55) * 0.06;
            dummy.position.set(2.8, 0.1, -1.8);
            dummy.rotation.set(Math.PI * 0.3, 0, t * (i % 2 === 0 ? 0.12 : -0.1) + scroll * 0.6);
            dummy.scale.set(baseScale * pulse, baseScale * pulse, 1);
            dummy.updateMatrix();
            rings.setMatrixAt(i, dummy.matrix);
          }
          rings.instanceMatrix.needsUpdate = true;
        });
      } else {
        // Privacidade / Padrão: Octaedro cristalino
        const octGeo = new THREE.OctahedronGeometry(2.65, 1);
        const oct = new THREE.Mesh(octGeo, primaryMat);
        oct.position.set(2.8, 0.1, -1.5);
        root.add(oct);
        registerDisposable(octGeo);

        onUpdate((t, scroll) => {
          oct.rotation.y = t * 0.2 + scroll * 1.2;
          oct.rotation.z = Math.sin(t * 0.3) * 0.2;
        });
      }

      // Campo leve de partículas em sintonia com o Hero (ParticleLogo)
      const starCount = 100;
      const starPos = new Float32Array(starCount * 3);
      for (let i = 0; i < starCount; i++) {
        starPos[i * 3] = (Math.random() - 0.5) * 18;
        starPos[i * 3 + 1] = (Math.random() - 0.5) * 11;
        starPos[i * 3 + 2] = -2 - Math.random() * 6;
      }
      const starGeo = new THREE.BufferGeometry();
      starGeo.setAttribute('position', new THREE.BufferAttribute(starPos, 3));
      const stars = new THREE.Points(starGeo, pointsMat);
      root.add(stars);
      registerDisposable(starGeo);

      onUpdate((t) => {
        stars.rotation.y = t * 0.02;
      });
    },
    [variant]
  );

  return <BaseScene3D sceneKey={variant} buildScene={buildScene} positioning={positioning} />;
}
