import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import PothosPage from './PothosPage';

// Import your 4 local founder photos directly from src/assets/
import ericPhoto from './assets/image.png';
import altrinPhoto from './assets/image_2026-10-22_150000817.png';
import visnuPhoto from './assets/28d10c82-49c6-429c-8238-21f0fe62396d.jpg';
import rishabPhoto from './assets/1789476840087.jpg';

// Native Vite asset URL resolver for your .glb file
const burjModelUrl = new URL(
  './assets/free__burj_khalifa_dubai.glb',
  import.meta.url
).href;

/* ==========================================================================
   0. FONT & TAILWIND AUTO-LOADER + SYSTEM-AWARE THEME ENGINE
   ========================================================================== */
function useSystemTheme() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('chedy-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      if (!localStorage.getItem('chedy-theme-manual')) {
        setIsDark(e.matches);
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  const toggleTheme = () => {
    setIsDark((prev) => {
      const next = !prev;
      localStorage.setItem('chedy-theme', next ? 'dark' : 'light');
      localStorage.setItem('chedy-theme-manual', 'true');
      return next;
    });
  };

  useEffect(() => {
    if (!document.getElementById('chedy-fonts')) {
      const link = document.createElement('link');
      link.id = 'chedy-fonts';
      link.rel = 'stylesheet';
      link.href =
        'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=JetBrains+Mono:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap';
      document.head.appendChild(link);
    }

    const testEl = document.createElement('div');
    testEl.className = 'hidden';
    document.body.appendChild(testEl);
    const hasTailwind = window.getComputedStyle(testEl).display === 'none';
    document.body.removeChild(testEl);

    if (!hasTailwind && !document.getElementById('tailwind-cdn')) {
      const script = document.createElement('script');
      script.id = 'tailwind-cdn';
      script.src = 'https://cdn.tailwindcss.com';
      document.head.appendChild(script);
    }
  }, []);

  return { isDark, toggleTheme };
}

/* ==========================================================================
   1. TRANSLUCENT BACKGROUND BOTANICAL CANVAS
   - Desktop (Mouse): Continuous vine, leaf & flower cursor trail + click bloom
   - Mobile (Touch): NO trail & NO spawning while scrolling; blooms only on tap!
   ========================================================================== */
