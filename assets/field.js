(function () {
  "use strict";

  // A point cloud that morphs between three formations and names what you are
  // looking at, one short line at a time.
  //   1. five separate systems
  //   2. the objects they resolve into
  //   3. the links you can then walk
  // Live canvas rather than a video: nothing to encode, sharp at any size.

  const TAU = Math.PI * 2;
  const HOLD = 1500;   // a formation is only legible for a moment
  const MORPH = 3600;  // most of the time it is on its way somewhere
  const OPEN = HOLD + MORPH * 0.45; // the page loads mid-move, never still
  const STEP = HOLD + MORPH;

  const TINT = ["#4e8df5", "#8f74e8", "#2fb45e", "#e0a01a", "#e8699a", "#2fc79a", "#e2552a"];
  const EDGES = [[6, 0], [1, 0], [1, 2], [0, 3], [0, 4], [4, 5]];
  const GRAPH = [[0, 0], [-250, -150], [-330, 130], [-30, 215], [250, -165], [340, 95], [10, -230]];

  const SHOTS = [
    { label: "Five systems", at: 0.12 },
    { label: "Every record you have", at: 0.3 },
    { label: "One object", at: 0.5 },
  ];

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  const easeInOut = (u) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

  function build(canvas) {
    const g = canvas.getContext("2d", { alpha: false });
    let W = 0, H = 0, N = 0;
    let forms = [];      // [formation][point] = {x, y, tint}
    let anchors = [];    // one point index per formation, for the leader line
    let cur = null;      // current drawn positions

    let seed = 1;
    const rnd = () => (seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296;

    function layout() {
      const box = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = Math.max(1, Math.round(box.width));
      H = Math.max(1, Math.round(box.height));
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      g.setTransform(dpr, 0, 0, dpr, 0, 0);

      const cx = W * 0.5;
      const cy = H * 0.5;
      const s = W / 1500;
      N = Math.round(Math.min(16000, Math.max(4200, (W * H) / 85)));

      seed = 1;
      const a = [], b = [], c = [];

      // 1. Five systems: five slabs of rows spanning the whole frame.
      for (let i = 0; i < N; i++) {
        const sys = i % 5;
        const rows = 34;
        const r = Math.floor(rnd() * rows);
        a.push({
          x: W * (0.07 + sys * 0.215) + (rnd() - 0.5) * W * 0.145,
          y: cy + (r - rows / 2) * (H / 46) + (rnd() - 0.5) * 4,
          tint: -1,
        });
      }

      // 2. Every record: a terrain of marks spanning the frame.
      seed = 23;
      const cols = 150;
      const rowsT = Math.ceil(N / cols);
      for (let i = 0; i < N; i++) {
        const gx = i % cols, gz = Math.floor(i / cols);
        const depth = gz / Math.max(1, rowsT);
        const persp = 0.28 + depth * 0.72;
        const wob = Math.sin(gx * 0.11 + gz * 0.17) * 30 + Math.cos(gx * 0.05 - gz * 0.23) * 20;
        b.push({
          x: cx + (gx - cols / 2) * (W / cols) * 1.22 * persp,
          y: cy + H * 0.36 - depth * H * 0.62 + wob * s * persp * 1.4,
          tint: gx % 29 === 0 ? (gx / 29) % 5 : -1,
        });
      }

      // 3. One object: everything draws into a single standing column.
      seed = 41;
      for (let i = 0; i < N; i++) {
        const u = rnd();
        const r = Math.pow(rnd(), 0.6) * W * 0.045;
        const ang = rnd() * TAU;
        c.push({
          x: cx + Math.cos(ang) * r,
          y: cy - H * 0.3 + u * H * 0.6 + Math.sin(ang) * r * 0.25,
          tint: -1,
        });
      }

      forms = [a, b, c];
      anchors = SHOTS.map((shot, f) => Math.min(forms[f].length - 1, Math.round(forms[f].length * shot.at)));

      seed = 5;
      cur = new Array(N);
      for (let i = 0; i < N; i++) {
        cur[i] = {
          x: a[i].x, y: a[i].y,
          size: rnd() < 0.07 ? 1.8 : rnd() < 0.38 ? 1.2 : 0.85,
          bright: 0.16 + Math.pow(rnd(), 1.8),
          drift: rnd() * TAU,
          speed: 0.4 + rnd() * 1.1,
        };
      }
    }

    function draw(raw) {
      const now = raw + OPEN;
      const cycle = now % (STEP * forms.length);
      const idx = Math.floor(cycle / STEP);
      const within = cycle - idx * STEP;
      const t = within < HOLD ? 0 : easeInOut((within - HOLD) / MORPH);
      const from = forms[idx];
      const to = forms[(idx + 1) % forms.length];

      g.fillStyle = "#000";
      g.fillRect(0, 0, W, H);

      g.globalCompositeOperation = "lighter";
      for (let i = 0; i < N; i++) {
        const p = cur[i], f = from[i], o = to[i];
        const wob = now * 0.00022 * p.speed + p.drift;
        const flow = Math.sin(now * 0.00009 + p.drift) * 14;
        const x = f.x + (o.x - f.x) * t + Math.sin(wob) * 3 + flow;
        const y = f.y + (o.y - f.y) * t + Math.cos(wob) * 2.4;
        p.x = x; p.y = y;

        // Colour belongs to the formation that has it, and fades across a morph.
        const tintFrom = f.tint, tintTo = o.tint;
        if (tintFrom >= 0 && t < 1) {
          g.globalAlpha = p.bright * (1 - t) * 0.85;
          g.fillStyle = TINT[tintFrom];
          g.fillRect(x, y, p.size + 0.4, p.size + 0.4);
        }
        if (tintTo >= 0 && t > 0) {
          g.globalAlpha = p.bright * t * 0.85;
          g.fillStyle = TINT[tintTo];
          g.fillRect(x, y, p.size + 0.4, p.size + 0.4);
        }
        if (tintFrom < 0 || tintTo < 0) {
          const plain = (tintFrom < 0 ? 1 - t : 0) + (tintTo < 0 ? t : 0);
          g.globalAlpha = p.bright * plain * 0.7;
          g.fillStyle = "#c3d6e6";
          g.fillRect(x, y, p.size, p.size);
        }
      }
      g.globalAlpha = 1;
      g.globalCompositeOperation = "source-over";

      // One annotation at a time, on a leader line, the way a drawing labels
      // the thing it is pointing at.
      const fade = within < HOLD
        ? Math.min(1, within / 700) * Math.min(1, (HOLD - within) / 700)
        : 0;
      if (fade > 0.01) {
        const p = cur[anchors[idx]];
        const right = p.x < W * 0.74;
        const lx = p.x + (right ? 54 : -54);
        const ly = p.y - 42;
        g.globalAlpha = fade * 0.5;
        g.strokeStyle = "#dfe9f2";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(p.x, p.y);
        g.lineTo(lx, ly);
        g.lineTo(lx + (right ? 16 : -16), ly);
        g.stroke();
        g.globalAlpha = fade * 0.92;
        g.fillStyle = "#eef4fa";
        g.font = '400 15px "Helvetica Neue", -apple-system, Arial, sans-serif';
        g.textAlign = right ? "left" : "right";
        g.fillText(SHOTS[idx].label, lx + (right ? 24 : -24), ly + 5);
        g.globalAlpha = 1;
        g.textAlign = "left";
      }
    }

    let raf = 0, running = false;
    const tick = (now) => { draw(now); raf = requestAnimationFrame(tick); };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    layout();
    if (calm.matches) draw(0); else start();

    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        layout();
        if (calm.matches || !running) draw(0);
      }, 160);
    });

    if ("IntersectionObserver" in window && !calm.matches) {
      new IntersectionObserver((es) => {
        es.forEach((e) => (e.isIntersecting ? start() : stop()));
      }, { rootMargin: "120px" }).observe(canvas);
    }
  }

  document.querySelectorAll("canvas[data-field]").forEach(build);
})();
