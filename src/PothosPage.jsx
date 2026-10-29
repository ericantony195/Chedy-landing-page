import React, { useState, useEffect, useRef } from 'react';

/* ==========================================================================
   0. FORMSPREE CLOUD ENDPOINT
   All waitlist submissions are sent directly to your Formspree dashboard.
   ========================================================================== */
const WAITLIST_WEBHOOK_URL = 'https://formspree.io/f/xaeebare';

/* ==========================================================================
   1. POTHOS CREEPER VINE HERO ("POTHOS")
   Grows long, winding, multi-node Pothos ("Money Plant") creeper vines
   with alternating heart-shaped variegated leaves around the letters!
   ========================================================================== */
function PothosHeroTitle({ isDark }) {
  const canvasRef = useRef(null);
  const [regrowTrigger, setRegrowTrigger] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let animId;
    let width = 0;
    let height = 0;
    let fontSize = 140;
    let deviceScale = 1;
    let creepers = [];

    const mouse = { x: -9999, y: -9999, vx: 0, vy: 0, px: 0, py: 0 };

    // Authentic heart-shaped Pothos (Money Plant) leaf with golden variegation
    const drawPothosHeartLeaf = (
      ctx,
      size,
      baseColor,
      variegationColor,
      sFactor
    ) => {
      ctx.save();
      ctx.fillStyle = baseColor;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.bezierCurveTo(
        -size * 0.22,
        -size * 0.45,
        size * 0.35,
        -size * 0.62,
        size,
        0
      );
      ctx.bezierCurveTo(
        size * 0.35,
        size * 0.62,
        -size * 0.22,
        size * 0.45,
        0,
        0
      );
      ctx.closePath();
      ctx.fill();

      // Golden-emerald Money Plant variegation patch & central midrib vein
      ctx.fillStyle = variegationColor;
      ctx.beginPath();
      ctx.moveTo(size * 0.12, 0);
      ctx.bezierCurveTo(
        size * 0.28,
        -size * 0.22,
        size * 0.58,
        -size * 0.18,
        size * 0.78,
        0
      );
      ctx.bezierCurveTo(
        size * 0.58,
        size * 0.14,
        size * 0.28,
        size * 0.18,
        size * 0.12,
        0
      );
      ctx.closePath();
      ctx.fill();

      ctx.strokeStyle = isDark
        ? 'rgba(253, 230, 138, 0.75)'
        : 'rgba(254, 240, 138, 0.9)';
      ctx.lineWidth = Math.max(0.6, 0.95 * sFactor);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(size * 0.86, 0);
      ctx.stroke();
      ctx.restore();
    };

    const buildScene = () => {
      const parent = canvas.parentElement;
      if (!parent) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      width = parent.clientWidth;
      deviceScale = Math.min(1.12, Math.max(0.44, width / 960));
      height = Math.min(350, Math.max(160, width * 0.28));

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      fontSize = Math.min(width * 0.175, 168);

      const off = document.createElement('canvas');
      off.width = width;
      off.height = height;
      const offCtx = off.getContext('2d');

      offCtx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      offCtx.textAlign = 'center';
      offCtx.textBaseline = 'middle';
      offCtx.fillStyle = '#000';
      offCtx.fillText('POTHOS', width / 2, height / 2);

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
              const baseAngle = Math.atan2(
                ny || y - height / 2,
                nx || x - width / 2
              );
              edgePoints.push({ x, y, baseAngle });
            }
          }
        }
      }

      creepers = [];
      const targetCreepers = Math.round(34 * Math.pow(deviceScale, 0.45));
      const stride = Math.max(
        3,
        Math.floor(edgePoints.length / Math.max(16, targetCreepers))
      );

      for (let i = 0; i < edgePoints.length; i += stride) {
        const pt = edgePoints[i];
        const isLongTrailingVine = i % 3 === 0;
        const numSegments = isLongTrailingVine ? 5 : 3;
        const segLen = (isLongTrailingVine ? 16 : 13) * deviceScale;

        const segments = [];
        for (let s = 0; s < numSegments; s++) {
          segments.push({
            turn: (Math.random() - 0.5) * 0.72,
            leafSize: (21 - s * 2.4 + Math.random() * 6) * deviceScale,
            leafSide: s % 2 === 0 ? 1 : -1,
            hasAerialRoot: Math.random() > 0.45,
          });
        }

        creepers.push({
          ox: pt.x,
          oy: pt.y,
          baseAngle: pt.baseAngle + (Math.random() - 0.5) * 0.45,
          segLen,
          segments,
          grow: 0,
          growDelay: (i / edgePoints.length) * 0.35,
          growSpeed: 0.022 + Math.random() * 0.015,
          swayOffset: Math.random() * Math.PI * 2,
          rotOffset: 0,
          rotVel: 0,
          isFront: i % 2 === 0,
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
      time += 0.024;
      ctx.clearRect(0, 0, width, height);

      const renderCreepers = (onlyFront) => {
        for (let i = 0; i < creepers.length; i++) {
          const c = creepers[i];
          if (c.isFront !== onlyFront) continue;

          if (time * 0.45 > c.growDelay && c.grow < 1) {
            c.grow = Math.min(1, c.grow + c.growSpeed);
          }
          const ease = 1 - Math.pow(1 - c.grow, 3);
          if (ease <= 0.01) continue;

          const dx = c.ox - mouse.x;
          const dy = c.oy - mouse.y;
          const dist = Math.hypot(dx, dy);
          const interactRad = 125 * deviceScale;
          if (dist < interactRad) {
            const push = (1 - dist / interactRad) * 0.1;
            c.rotVel += (mouse.vx * 0.03 - c.rotOffset) * push;
          }
          c.rotVel += (0 - c.rotOffset) * 0.06;
          c.rotVel *= 0.85;
          c.rotOffset += c.rotVel;

          const nodes = [{ x: c.ox, y: c.oy, angle: c.baseAngle }];
          let curX = c.ox;
          let curY = c.oy;
          let curAngle = c.baseAngle + c.rotOffset;

          const totalProgress = ease * c.segments.length;

          for (let s = 0; s < c.segments.length; s++) {
            const segEase = Math.max(0, Math.min(1, totalProgress - s));
            if (segEase <= 0) break;

            const seg = c.segments[s];
            const breeze =
              Math.sin(time * 1.3 + c.swayOffset + s * 0.55) * 0.14;
            curAngle += seg.turn + breeze;

            const gravityPull = Math.cos(curAngle) * 0.16;
            curAngle += gravityPull;

            const stepDist = c.segLen * segEase;
            curX += Math.cos(curAngle) * stepDist;
            curY += Math.sin(curAngle) * stepDist;

            nodes.push({
              x: curX,
              y: curY,
              angle: curAngle,
              seg,
              segEase,
            });
          }

          if (nodes.length > 1) {
            ctx.beginPath();
            ctx.moveTo(nodes[0].x, nodes[0].y);
            for (let n = 1; n < nodes.length; n++) {
              const prev = nodes[n - 1];
              const cur = nodes[n];
              const midX = (prev.x + cur.x) / 2;
              const midY = (prev.y + cur.y) / 2;
              ctx.quadraticCurveTo(prev.x, prev.y, midX, midY);
            }
            const last = nodes[nodes.length - 1];
            ctx.lineTo(last.x, last.y);

            ctx.strokeStyle = isDark ? '#10b981' : '#047857';
            ctx.lineWidth = 2.4 * Math.max(0.65, deviceScale);
            ctx.lineCap = 'round';
            ctx.stroke();
          }

          for (let n = 1; n < nodes.length; n++) {
            const node = nodes[n];
            const { seg, segEase } = node;

            if (seg.hasAerialRoot && segEase > 0.5) {
              ctx.save();
              ctx.translate(node.x, node.y);
              ctx.rotate(node.angle - seg.leafSide * 0.9);
              ctx.strokeStyle = isDark ? '#6ee7b7' : '#059669';
              ctx.lineWidth = 1.1 * Math.max(0.6, deviceScale);
              ctx.beginPath();
              ctx.moveTo(0, 0);
              ctx.quadraticCurveTo(
                4 * deviceScale,
                4 * deviceScale,
                2 * deviceScale,
                9 * deviceScale
              );
              ctx.stroke();
              ctx.restore();
            }

            ctx.save();
            ctx.translate(node.x, node.y);
            const isTip = n === nodes.length - 1;
            const leafAngle = isTip
              ? node.angle
              : node.angle + seg.leafSide * 0.78;
            ctx.rotate(leafAngle);

            const baseCol =
              c.variant === 0
                ? '#10b981'
                : c.variant === 1
                ? isDark
                  ? '#34d399'
                  : '#047857'
                : '#059669';
            const variegationCol = isDark
              ? 'rgba(167, 243, 208, 0.42)'
              : 'rgba(253, 224, 71, 0.38)';

            drawPothosHeartLeaf(
              ctx,
              seg.leafSize * segEase,
              baseCol,
              variegationCol,
              deviceScale
            );
            ctx.restore();
          }
        }
      };

      renderCreepers(false);

      ctx.save();
      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      ctx.shadowColor = isDark
        ? 'rgba(16, 185, 129, 0.25)'
        : 'rgba(6, 78, 59, 0.16)';
      ctx.shadowBlur = 28 * deviceScale;
      ctx.shadowOffsetY = 10 * deviceScale;

      const textGrad = ctx.createLinearGradient(
        0,
        height * 0.22,
        0,
        height * 0.78
      );
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
      ctx.fillText('POTHOS', width / 2, height / 2);
      ctx.restore();

      ctx.font = `800 ${fontSize}px "Plus Jakarta Sans", "Inter", sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.strokeStyle = isDark
        ? 'rgba(167, 243, 208, 0.28)'
        : 'rgba(16, 185, 129, 0.22)';
      ctx.lineWidth = Math.max(0.8, 1.25 * deviceScale);
      ctx.strokeText('POTHOS', width / 2, height / 2);

      renderCreepers(true);
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
        title="Click to regrow Pothos creeper vines"
      />
    </div>
  );
}

/* ==========================================================================
   2. WEBSITE URL / BUSINESS DESCRIPTION -> AUTONOMOUS LEAD & SALES ENGINE
   ========================================================================== */
function BusinessToLeadsEngine({ isDark, theme }) {
  const [inputMode, setInputMode] = useState('url');
  const [selectedExample, setSelectedExample] = useState(0);
  const [inputValue, setInputValue] = useState('https://chedy.net');
  const [isScanning, setIsScanning] = useState(false);
  const [dispatchedLeads, setDispatchedLeads] = useState({});

  const examples = [
    {
      label: '01. B2B Software Studio',
      url: 'https://chedy.net',
      description:
        'We build custom enterprise software, AI voice receptionists, and smart food locker systems for businesses in the UAE.',
      extractedOffer:
        'Custom Software, AI Voice Agents & Smart Logistics Hardware',
      targetICP:
        'Hospitality Groups, Real Estate Developers & High-Growth Enterprises in UAE',
      leads: [
        {
          company: 'Jumeirah Restaurant Group',
          decisionMaker: 'Director of Operations • Dubai',
          whyMatched:
            'Scanned 14 venues • High table-booking call volume & delivery traffic',
          agentAction:
            'Pitching Frontdesk Voice AI + Smart Thermal Lockers via WhatsApp & Email',
          matchScore: '99%',
        },
        {
          company: 'Emaar Community Management',
          decisionMaker: 'VP of Digital Transformation • Downtown Dubai',
          whyMatched:
            'Actively digitizing residential tower lobby deliveries & visitor desks',
          agentAction:
            'Sending custom residential locker ROI deck + booking discovery call',
          matchScore: '96%',
        },
        {
          company: 'DIFC FinTech Hive',
          decisionMaker: 'Head of Partnerships • DIFC',
          whyMatched:
            'Scaling bespoke software & automation initiatives across portfolio',
          agentAction:
            'Initiating personalized founder-to-founder LinkedIn & Email sequence',
          matchScore: '94%',
        },
      ],
    },
    {
      label: '02. Commercial Interior Fit-Out',
      url: 'https://luxespace-dubai.ae',
      description:
        'We design and build luxury office and retail interiors for companies moving into new commercial spaces in Dubai.',
      extractedOffer: 'Turnkey Commercial Office & Retail Interior Fit-Out',
      targetICP:
        'Companies signing new commercial leases or expanding headquarters in Dubai',
      leads: [
        {
          company: 'Nordic Cloud MENA',
          decisionMaker: 'Regional Managing Director • Dubai Internet City',
          whyMatched:
            'Just registered a new 12,000 sq.ft regional HQ trade license in DIC',
          agentAction:
            'Sending portfolio of tech HQ fit-outs + offering free 3D space plan',
          matchScore: '98%',
        },
        {
          company: 'Aura Wellness Clinics',
          decisionMaker: 'Founder & CEO • Jumeirah',
          whyMatched:
            'Announced 3 new clinic branches opening across Dubai in Q4',
          agentAction:
            'Reaching out on WhatsApp with medical-grade luxury fit-out case study',
          matchScore: '95%',
        },
        {
          company: 'Veloce Specialty Coffee',
          decisionMaker: 'Head of Expansion • Alserkal Avenue',
          whyMatched:
            'Hiring store managers for 2 new flagship roastery locations',
          agentAction:
            'Booking site-visit call with commercial retail design director',
          matchScore: '92%',
        },
      ],
    },
    {
      label: '03. B2B Logistics & Fleet SaaS',
      url: 'https://routepulse.io',
      description:
        'We provide route optimization and cold-chain fleet tracking software for food & grocery distributors.',
      extractedOffer: 'AI Route Optimization & Cold-Chain Fleet Telemetry',
      targetICP:
        'FMCG Distributors, Cloud Kitchens & Cold-Chain Fleets in the GCC',
      leads: [
        {
          company: 'Gulf Fresh Foods Distribution',
          decisionMaker: 'Chief Supply Chain Officer • Jebel Ali',
          whyMatched:
            'Operating 180+ refrigerated trucks • Hiring Fleet Operations Manager',
          agentAction:
            'Sending fuel-savings simulation tailored to 180-truck fleet size',
          matchScore: '97%',
        },
        {
          company: 'Emirates Dark-Store Network',
          decisionMaker: 'VP of Last-Mile Delivery • Business Bay',
          whyMatched:
            'Expanded to 15-minute delivery SLA across 9 new zones in Dubai',
          agentAction:
            'Pitching dispatch API integration via WhatsApp & Direct Email',
          matchScore: '95%',
        },
        {
          company: 'Oasis Beverage Bottling',
          decisionMaker: 'Head of Logistics • Abu Dhabi',
          whyMatched:
            'Tendered new regional distribution contract across Northern Emirates',
          agentAction:
            'Launching multi-touch executive outreach sequence',
          matchScore: '91%',
        },
      ],
    },
  ];

  const handleSelectExample = (idx) => {
    setSelectedExample(idx);
    setInputValue(
      inputMode === 'url' ? examples[idx].url : examples[idx].description
    );
    setIsScanning(true);
    setDispatchedLeads({});
    setTimeout(() => setIsScanning(false), 450);
  };

  const handleSwitchMode = (mode) => {
    setInputMode(mode);
    setInputValue(
      mode === 'url'
        ? examples[selectedExample].url
        : examples[selectedExample].description
    );
  };

  const currentExample = examples[selectedExample];

  return (
    <div
      data-interactive="true"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
      }}
      className="rounded-[36px] border p-6 sm:p-10 shadow-2xl shadow-emerald-950/10 backdrop-blur-xl"
    >
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-emerald-500/15">
        <div className="inline-flex p-1 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
          <button
            type="button"
            onClick={() => handleSwitchMode('url')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              inputMode === 'url'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-500 hover:text-emerald-400'
            }`}
          >
            🌐 Paste Website Link
          </button>
          <button
            type="button"
            onClick={() => handleSwitchMode('describe')}
            className={`px-4 py-2 rounded-xl text-xs font-mono font-semibold transition cursor-pointer ${
              inputMode === 'describe'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-emerald-500 hover:text-emerald-400'
            }`}
          >
            ✍️ Describe Your Business
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span
            style={{ color: theme.muted }}
            className="text-xs font-mono mr-1 hidden sm:inline"
          >
            Try sample:
          </span>
          {examples.map((ex, idx) => (
            <button
              key={ex.label}
              type="button"
              onClick={() => handleSelectExample(idx)}
              className={`px-3 py-1.5 rounded-full text-xs font-mono font-semibold transition cursor-pointer ${
                selectedExample === idx
                  ? 'bg-emerald-600 text-white'
                  : 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20'
              }`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          setIsScanning(true);
          setTimeout(() => setIsScanning(false), 450);
        }}
        style={{
          backgroundColor: isDark ? '#070D0A' : '#FFFFFF',
          borderColor: 'rgba(16, 185, 129, 0.35)',
        }}
        className="mt-6 rounded-2xl border p-3.5 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shadow-inner"
      >
        <div className="flex items-center gap-3 flex-1">
          <span className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-mono text-sm font-bold shrink-0">
            {inputMode === 'url' ? '🔗' : '✦'}
          </span>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            style={{ color: theme.text }}
            className="w-full bg-transparent text-xs sm:text-sm font-medium focus:outline-none"
            placeholder={
              inputMode === 'url'
                ? 'https://yourcompany.com — paste your website link...'
                : 'Describe what your business sells and who you help...'
            }
          />
        </div>
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold tracking-wide transition shrink-0 cursor-pointer shadow-md shadow-emerald-600/20"
        >
          {isScanning
            ? 'Analyzing Business & Finding Leads...'
            : 'Scan Business & Get Leads →'}
        </button>
      </form>

      <div
        style={{
          backgroundColor: isDark
            ? 'rgba(16, 185, 129, 0.06)'
            : 'rgba(5, 150, 105, 0.05)',
          borderColor: 'rgba(16, 185, 129, 0.22)',
          opacity: isScanning ? 0.45 : 1,
        }}
        className="mt-6 rounded-2xl border p-4 sm:p-5 grid grid-cols-1 md:grid-cols-2 gap-4 transition-opacity duration-300"
      >
        <div>
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">
            ✓ AI SITE ANALYSIS // WHAT YOU SELL
          </div>
          <div className="text-sm font-bold mt-1">
            {currentExample.extractedOffer}
          </div>
        </div>
        <div className="md:border-l border-emerald-500/15 md:pl-4">
          <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-emerald-500">
            ✓ AUTO-GENERATED IDEAL BUYER PROFILE
          </div>
          <div className="text-sm font-bold mt-1">
            {currentExample.targetICP}
          </div>
        </div>
      </div>

      <div className="mt-6 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono text-emerald-500 px-1">
          <span>MATCHED BUYERS READY FOR OUTREACH</span>
          <span>AI SALES AGENT READY</span>
        </div>

        {currentExample.leads.map((lead) => {
          const isDispatched = dispatchedLeads[lead.company];
          return (
            <div
              key={lead.company}
              style={{
                backgroundColor: isDark ? '#09110D' : '#FFFFFF',
                borderColor: theme.border,
                opacity: isScanning ? 0.4 : 1,
                transform: isScanning ? 'scale(0.99)' : 'scale(1)',
              }}
              className="rounded-2xl border p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 transition-all duration-300"
            >
              <div className="space-y-1 min-w-[230px]">
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold tracking-tight">
                    {lead.company}
                  </span>
                  <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500">
                    {lead.matchScore} Match
                  </span>
                </div>
                <div
                  style={{ color: theme.muted }}
                  className="text-xs font-medium"
                >
                  {lead.decisionMaker}
                </div>
              </div>

              <div className="flex-1 space-y-1">
                <div className="text-xs font-mono text-emerald-500">
                  ⚡ {lead.whyMatched}
                </div>
                <div style={{ color: theme.muted }} className="text-xs">
                  <strong style={{ color: theme.text }}>Sales Agent Plan:</strong>{' '}
                  {lead.agentAction}
                </div>
              </div>

              <div className="flex items-center justify-end pt-3 lg:pt-0 border-t lg:border-t-0 border-emerald-500/10 shrink-0">
                <button
                  type="button"
                  onClick={() =>
                    setDispatchedLeads((prev) => ({
                      ...prev,
                      [lead.company]: true,
                    }))
                  }
                  className={`px-4 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                    isDispatched
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                      : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/20'
                  }`}
                >
                  {isDispatched
                    ? '✓ Sales Agent Pitching'
                    : 'Deploy Sales Agent →'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ==========================================================================
   3. MAGIC UI STYLE "ANIMATED BEAM" SIGNAL-TO-SALES-AGENT FLOW
   ========================================================================== */
function SignalBeamArchitecture({ isDark, theme }) {
  const [hoveredSignal, setHoveredSignal] = useState(null);

  const leftSignals = [
    {
      id: 0,
      label: 'Your Website & Offer',
      sub: 'Pothos learns what you sell automatically',
      y: 65,
    },
    {
      id: 1,
      label: 'Hiring & Expansion Spikes',
      sub: 'Detects new branches & team growth',
      y: 145,
    },
    {
      id: 2,
      label: 'LinkedIn & Web Intent',
      sub: 'Tracks competitor & topic engagement',
      y: 225,
    },
    {
      id: 3,
      label: 'UAE & Global Registries',
      sub: 'New licenses, funding & decision-makers',
      y: 305,
    },
  ];

  const rightOutputs = [
    {
      id: 0,
      label: 'WhatsApp Sales Agent',
      sub: 'Starts natural 1-to-1 WhatsApp threads',
      y: 95,
    },
    {
      id: 1,
      label: 'Hyper-Personalized Email',
      sub: 'Writes custom pitches & follows up',
      y: 185,
    },
    {
      id: 2,
      label: 'Booked Sales Meetings',
      sub: 'Handles objections & books your calendar',
      y: 275,
    },
  ];

  return (
    <div
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
      }}
      className="rounded-[36px] border p-8 sm:p-12 overflow-hidden relative"
    >
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500 mb-4">
            01 // Live Intelligence Inputs
          </div>
          {leftSignals.map((sig) => (
            <div
              key={sig.id}
              data-interactive="true"
              onMouseEnter={() => setHoveredSignal(sig.id)}
              onMouseLeave={() => setHoveredSignal(null)}
              style={{
                backgroundColor: isDark ? '#09110D' : '#FFFFFF',
                borderColor:
                  hoveredSignal === sig.id
                    ? '#10b981'
                    : 'rgba(16, 185, 129, 0.18)',
              }}
              className="p-4 rounded-2xl border transition-all duration-300 cursor-pointer hover:translate-x-1"
            >
              <div className="text-sm font-bold flex items-center justify-between">
                <span>{sig.label}</span>
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
              </div>
              <div style={{ color: theme.muted }} className="text-xs mt-1">
                {sig.sub}
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-4 flex flex-col items-center justify-center relative py-6">
          <svg
            viewBox="0 0 320 360"
            className="w-full max-w-[320px] h-[260px] sm:h-[320px] overflow-visible"
          >
            <defs>
              <linearGradient id="beamGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="rgba(16, 185, 129, 0.15)" />
                <stop offset="50%" stopColor="#10b981" />
                <stop offset="100%" stopColor="rgba(52, 211, 153, 0.15)" />
              </linearGradient>
            </defs>

            {leftSignals.map((sig) => {
              const pathD = `M 0 ${sig.y} C 80 ${sig.y}, 85 180, 160 180`;
              const isHighlighted =
                hoveredSignal === null || hoveredSignal === sig.id;
              return (
                <g
                  key={`left-${sig.id}`}
                  style={{ opacity: isHighlighted ? 1 : 0.25 }}
                >
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.22)"
                    strokeWidth="2"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#beamGrad)"
                    strokeWidth="3"
                    strokeDasharray="18 140"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="158"
                      to="0"
                      dur={`${1.8 + sig.id * 0.25}s`}
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}

            {rightOutputs.map((out) => {
              const pathD = `M 160 180 C 235 180, 240 ${out.y}, 320 ${out.y}`;
              return (
                <g key={`right-${out.id}`}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke="rgba(16, 185, 129, 0.22)"
                    strokeWidth="2"
                  />
                  <path
                    d={pathD}
                    fill="none"
                    stroke="url(#beamGrad)"
                    strokeWidth="3"
                    strokeDasharray="20 140"
                  >
                    <animate
                      attributeName="stroke-dashoffset"
                      from="160"
                      to="0"
                      dur={`${1.7 + out.id * 0.3}s`}
                      repeatCount="indefinite"
                    />
                  </path>
                </g>
              );
            })}

            <g transform="translate(160, 180)">
              <circle
                r="46"
                fill={isDark ? '#06140D' : '#ECFDF5'}
                stroke="#10b981"
                strokeWidth="2"
              />
              <circle
                r="56"
                fill="none"
                stroke="rgba(16, 185, 129, 0.3)"
                strokeWidth="1.2"
                strokeDasharray="4 6"
              >
                <animateTransform
                  attributeName="transform"
                  type="rotate"
                  from="0"
                  to="360"
                  dur="14s"
                  repeatCount="indefinite"
                />
              </circle>
              <text
                textAnchor="middle"
                dy="-2"
                fill="#10b981"
                className="font-mono text-[11px] font-extrabold"
              >
                POTHOS
              </text>
              <text
                textAnchor="middle"
                dy="12"
                fill={isDark ? '#a7f3d0' : '#047857'}
                className="font-mono text-[8px] font-semibold"
              >
                SALES AGENT
              </text>
            </g>
          </svg>
        </div>

        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500 mb-4">
            02 // Autonomous Sales Execution
          </div>
          {rightOutputs.map((out) => (
            <div
              key={out.id}
              style={{
                backgroundColor: isDark ? '#09110D' : '#FFFFFF',
                borderColor: 'rgba(16, 185, 129, 0.24)',
              }}
              className="p-4 rounded-2xl border"
            >
              <div className="text-sm font-bold text-emerald-500">
                {out.label}
              </div>
              <div style={{ color: theme.muted }} className="text-xs mt-1">
                {out.sub}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ==========================================================================
   4. SPOTLIGHT BENTO CARD (ACETERNITY / HOVER.DEV RADIAL CURSOR GLOW)
   ========================================================================== */
function SpotlightCard({
  badge,
  title,
  desc,
  children,
  isDark,
  theme,
  className = '',
}) {
  const cardRef = useRef(null);
  const [pos, setPos] = useState({ x: 0, y: 0, opacity: 0 });

  const handleMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    setPos({
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
      opacity: 1,
    });
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMove}
      onMouseLeave={() => setPos((p) => ({ ...p, opacity: 0 }))}
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
      }}
      className={`relative rounded-[32px] border p-8 sm:p-10 overflow-hidden flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 ${className}`}
    >
      <div
        style={{
          opacity: pos.opacity,
          background: `radial-gradient(420px circle at ${pos.x}px ${pos.y}px, ${
            isDark ? 'rgba(16, 185, 129, 0.14)' : 'rgba(5, 150, 105, 0.09)'
          }, transparent 70%)`,
        }}
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
      />

      <div className="relative z-10">
        <span className="inline-block text-xs font-mono font-bold uppercase tracking-widest text-emerald-500 mb-4">
          {badge}
        </span>
        <h3 className="text-2xl sm:text-3xl font-bold tracking-tight leading-tight">
          {title}
        </h3>
        <p
          style={{ color: theme.muted }}
          className="mt-3 text-sm sm:text-base leading-relaxed"
        >
          {desc}
        </p>
      </div>

      {children && <div className="relative z-10 mt-8">{children}</div>}
    </div>
  );
}

/* ==========================================================================
   5. WORKING BUSINESS WAITLIST ENGINE (CONNECTED TO FORMSPREE)
   Sends Business Name, Work Email, Website, and Requirement directly to
   https://formspree.io/f/xaeebare
   ========================================================================== */
function PothosWaitlistSection({ isDark, theme }) {
  const [businessName, setBusinessName] = useState('');
  const [workEmail, setWorkEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [requirement, setRequirement] = useState(
    'Yes — Our business needs autonomous lead gen & sales right now'
  );
  const [status, setStatus] = useState('idle'); // 'idle' | 'submitting' | 'success' | 'error'

  const requirementOptions = [
    'Yes — Our business needs autonomous lead gen & sales right now',
    'Yes — We want to test Pothos for our sales pipeline next quarter',
    'We’d love a live demo to see how Pothos fits our business',
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!businessName.trim() || !workEmail.trim()) return;

    setStatus('submitting');

    const payload = {
      businessName: businessName.trim(),
      email: workEmail.trim(),
      website: website.trim() || 'Not provided',
      requirement,
      product: 'Pothos AI Lead Gen & Sales Agent',
      submittedAt: new Date().toISOString(),
    };

    try {
      const response = await fetch(WAITLIST_WEBHOOK_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus('success');
        setBusinessName('');
        setWorkEmail('');
        setWebsite('');
      } else {
        setStatus('error');
      }
    } catch (err) {
      console.error('Formspree submission error:', err);
      setStatus('error');
    }
  };

  return (
    <div
      data-interactive="true"
      style={{
        backgroundColor: theme.card,
        borderColor: theme.border,
      }}
      className="max-w-3xl mx-auto rounded-[40px] border p-8 sm:p-12 text-left shadow-2xl shadow-emerald-950/10 relative overflow-hidden"
    >
      {status === 'success' ? (
        <div className="py-10 text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-500 flex items-center justify-center mx-auto text-2xl font-bold">
            ✓
          </div>
          <div className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500">
            PRIORITY ACCESS RESERVED
          </div>
          <h3 className="text-3xl sm:text-4xl font-bold tracking-tight">
            Your business is on the Pothos waitlist.
          </h3>
          <p
            style={{ color: theme.muted }}
            className="text-base sm:text-lg max-w-lg mx-auto"
          >
            We’ve recorded your company details. Our founding team will reach out to onboard your business onto Pothos.
          </p>
          <div className="pt-4 flex items-center justify-center">
            <button
              type="button"
              onClick={() => setStatus('idle')}
              className="px-6 py-2.5 rounded-full text-xs font-mono font-semibold bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20 transition cursor-pointer"
            >
              + Register Another Business
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-emerald-500/15">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-emerald-500">
              ● EARLY ACCESS WAITLIST FOR BUSINESSES
            </span>
            <span
              style={{ color: theme.muted }}
              className="text-xs font-mono"
            >
              Takes 15 seconds
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Business Name */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider mb-2">
                Business / Company Name *
              </label>
              <input
                type="text"
                name="businessName"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Acme Hospitality Dubai"
                style={{
                  backgroundColor: isDark ? '#070D0A' : '#FFFFFF',
                  borderColor: theme.border,
                  color: theme.text,
                }}
                className="w-full px-4 py-3.5 rounded-2xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>

            {/* Work Email */}
            <div>
              <label className="block text-xs font-mono font-semibold uppercase tracking-wider mb-2">
                Work Email *
              </label>
              <input
                type="email"
                name="email"
                required
                value={workEmail}
                onChange={(e) => setWorkEmail(e.target.value)}
                placeholder="you@company.com"
                style={{
                  backgroundColor: isDark ? '#070D0A' : '#FFFFFF',
                  borderColor: theme.border,
                  color: theme.text,
                }}
                className="w-full px-4 py-3.5 rounded-2xl border text-sm focus:outline-none focus:border-emerald-500 transition"
              />
            </div>
          </div>

          {/* Optional Company Website */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider mb-2">
              Company Website (Optional)
            </label>
            <input
              type="text"
              name="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://yourbusiness.com"
              style={{
                backgroundColor: isDark ? '#070D0A' : '#FFFFFF',
                borderColor: theme.border,
                color: theme.text,
              }}
              className="w-full px-4 py-3.5 rounded-2xl border text-sm focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          {/* Requirement Question */}
          <div>
            <label className="block text-xs font-mono font-semibold uppercase tracking-wider mb-3">
              Is autonomous lead generation &amp; AI sales something your business requires?
            </label>
            <div className="space-y-2.5">
              {requirementOptions.map((opt) => {
                const active = requirement === opt;
                return (
                  <button
                    key={opt}
                    type="button"
                    onClick={() => setRequirement(opt)}
                    style={{
                      backgroundColor: active
                        ? 'rgba(16, 185, 129, 0.12)'
                        : isDark
                        ? '#070D0A'
                        : '#FFFFFF',
                      borderColor: active ? '#10b981' : theme.border,
                      color: theme.text,
                    }}
                    className="w-full px-4 py-3.5 rounded-2xl border text-left text-xs sm:text-sm font-medium flex items-center justify-between gap-3 transition cursor-pointer"
                  >
                    <span>{opt}</span>
                    <span
                      className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                        active
                          ? 'border-emerald-500 bg-emerald-500 text-white'
                          : 'border-emerald-500/40'
                      }`}
                    >
                      {active && (
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {status === 'error' && (
            <p className="text-xs font-mono text-rose-500">
              Something went wrong while submitting. Please check your connection and try again.
            </p>
          )}

          <div className="pt-2">
            <button
              type="submit"
              disabled={status === 'submitting'}
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-sm sm:text-base font-semibold shadow-xl shadow-emerald-600/25 hover:scale-[1.02] active:scale-95 transition-all cursor-pointer"
            >
              {status === 'submitting'
                ? 'Saving Your Spot...'
                : 'Join the Pothos Waitlist →'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

/* ==========================================================================
   6. MAIN POTHOS PAGE COMPONENT
   ========================================================================== */
export default function PothosPage({
  isDark,
  theme,
  onBackHome,
  ScrollSection,
  ScrollScrubText,
}) {
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, []);

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="relative z-10">
      {/* Sticky Top Navigation Bar */}
      <header className="fixed top-6 left-6 z-50 flex items-center gap-3">
        <button
          type="button"
          onClick={onBackHome}
          data-interactive="true"
          style={{
            backgroundColor: isDark
              ? 'rgba(18, 29, 23, 0.85)'
              : 'rgba(255, 255, 255, 0.85)',
            borderColor: theme.border,
            color: theme.text,
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-full border backdrop-blur-xl shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer text-xs font-semibold"
        >
          <span>←</span>
          <span>CHEDY.NET</span>
        </button>

        <button
          type="button"
          onClick={() => scrollToSection('pothos-waitlist')}
          data-interactive="true"
          className="hidden sm:inline-flex items-center gap-1.5 px-4 py-2.5 rounded-full text-xs font-mono font-semibold bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg transition cursor-pointer"
        >
          <span>Join Waitlist →</span>
        </button>
      </header>

      {/* SECTION 1: POTHOS HERO */}
      <section className="relative min-h-screen flex flex-col items-center justify-between py-16 px-6 text-center">
        <div
          style={{ color: theme.muted }}
          className="text-xs font-semibold tracking-[0.28em] uppercase mt-10 sm:mt-0"
        >
          A CHEDY ORIGINAL PRODUCT
        </div>

        <div className="w-full my-auto py-8">
          <PothosHeroTitle isDark={isDark} />

          <div className="mt-4 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-500 text-xs font-mono font-semibold">
            <span>● AUTONOMOUS LEAD GENERATION &amp; AI SALES AGENT</span>
          </div>

          <h1 className="mt-6 text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight max-w-4xl mx-auto leading-[1.08]">
            The money plant for{' '}
            <span className="text-emerald-500">your revenue.</span>
          </h1>

          <p
            style={{ color: theme.muted }}
            className="mt-5 text-base sm:text-xl max-w-2xl mx-auto font-normal leading-relaxed"
          >
            Paste your website link or describe your business. Pothos studies what you sell, finds companies that need you right now, and deploys an AI sales agent to book meetings for you.
          </p>
        </div>

        <button
          type="button"
          onClick={() => scrollToSection('pothos-story')}
          data-interactive="true"
          style={{ color: theme.muted }}
          className="inline-flex flex-col items-center gap-2 text-xs font-medium tracking-widest uppercase hover:text-emerald-500 transition cursor-pointer bg-transparent border-0"
        >
          <span>Explore Pothos</span>
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

      {/* SECTION 2: THE MANIFESTO — FAST GROWTH & THE "MONEY PLANT" */}
      <section
        id="pothos-story"
        className="min-h-screen flex items-center justify-center py-28 px-6 sm:px-12"
      >
        <div className="max-w-5xl mx-auto">
          <ScrollSection>
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-8">
              Why We Named It Pothos
            </div>
          </ScrollSection>

          <ScrollScrubText
            isDark={isDark}
            highlightWords={[
              'pothos',
              'fastest-growing',
              'money',
              'plant',
              'leads',
              'revenue',
            ]}
            text="Pothos is one of the fastest growing creeper vines on earth and across our region, it is known as the Money Plant. We built Pothos to do the exact same thing for your business: spread rapidly into new markets, find high intent buyers, and generate revenue non stop."
          />
        </div>
      </section>

      {/* SECTION 3: PASTE YOUR WEBSITE LINK OR DESCRIBE YOUR BUSINESS */}
      <section className="min-h-screen flex items-center justify-center py-28 px-6 sm:px-12">
        <div className="max-w-6xl w-full mx-auto">
          <ScrollSection className="max-w-3xl mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
              01 / Zero-Setup Lead Discovery
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.06]">
              Drop your website link.
              <br />
              <span className="text-emerald-500">
                Pothos finds your buyers.
              </span>
            </h2>
            <p
              style={{ color: theme.muted }}
              className="mt-5 text-base sm:text-xl"
            >
              You don’t even need to know how to build lead lists. Just paste your company URL or describe your business in a sentence and Pothos figures out who your ideal customers are, finds their verified contact info, and starts pitching them.
            </p>
          </ScrollSection>

          <ScrollSection delay={50}>
            <BusinessToLeadsEngine isDark={isDark} theme={theme} />
          </ScrollSection>
        </div>
      </section>

      {/* SECTION 4: GOJIBERRY-STYLE ANIMATED SIGNAL BEAM ARCHITECTURE */}
      <section className="min-h-screen flex items-center justify-center py-28 px-6 sm:px-12">
        <div className="max-w-6xl w-full mx-auto">
          <ScrollSection className="max-w-3xl mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
              02 / Autonomous Sales Agent
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.06]">
              From buying signal to
              <br />
              <span className="text-emerald-500">booked meeting.</span>
            </h2>
            <p
              style={{ color: theme.muted }}
              className="mt-5 text-base sm:text-xl"
            >
              Pothos doesn’t just hand you a static list of names. Its AI sales agent reaches out at the exact moment a company shows buying intent, holds natural conversations, and books meetings straight onto your calendar.
            </p>
          </ScrollSection>

          <ScrollSection delay={50}>
            <SignalBeamArchitecture isDark={isDark} theme={theme} />
          </ScrollSection>
        </div>
      </section>

      {/* SECTION 5: SPOTLIGHT BENTO GRID (CORE CAPABILITIES) */}
      <section className="min-h-screen flex items-center justify-center py-28 px-6 sm:px-12">
        <div className="max-w-6xl w-full mx-auto">
          <ScrollSection className="max-w-3xl mb-14">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
              03 / How Pothos Works
            </div>
            <h2 className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.06]">
              Relentless lead generation.
              <br />
              <span className="text-emerald-500">Human level sales outreach.</span>
            </h2>
          </ScrollSection>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <ScrollSection delay={20} className="md:col-span-7">
              <SpotlightCard
                isDark={isDark}
                theme={theme}
                badge="WATERFALL ENRICHMENT"
                title="Multi-Source Contact Verification."
                desc="Instead of relying on a single outdated database, Pothos cascades across multiple global and regional data providers—verifying decision-maker emails, LinkedIn profiles, and direct WhatsApp numbers in real time."
                className="h-full"
              >
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-emerald-500/15 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <div className="font-bold">STEP 01</div>
                    <div className="text-[11px] opacity-80">Scan Your Site</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <div className="font-bold">STEP 02</div>
                    <div className="text-[11px] opacity-80">Verify Contacts</div>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-500">
                    <div className="font-bold">STEP 03</div>
                    <div className="text-[11px] opacity-80">Pitch &amp; Book</div>
                  </div>
                </div>
              </SpotlightCard>
            </ScrollSection>

            <ScrollSection delay={60} className="md:col-span-5">
              <SpotlightCard
                isDark={isDark}
                theme={theme}
                badge="UAE & GLOBAL CHANNELS"
                title="Native WhatsApp, LinkedIn &amp; Email."
                desc="In the UAE, deals close on WhatsApp. Pothos’s AI sales agent natively starts and replies to conversations across WhatsApp, LinkedIn, and Email so you meet buyers where they actually reply."
                className="h-full"
              >
                <div className="flex flex-wrap gap-2 pt-4 border-t border-emerald-500/15">
                  {['WhatsApp Outreach', 'LinkedIn Sequences', 'Smart Email'].map(
                    (tag) => (
                      <span
                        key={tag}
                        className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/10 text-emerald-500"
                      >
                        {tag}
                      </span>
                    )
                  )}
                </div>
              </SpotlightCard>
            </ScrollSection>

            <ScrollSection delay={80} className="md:col-span-5">
              <SpotlightCard
                isDark={isDark}
                theme={theme}
                badge="24/7 AI SALES AGENT"
                title="Handles Replies &amp; Books Calls."
                desc="When a prospect replies with a question about pricing or how your service works, the Pothos sales agent answers using the knowledge from your website and locks in a meeting on your calendar."
                className="h-full"
              />
            </ScrollSection>

            <ScrollSection delay={110} className="md:col-span-7">
              <SpotlightCard
                isDark={isDark}
                theme={theme}
                badge="DEEP PROSPECT RESEARCH"
                title="1 to 1 Custom Pitches for Every Lead."
                desc="No generic spam templates. Before messaging a prospect, Pothos reads their website, recent news, and open job roles, writing a tailored pitch that connects what you sell to what they need right now."
                className="h-full"
              />
            </ScrollSection>
          </div>
        </div>
      </section>

      {/* SECTION 6: WORKING WAITLIST & EARLY ACCESS SIGNUP */}
      <section
        id="pothos-waitlist"
        style={{ backgroundColor: theme.bgSubtle }}
        className="py-32 px-6 sm:px-12 text-center border-t border-emerald-500/15"
      >
        <ScrollSection className="max-w-4xl mx-auto">
          <div className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-emerald-500 mb-4">
            POTHOS WAITLIST
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-7xl font-bold tracking-tight leading-[1.06]">
            Does your business need
            <br />
            <span className="text-emerald-500">more qualified leads?</span>
          </h2>
          <p
            style={{ color: theme.muted }}
            className="mt-6 text-lg sm:text-xl max-w-2xl mx-auto mb-12"
          >
            Join the priority waitlist below. Tell us your business name and email, and we’ll onboard you for early access.
          </p>

          <PothosWaitlistSection isDark={isDark} theme={theme} />

          <div className="mt-14">
            <button
              type="button"
              onClick={onBackHome}
              data-interactive="true"
              style={{
                borderColor: theme.border,
                color: theme.text,
              }}
              className="inline-flex items-center gap-2 px-7 py-4 rounded-full border text-sm sm:text-base font-semibold hover:border-emerald-500 hover:text-emerald-500 transition cursor-pointer"
            >
              <span>← Back to Top of CHEDY.NET</span>
            </button>
          </div>
        </ScrollSection>
      </section>
    </div>
  );
}