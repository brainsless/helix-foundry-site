// Generates the two technical illustrations. Geometry is computed rather than
// hand-written so the projection, the slab thickness and the label positions
// are exact. Run: node assets/diagram.mjs hero | boundary

const COS30 = Math.cos(Math.PI / 6);
const FLAT = 0.36; // flatter than true isometric, so a plane reads wide
const THICK = 18;

const iso = (x, y, z) => [(x - y) * COS30, (x + y) * FLAT - z];
const f = (n) => Math.round(n * 10) / 10;

function makeFrame(W, D, lifts, pad) {
  const xs = [], ys = [];
  for (const z of lifts.concat(lifts.map((z) => z - THICK))) {
    for (const [x, y] of [[0, 0], [W, 0], [W, D], [0, D]]) {
      const [px, py] = iso(x, y, z);
      xs.push(px); ys.push(py);
    }
  }
  const ox = pad.l - Math.min(...xs);
  const oy = pad.t - Math.min(...ys);
  return {
    P: (x, y, z) => { const [a, b] = iso(x, y, z); return [a + ox, b + oy]; },
    vw: Math.round(Math.max(...xs) - Math.min(...xs) + pad.l + pad.r),
    vh: Math.round(Math.max(...ys) - Math.min(...ys) + pad.t + pad.b),
  };
}

const pts = (list) => list.map(([a, b]) => `${f(a)},${f(b)}`).join(" ");

// A plane with real thickness: a top face plus the two side faces that face
// the viewer, which carry the hatch.
function slab(P, W, D, z, topFill) {
  const T = (x, y) => P(x, y, z);
  const B = (x, y) => P(x, y, z - THICK);
  return `
  <polygon points="${pts([T(0, 0), T(W, 0), T(W, D), T(0, D)])}" fill="${topFill}" stroke="var(--dia-ink)" stroke-width="1.4" stroke-linejoin="round"/>
  <polygon points="${pts([T(W, 0), T(W, D), B(W, D), B(W, 0)])}" fill="url(#hatch)" stroke="var(--dia-ink)" stroke-width="1.4" stroke-linejoin="round"/>
  <polygon points="${pts([T(W, D), T(0, D), B(0, D), B(W, D)])}" fill="url(#hatch)" stroke="var(--dia-ink)" stroke-width="1.4" stroke-linejoin="round"/>`;
}

const GLYPHS = {
  // Each glyph is drawn inside a 24 by 24 box with its own origin at 0,0.
  db: `<ellipse cx="12" cy="6.5" rx="7.5" ry="3.2"/><path d="M4.5 6.5v11c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2v-11"/><path d="M4.5 12c0 1.8 3.4 3.2 7.5 3.2s7.5-1.4 7.5-3.2"/>`,
  people: `<circle cx="8.5" cy="8" r="3"/><circle cx="16" cy="9.5" r="2.4"/><path d="M3.5 19c0-2.8 2.2-4.6 5-4.6s5 1.8 5 4.6"/><path d="M14.5 19c0-2 1.3-3.4 3-3.4s3 1.4 3 3.4"/>`,
  card: `<rect x="3.5" y="6" width="17" height="12" rx="2"/><path d="M3.5 10.2h17"/><path d="M6.8 14.4h4.2"/>`,
  chart: `<path d="M4 20V11"/><path d="M9.3 20V5.5"/><path d="M14.6 20v-6"/><path d="M20 20V8.5"/>`,
  file: `<path d="M6 3.5h7.5L19 9v11.5H6z"/><path d="M13.5 3.5V9H19"/><path d="M8.8 13h7.4"/><path d="M8.8 16.4h4.6"/>`,
};

function tile(P, x, y, z, glyph, label) {
  const [cx, cy] = P(x, y, z);
  const S = 62;
  return `
  <g transform="translate(${f(cx - S / 2)},${f(cy - S / 2 - 10)})">
    <rect x="0" y="0" width="${S}" height="${S}" rx="12" fill="var(--dia-card)" stroke="var(--dia-ink)" stroke-width="1.4"/>
    <g transform="translate(${(S - 24) / 2},${(S - 24) / 2})" fill="none" stroke="var(--dia-ink)" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
  </g>
  <text class="dia-tag" x="${f(cx)}" y="${f(cy + S / 2 + 6)}" text-anchor="middle">${label}</text>`;
}

