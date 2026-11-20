// The reading room's dust, in the world of afrani.id. First-party and self-hosted (third-party code stays banned).
// - The index: afrani.id's tree of glowing dust grows above the list, sways, lets go and gathers again; slow embers
//   drift behind the page.
// - A post: the same tree, drawn once, small and still beside the name.
// - Titles (the list and a post's title) gather from specks sampled from their own letters, then resolve into the
//   real text, which stays selectable and readable by screen readers.
// With reduced motion the tree is drawn once and titles appear as text.
(() => {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // afrani.id's tree: mulberry32(23), growTree(0, 50, 100, 7) (afrani-id site/scenes.js and site/tree-dust.js).
  const mulberry32 = (seed) => {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };
  function growTree(r, x, base, height, depth) {
    const segments = [];
    const branch = (px, py, angle, len, level) => {
      const nx = px + Math.cos(angle) * len;
      const ny = py + Math.sin(angle) * len;
      segments.push({ x1: px, y1: py, x2: nx, y2: ny, level });
      if (level >= depth) return;
      const spread = 0.32 + r() * 0.28;
      const shrink = 0.66 + r() * 0.12;
      branch(nx, ny, angle - spread * (0.7 + r() * 0.6), len * shrink, level + 1);
      branch(nx, ny, angle + spread * (0.7 + r() * 0.6), len * shrink, level + 1);
      if (level < 2 && r() < 0.5) branch(nx, ny, angle + (r() - 0.5) * 0.2, len * shrink * 0.9, level + 1);
    };
    branch(x, base, -Math.PI / 2 + (r() - 0.5) * 0.08, height * 0.3, 0);
    return segments;
  }

  const LEVELS = 7;
  const EMBERS = 300;
  function particles(mark, embers) {
    const r = mulberry32(23);
    const gauss = () => Math.sqrt(-2 * Math.log(Math.max(r(), 1e-9))) * Math.cos(6.2832 * r());
    const tree = growTree(r, 0, 50, 100, LEVELS);
    const N = mark + embers;
    const home = new Float32Array(N * 3);
    const from = new Float32Array(N * 3);
    const info = new Float32Array(N * 4);
    let ink = 0;
    for (const s of tree) ink += Math.hypot(s.x2 - s.x1, s.y2 - s.y1) * Math.pow(0.72, s.level);
    let i = 0;
    for (const s of tree) {
      const len = Math.hypot(s.x2 - s.x1, s.y2 - s.y1);
      const w = 2.6 * Math.pow(0.66, s.level) + 0.25;
      const n = Math.round((mark * len * Math.pow(0.72, s.level)) / ink);
      const nx = -(s.y2 - s.y1) / (len || 1);
      const ny = (s.x2 - s.x1) / (len || 1);
      for (let k = 0; k < n && i < mark; k++, i++) {
        const u = r();
        const off = gauss() * w * 0.4;
        const haze = r() < 0.06;
        const bud = s.level >= LEVELS - 2 && u > 0.45 && r() < 0.75;
        const x = s.x1 + (s.x2 - s.x1) * u + nx * off + (haze ? gauss() * 2.5 : 0);
        const y = s.y1 + (s.y2 - s.y1) * u + ny * off + (haze ? gauss() * 2.5 : 0);
        home.set([x, y, gauss() * (haze ? 4 : 0.8)], i * 3);
        const a = r() * 6.2832;
        const d = 40 + r() * 70;
        from.set([Math.cos(a) * d, Math.sin(a) * d * 0.55 - 10, gauss() * 16], i * 3);
        info.set([Math.min(1, Math.max(0, (50 - y) / 100)) * 0.7 + r() * 0.3, bud ? 1 : 0, haze ? 1 : 0, 0], i * 4);
      }
    }
    for (let j = mark; j < N; j++) {
      home.set([r(), r(), r()], j * 3);
      info.set([r(), r() < 0.25 ? 1 : 0, 0, 1], j * 4);
    }
    return { home, from, info, N };
  }

  const VERTEX = `
    attribute vec3 aHome, aFrom; attribute vec4 aInfo;
    uniform vec2 uRes, uCenter; uniform float uScale, uTime, uGather, uDpr, uGain; uniform vec3 uPointer;
    varying vec3 vCol; varying float vA, vSoft;
    const vec3 PALE = vec3(0.874, 0.902, 0.886);
    const vec3 SAGE = vec3(0.624, 0.878, 0.741);
    void main() {
      float k = aInfo.x; bool bud = aInfo.y > 0.5; vec2 p; float a, soft;
      if (aInfo.w > 0.5) {
        float rise = fract(aHome.y - uTime * (0.006 + 0.01 * k));
        p = vec2(aHome.x + 0.015 * sin(uTime * 0.25 + k * 40.0), rise) * uRes;
        a = (0.08 + 0.18 * k) * (0.6 + 0.4 * sin(uTime * (0.8 + 1.5 * k) + k * 30.0)) * (bud ? 1.4 : 1.0);
        soft = 0.4 + aHome.z;
        gl_PointSize = (1.0 + 2.4 * aHome.z) * uDpr;
      } else {
        float t = clamp((uGather - k * 0.5) / 0.5, 0.0, 1.0);
        t = t * t * (3.0 - 2.0 * t);
        vec3 q = mix(aFrom, aHome, t);
        float h = clamp((50.0 - q.y) / 100.0, 0.0, 1.0);
        q.x += (sin(uTime * 0.55) * 0.7 + sin(uTime * 0.2 + 1.7) * 0.3) * 2.2 * h * h;
        q.xy += vec2(sin(uTime * 1.1 + k * 50.0), cos(uTime * 0.9 + k * 70.0)) * (0.12 + 1.6 * (1.0 - t));
        p = uCenter + q.xy * uScale;
        vec2 d = p - uPointer.xy; float rr = length(d);
        p += normalize(d + 0.0001) * uPointer.z * 40.0 * uDpr * exp(-rr * rr / (8000.0 * uDpr * uDpr));
        soft = abs(q.z) / 3.0 + (1.0 - t) * 0.9 + (aInfo.z > 0.5 ? 0.8 : 0.0);
        a = (aInfo.z > 0.5 ? 0.18 : 0.5 + 0.35 * fract(k * 13.0)) / (1.0 + soft * soft * 2.0) * (bud ? 2.1 : 1.0) * uGain;
        gl_PointSize = max(uDpr, (1.3 + 0.8 * fract(k * 7.0) + soft * 2.4) * (uScale / 4.2));
      }
      vCol = bud ? SAGE : PALE; vA = a; vSoft = soft;
      gl_Position = vec4((p / uRes) * 2.0 - 1.0, 0.0, 1.0) * vec4(1.0, -1.0, 1.0, 1.0);
    }`;
  const FRAGMENT = `
    precision mediump float; varying vec3 vCol; varying float vA, vSoft;
    void main() {
      float d = length(gl_PointCoord - 0.5) * 2.0;
      if (d > 1.0) discard;
      float g = vA * mix(exp(-d * d * 3.5), smoothstep(1.0, 0.55, d) * 0.7, clamp(vSoft * 0.7, 0.0, 1.0));
      gl_FragColor = vec4(vCol * g, g);
    }`;

  function renderer(canvas, mark, embers) {
    const gl = canvas.getContext("webgl", { antialias: false, premultipliedAlpha: true });
    if (!gl) return null;
    const shader = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "tree-dust: shader failed");
      return s;
    };
    const prog = gl.createProgram();
    gl.attachShader(prog, shader(gl.VERTEX_SHADER, VERTEX));
    gl.attachShader(prog, shader(gl.FRAGMENT_SHADER, FRAGMENT));
    gl.linkProgram(prog);
    gl.useProgram(prog);
    const { home, from, info, N } = particles(mark, embers);
    for (const [name, data, size] of [["aHome", home, 3], ["aFrom", from, 3], ["aInfo", info, 4]]) {
      gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
      gl.bufferData(gl.ARRAY_BUFFER, data, gl.STATIC_DRAW);
      const loc = gl.getAttribLocation(prog, name);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, size, gl.FLOAT, false, 0, 0);
    }
    const u = {};
    for (const n of ["uRes", "uCenter", "uScale", "uTime", "uGather", "uDpr", "uPointer", "uGain"]) u[n] = gl.getUniformLocation(prog, n);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE);
    return ({ t, gather, cx, cy, size, pointer, gain }) => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.round(canvas.clientWidth * dpr);
      const h = Math.round(canvas.clientHeight * dpr);
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.uniform2f(u.uRes, w, h);
      gl.uniform2f(u.uCenter, cx * dpr, cy * dpr);
      gl.uniform1f(u.uScale, (size / 100) * dpr);
      gl.uniform1f(u.uTime, t);
      gl.uniform1f(u.uGather, gather);
      gl.uniform1f(u.uDpr, dpr);
      gl.uniform1f(u.uGain, gain);
      gl.uniform3f(u.uPointer, pointer.x * dpr, pointer.y * dpr, pointer.on);
      gl.drawArrays(gl.POINTS, 0, N);
    };
  }

  // ---- the tree and the embers (index), the small still tree (posts)
  const CYCLE = 18;
  const gatherAt = (t) => {
    const c = t % CYCLE;
    if (c < 4) return c / 4;
    if (c < 13) return 1;
    if (c < 16) return 1 - (c - 13) / 3;
    return 0;
  };
  const slot = document.querySelector(".tree-slot");
  const field = slot ? document.getElementById("field") : null;
  const drawField = field ? renderer(field, 22000, EMBERS) : null;
  const markCanvas = document.querySelector(".site-mark canvas");
  const drawMark = !slot && markCanvas ? renderer(markCanvas, 6000, 0) : null;
  const still = { x: 0, y: 0, on: 0 };
  const paintMark = () => drawMark && drawMark({ t: 6, gather: 1, cx: 15, cy: 18, size: 34, pointer: still, gain: 1.4 });
  const pointer = { x: -9999, y: -9999, on: 0, target: 0 };
  window.addEventListener("pointermove", (e) => {
    pointer.x = e.clientX;
    pointer.y = e.clientY;
    pointer.target = e.pointerType === "mouse" ? 1 : 0;
  });
  document.documentElement.addEventListener("pointerleave", () => (pointer.target = 0));
  const paintField = (t) => {
    if (!drawField) return;
    const r = slot.getBoundingClientRect();
    const size = Math.min(r.width * 0.7, r.height * 0.92, 360);
    pointer.on += (pointer.target - pointer.on) * 0.08;
    drawField({ t, gather: reduce ? 1 : gatherAt(t), cx: r.left + r.width / 2, cy: r.bottom - size * 0.5 - 6, size, pointer: reduce ? still : pointer, gain: 1 });
  };

  // ---- titles from dust
  const inkCanvas = document.getElementById("ink");
  const ictx = inkCanvas && !reduce ? inkCanvas.getContext("2d") : null;
  const titles = Array.from(document.querySelectorAll(".notes-list a, .post-title"));
  const states = new Map();
  const srand = mulberry32(77);
  const GATHER = 1100;
  // A title is sampled once it is on screen: split into word spans (spaces kept), each word's letters drawn to a
  // canvas in the title's own font and sampled into specks that follow the word's box as the page scrolls.
  const prepare = (el) => {
    if (states.has(el)) return states.get(el);
    const text = el.textContent;
    el.textContent = "";
    for (const part of text.split(/(\s+)/)) {
      if (!part) continue;
      const sp = document.createElement("span");
      sp.className = "w";
      sp.textContent = part;
      el.appendChild(sp);
    }
    const cs = getComputedStyle(el);
    const font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
    const spans = Array.from(el.querySelectorAll(".w")).filter((sp) => sp.textContent.trim());
    const words = spans.map((sp, wi) => {
      const r = sp.getBoundingClientRect();
      const c = document.createElement("canvas");
      c.width = (Math.ceil(r.width) + 4) * 2;
      c.height = (Math.ceil(r.height) + 4) * 2;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.scale(2, 2);
      g.font = font;
      g.fillStyle = "#fff";
      g.textBaseline = "alphabetic";
      const asc = g.measureText(sp.textContent).fontBoundingBoxAscent || parseFloat(cs.fontSize) * 0.8;
      g.fillText(sp.textContent, 0, asc);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const pts = [];
      for (let y = 0; y < c.height; y++) {
        for (let x = 0; x < c.width; x++) if (d[(y * c.width + x) * 4 + 3] > 110 && srand() < 0.42) pts.push(x / 2, y / 2, srand(), srand(), srand());
      }
      return { sp, pts: new Float32Array(pts), order: spans.length > 1 ? wi / (spans.length - 1) : 0 };
    });
    const st = { el, words, start: null };
    states.set(el, st);
    return st;
  };
  if (ictx) {
    // the script takes over from the CSS fallback that reveals titles if it never runs
    for (const el of titles) {
      el.style.animation = "none";
      el.style.opacity = "0";
    }
    const seen = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const st = prepare(e.target);
          if (st.start === null) st.start = performance.now() + 60 * Math.random();
          seen.unobserve(e.target);
        }
      },
      { threshold: 0.6 },
    );
    document.fonts.ready.then(() => titles.forEach((el) => seen.observe(el)));
  }
  const paintInk = (now) => {
    if (!ictx) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = inkCanvas.clientWidth;
    const h = inkCanvas.clientHeight;
    if (inkCanvas.width !== Math.round(w * dpr) || inkCanvas.height !== Math.round(h * dpr)) {
      inkCanvas.width = Math.round(w * dpr);
      inkCanvas.height = Math.round(h * dpr);
    }
    ictx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ictx.clearRect(0, 0, w, h);
    ictx.globalCompositeOperation = "lighter";
    for (const st of states.values()) {
      if (st.start === null || st.done) continue;
      const p = (now - st.start) / GATHER;
      if (p < 0) continue;
      st.el.style.opacity = String(Math.min(1, Math.max(0, (p - 0.62) / 0.3)));
      if (p > 1.05) {
        st.done = true;
        st.el.style.opacity = "1";
        continue;
      }
      const fade = Math.min(1, Math.max(0, (p - 0.78) / 0.24));
      for (const wd of st.words) {
        const r = wd.sp.getBoundingClientRect();
        if (r.bottom < -40 || r.top > h + 40) continue;
        const a = wd.pts;
        for (let i = 0; i < a.length; i += 5) {
          const k = a[i + 2];
          const s2 = a[i + 3];
          const s3 = a[i + 4];
          let t = (p - (wd.order * 0.22 + k * 0.28)) / 0.5;
          t = t < 0 ? 0 : t > 1 ? 1 : t;
          t = t * t * (3 - 2 * t);
          const u = 1 - t;
          const ang = s2 * 6.2832;
          const far = 14 + s3 * 46;
          const alpha = t * (1 - fade) * (0.55 + 0.45 * s3);
          if (alpha < 0.02) continue;
          ictx.globalAlpha = alpha;
          ictx.fillStyle = s2 > 0.9 ? "#9fe0bd" : "#e6ebe7";
          ictx.fillRect(r.left + a[i] + Math.cos(ang) * far * u - 10 * u - 0.6, r.top + a[i + 1] + Math.sin(ang) * far * 0.6 * u - 18 * u - 0.6, 1.2, 1.2);
        }
      }
    }
    ictx.globalAlpha = 1;
    ictx.globalCompositeOperation = "source-over";
  };

  // ---- one loop for the page; it pauses with the tab and stops once nothing is left to move
  paintMark();
  window.addEventListener("resize", () => {
    paintMark();
    if (reduce) paintField(6);
  });
  if (reduce) {
    paintField(6);
    return;
  }
  const t0 = performance.now() - 300;
  let raf = 0;
  const frame = () => {
    raf = 0;
    const now = performance.now();
    paintField((now - t0) / 1000);
    paintInk(now);
    const busy = drawField || Array.from(states.values()).some((st) => !st.done) || states.size < titles.length;
    if (busy && !document.hidden) raf = requestAnimationFrame(frame);
  };
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden && !raf) raf = requestAnimationFrame(frame);
  });
  raf = requestAnimationFrame(frame);
})();
