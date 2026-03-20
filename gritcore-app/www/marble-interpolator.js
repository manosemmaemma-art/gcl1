// ── Marble Interpolator ──
// Generates 4 marble canvases (dawn → midday → dusk → night) and
// cross-fades between them based on the current hour.
// Vein style inspired by: bold dark veins on white, bright silver on black.

const MarbleInterpolator = (() => {
  const STOPS = [
    {
      // DAWN — pure white with dramatic dark charcoal veins (like Calacatta)
      hour: 6,
      bg: ['#f7f4f0', '#f2ede7', '#f5f1ea', '#efe9e1'],
      veinColor: '38,30,22',      // deep charcoal-brown veins
      veinAlpha: 0.72,            // bold opacity
      veinWidth: 3.2,             // thicker primary veins
      subVeinColor: '60,48,36',
      subVeinAlpha: 0.38,
      goldVein: true,
      grainAmt: 14,
      dark: false,
    },
    {
      // MIDDAY — warm stone/beige with medium grey veins (Crema Marfil)
      hour: 12,
      bg: ['#d8cfc4', '#d2c8bc', '#d5ccbf', '#cfc5b8'],
      veinColor: '72,58,44',
      veinAlpha: 0.55,
      veinWidth: 2.4,
      subVeinColor: '90,74,58',
      subVeinAlpha: 0.28,
      goldVein: false,
      grainAmt: 13,
      dark: false,
    },
    {
      // DUSK — deep grey with silver veins
      hour: 18,
      bg: ['#5a5450', '#524e4a', '#565250', '#4e4a46'],
      veinColor: '195,188,178',   // bright silver veins on dark bg
      veinAlpha: 0.65,
      veinWidth: 2.8,
      subVeinColor: '220,215,205',
      subVeinAlpha: 0.32,
      goldVein: false,
      grainAmt: 11,
      dark: true,
    },
    {
      // NIGHT — deep black with dramatic bright silver-white veins (Nero Marquina)
      hour: 22,
      bg: ['#141210', '#0e0c0a', '#121008', '#100e0c'],
      veinColor: '220,215,205',   // bright silver-white veins
      veinAlpha: 0.80,            // very visible on black
      veinWidth: 3.6,             // boldest veins
      subVeinColor: '240,236,228',
      subVeinAlpha: 0.42,
      goldVein: true,             // subtle gold vein on night marble (premium feel)
      grainAmt: 9,
      dark: true,
    },
  ];

  let canvases = [];
  let intervalId = null;

  function rng(s) {
    const x = Math.sin(s) * 43758.5453;
    return x - Math.floor(x);
  }

  function drawMarbleCanvas(cv, stop) {
    const W = cv.width = window.innerWidth * 2;
    const H = cv.height = window.innerHeight * 2;
    cv.style.width = '100%';
    cv.style.height = '100%';
    const ctx = cv.getContext('2d');

    // ── Base gradient ──
    const g = ctx.createLinearGradient(0, 0, W * 0.8, H);
    const bg = stop.bg;
    g.addColorStop(0,   bg[0]);
    g.addColorStop(0.35, bg[1]);
    g.addColorStop(0.65, bg[2]);
    g.addColorStop(1,   bg[3]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // ── Subtle tonal variation patches ──
    for (let p = 0; p < 10; p++) {
      const px = rng(p * 9 + 1) * W;
      const py = rng(p * 9 + 2) * H;
      const pr = rng(p * 9 + 3) * 320 + 120;
      const pg = ctx.createRadialGradient(px, py, 0, px, py, pr);
      const a = rng(p * 9 + 4) * 0.06 + 0.02;
      if (stop.dark) {
        pg.addColorStop(0, `rgba(30,24,18,${a * 2.5})`);
        pg.addColorStop(1, 'rgba(0,0,0,0)');
      } else {
        pg.addColorStop(0, `rgba(130,115,95,${a})`);
        pg.addColorStop(1, 'rgba(255,255,255,0)');
      }
      ctx.fillStyle = pg;
      ctx.fillRect(0, 0, W, H);
    }

    ctx.lineCap = 'round';
    const vRgb = stop.veinColor;
    const vA   = stop.veinAlpha;
    const vW   = stop.veinWidth;

    // ── PRIMARY VEINS — bold, dramatic, branching ──
    for (let v = 0; v < 14; v++) {
      const s = v * 191 + 7;
      const x0 = rng(s)     * W * 1.8 - W * 0.4;
      const y0 = rng(s + 1) * H * 1.8 - H * 0.4;
      const x1 = rng(s + 2) * W * 1.8 - W * 0.4;
      const y1 = rng(s + 3) * H * 1.8 - H * 0.4;
      const cp1x = rng(s + 4) * W, cp1y = rng(s + 5) * H;
      const cp2x = rng(s + 6) * W, cp2y = rng(s + 7) * H;
      const w = (rng(s + 8) * 1.8 + 0.9) * vW;
      const a = (rng(s + 9) * 0.5 + 0.5) * vA; // high alpha — bold veins

      // Core vein stroke
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x1, y1);
      ctx.strokeStyle = `rgba(${vRgb},${a})`;
      ctx.lineWidth = w;
      ctx.stroke();

      // Inner highlight (thin bright line inside the vein — gives depth)
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, x1, y1);
      const hlRgb = stop.dark ? '255,252,245' : '20,14,8';
      ctx.strokeStyle = `rgba(${hlRgb},${a * 0.18})`;
      ctx.lineWidth = w * 0.18;
      ctx.stroke();

      // Branch veins off the primary
      for (let b = 0; b < 5; b++) {
        const t = rng(s + 10 + b) * 0.75 + 0.12;
        const mt = 1 - t;
        const bx = mt*mt*mt*x0 + 3*mt*mt*t*cp1x + 3*mt*t*t*cp2x + t*t*t*x1;
        const by = mt*mt*mt*y0 + 3*mt*mt*t*cp1y + 3*mt*t*t*cp2y + t*t*t*y1;
        const blen = rng(s + 14 + b) * 220 + 60;
        const bang  = rng(s + 18 + b) * Math.PI * 2;
        const bwid  = (rng(s + 22 + b) * 0.9 + 0.3) * vW;
        const ba    = a * (rng(s + 26 + b) * 0.4 + 0.35);

        ctx.beginPath();
        ctx.moveTo(bx, by);
        ctx.quadraticCurveTo(
          bx + Math.cos(bang) * blen * 0.55 + (rng(s + 30 + b) - 0.5) * 90,
          by + Math.sin(bang) * blen * 0.55 + (rng(s + 34 + b) - 0.5) * 90,
          bx + Math.cos(bang) * blen,
          by + Math.sin(bang) * blen
        );
        ctx.strokeStyle = `rgba(${vRgb},${ba})`;
        ctx.lineWidth = bwid;
        ctx.stroke();
      }
    }

    // ── SECONDARY VEINS — finer network ──
    const sv = stop.subVeinColor;
    const sa = stop.subVeinAlpha;
    for (let v = 0; v < 28; v++) {
      const s = v * 317 + 99;
      const x0  = rng(s)     * W * 1.6 - W * 0.3;
      const y0  = rng(s + 1) * H * 1.6 - H * 0.3;
      const x1  = rng(s + 2) * W * 1.6 - W * 0.3;
      const y1  = rng(s + 3) * H * 1.6 - H * 0.3;
      const cp1x = rng(s + 4) * W, cp1y = rng(s + 5) * H;
      const w   = (rng(s + 6) * 0.8 + 0.2) * (vW * 0.45);
      const a   = (rng(s + 7) * 0.55 + 0.25) * sa;

      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.quadraticCurveTo(cp1x, cp1y, x1, y1);
      ctx.strokeStyle = `rgba(${sv},${a})`;
      ctx.lineWidth = w;
      ctx.stroke();
    }

    // ── MICRO CRACKS — adds realism ──
    for (let c = 0; c < 40; c++) {
      const s = c * 179 + 333;
      const cx0  = rng(s) * W, cy0 = rng(s + 1) * H;
      const clen = rng(s + 2) * 110 + 20;
      const cang = rng(s + 3) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx0, cy0);
      ctx.lineTo(cx0 + Math.cos(cang) * clen, cy0 + Math.sin(cang) * clen);
      ctx.strokeStyle = `rgba(${vRgb},${(rng(s + 4) * 0.18 + 0.06) * sa})`;
      ctx.lineWidth = rng(s + 5) * 0.55 + 0.08;
      ctx.stroke();
    }

    // ── GOLD VEIN — one thin diagonal gold thread (premium signature) ──
    if (stop.goldVein) {
      const gx0 = W * 0.05, gy0 = H * (rng(101) * 0.3 + 0.1);
      const gx1 = W * 0.95, gy1 = H * (rng(102) * 0.3 + 0.55);
      const gcx = W * (rng(103) * 0.4 + 0.3), gcy = H * (rng(104) * 0.5 + 0.2);

      // Glow pass
      ctx.beginPath();
      ctx.moveTo(gx0, gy0);
      ctx.quadraticCurveTo(gcx, gcy, gx1, gy1);
      ctx.strokeStyle = stop.dark
        ? 'rgba(201,168,76,0.18)'
        : 'rgba(140,100,30,0.14)';
      ctx.lineWidth = 6;
      ctx.stroke();

      // Core gold line
      ctx.beginPath();
      ctx.moveTo(gx0, gy0);
      ctx.quadraticCurveTo(gcx, gcy, gx1, gy1);
      ctx.strokeStyle = stop.dark
        ? 'rgba(218,185,95,0.55)'
        : 'rgba(120,85,22,0.42)';
      ctx.lineWidth = 1.4;
      ctx.stroke();
    }

    // ── FILM GRAIN ──
    const id = ctx.getImageData(0, 0, W, H);
    const px = id.data;
    const g2 = stop.grainAmt;
    for (let i = 0; i < px.length; i += 4) {
      const gr = (Math.random() - 0.5) * g2;
      px[i]     = Math.max(0, Math.min(255, px[i]     + gr));
      px[i + 1] = Math.max(0, Math.min(255, px[i + 1] + gr * 0.92));
      px[i + 2] = Math.max(0, Math.min(255, px[i + 2] + gr * 0.86));
    }
    ctx.putImageData(id, 0, 0);
  }

  // Compute blend weights for the 4 stops given current hour
  function getWeights(hour) {
    const extHours = [6, 12, 18, 22, 30]; // 30 = next-day 6am
    const weights  = [0, 0, 0, 0];
    let h = hour < 6 ? hour + 24 : hour;

    for (let i = 0; i < 4; i++) {
      const a = extHours[i], b = extHours[i + 1];
      if (h >= a && h < b) {
        const t = (h - a) / (b - a);
        weights[i]           = 1 - t;
        weights[(i + 1) % 4] = t;
        return weights;
      }
    }
    weights[0] = 1;
    return weights;
  }

  function updateOpacities() {
    const hour = new Date().getHours();
    const weights = getWeights(hour);
    const isDark = weights[2] + weights[3] >= 0.5;
    document.body.classList.toggle('dark', isDark);
    canvases.forEach((cv, i) => {
      cv.style.transition = 'opacity 90s ease';
      cv.style.opacity    = weights[i];
    });
  }

  function init() {
    const container = document.getElementById('marble-layers');
    if (!container) return;
    container.innerHTML = '';
    canvases = [];

    STOPS.forEach((stop, i) => {
      const cv = document.createElement('canvas');
      cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;opacity:0;filter:blur(2.8px);transform:scale(1.025);';
      container.appendChild(cv);
      canvases.push(cv);

      // Stagger so main thread isn't blocked all at once
      setTimeout(() => {
        drawMarbleCanvas(cv, stop);
        if (i === STOPS.length - 1) {
          // Apply initial opacities without transition (instant snap to correct time)
          canvases.forEach(c => { c.style.transition = 'none'; });
          updateOpacities();
          setTimeout(() => {
            canvases.forEach(c => { c.style.transition = 'opacity 90s ease'; });
          }, 200);
        }
      }, i * 400); // 400ms stagger between each canvas
    });

    if (intervalId) clearInterval(intervalId);
    intervalId = setInterval(updateOpacities, 60000);
  }

  // Draw a single canvas (for onboarding background — uses current time's dominant stop)
  function drawSingle(cv) {
    const hour = new Date().getHours();
    const weights = getWeights(hour);
    const dominantIdx = weights.indexOf(Math.max(...weights));
    drawMarbleCanvas(cv, STOPS[dominantIdx]);
  }

  return { init, drawSingle, getWeights };
})();