function callout(P, x, y, z, n, dx, dy) {
  const [cx, cy] = P(x, y, z);
  const tx = cx + dx, ty = cy + dy;
  return `
  <line x1="${f(cx)}" y1="${f(cy)}" x2="${f(tx)}" y2="${f(ty)}" stroke="var(--dia-ink)" stroke-width="1"/>
  <circle cx="${f(cx)}" cy="${f(cy)}" r="2" fill="var(--dia-ink)"/>
  <circle cx="${f(tx)}" cy="${f(ty)}" r="11" fill="var(--dia-card)" stroke="var(--dia-ink)" stroke-width="1.3"/>
  <text class="dia-call" x="${f(tx)}" y="${f(ty + 3.8)}" text-anchor="middle">${n}</text>`;
}

function pill(P, a, b, z, text) {
  const [x0, y0] = P(a[0], a[1], z);
  const [x1, y1] = P(b[0], b[1], z);
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  const w = text.length * 6.3 + 20;
  return `
  <g transform="translate(${f(cx - w / 2)},${f(cy - 10)})">
    <rect x="0" y="0" width="${f(w)}" height="20" rx="10" fill="var(--dia-mint)" stroke="var(--dia-ink)" stroke-width="1.2"/>
    <text class="dia-pill" x="${f(w / 2)}" y="13.5" text-anchor="middle">${text}</text>
  </g>`;
}

/* ---------------------------------------------------------------- hero */