function MouseGrassTrail({ isDark }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    let width = window.innerWidth;
    let height = window.innerHeight;

    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener('resize', resize);

    const vineNodes = [];
    const leaves = [];
    const tendrils = [];
    const flowers = [];
    const spores = [];

    let lastMouse = { x: -999, y: -999 };
    let stepCounter = 0;
    let leafSide = 1;

    const touchState = {
      startX: 0,
      startY: 0,
      startTime: 0,
      moved: false,
      targetIsInteractive: false,
    };

    const getPalette = () =>
      isDark
        ? {
            vineMain: '#10b981',
            vineCore: '#6ee7b7',
            leafPairs: [
              { dark: '#047857', light: '#34d399', vein: '#a7f3d0' },
              { dark: '#065f46', light: '#10b981', vein: '#6ee7b7' },
              { dark: '#14532d', light: '#4ade80', vein: '#bbf7d0' },
            ],
            tendril: '#34d399',
            flowerPetal: '#ecfdf5',
            flowerInner: '#34d399',
            flowerCore: '#fbbf24',
            spore: '#6ee7b7',
          }
        : {
            vineMain: '#065f46',
            vineCore: '#10b981',
            leafPairs: [
              { dark: '#022c22', light: '#059669', vein: '#6ee7b7' },
              { dark: '#064e3b', light: '#10b981', vein: '#a7f3d0' },
              { dark: '#14532d', light: '#16a34a', vein: '#86efac' },
            ],
            tendril: '#047857',
            flowerPetal: '#10b981',
            flowerInner: '#ecfdf5',
            flowerCore: '#f59e0b',
            spore: '#059669',
          };

    const spawnLeaf = (x, y, baseAngle, sizeMultiplier = 1) => {
      const pal = getPalette();
      const pair = pal.leafPairs[Math.floor(Math.random() * pal.leafPairs.length)];
      leaves.push({
        x,
        y,
        angle: baseAngle,
        targetScale: (13 + Math.random() * 12) * sizeMultiplier,
        scale: 0.1,
        scaleVel: 0,
        swayPhase: Math.random() * Math.PI * 2,
        swaySpeed: 0.04 + Math.random() * 0.03,
        life: 1.0,
        decay: 0.008 + Math.random() * 0.005,
        darkCol: pair.dark,
        lightCol: pair.light,
        veinCol: pair.vein,
        bend: (Math.random() - 0.5) * 0.35,
      });
      if (leaves.length > 200) leaves.shift();
    };

    const spawnTendril = (x, y, moveAngle) => {
      const curlDir = Math.random() > 0.5 ? 1 : -1;
      tendrils.push({
        x,
        y,
        angle: moveAngle + curlDir * (0.4 + Math.random() * 0.6),
        curlDir,
        length: 20 + Math.random() * 20,
        progress: 0.02,
        growSpeed: 0.035 + Math.random() * 0.02,
        life: 1.0,
        decay: 0.0085,
        swayPhase: Math.random() * Math.PI * 2,
      });
      if (tendrils.length > 70) tendrils.shift();
    };

    const spawnFlower = (x, y, scaleMultiplier = 1) => {
      flowers.push({
        x: x + (Math.random() - 0.5) * 10,
        y: y + (Math.random() - 0.5) * 10,
        targetRadius: (6.5 + Math.random() * 5) * scaleMultiplier,
        radius: 0.1,
        radVel: 0,
        rot: Math.random() * Math.PI * 2,
        rotSpeed: (Math.random() - 0.5) * 0.015,
        life: 1.0,
        decay: 0.0075 + Math.random() * 0.004,
        petals: 5,
      });
      if (flowers.length > 50) flowers.shift();
    };

    const spawnSpore = (x, y) => {
      spores.push({
        x: x + (Math.random() - 0.5) * 24,
        y: y + (Math.random() - 0.5) * 24,
        vx: (Math.random() - 0.5) * 0.6,
        vy: -0.4 - Math.random() * 0.8,
        size: 1.5 + Math.random() * 2,
        life: 1.0,
        decay: 0.012 + Math.random() * 0.01,
        phase: Math.random() * Math.PI * 2,
      });
      if (spores.length > 90) spores.shift();
    };

    const spawnTapBloomCluster = (cx, cy) => {
      for (let i = 0; i < 8; i++) {
        const angle = (Math.PI * 2 * i) / 8 + (Math.random() - 0.5) * 0.35;
        spawnLeaf(cx, cy, angle, 1.25);
        if (i % 2 === 0) spawnTendril(cx, cy, angle);
      }
      for (let i = 0; i < 3; i++) {
        spawnFlower(
          cx + (Math.random() - 0.5) * 24,
          cy + (Math.random() - 0.5) * 24,
          1.3
        );
      }
      for (let i = 0; i < 8; i++) {
        spawnSpore(cx, cy);
      }
    };

    const addInterpolatedPoint = (x, y, moveAngle) => {
      vineNodes.push({
        x,
        y,
        life: 1.0,
        decay: 0.015,
        width: 3.2 + Math.sin(stepCounter * 0.3) * 0.7,
      });
      if (vineNodes.length > 85) vineNodes.shift();

      stepCounter++;

      if (stepCounter % 2 === 0) {
        leafSide *= -1;
        const branchAngle = moveAngle + leafSide * (0.55 + Math.random() * 0.45);
        spawnLeaf(x, y, branchAngle, 1);

        if (Math.random() < 0.4) {
          spawnLeaf(x, y, moveAngle - leafSide * (0.7 + Math.random() * 0.3), 0.65);
        }
      }

      if (stepCounter % 5 === 0) {
        spawnTendril(x, y, moveAngle);
      }

      if (stepCounter % 9 === 0) {
        spawnFlower(x, y, 1);
      }

      if (Math.random() < 0.4) {
        spawnSpore(x, y);
      }
    };

    const handlePointerMove = (e) => {
      if (e.pointerType !== 'mouse') return;
      const nx = e.clientX;
      const ny = e.clientY;

      if (lastMouse.x === -999) {
        lastMouse = { x: nx, y: ny };
        return;
      }

      const dx = nx - lastMouse.x;
      const dy = ny - lastMouse.y;
      const dist = Math.hypot(dx, dy);

      if (dist > 7) {
        const moveAngle = Math.atan2(dy, dx);
        const steps = Math.min(12, Math.floor(dist / 7));
        for (let s = 1; s <= steps; s++) {
          const ix = lastMouse.x + (dx * s) / steps;
          const iy = lastMouse.y + (dy * s) / steps;
          addInterpolatedPoint(ix, iy, moveAngle);
        }
        lastMouse = { x: nx, y: ny };
      }
    };

    const handlePointerDown = (e) => {
      if (e.pointerType !== 'mouse') return;
      if (e.target.closest('button, a, [data-interactive]')) return;
      spawnTapBloomCluster(e.clientX, e.clientY);
    };

    const handleTouchStart = (e) => {
      if (e.touches.length !== 1) {
        touchState.moved = true;
        return;
      }
      const t = e.touches[0];
      touchState.startX = t.clientX;
      touchState.startY = t.clientY;
      touchState.startTime = Date.now();
      touchState.moved = false;
      touchState.targetIsInteractive = Boolean(
        e.target.closest('button, a, [data-interactive]')
      );
    };

    const handleTouchMove = (e) => {
      if (touchState.moved || !e.touches.length) return;
      const t = e.touches[0];
      if (
        Math.hypot(t.clientX - touchState.startX, t.clientY - touchState.startY) > 10
      ) {
        touchState.moved = true;
      }
    };

    const handleTouchEnd = () => {
      const elapsed = Date.now() - touchState.startTime;
      if (
        !touchState.moved &&
        !touchState.targetIsInteractive &&
        elapsed < 400
      ) {
        spawnTapBloomCluster(touchState.startX, touchState.startY);
      }
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    window.addEventListener('pointerdown', handlePointerDown, { passive: true });
    window.addEventListener('touchstart', handleTouchStart, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    const drawRichLeaf = (l, time) => {
      const s = l.scale * Math.min(1, l.life * 1.5);
      if (s <= 0.5) return;

      const wind = Math.sin(time * l.swaySpeed + l.swayPhase) * 0.14;
      ctx.save();
      ctx.translate(l.x, l.y);
      ctx.rotate(l.angle + wind);
      ctx.globalAlpha = Math.min(1, l.life * 1.15);

      ctx.strokeStyle = l.darkCol;
      ctx.lineWidth = 1.3;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(s * 0.18, 0);
      ctx.stroke();

      ctx.translate(s * 0.15, 0);

      ctx.fillStyle = l.lightCol;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.35, -s * 0.44, s * 0.75, -s * 0.28, s, l.bend * s * 0.2);
      ctx.quadraticCurveTo(s * 0.5, l.bend * s * 0.08, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = l.darkCol;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(s * 0.35, s * 0.44, s * 0.75, s * 0.28, s, l.bend * s * 0.2);
      ctx.quadraticCurveTo(s * 0.5, l.bend * s * 0.08, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = l.veinCol;
      ctx.lineWidth = Math.max(0.55, s * 0.045);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(s * 0.5, l.bend * s * 0.08, s * 0.88, l.bend * s * 0.18);
      ctx.moveTo(s * 0.32, 0);
      ctx.lineTo(s * 0.48, -s * 0.16);
      ctx.moveTo(s * 0.52, 0);
      ctx.lineTo(s * 0.66, s * 0.15);
      ctx.stroke();

      ctx.restore();
    };

    let time = 0;
    const render = () => {
      animId = requestAnimationFrame(render);
      time += 1;
      ctx.clearRect(0, 0, width, height);

      const pal = getPalette();

      if (vineNodes.length > 1) {
        for (let i = vineNodes.length - 1; i >= 0; i--) {
          vineNodes[i].life -= vineNodes[i].decay;
          if (vineNodes[i].life <= 0) {
            vineNodes.splice(i, 1);
          }
        }

        for (let i = 1; i < vineNodes.length; i++) {
          const p0 = vineNodes[i - 1];
          const p1 = vineNodes[i];
          const dist = Math.hypot(p1.x - p0.x, p1.y - p0.y);
          if (dist > 90) continue;

          const alpha = Math.min(1, p1.life * 1.1);
          const w = p1.width * p1.life;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = pal.vineMain;
          ctx.lineWidth = w;
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();

          ctx.strokeStyle = pal.vineCore;
          ctx.lineWidth = w * 0.35;
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
          ctx.lineTo(p1.x, p1.y);
          ctx.stroke();
          ctx.restore();
        }
      }

      for (let i = tendrils.length - 1; i >= 0; i--) {
        const t = tendrils[i];
        if (t.progress < 1) {
          t.progress = Math.min(1, t.progress + t.growSpeed);
        } else {
          t.life -= t.decay;
        }
        if (t.life <= 0) {
          tendrils.splice(i, 1);
          continue;
        }

        const sway = Math.sin(time * 0.04 + t.swayPhase) * 0.1;
        ctx.save();
        ctx.translate(t.x, t.y);
        ctx.rotate(t.angle + sway);
        ctx.globalAlpha = Math.min(1, t.life * 1.1);
        ctx.strokeStyle = pal.tendril;
        ctx.lineWidth = 1.4 * Math.min(1, t.life * 1.3);
        ctx.lineCap = 'round';

        ctx.beginPath();
        ctx.moveTo(0, 0);
        const totalSteps = Math.floor(28 * t.progress);
        let px = 0;
        let py = 0;
        let curAngle = 0;
        for (let s = 1; s <= totalSteps; s++) {
          const ratio = s / 28;
          curAngle += t.curlDir * (ratio * ratio * 0.42);
          const stepLen = (t.length / 28) * (1 - ratio * 0.45);
          px += Math.cos(curAngle) * stepLen;
          py += Math.sin(curAngle) * stepLen;
          ctx.lineTo(px, py);
        }
        ctx.stroke();
        ctx.restore();
      }

      for (let i = leaves.length - 1; i >= 0; i--) {
        const l = leaves[i];
        const force = (l.targetScale - l.scale) * 0.22;
        l.scaleVel = (l.scaleVel + force) * 0.74;
        l.scale += l.scaleVel;

        l.life -= l.decay;
        if (l.life <= 0) {
          leaves.splice(i, 1);
          continue;
        }
        drawRichLeaf(l, time);
      }

      for (let i = flowers.length - 1; i >= 0; i--) {
        const f = flowers[i];
        const force = (f.targetRadius - f.radius) * 0.24;
        f.radVel = (f.radVel + force) * 0.72;
        f.radius += f.radVel;
        f.rot += f.rotSpeed;
        f.life -= f.decay;

        if (f.life <= 0) {
          flowers.splice(i, 1);
          continue;
        }

        const r = Math.max(0.5, f.radius * Math.min(1, f.life * 1.4));
        ctx.save();
        ctx.translate(f.x, f.y);
        ctx.rotate(f.rot);
        ctx.globalAlpha = Math.min(1, f.life * 1.2);

        for (let p = 0; p < f.petals; p++) {
          ctx.rotate((Math.PI * 2) / f.petals);
          ctx.fillStyle = pal.flowerPetal;
          ctx.beginPath();
          ctx.moveTo(0, 0);
          ctx.bezierCurveTo(-r * 0.45, -r * 0.5, -r * 0.35, -r, 0, -r * 0.92);
          ctx.bezierCurveTo(r * 0.35, -r, r * 0.45, -r * 0.5, 0, 0);
          ctx.fill();
        }

        ctx.fillStyle = pal.flowerInner;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.34, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = pal.flowerCore;
        ctx.beginPath();
        ctx.arc(0, 0, r * 0.2, 0, Math.PI * 2);
        ctx.fill();

        ctx.restore();
      }

      for (let i = spores.length - 1; i >= 0; i--) {
        const sp = spores[i];
        sp.x += sp.vx + Math.sin(time * 0.05 + sp.phase) * 0.35;
        sp.y += sp.vy;
        sp.life -= sp.decay;

        if (sp.life <= 0) {
          spores.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = sp.life * 0.75;
        ctx.fillStyle = pal.spore;
        ctx.shadowColor = pal.spore;
        ctx.shadowBlur = 6;
        ctx.beginPath();
        ctx.arc(sp.x, sp.y, sp.size * sp.life, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('touchstart', handleTouchStart);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDark]);

  return (
    <canvas
      ref={canvasRef}
      style={{ opacity: isDark ? 0.44 : 0.38 }}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden transition-opacity duration-500"
    />
  );
}

/* ==========================================================================
   2. TYPE-GARDEN BOTANICAL TYPOGRAPHY HERO ("CHEDY")
   ========================================================================== */
function TypeGardenHero({ isDark }) {
  const canvasRef = useRef(null);
  const [regrowTrigger, setRegrowTrigger] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let width = 0;
    let height = 0;
    let fontSize = 150;
    let deviceScale = 1;
    let ornaments = [];

    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: 0, py: 0 };

    const drawBotanicalLeaf = (ctx, size, color, veinColor, sFactor) => {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(size * 0.35, -size * 0.44, size * 0.75, -size * 0.3, size, 0);
      ctx.bezierCurveTo(size * 0.75, size * 0.3, size * 0.35, size * 0.44, 0, 0);
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = veinColor;
      ctx.lineWidth = Math.max(0.5, 1.0 * sFactor);
      ctx.beginPath();
      ctx.moveTo(size * 0.1, 0);
      ctx.lineTo(size * 0.84, 0);
      ctx.stroke();
    };

    const drawBlossom = (ctx, radius, petalColor, innerColor, coreColor, rot) => {
      ctx.save();
      ctx.rotate(rot);
      const petals = 6;
      for (let i = 0; i < petals; i++) {
        ctx.rotate((Math.PI * 2) / petals);
        ctx.fillStyle = petalColor;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.bezierCurveTo(
          -radius * 0.42,
          -radius * 0.58,
          -radius * 0.3,
          -radius * 1.1,
          0,
          -radius * 1.1
        );
        ctx.bezierCurveTo(
          radius * 0.3,
          -radius * 1.1,
          radius * 0.42,
          -radius * 0.58,
          0,
          0
        );
        ctx.fill();
      }

      ctx.fillStyle = innerColor;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.38, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = coreColor;
      ctx.beginPath();
      ctx.arc(0, 0, radius * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    };

    const buildScene = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;

      deviceScale = Math.min(1.12, Math.max(0.42, width / 960));

      height = Math.min(360, Math.max(150, width * 0.29));
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = Math.min(width * 0.2, 185);

      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const offCtx = off.getContext('2d');

      offCtx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#000';
      offCtx.fillText('CHEDY', width / 2, height / 2);

      const img = offCtx.getImageData(0, 0, width, height).data;
      const edgePoints = [];
      const step = Math.max(4, Math.round(6 * deviceScale));

      for (let y = step; y < height - step; y += step) {
        for (let x = step; x < width - step; x += step) {
          const a = img[(y * width + x) * 4 + 3];
          if (a > 160) {
            const up = img[((y - step) * width + x) * 4 + 3];
            const dn = img[((y + step) * width + x) * 4 + 3];
            const lf = img[(y * width + (x - step)) * 4 + 3];
            const rt = img[(y * width + (x + step)) * 4 + 3];

            if (up < 120 || dn < 120 || lf < 120 || rt < 120) {
              const nx = (lf - rt) / 255;
              const ny = (up - dn) / 255;
              const baseAngle = Math.atan2(ny || y - height / 2, nx || x - width / 2);
              edgePoints.push({ x, y, baseAngle });
            }
          }
        }
      }

      ornaments = [];
      const targetOrnaments = Math.round(48 * Math.pow(deviceScale, 0.45));
      const stride = Math.max(3, Math.floor(edgePoints.length / Math.max(18, targetOrnaments)));

      for (let i = 0; i < edgePoints.length; i += stride) {
        const pt = edgePoints[i];
        const rand = Math.random();
        const isFlower = rand < 0.28;
        const isLongTendril = rand >= 0.28 && rand < 0.58;

        const baseStem = isLongTendril
          ? 38 + Math.random() * 32
          : isFlower
          ? 28 + Math.random() * 26
          : 22 + Math.random() * 22;

        ornaments.push({
          ox: pt.x,
          oy: pt.y,
          angle: pt.baseAngle + (Math.random() - 0.5) * 0.6,
          curveBend: (Math.random() - 0.5) * 0.85,
          stemLen: baseStem * deviceScale,
          leafSize: (18 + Math.random() * 14) * deviceScale,
          flowerRadius: (12 + Math.random() * 8) * deviceScale,
          isFlower,
          isLongTendril,
          grow: 0,
          growDelay: (i / edgePoints.length) * 0.35,
          growSpeed: 0.025 + Math.random() * 0.02,
          swayOffset: Math.random() * Math.PI * 2,
          rotOffset: 0,
          rotVel: 0,
          variant: i % 3,
        });
      }
    };

    buildScene();

    const onMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      const nx = e.clientX - rect.left;
      const ny = e.clientY - rect.top;
      mouse.vx = nx - mouse.px;
      mouse.vy = ny - mouse.py;
      mouse.px = nx;
      mouse.py = ny;
      mouse.x = nx;
      mouse.y = ny;
    };

    const onLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
    window.addEventListener('resize', buildScene);

    let time = 0;
    const render = () => {
      animId = requestAnimationFrame(render);
      time += 0.025;

      ctx.clearRect(0, 0, width, height);

      const renderPass = (onlyFront) => {
        for (let i = 0; i < ornaments.length; i++) {
          const o = ornaments[i];
          const isFrontItem = o.isFlower || i % 2 === 0;
          if (onlyFront !== isFrontItem) continue;

          if (time * 0.4 > o.growDelay && o.grow < 1) {
            o.grow = Math.min(1, o.grow + o.growSpeed);
          }
          const ease = 1 - Math.pow(1 - o.grow, 3);
          if (ease <= 0.01) continue;

          const dx = o.ox - mouse.x;
          const dy = o.oy - mouse.y;
          const dist = Math.hypot(dx, dy);
          const interactRad = 120 * deviceScale;
          if (dist < interactRad) {
            const push = (1 - dist / interactRad) * 0.1;
            o.rotVel += (mouse.vx * 0.03 - o.rotOffset) * push;
          }
          o.rotVel += (0 - o.rotOffset) * 0.06;
          o.rotVel *= 0.85;
          o.rotOffset += o.rotVel;

          const breeze = Math.sin(time * 1.3 + o.swayOffset) * 0.12;
          const curAngle = o.angle + breeze + o.rotOffset;
          const len = o.stemLen * ease;

          const ctrlX = o.ox + Math.cos(curAngle + o.curveBend * 0.5) * (len * 0.55);
          const ctrlY = o.oy + Math.sin(curAngle + o.curveBend * 0.5) * (len * 0.55);
          const tipX = o.ox + Math.cos(curAngle) * len;
          const tipY = o.oy + Math.sin(curAngle) * len;

          ctx.strokeStyle = isDark
            ? o.variant === 0
              ? '#10b981'
              : '#059669'
            : o.variant === 0
            ? '#047857'
            : '#065f46';
          ctx.lineWidth = (o.isFlower ? 2.6 : 2.1) * Math.max(0.6, deviceScale);
          ctx.lineCap = 'round';
          ctx.beginPath();
          ctx.moveTo(o.ox, o.oy);
          ctx.quadraticCurveTo(ctrlX, ctrlY, tipX, tipY);
          ctx.stroke();

          if (o.isLongTendril && ease > 0.4) {
            ctx.save();
            ctx.translate(ctrlX, ctrlY);
            ctx.rotate(curAngle + 0.65);
            drawBotanicalLeaf(
              ctx,
              o.leafSize * 0.7 * ease,
              isDark ? '#10b981' : '#059669',
              isDark ? '#a7f3d0' : '#d1fae5',
              deviceScale
            );
            ctx.restore();
          }

          ctx.save();
          ctx.translate(tipX, tipY);
          if (o.isFlower) {
            const petalCol =
              o.variant === 0
                ? isDark
                  ? '#ecfdf5'
                  : '#10b981'
                : o.variant === 1
                ? '#34d399'
                : isDark
                ? '#a7f3d0'
                : '#059669';
            const innerCol = isDark ? '#064e3b' : '#ecfdf5';
            const coreCol = '#f59e0b';
            drawBlossom(
              ctx,
              o.flowerRadius * ease,
              petalCol,
              innerCol,
              coreCol,
              time * 0.3 + o.swayOffset
            );
          } else {
            ctx.rotate(curAngle);
            const leafCol =
              o.variant === 0
                ? '#10b981'
                : o.variant === 1
                ? isDark
                  ? '#34d399'
                  : '#047857'
                : '#059669';
            drawBotanicalLeaf(
              ctx,
              o.leafSize * ease,
              leafCol,
              isDark ? 'rgba(255,255,255,0.45)' : 'rgba(255,255,255,0.6)',
              deviceScale
            );
          }
          ctx.restore();
        }
      };

      renderPass(false);

      ctx.save();
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = isDark
        ? 'rgba(16, 185, 129, 0.22)'
        : 'rgba(6, 78, 59, 0.16)';
      ctx.shadowBlur = 28 * deviceScale;
      ctx.shadowOffsetY = 10 * deviceScale;

      const textGrad = ctx.createLinearGradient(0, height * 0.22, 0, height * 0.78);
      if (isDark) {
        textGrad.addColorStop(0, '#FFFFFF');
        textGrad.addColorStop(0.65, '#ECFDF5');
        textGrad.addColorStop(1, '#6EE7B7');
      } else {
        textGrad.addColorStop(0, '#052E16');
        textGrad.addColorStop(0.6, '#064E3B');
        textGrad.addColorStop(1, '#047857');
      }
      ctx.fillStyle = textGrad;
      ctx.fillText('CHEDY', width / 2, height / 2);
      ctx.restore();

      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = isDark
        ? 'rgba(167, 243, 208, 0.28)'
        : 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = Math.max(0.8, 1.25 * deviceScale);
      ctx.strokeText('CHEDY', width / 2, height / 2);

      renderPass(true);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      canvas.removeEventListener('mousemove', onMove);
      canvas.removeEventListener('mouseleave', onLeave);
      window.removeEventListener('resize', buildScene);
    };
  }, [isDark, regrowTrigger]);

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col items-center">
      <canvas
        ref={canvasRef}
        data-interactive="true"
        onClick={() => setRegrowTrigger((n) => n + 1)}
        className="w-full cursor-pointer select-none"
      />
    </div>
  );
}

