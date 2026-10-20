(function () {
  "use strict";

  // Small animated diagrams. Each one makes a single point and carries almost
  // no text, so it can be understood without being read.

  const calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  const TINT = ["#4e8df5", "#8f74e8", "#2fb45e", "#e0a01a", "#e8699a"];

  function fit(canvas, g) {
    const box = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(box.width));
    const h = Math.max(1, Math.round(box.height));
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    g.setTransform(dpr, 0, 0, dpr, 0, 0);
    return [w, h];
  }

  function label(g, text, x, y, align) {
    g.font = '500 10px ui-monospace, SFMono-Regular, Menlo, monospace';
    g.textAlign = align || "left";
    g.fillText(text, x, y);
    g.textAlign = "left";
  }

  // Records leave five systems and arrive as one object.
  function resolve(canvas) {
    const g = canvas.getContext("2d", { alpha: false });
    let W, H, dots = [];

    function layout() {
      [W, H] = fit(canvas, g);
      const lx = W * 0.16, rx = W * 0.84;
      dots = [];
      for (let i = 0; i < 160; i++) {
        const sys = i % 5;
        dots.push({
          sys,
          y0: H * (0.2 + sys * 0.15),
          phase: (i / 160 + sys * 0.07) % 1,
          speed: 0.55 + (i % 7) * 0.07,
          lx, rx,
        });
      }
    }

    function draw(now) {
      g.fillStyle = "#080808";
      g.fillRect(0, 0, W, H);
      const lx = W * 0.16, rx = W * 0.84, my = H * 0.5;

      // The five systems, and the one object they resolve into.
      for (let s = 0; s < 5; s++) {
        const y = H * (0.2 + s * 0.15);
        g.fillStyle = TINT[s];
        g.globalAlpha = 0.9;
        g.fillRect(lx - 16, y - 5, 10, 10);
        g.globalAlpha = 0.16;
        g.strokeStyle = "#8d8d8d";
        g.lineWidth = 1;
        g.beginPath();
        g.moveTo(lx, y);
        g.bezierCurveTo(W * 0.45, y, W * 0.55, my, rx, my);
        g.stroke();
      }
      g.globalAlpha = 1;

      for (const d of dots) {
        const u = ((now * 0.00009 * d.speed) + d.phase) % 1;
        const t = u, mt = 1 - t;
        const x = mt * mt * mt * lx + 3 * mt * mt * t * (W * 0.45) + 3 * mt * t * t * (W * 0.55) + t * t * t * rx;
        const y = mt * mt * mt * d.y0 + 3 * mt * mt * t * d.y0 + 3 * mt * t * t * my + t * t * t * my;
        g.globalAlpha = 0.25 + 0.75 * Math.sin(Math.PI * u);
        g.fillStyle = TINT[d.sys];
        g.fillRect(x - 1, y - 1, 2.4, 2.4);
      }
      g.globalAlpha = 1;

      const pulse = 1 + 0.12 * Math.sin(now * 0.002);
      g.fillStyle = "#4e8df5";
      g.beginPath();
      g.arc(rx + 14, my, 9 * pulse, 0, Math.PI * 2);
      g.fill();
      g.strokeStyle = "#000";
      g.lineWidth = 2;
      g.stroke();

      g.fillStyle = "#8d8d8d";
      label(g, "YOUR SYSTEMS", lx - 16, H * 0.14);
      g.fillStyle = "#e4e4e4";
      label(g, "ONE OBJECT", rx + 30, my + 4);
    }

    return { layout, draw };
  }

  // A question goes in, a query and its answer come back out, and the box the
  // query runs in has nothing else connected to it.
  function sealed(canvas) {
    const g = canvas.getContext("2d", { alpha: false });
    let W, H;

    function layout() { [W, H] = fit(canvas, g); }

    function draw(now) {
      g.fillStyle = "#080808";
      g.fillRect(0, 0, W, H);
      const bx = W * 0.32, bw = W * 0.36, by = H * 0.3, bh = H * 0.4;

      g.strokeStyle = "#2f2f2f";
      g.lineWidth = 1;
      g.strokeRect(bx, by, bw, bh);
      g.fillStyle = "#0d0d0d";
      g.fillRect(bx + 1, by + 1, bw - 2, bh - 2);

      // Two travelling marks: the question in, the answer back.
      const u = (now * 0.00022) % 1;
      const inX = W * 0.06 + (bx - W * 0.06) * Math.min(1, u * 2);
      const outX = bx + bw + ((W * 0.94) - (bx + bw)) * Math.max(0, u * 2 - 1);
      g.fillStyle = "#36b98a";
      g.globalAlpha = u < 0.5 ? 1 : 0.15;
      g.fillRect(inX, H * 0.5 - 1.5, 14, 3);
      g.globalAlpha = u >= 0.5 ? 1 : 0.15;
      g.fillRect(outX, H * 0.5 - 1.5, 14, 3);
      g.globalAlpha = 1;

      // Nothing else reaches the box.
      g.strokeStyle = "#2f2f2f";
      g.setLineDash([3, 4]);
      [0.18, 0.82].forEach((f) => {
        g.beginPath();
        g.moveTo(bx + bw * f, by - H * 0.2);
        g.lineTo(bx + bw * f, by - 8);
        g.stroke();
      });
      g.setLineDash([]);
      [0.18, 0.82].forEach((f) => {
        const cx = bx + bw * f, cy = by - 16;
        g.strokeStyle = "#5a5a5a";
        g.beginPath();
        g.moveTo(cx - 5, cy - 5); g.lineTo(cx + 5, cy + 5);
        g.moveTo(cx + 5, cy - 5); g.lineTo(cx - 5, cy + 5);
        g.stroke();
      });

      g.fillStyle = "#8d8d8d";
      label(g, "NO INTERNET", bx + bw * 0.18, by - H * 0.22, "center");
      label(g, "NO KEYS", bx + bw * 0.82, by - H * 0.22, "center");
      g.fillStyle = "#e4e4e4";
      label(g, "THE QUERY RUNS HERE", bx + bw / 2, by + bh / 2 + 4, "center");
      g.fillStyle = "#8d8d8d";
      label(g, "ASK", W * 0.06, H * 0.5 - 12);
      label(g, "ANSWER", W * 0.94, H * 0.5 - 12, "right");
    }

    return { layout, draw };
  }

  const KINDS = { resolve, sealed };

  document.querySelectorAll("canvas[data-diagram]").forEach((canvas) => {
    const make = KINDS[canvas.dataset.diagram];
    if (!make) return;
    const d = make(canvas);
    d.layout();

    let raf = 0, running = false;
    const tick = (now) => { d.draw(now); raf = requestAnimationFrame(tick); };
    const start = () => { if (!running) { running = true; raf = requestAnimationFrame(tick); } };
    const stop = () => { running = false; cancelAnimationFrame(raf); };

    if (calm.matches) d.draw(2000); else start();

    let timer;
    window.addEventListener("resize", () => {
      clearTimeout(timer);
      timer = setTimeout(() => { d.layout(); if (calm.matches || !running) d.draw(2000); }, 160);
    });

    if ("IntersectionObserver" in window && !calm.matches) {
      new IntersectionObserver((es) => {
        es.forEach((e) => (e.isIntersecting ? start() : stop()));
      }, { rootMargin: "100px" }).observe(canvas);
    }
  });
})();