function hero() {
  const W = 660, D = 340, LIFT = 300;
  const { P, vw, vh } = makeFrame(W, D, [0, LIFT], { l: 150, r: 40, t: 96, b: 112 });

  const SOURCES = [
    { x: 0.17, y: 0.26, g: "db", t: "PLANETSCALE" },
    { x: 0.50, y: 0.26, g: "people", t: "WORKOS" },
    { x: 0.83, y: 0.26, g: "card", t: "STRIPE" },
    { x: 0.33, y: 0.74, g: "chart", t: "POSTHOG" },
    { x: 0.66, y: 0.74, g: "file", t: "S3 FILES" },
  ];

  const N = {
    account: [0.52, 0.46], user: [0.28, 0.16], ticket: [0.14, 0.52],
    sso: [0.34, 0.82], subscription: [0.81, 0.24], invoice: [0.95, 0.66],
    campaign: [0.56, 0.04],
  };
  // Each label is placed by hand so none of them lands on a link or an edge.
  const LABEL = {
    account: [0, 22, "middle"], user: [0, -15, "middle"], ticket: [-13, 4, "end"],
    sso: [-13, 4, "end"], subscription: [0, -15, "middle"],
    invoice: [0, 21, "middle"], campaign: [0, -15, "middle"],
  };
  const L = (k) => [N[k][0] * W, N[k][1] * D];
  const EDGES = [["campaign", "account"], ["user", "account"], ["user", "ticket"],
    ["account", "sso"], ["account", "subscription"], ["subscription", "invoice"]];
  const COLOUR = {
    account: "var(--type-account)", user: "var(--type-user)", ticket: "var(--type-ticket)",
    sso: "var(--type-sso)", subscription: "var(--type-subscription)",
    invoice: "var(--type-invoice)", campaign: "var(--type-campaign)",
  };
  const FEED = [["account", 0], ["user", 1], ["subscription", 2], ["ticket", 3], ["invoice", 4]];

  const o = [];
  o.push(`<svg class="dia" viewBox="0 0 ${vw} ${vh}" role="img" aria-labelledby="dia-hero" preserveAspectRatio="xMidYMid meet">`);
  o.push(`<title id="dia-hero">Five systems on one slab, their records rising into a single ontology slab above, where accounts, users, subscriptions, invoices, support tickets, campaigns and SSO connections are linked to each other.</title>`);
  o.push(`<defs>
  <pattern id="hatch" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <rect width="7" height="7" fill="var(--dia-card)"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--dia-ink)" stroke-width="1.1"/>
  </pattern>
  <marker id="tip" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
    <path d="M0 1.2 L8 5 L0 8.8 z" fill="var(--dia-stream)"/>
  </marker>
</defs>`);

  // Lower slab and its sources
  o.push(`<g>${slab(P, W, D, 0, "var(--dia-plane)")}</g>`);
  const [lx, ly] = P(0.2 * W, D, 0);
  o.push(`<text class="dia-caps" x="${f(lx)}" y="${f(ly + 40)}" text-anchor="middle">YOUR SYSTEMS</text>`);
  for (const s of SOURCES) o.push(tile(P, s.x * W, s.y * D, 0, GLYPHS[s.g], s.t));

  // Streams, drawn after the lower slab so they rise out of the tiles
  o.push(`<g fill="none" stroke="var(--dia-stream)" stroke-width="1.5" stroke-dasharray="2 5" stroke-linecap="round">`);
  for (const [key, si] of FEED) {
    const s = SOURCES[si];
    const [x1, y1] = P(...L(key), LIFT);
    for (const spread of [-12, 0, 12]) {
      const [x0, y0] = P(s.x * W + spread, s.y * D + spread, 0);
      const bow = spread * 0.8;
      const head = spread === 0 ? ' marker-end="url(#tip)"' : "";
      o.push(`<path d="M${f(x0)},${f(y0 - 42)} C${f(x0 + bow)},${f(y0 - 160)} ${f(x1 + bow)},${f(y1 + 150)} ${f(x1)},${f(y1 + 15)}"${head}/>`);
    }
  }
  o.push(`</g>`);

  // Upper slab and the ontology on it
  o.push(`<g>${slab(P, W, D, LIFT, "var(--dia-plane-2)")}</g>`);
  const [ux, uy] = P(0, 0, LIFT);
  o.push(`<text class="dia-caps dia-caps-lg" x="${f(ux - 14)}" y="${f(uy - 6)}" text-anchor="end">ONTOLOGY</text>`);

  o.push(`<g stroke="var(--dia-ink)" stroke-width="1.3">`);
  for (const [a, b] of EDGES) {
    const [x0, y0] = P(...L(a), LIFT);
    const [x1, y1] = P(...L(b), LIFT);
    o.push(`<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}"/>`);
  }
  o.push(`</g>`);

  o.push(pill(P, L("user"), L("account"), LIFT, "MEMBER OF"));
  o.push(pill(P, L("account"), L("subscription"), LIFT, "SUBSCRIBES TO"));
  o.push(pill(P, L("subscription"), L("invoice"), LIFT, "BILLED AS"));

  const NAMES = {
    account: "Account", user: "User", ticket: "Support ticket", sso: "SSO connection",
    subscription: "Subscription", invoice: "Invoice", campaign: "Campaign",
  };
  for (const k of Object.keys(N)) {
    const [x, y] = P(...L(k), LIFT);
    const r = k === "account" ? 9 : 6.5;
    const [dx, dy, anchor] = LABEL[k];
    o.push(`<circle cx="${f(x)}" cy="${f(y)}" r="${r}" fill="${COLOUR[k]}" stroke="var(--dia-ink)" stroke-width="1.3"/>`);
    o.push(`<text class="dia-node" x="${f(x + dx)}" y="${f(y + dy)}" text-anchor="${anchor}">${NAMES[k]}</text>`);
  }

  o.push(callout(P, 0.81 * W, 0.24 * D, LIFT, 1, 128, -46));
  o.push(callout(P, 0.43 * W, 0.64 * D, LIFT, 2, -138, 34));
  o.push(callout(P, 0.5 * W, 0.26 * D, 0, 3, 150, -26));
  o.push(callout(P, 0.17 * W, 0.26 * D, 0, 4, -92, -56));

  // The caption card overlaps the artwork rather than sitting beside it.
  o.push(`<g transform="translate(96,${f(vh - 128)})">
  <rect x="0" y="0" width="316" height="112" fill="var(--dia-card)" stroke="var(--dia-ink)" stroke-width="1.4"/>
  <text class="dia-cap-t" x="20" y="36">Matched on your own keys</text>
  <text class="dia-cap-b" x="20" y="62">Stripe, WorkOS, your database and your files</text>
  <text class="dia-cap-b" x="20" y="80">all resolve to the same business object.</text>
</g>`);


  o.push(`</svg>`);
  return o.join("\n");
}

/* ------------------------------------------------------------ boundary */