/* ==========================================================================
   3. APPLE-STYLE SCROLL-LINKED SECTION REVEAL
   ========================================================================== */
function ScrollSection({ children, className = '', delay = 0 }) {
  const ref = useRef(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return;
      const rect = ref.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const raw = (vh * 0.82 - rect.top) / (vh * 0.3);
      const clamped = Math.max(0, Math.min(1, raw));
      setProgress(clamped);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const translateY = (1 - progress) * 32;
  const scale = 0.97 + progress * 0.03;
  const blur = (1 - progress) * 5;

  return (
    <div
      ref={ref}
      style={{
        opacity: progress,
        transform: `translate3d(0, ${translateY.toFixed(1)}px, 0) scale(${scale.toFixed(3)})`,
        filter: `blur(${blur.toFixed(1)}px)`,
        transition: `opacity 140ms ease-out ${delay}ms, transform 140ms ease-out ${delay}ms, filter 140ms ease-out ${delay}ms`,
        willChange: 'transform, opacity, filter',
      }}
      className={className}
    >
      {children}
    </div>
  );
}

/* ==========================================================================
   4. APPLE-STYLE WORD-BY-WORD SCROLL SCRUBBING MANIFESTO
   ========================================================================== */
function ScrollScrubText({ text, highlightWords = [], isDark }) {
  const containerRef = useRef(null);
  const [scrollRatio, setScrollRatio] = useState(0);
  const words = text.split(' ');

  useEffect(() => {
    const onScroll = () => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const start = vh * 0.78;
      const end = vh * 0.32;
      const ratio = (start - rect.top) / (start - end);
      setScrollRatio(Math.max(0, Math.min(1, ratio)));
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <p
      ref={containerRef}
      className="text-3xl sm:text-5xl md:text-6xl font-semibold tracking-tight leading-[1.18] flex flex-wrap gap-x-3 gap-y-2"
    >
      {words.map((word, i) => {
        const wordStart = i / words.length;
        const wordEnd = (i + 1) / words.length;
        const activeAmount = Math.max(
          0,
          Math.min(1, (scrollRatio - wordStart) / (wordEnd - wordStart))
        );

        const cleanWord = word.replace(/[.,]/g, '').toLowerCase();
        const isHighlight = highlightWords.includes(cleanWord);

        const baseOpacity = 0.2 + activeAmount * 0.8;
        const color = isHighlight
          ? isDark
            ? '#34d399'
            : '#059669'
          : isDark
          ? '#ffffff'
          : '#090d0b';

        return (
          <span
            key={i}
            style={{
              opacity: baseOpacity,
              color,
              transform: `translateY(${(1 - activeAmount) * 4}px)`,
              transition: 'opacity 80ms linear, transform 100ms ease-out',
            }}
            className="inline-block"
          >
            {word}
          </span>
        );
      })}
    </p>
  );
}

/* ==========================================================================
   5. 3D BURJ KHALIFA MODEL (`free__burj_khalifa_dubai.glb` IN THE OPEN)
   ========================================================================== */
function BurjKhalifa3D({ isDark }) {
  const mountRef = useRef(null);
  const stateRef = useRef({
    angleY: 0.4,
    velY: 0.0055,
    dragging: false,
    lastX: 0,
    growProgress: 0,
    targetGrow: 0,
  });

  useEffect(() => {
    const handleScroll = () => {
      if (!mountRef.current) return;
      const rect = mountRef.current.getBoundingClientRect();
      const vh = window.innerHeight;
      const centerY = rect.top + rect.height * 0.5;

      if (centerY < vh * 0.78 && centerY > vh * 0.12) {
        stateRef.current.targetGrow = 1;
      } else {
        stateRef.current.targetGrow = 0;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || 500;
    let height = container.clientHeight || 640;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(38, width / height, 0.1, 1000);
    camera.position.set(0, 0.15, 14.6);
    camera.lookAt(0, 0, 0);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = isDark ? 1.35 : 1.15;

    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, isDark ? 1.7 : 2.2);
    scene.add(ambientLight);

    const hemiLight = new THREE.HemisphereLight(
      0xffffff,
      isDark ? 0x064e3b : 0xd1fae5,
      1.4
    );
    hemiLight.position.set(0, 20, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xffffff, 2.8);
    keyLight.position.set(12, 24, 16);
    scene.add(keyLight);

    const emeraldRimLight = new THREE.DirectionalLight(0x10b981, 2.2);
    emeraldRimLight.position.set(-14, 10, -12);
    scene.add(emeraldRimLight);

    const topBeaconLight = new THREE.PointLight(0x34d399, 2.5, 18);
    topBeaconLight.position.set(0, 5.2, 2);
    scene.add(topBeaconLight);

    const pivotGroup = new THREE.Group();
    scene.add(pivotGroup);

    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    loader.setDRACOLoader(dracoLoader);

    let isDisposed = false;

    loader.load(
      burjModelUrl,
      (gltf) => {
        if (isDisposed) return;
        const model = gltf.scene;

        model.traverse((child) => {
          if (child.isMesh && child.material) {
            child.castShadow = true;
            child.receiveShadow = true;
            if (child.material.isMeshStandardMaterial) {
              child.material.metalness = Math.min(
                0.85,
                Math.max(0.35, child.material.metalness)
              );
              child.material.roughness = Math.min(
                0.55,
                Math.max(0.2, child.material.roughness)
              );
            }
          }
        });

        const box = new THREE.Box3().setFromObject(model);
        const size = new THREE.Vector3();
        const center = new THREE.Vector3();
        box.getSize(size);
        box.getCenter(center);

        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const targetHeight = 7.2;
        const scaleFactor = targetHeight / maxDim;

        model.scale.setScalar(scaleFactor);
        model.position.set(
          -center.x * scaleFactor,
          -box.min.y * scaleFactor - 3.2,
          -center.z * scaleFactor
        );

        pivotGroup.add(model);
      },
      undefined,
      (err) => {
        console.error('Error loading free__burj_khalifa_dubai.glb:', err);
      }
    );

    let animId;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      stateRef.current.growProgress +=
        (stateRef.current.targetGrow - stateRef.current.growProgress) * 0.042;

      const g = Math.max(0.001, stateRef.current.growProgress);
      const easeOut = 1 - Math.pow(1 - g, 3);

      pivotGroup.scale.set(easeOut, easeOut, easeOut);
      pivotGroup.position.y = (1 - easeOut) * -1.5;

      if (!stateRef.current.dragging) {
        stateRef.current.velY += (0.0055 - stateRef.current.velY) * 0.05;
        stateRef.current.angleY += stateRef.current.velY;
      }
      pivotGroup.rotation.y = stateRef.current.angleY + (1 - easeOut) * 1.8;

      renderer.render(scene, camera);
    };
    animate();

    const updateSize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      if (nw > 0 && nh > 0) {
        width = nw;
        height = nh;
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);
    window.addEventListener('resize', updateSize);
    requestAnimationFrame(updateSize);

    return () => {
      isDisposed = true;
      cancelAnimationFrame(animId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', updateSize);
      dracoLoader.dispose();
      renderer.dispose();
    };
  }, [isDark]);

  const handlePointerDown = (e) => {
    stateRef.current.dragging = true;
    stateRef.current.lastX = e.clientX;
  };

  useEffect(() => {
    const onMove = (e) => {
      if (!stateRef.current.dragging) return;
      const dx = e.clientX - stateRef.current.lastX;
      stateRef.current.lastX = e.clientX;
      stateRef.current.velY = dx * 0.012;
      stateRef.current.angleY += stateRef.current.velY;
    };
    const onUp = () => {
      stateRef.current.dragging = false;
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-interactive="true"
      onPointerDown={handlePointerDown}
      style={{ touchAction: 'pan-y' }}
      className="relative w-full h-[540px] sm:h-[660px] overflow-hidden cursor-grab active:cursor-grabbing select-none"
      title="Drag to rotate Burj Khalifa 3D model"
    />
  );
}

/* ==========================================================================
   6. "WHAT WE ARE WORKING ON" — 3 PRODUCT CARDS WITH "VISIT PAGE" ICON
   Clicking Pothos opens the dedicated PothosPage!
   ========================================================================== */
function WhatWeAreWorkingOnSection({ theme, onOpenPothos }) {
  const products = [
    {
      num: '01 / Pothos',
      tag: 'AI SALES AGENT',
      title: 'Pothos — Autonomous Lead Gen & Sales Agent.',
      desc: 'Drop your website link or describe your business. Pothos automatically learns what you sell, discovers high-intent buyers, and deploys an AI sales agent that pitches them and books meetings on autopilot.',
      onClick: onOpenPothos,
    },
    {
      num: '02 / Smart Logistics',
      tag: 'SOFTWARE + IOT',
      title: 'Autonomous Food Locker System.',
      desc: 'A 100% software-orchestrated pickup ecosystem built for both delivery drivers and customers. Riders drop orders into smart thermal lockers in seconds without waiting, and customers unlock their meal whenever they’re ready.',
      href: '#food-locker-system',
    },
    {
      num: '03 / Conversational AI',
      tag: 'VOICE + WHATSAPP',
      title: 'Frontdesk AI Receptionist.',
      desc: 'An AI agent that learns every detail of a business, answers phone calls in a natural human voice, and replies on WhatsApp 24/7—resolving customer queries, checking availability, and booking restaurant tables automatically.',
      href: '#frontdesk-ai-agent',
    },
  ];

  return (
    <section className="min-h-screen flex items-center justify-center py-20 px-6 sm:px-12 relative z-10">
      <div className="max-w-7xl w-full mx-auto">
        <ScrollSection className="max-w-3xl mb-14">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
            In The Lab
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
            What we’re
            <br />
            <span className="text-emerald-500">working on.</span>
          </h2>
          <p
            style={{ color: theme.muted }}
            className="mt-5 text-base sm:text-xl font-normal"
          >
            A look inside the original products and platforms we are actively building right now.
          </p>
        </ScrollSection>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {products.map((item, idx) => (
            <ScrollSection key={item.title} delay={idx * 40} className="h-full">
              <div
                onClick={item.onClick}
                style={{
                  backgroundColor: theme.card,
                  borderColor: theme.border,
                }}
                className={`group rounded-[36px] border p-8 sm:p-10 h-full flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 shadow-lg shadow-emerald-950/5 ${
                  item.onClick ? 'cursor-pointer' : ''
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500">
                      {item.num}
                    </span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-mono font-semibold bg-emerald-500/10 text-emerald-500">
                      {item.tag}
                    </span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
                    {item.title}
                  </h3>

                  <p
                    style={{ color: theme.muted }}
                    className="mt-4 text-sm sm:text-base leading-relaxed"
                  >
                    {item.desc}
                  </p>
                </div>

                {/* Visit Page Button & Icon */}
                <div className="mt-10 pt-6 border-t border-emerald-500/15">
                  {item.onClick ? (
                    <button
                      type="button"
                      data-interactive="true"
                      onClick={(e) => {
                        e.stopPropagation();
                        item.onClick();
                      }}
                      className="w-full inline-flex items-center justify-between text-sm font-semibold text-emerald-500 group-hover:text-emerald-400 transition cursor-pointer"
                    >
                      <span>Visit Pothos Page</span>
                      <span className="w-10 h-10 rounded-full border border-emerald-500/25 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 17L17 7M17 7H8M17 7V16"
                          />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <a
                      href={item.href}
                      data-interactive="true"
                      className="w-full inline-flex items-center justify-between text-sm font-semibold text-emerald-500 group-hover:text-emerald-400 transition"
                    >
                      <span>Visit Page</span>
                      <span className="w-10 h-10 rounded-full border border-emerald-500/25 bg-emerald-500/10 group-hover:bg-emerald-500 group-hover:text-white flex items-center justify-center transition-all duration-300 shadow-sm">
                        <svg
                          className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 17L17 7M17 7H8M17 7V16"
                          />
                        </svg>
                      </span>
                    </a>
                  )}
                </div>
              </div>
            </ScrollSection>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ==========================================================================
   7. AUTHENTIC REACT BITS LANYARD COMPONENT
   ========================================================================== */
function ReactBitsLanyard({
  member,
  isDark,
  index,
  zIndex,
  onFocusLanyard,
}) {
  const wrapperRef = useRef(null);
  const cardDomRef = useRef(null);
  const backStrapRef = useRef(null);
  const frontStrapRef = useRef(null);
  const stitchStrapRef = useRef(null);
  const clampGroupRef = useRef(null);

  const [isFlipped, setIsFlipped] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const phys = useRef({
    points: [],
    pointerPressed: false,
    activePointerId: null,
    dragging: false,
    startClient: { x: 0, y: 0 },
    movedDist: 0,
    targetMouse: { x: 0, y: 0 },
    grabOffset: { x: 0, y: 0 },
    throwVel: { vx: 0, vy: 0 },
    rotZ: 0,
    velRotZ: 0,
    rotX: 0,
    rotY: 0,
    breezeSeed: Math.random() * 100,
  });

  useEffect(() => {
    const wrapper = wrapperRef.current;
    if (!wrapper) return;

    const numNodes = 12;
    const strapLength = 155;
    const segLen = strapLength / (numNodes - 1);

    const anchorX = wrapper.clientWidth / 2;
    const anchorY = 0;
    const introOffsetX = (index % 2 === 0 ? -1 : 1) * (55 + index * 12);

    const pts = [];
    for (let i = 0; i < numNodes; i++) {
      const t = i / (numNodes - 1);
      const sx = anchorX + introOffsetX * t;
      const sy = anchorY + i * segLen - Math.abs(introOffsetX) * 0.25 * t;
      pts.push({
        x: sx,
        y: sy,
        oldX: sx,
        oldY: sy,
        pinned: i === 0,
      });
    }
    phys.current.points = pts;

    const buildSmoothPath = (nodes, offsetX = 0) => {
      if (nodes.length < 2) return '';
      let d = `M ${(nodes[0].x + offsetX).toFixed(1)} ${nodes[0].y.toFixed(1)}`;
      for (let i = 1; i < nodes.length - 1; i++) {
        const xc = ((nodes[i].x + nodes[i + 1].x) / 2 + offsetX).toFixed(1);
        const yc = ((nodes[i].y + nodes[i + 1].y) / 2).toFixed(1);
        d += ` Q ${(nodes[i].x + offsetX).toFixed(1)} ${nodes[i].y.toFixed(1)}, ${xc} ${yc}`;
      }
      const last = nodes[nodes.length - 1];
      d += ` L ${(last.x + offsetX).toFixed(1)} ${last.y.toFixed(1)}`;
      return d;
    };

    let animId;
    let time = phys.current.breezeSeed;

    const stepPhysics = () => {
      animId = requestAnimationFrame(stepPhysics);
      time += 0.022;

      const pList = phys.current.points;
      if (!pList.length || !wrapperRef.current) return;

      const ax = wrapperRef.current.clientWidth / 2;
      pList[0].x = ax;
      pList[0].y = 0;

      const gravity = 0.72;
      const damping = phys.current.dragging ? 0.92 : 0.986;

      const breezeForce =
        Math.sin(time * 1.1 + index * 1.7) * 0.09 +
        Math.cos(time * 0.65 - index) * 0.05;

      for (let i = 1; i < pList.length; i++) {
        const p = pList[i];

        if (phys.current.dragging && i === pList.length - 1) {
          const prevX = p.x;
          const prevY = p.y;
          const destX = phys.current.targetMouse.x - phys.current.grabOffset.x;
          const destY = phys.current.targetMouse.y - phys.current.grabOffset.y;

          const dxAnchor = destX - ax;
          const dyAnchor = destY;
          const distFromAnchor = Math.hypot(dxAnchor, dyAnchor);
          const maxStretch = 420;
          let targetX = destX;
          let targetY = destY;
          if (distFromAnchor > maxStretch) {
            const scale = maxStretch / distFromAnchor;
            targetX = ax + dxAnchor * scale;
            targetY = dyAnchor * scale;
          }

          p.x += (targetX - p.x) * 0.65;
          p.y += (targetY - p.y) * 0.65;
          phys.current.throwVel.vx = p.x - prevX;
          phys.current.throwVel.vy = p.y - prevY;
          p.oldX = p.x - phys.current.throwVel.vx;
          p.oldY = p.y - phys.current.throwVel.vy;
          continue;
        }

        const vx = (p.x - p.oldX) * damping;
        const vy = (p.y - p.oldY) * damping;
        p.oldX = p.x;
        p.oldY = p.y;
        p.x += vx + breezeForce * (i / pList.length);
        p.y += vy + gravity;
      }

      const elasticity = phys.current.dragging ? 0.42 : 0.78;
      for (let iter = 0; iter < 10; iter++) {
        for (let i = 0; i < pList.length - 1; i++) {
          const p1 = pList[i];
          const p2 = pList[i + 1];
          const dx = p2.x - p1.x;
          const dy = p2.y - p1.y;
          const dist = Math.hypot(dx, dy) || 0.0001;
          const diff = ((segLen - dist) / dist) * elasticity;

          if (p1.pinned) {
            p2.x += dx * diff;
            p2.y += dy * diff;
          } else if (phys.current.dragging && i + 1 === pList.length - 1) {
            p1.x -= dx * diff;
            p1.y -= dy * diff;
          } else {
            p1.x -= dx * diff * 0.5;
            p1.y -= dy * diff * 0.5;
            p2.x += dx * diff * 0.5;
            p2.y += dy * diff * 0.5;
          }
        }
      }

      const tip = pList[pList.length - 1];
      const prev = pList[pList.length - 3] || pList[pList.length - 2];
      const ropeAngleRad = Math.atan2(tip.x - prev.x, tip.y - prev.y);
      const ropeAngleDeg = (ropeAngleRad * 180) / Math.PI;

      if (backStrapRef.current && frontStrapRef.current && stitchStrapRef.current) {
        backStrapRef.current.setAttribute('d', buildSmoothPath(pList, -5));
        frontStrapRef.current.setAttribute('d', buildSmoothPath(pList, 3));
        stitchStrapRef.current.setAttribute('d', buildSmoothPath(pList, 3));
      }

      if (clampGroupRef.current) {
        clampGroupRef.current.setAttribute(
          'transform',
          `translate(${tip.x.toFixed(1)}, ${tip.y.toFixed(1)}) rotate(${(
            -ropeAngleDeg * 0.55
          ).toFixed(1)})`
        );
      }

      const vxTip = tip.x - tip.oldX;
      const vyTip = tip.y - tip.oldY;

      const targetRotZ = Math.max(
        -38,
        Math.min(38, -vxTip * 1.9 - ropeAngleDeg * 0.48)
      );
      phys.current.velRotZ += (targetRotZ - phys.current.rotZ) * 0.16;
      phys.current.velRotZ *= 0.82;
      phys.current.rotZ += phys.current.velRotZ;

      const targetRotY = Math.max(-24, Math.min(24, vxTip * 2.6));
      const targetRotX = Math.max(-18, Math.min(18, -vyTip * 1.8));
      phys.current.rotY += (targetRotY - phys.current.rotY) * 0.14;
      phys.current.rotX += (targetRotX - phys.current.rotX) * 0.14;

      if (cardDomRef.current) {
        const cardW = 236;
        const cardX = tip.x - cardW / 2;
        const cardY = tip.y + 6;
        cardDomRef.current.style.transform = `translate3d(${cardX.toFixed(
          2
        )}px, ${cardY.toFixed(2)}px, 0) rotateZ(${phys.current.rotZ.toFixed(
          2
        )}deg) rotateX(${phys.current.rotX.toFixed(
          2
        )}deg) rotateY(${phys.current.rotY.toFixed(2)}deg)`;
      }
    };

    stepPhysics();

    return () => cancelAnimationFrame(animId);
  }, [index]);

  const handlePointerDown = (e) => {
    if (e.target.closest('a, button')) return;

    onFocusLanyard();
    phys.current.pointerPressed = true;
    phys.current.activePointerId = e.pointerId;
    phys.current.dragging = false;
    phys.current.movedDist = 0;
    phys.current.startClient = { x: e.clientX, y: e.clientY };
  };

  useEffect(() => {
    const handlePointerMove = (e) => {
      if (
        !phys.current.pointerPressed ||
        e.pointerId !== phys.current.activePointerId ||
        !wrapperRef.current
      ) {
        return;
      }

      const dx = e.clientX - phys.current.startClient.x;
      const dy = e.clientY - phys.current.startClient.y;
      const dist = Math.hypot(dx, dy);
      phys.current.movedDist = dist;

      if (!phys.current.dragging && dist > 10) {
        const rect = wrapperRef.current.getBoundingClientRect();
        const mx = e.clientX - rect.left;
        const my = e.clientY - rect.top;
        const pts = phys.current.points;
        const tip = pts[pts.length - 1];

        phys.current.grabOffset = { x: mx - tip.x, y: my - tip.y };
        phys.current.targetMouse = { x: mx, y: my };
        phys.current.dragging = true;
        setIsDragging(true);
      }

      if (phys.current.dragging) {
        const rect = wrapperRef.current.getBoundingClientRect();
        phys.current.targetMouse = {
          x: e.clientX - rect.left,
          y: Math.max(-40, Math.min(520, e.clientY - rect.top)),
        };
      }
    };

    const handlePointerUp = (e) => {
      if (
        !phys.current.pointerPressed ||
        e.pointerId !== phys.current.activePointerId
      ) {
        return;
      }

      const wasDragging = phys.current.dragging;
      const totalMoved = phys.current.movedDist;

      phys.current.pointerPressed = false;
      phys.current.activePointerId = null;
      phys.current.dragging = false;
      setIsDragging(false);

      if (!wasDragging && totalMoved <= 10) {
        setIsFlipped((prev) => !prev);
      }
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerUp);
    };
  }, []);

  const gradId = `strap-grad-${index}`;
  const clampGradId = `clamp-grad-${index}`;

  return (
    <div
      ref={wrapperRef}
      onMouseEnter={onFocusLanyard}
      style={{ zIndex }}
      className="relative w-full h-[550px] select-none overflow-visible"
    >
      <svg
        className="absolute inset-0 w-full h-full overflow-visible pointer-events-none"
        style={{ zIndex: 20 }}
      >
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="50%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
          <linearGradient id={clampGradId} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#71717a" />
            <stop offset="45%" stopColor="#f4f4f5" />
            <stop offset="100%" stopColor="#52525b" />
          </linearGradient>
        </defs>

        <path
          ref={backStrapRef}
          fill="none"
          stroke={isDark ? '#022c22' : '#064e3b'}
          strokeWidth="15"
          strokeLinecap="round"
        />

        <path
          ref={frontStrapRef}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth="14"
          strokeLinecap="round"
        />

        <path
          ref={stitchStrapRef}
          fill="none"
          stroke="rgba(255,255,255,0.32)"
          strokeWidth="1.2"
          strokeDasharray="3 4"
          strokeLinecap="round"
        />

        <g ref={clampGroupRef}>
          <rect
            x="-12"
            y="-6"
            width="24"
            height="10"
            rx="3"
            fill={`url(#${clampGradId})`}
            stroke="#3f3f46"
            strokeWidth="1"
          />
          <circle cx="0" cy="-1" r="1.6" fill="#27272a" />
          <rect
            x="-4.5"
            y="3"
            width="9"
            height="13"
            rx="4"
            fill="none"
            stroke={`url(#${clampGradId})`}
            strokeWidth="2.8"
          />
        </g>
      </svg>

      <div
        ref={cardDomRef}
        data-interactive="true"
        onPointerDown={handlePointerDown}
        style={{
          width: 236,
          height: 332,
          transformOrigin: '50% 10px',
          perspective: '1200px',
          willChange: 'transform',
          touchAction: 'none',
          WebkitUserSelect: 'none',
          userSelect: 'none',
          WebkitTapHighlightColor: 'transparent',
          zIndex: 15,
        }}
        className={`absolute top-0 left-0 ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'relative',
            transformStyle: 'preserve-3d',
            transition: 'transform 650ms cubic-bezier(0.22, 1, 0.36, 1)',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* FRONT OF BADGE */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              pointerEvents: isFlipped ? 'none' : 'auto',
              backgroundColor: isDark ? '#101713' : '#ffffff',
              borderColor: isDark
                ? 'rgba(52, 211, 153, 0.28)'
                : 'rgba(0, 0, 0, 0.09)',
              color: isDark ? '#ffffff' : '#090d0b',
            }}
            className="absolute inset-0 rounded-[28px] border p-3.5 flex flex-col justify-between shadow-[0_28px_60px_-12px_rgba(0,0,0,0.28)] overflow-hidden"
          >
            <div className="relative z-10 flex justify-center pt-0.5 pb-2">
              <div
                style={{
                  backgroundColor: isDark ? '#060B08' : '#E8F0EC',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.12)',
                }}
                className="w-12 h-3 rounded-full border shadow-inner"
              />
            </div>

            <div className="relative z-10 w-full h-[228px] rounded-[20px] overflow-hidden bg-zinc-900">
              <img
                src={member.photo}
                alt={member.name}
                draggable={false}
                className="w-full h-full object-cover object-center pointer-events-none select-none"
              />
            </div>

            <div className="relative z-10 pt-2.5 pb-1 px-2 flex items-center justify-between">
              <h3 className="text-lg font-bold tracking-tight truncate">
                {member.name}
              </h3>
              <span className="text-[10px] font-semibold uppercase tracking-widest text-emerald-500">
                Flip ↻
              </span>
            </div>
          </div>

          {/* BACK OF BADGE */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
              pointerEvents: isFlipped ? 'auto' : 'none',
              backgroundColor: isDark ? '#101713' : '#ffffff',
              borderColor: isDark
                ? 'rgba(52, 211, 153, 0.35)'
                : 'rgba(5, 150, 105, 0.22)',
              color: isDark ? '#ffffff' : '#090d0b',
            }}
            className="absolute inset-0 rounded-[28px] border p-6 flex flex-col justify-between shadow-[0_28px_60px_-12px_rgba(0,0,0,0.32)]"
          >
            <div>
              <div
                style={{
                  backgroundColor: isDark ? '#060B08' : '#E8F0EC',
                  borderColor: isDark
                    ? 'rgba(255,255,255,0.12)'
                    : 'rgba(0,0,0,0.12)',
                }}
                className="mx-auto w-12 h-3 rounded-full border shadow-inner mb-6"
              />

              <div className="inline-block px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                {member.dept}
              </div>

              <h3 className="text-2xl font-bold tracking-tight mt-3">
                {member.name}
              </h3>

              <p
                style={{ color: isDark ? '#9fb3a8' : '#526058' }}
                className="mt-3 text-sm leading-relaxed font-normal"
              >
                {member.whatTheyDo}
              </p>
            </div>

            <div className="pt-4 border-t border-emerald-500/15 flex items-center justify-between">
              <a
                href={member.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                onPointerDown={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{ touchAction: 'manipulation' }}
                className="relative z-30 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-semibold transition shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                </svg>
                <span>LinkedIn</span>
              </a>

              <span
                style={{ color: isDark ? '#6b7f74' : '#86968d' }}
                className="text-[11px] font-medium"
              >
                Tap to flip
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   8. MAIN APPLE-STYLE MINIMAL LANDING PAGE FOR CHEDY.NET + POTHOS ROUTER
   ========================================================================== */
export default function App() {
  const { isDark, toggleTheme } = useSystemTheme();
  const [zOrder, setZOrder] = useState([10, 11, 12, 13]);
  const [currentPage, setCurrentPage] = useState(() =>
    window.location.hash.startsWith('#/pothos') ? 'pothos' : 'home'
  );

  // Force manual scroll restoration so switching back to CHEDY.NET never lands in the middle/bottom
  useEffect(() => {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual';
    }
  }, []);

  const forceScrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  useEffect(() => {
    const onHashChange = () => {
      if (window.location.hash.startsWith('#/pothos')) {
        setCurrentPage('pothos');
        forceScrollToTop();
      } else if (
        window.location.hash === '' ||
        window.location.hash === '#' ||
        window.location.hash === '#/'
      ) {
        setCurrentPage('home');
        forceScrollToTop();
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // Guarantee top-of-page scroll after React finishes mounting the target page
  useEffect(() => {
    forceScrollToTop();
    const raf = requestAnimationFrame(forceScrollToTop);
    const timer = setTimeout(forceScrollToTop, 30);
    return () => {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
    };
  }, [currentPage]);

  const navigateTo = (page) => {
    if (page === 'pothos') {
      window.location.hash = '#/pothos';
      setCurrentPage('pothos');
    } else {
      window.history.pushState(
        '',
        document.title,
        window.location.pathname + window.location.search
      );
      setCurrentPage('home');
    }
    forceScrollToTop();
  };

  const bringLanyardToFront = (idx) => {
    setZOrder((prev) => {
      const maxZ = Math.max(...prev);
      if (prev[idx] === maxZ) return prev;
      const next = [...prev];
      next[idx] = maxZ + 1;
      return next;
    });
  };

  const theme = {
    bg: isDark ? '#060B08' : '#FFFFFF',
    bgSubtle: isDark ? '#0B130E' : '#F6FAF7',
    text: isDark ? '#F7FAF8' : '#090D0B',
    muted: isDark ? '#8FA397' : '#5A6B61',
    card: isDark ? '#0E1712' : '#F8FBF9',
    border: isDark ? 'rgba(16, 185, 129, 0.16)' : 'rgba(5, 150, 105, 0.14)',
  };

  const founders = [
    {
      name: 'Eric Antony',
      dept: 'Co-Founder & CEO',
      whatTheyDo:
        'Leads product vision, company strategy, and the creation of software products that shape how the world works.',
      photo: ericPhoto,
      linkedin: 'https://www.linkedin.com',
    },
    {
      name: 'Altrin Lloyd',
      dept: 'Co-Founder & CTO',
      whatTheyDo:
        'Architects core software systems, high-speed engineering standards, and next-generation technology platforms.',
      photo: altrinPhoto,
      linkedin: 'https://www.linkedin.com/in/altrin-lloyd-hudson/',
    },
    {
      name: 'Visnu Anand',
      dept: 'Co-Founder & MD',
      whatTheyDo:
        'Drives venture growth, strategic partnerships, and the execution of mission-critical software initiatives.',
      photo: visnuPhoto,
      linkedin: 'https://www.linkedin.com/in/visnuanand/',
    },
    {
      name: 'Rishab Dinesh',
      dept: 'Co-Founder & COO',
      whatTheyDo:
        'Leads global operations, product delivery, and scalable systems that take software from idea to worldwide impact.',
      photo: rishabPhoto,
      linkedin: 'https://www.linkedin.com/in/rishabdhinesh/',
    },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, sans-serif',
      }}
      className="min-h-screen transition-colors duration-500 selection:bg-emerald-500 selection:text-white overflow-x-hidden relative"
    >
      {/* Translucent Botanical Background Canvas (z-0) */}
      <MouseGrassTrail isDark={isDark} />

      {/* Minimal Top-Right Theme Switch */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle Light or Dark Mode"
        style={{
          backgroundColor: isDark
            ? 'rgba(18, 29, 23, 0.85)'
            : 'rgba(255, 255, 255, 0.85)',
          borderColor: theme.border,
          color: theme.text,
        }}
        className="fixed top-6 right-6 z-50 flex items-center gap-2.5 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
      >
        {isDark ? (
          <>
            <svg
              className="w-4 h-4 text-emerald-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
              />
            </svg>
            <span className="text-xs font-semibold tracking-wide">Light</span>
          </>
        ) : (
          <>
            <svg
              className="w-4 h-4 text-emerald-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
              />
            </svg>
            <span className="text-xs font-semibold tracking-wide">Dark</span>
          </>
        )}
      </button>

      {currentPage === 'pothos' ? (
        <PothosPage
          isDark={isDark}
          toggleTheme={toggleTheme}
          theme={theme}
          onBackHome={() => navigateTo('home')}
          ScrollSection={ScrollSection}
          ScrollScrubText={ScrollScrubText}
        />
      ) : (
        <>
          {/* SCREEN 1: HERO */}
          <section className="relative min-h-screen flex flex-col items-center justify-between py-16 px-6 text-center z-10">
            <div
              style={{ color: theme.muted }}
              className="text-xs font-semibold tracking-[0.28em] uppercase"
            >
              CHEDY.NET
            </div>

            <div className="w-full my-auto py-8">
              <TypeGardenHero isDark={isDark} />

              <h1 className="mt-8 text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-3xl mx-auto leading-[1.08]">
                Software that{' '}
                <span className="text-emerald-500">shapes the world.</span>
              </h1>
            </div>

            <button
              type="button"
              onClick={() =>
                document
                  .getElementById('philosophy')
                  ?.scrollIntoView({ behavior: 'smooth' })
              }
              style={{ color: theme.muted }}
              className="inline-flex flex-col items-center gap-2 text-xs font-medium tracking-widest uppercase hover:text-emerald-500 transition cursor-pointer bg-transparent border-0"
            >
              <span>Scroll</span>
              <svg
                className="w-4 h-4 animate-bounce text-emerald-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 14l-7 7m0 0l-7-7m7 7V3"
                />
              </svg>
            </button>
          </section>

          {/* SCREEN 2: THE STORY (SCROLL-SCRUBBED) */}
          <section
            id="philosophy"
            className="min-h-screen flex items-center justify-center py-32 px-6 sm:px-12 relative z-10"
          >
            <div className="max-w-5xl mx-auto">
              <ScrollSection>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-8">
                  The Meaning of Chedy
                </div>
              </ScrollSection>

              <ScrollScrubText
                isDark={isDark}
                highlightWords={[
                  'chedy',
                  'sapling',
                  'humanity',
                  'cannot',
                  'revolutionary',
                  'software',
                ]}
                text="Chedy means sapling. Just as humanity cannot exist without the living plants that sustain our world, we build the revolutionary software and foundational products that tomorrow will not be able to live without."
              />
            </div>
          </section>

          {/* SCREEN 3: PROPRIETARY PRODUCTS FIRST, THEN BESPOKE SOFTWARE SOLUTIONS */}
          <section className="min-h-screen flex items-center justify-center py-32 px-6 sm:px-12 relative z-10">
            <div className="max-w-6xl w-full mx-auto">
              <ScrollSection className="max-w-3xl mb-20">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
                  What We Do
                </div>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
                  One software company.
                  <br />
                  <span className="text-emerald-500">
                    Two ways we shape the world.
                  </span>
                </h2>
              </ScrollSection>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* 01 / ORIGINALS */}
                <ScrollSection delay={30}>
                  <div
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    }}
                    className="group rounded-[36px] border p-10 sm:p-14 h-full flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 backdrop-blur-md"
                  >
                    <div>
                      <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6">
                        01 / Originals
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                        Proprietary Products of Our Own.
                      </h3>
                      <p
                        style={{ color: theme.muted }}
                        className="mt-5 text-base sm:text-lg leading-relaxed"
                      >
                        Inside Chedy, we incubate and launch our own suite of original software ventures—built to solve real problems and redefine how people live and work every day.
                      </p>
                    </div>

                    <div className="mt-14 pt-6 border-t border-emerald-500/15 flex items-center justify-between text-sm font-semibold text-emerald-500">
                      <span>In-House Ventures</span>
                      <span>✦</span>
                    </div>
                  </div>
                </ScrollSection>

                {/* 02 / SOLUTIONS */}
                <ScrollSection delay={80}>
                  <div
                    style={{
                      backgroundColor: theme.card,
                      borderColor: theme.border,
                    }}
                    className="group rounded-[36px] border p-10 sm:p-14 h-full flex flex-col justify-between transition-all duration-500 hover:-translate-y-1.5 backdrop-blur-md"
                  >
                    <div>
                      <span className="inline-block text-xs font-bold uppercase tracking-widest text-emerald-500 mb-6">
                        02 / Solutions
                      </span>
                      <h3 className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight">
                        Bespoke Software Solutions.
                      </h3>
                      <p
                        style={{ color: theme.muted }}
                        className="mt-5 text-base sm:text-lg leading-relaxed"
                      >
                        We partner with ambitious companies to design and engineer custom software platforms, digital products, and scalable systems from the ground up.
                      </p>
                    </div>

                    <div className="mt-14 pt-6 border-t border-emerald-500/15 flex items-center justify-between text-sm font-semibold text-emerald-500">
                      <span>Custom Engineering</span>
                      <span>→</span>
                    </div>
                  </div>
                </ScrollSection>
              </div>
            </div>
          </section>

          {/* SCREEN 4: BUILT FOR THE UAE MARKET + OPEN 3D BURJ KHALIFA ON RIGHT */}
          <section className="min-h-screen flex items-center justify-center py-32 px-6 sm:px-12 relative z-10 overflow-visible">
            <div className="max-w-7xl w-full mx-auto">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
                <div className="lg:col-span-6">
                  <ScrollSection>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
                      Regional Focus
                    </div>
                    <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
                      Built for the
                      <br />
                      <span className="text-emerald-500">UAE market.</span>
                    </h2>
                    <p
                      style={{ color: theme.muted }}
                      className="mt-6 text-lg sm:text-2xl leading-relaxed font-normal"
                    >
                      Solving real UAE challenges—one software breakthrough at a time.
                    </p>
                    <p
                      style={{ color: theme.muted }}
                      className="mt-4 text-base sm:text-lg leading-relaxed"
                    >
                      From Dubai’s fast-moving hospitality and delivery ecosystems to its fastest-growing enterprises, we engineer software purpose-built for the speed, ambition, and scale of the Emirates.
                    </p>
                  </ScrollSection>
                </div>

                <div className="lg:col-span-6 overflow-visible">
                  <BurjKhalifa3D isDark={isDark} />
                </div>
              </div>
            </div>
          </section>

          {/* SCREEN 5: WHAT WE ARE WORKING ON */}
          <WhatWeAreWorkingOnSection
            theme={theme}
            onOpenPothos={() => navigateTo('pothos')}
          />

          {/* SCREEN 6: REACT BITS LANYARDS */}
          <section className="min-h-screen flex flex-col justify-center py-32 px-6 relative z-10 overflow-visible">
            <div className="max-w-7xl w-full mx-auto overflow-visible">
              <ScrollSection className="text-center max-w-3xl mx-auto mb-8">
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
                  Leadership
                </div>
                <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
                  The Minds Behind Chedy.
                </h2>
                <p
                  style={{ color: theme.muted }}
                  className="mt-4 text-base sm:text-xl font-normal"
                >
                  Drag, stretch, or throw any badge. Tap or click a badge to flip it over.
                </p>
              </ScrollSection>

              <ScrollSection delay={60} className="overflow-visible">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 overflow-visible">
                  {founders.map((member, idx) => (
                    <ReactBitsLanyard
                      key={member.name}
                      member={member}
                      isDark={isDark}
                      index={idx}
                      zIndex={zOrder[idx]}
                      onFocusLanyard={() => bringLanyardToFront(idx)}
                    />
                  ))}
                </div>
              </ScrollSection>
            </div>
          </section>

          {/* SCREEN 7: CLOSING CTA */}
          <section
            style={{ backgroundColor: theme.bgSubtle }}
            className="py-36 px-6 sm:px-12 text-center border-t border-emerald-500/15 relative z-10"
          >
            <ScrollSection className="max-w-4xl mx-auto">
              <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
                Let’s build something
                <br />
                <span className="text-emerald-500">revolutionary.</span>
              </h2>
              <p
                style={{ color: theme.muted }}
                className="mt-6 text-lg sm:text-xl max-w-xl mx-auto"
              >
                Partner with us on custom software solutions or get early access to our upcoming UAE products.
              </p>

              <div className="mt-10">
                <a
                  href="mailto:hello@chedy.net"
                  className="inline-flex items-center gap-3 px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-base font-semibold shadow-xl shadow-emerald-600/25 hover:scale-105 transition-all"
                >
                  <span>hello@chedy.net</span>
                  <span>↗</span>
                </a>
              </div>

              <div
                style={{ color: theme.muted }}
                className="mt-24 pt-8 border-t border-emerald-500/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-medium"
              >
                <span>CHEDY.NET</span>
                <span>
                  © {new Date().getFullYear()} Chedy Technologies.
                </span>
              </div>
            </ScrollSection>
          </section>
        </>
      )}
    </div>
  );
}