function boundary() {
  const W = 620, D = 330, LIFT = 0;
  const { P, vw, vh } = makeFrame(W, D, [LIFT], { l: 40, r: 300, t: 90, b: 70 });

  const BOXES = [
    { x: 0.26, y: 0.14, g: "people", t: "BROWSER" },
    { x: 0.54, y: 0.12, g: "card", t: "THE APP" },
    { x: 0.82, y: 0.18, g: "db", t: "HELIXDB" },
    { x: 0.55, y: 0.54, g: "chart", t: "OLLAMA" },
    { x: 0.83, y: 0.60, g: "file", t: "SQL EXECUTOR" },
  ];

  const o = [];
  o.push(`<svg class="dia" viewBox="0 0 ${vw} ${vh}" role="img" aria-labelledby="dia-bound" preserveAspectRatio="xMidYMid meet">`);
  o.push(`<title id="dia-bound">One slab holding the browser, the app on port 3001, HelixDB, the local model and an isolated SQL executor. Two dotted lines leave the slab: outbound reads from your sources, and a hosted model only if you choose one.</title>`);
  o.push(`<defs>
  <pattern id="hatch2" width="7" height="7" patternTransform="rotate(45)" patternUnits="userSpaceOnUse">
    <rect width="7" height="7" fill="var(--dia-card)"/>
    <line x1="0" y1="0" x2="0" y2="7" stroke="var(--dia-ink)" stroke-width="1.1"/>
  </pattern>
  <marker id="tip2" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5.5" markerHeight="5.5" orient="auto-start-reverse">
    <path d="M0 1.2 L8 5 L0 8.8 z" fill="var(--dia-ink)"/>
  </marker>
</defs>`);

  o.push(`<g>${slab(P, W, D, LIFT, "var(--dia-plane)").replace(/url\(#hatch\)/g, "url(#hatch2)")}</g>`);

  const [cx0, cy0] = P(0, 0, LIFT);
  o.push(`<text class="dia-caps dia-caps-lg" x="${f(cx0 - 14)}" y="${f(cy0 - 6)}" text-anchor="end">127.0.0.1</text>`);

  for (const b of BOXES) o.push(tile(P, b.x * W, b.y * D, LIFT, GLYPHS[b.g], b.t));

  // The two things that cross the edge of the machine.
  const [ex, ey] = P(W, 0.18 * D, LIFT);
  const [ex2, ey2] = P(W, 0.62 * D, LIFT);
  o.push(`<g fill="none" stroke="var(--dia-ink)" stroke-width="1.3" stroke-dasharray="4 5">
  <path d="M${f(ex + 10)},${f(ey)} L${f(ex + 150)},${f(ey - 30)}" marker-end="url(#tip2)"/>
  <path d="M${f(ex2 + 10)},${f(ey2)} L${f(ex2 + 150)},${f(ey2 + 10)}" marker-end="url(#tip2)"/>
</g>`);
  o.push(`<g>
  <text class="dia-cap-t" x="${f(ex + 164)}" y="${f(ey - 32)}">Your sources</text>
  <text class="dia-cap-b" x="${f(ex + 164)}" y="${f(ey - 12)}">read outward, on your schedule</text>
  <text class="dia-cap-t" x="${f(ex2 + 164)}" y="${f(ey2 + 8)}">A hosted model</text>
  <text class="dia-cap-b" x="${f(ex2 + 164)}" y="${f(ey2 + 28)}">only if you choose one</text>
</g>`);

  o.push(callout(P, 0.54 * W, 0.12 * D, LIFT, 1, 126, -48));
  o.push(callout(P, 0.83 * W, 0.6 * D, LIFT, 2, 96, 54));
  o.push(callout(P, 0.82 * W, 0.18 * D, LIFT, 3, 150, 10));
  o.push(callout(P, 0.26 * W, 0.14 * D, LIFT, 4, -124, -26));

  o.push(`<g transform="translate(${f(P(0.02 * W, D, LIFT)[0])},${f(P(0.02 * W, D, LIFT)[1] + 76)})">
  <rect x="0" y="0" width="330" height="96" fill="var(--dia-card)" stroke="var(--dia-ink)" stroke-width="1.4"/>
  <text class="dia-cap-t" x="20" y="34">One machine, one person</text>
  <text class="dia-cap-b" x="20" y="58">The app publishes port 3001 and nothing else.</text>
  <text class="dia-cap-b" x="20" y="76">The executor runs SQL with no internet and no keys.</text>
</g>`);

  o.push(`</svg>`);
  return o.join("\n");
}

const which = process.argv[2] || "hero";
console.log(which === "boundary" ? boundary() : hero());
