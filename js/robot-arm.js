/* 히어로의 인터랙티브 로봇팔.
   레일 단면(KR60 근사) 위 검사 지점에 대해, 카메라가 표면 법선 방향으로
   일정 거리(standoff)를 두고 정면을 보도록 3관절 팔의 역기구학을 풉니다.
   마우스를 움직이면 가장 가까운 레일 표면 지점으로 목표가 이동하고,
   가만히 두면 Crown → Gauge → Web → Foot 지점을 순서대로 검사합니다. */
(function () {
  const canvas = document.getElementById("arm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const out = {
    point: document.getElementById("ro-point"),
    q: document.getElementById("ro-q"),
    err: document.getElementById("ro-err"),
    mode: document.getElementById("ro-mode"),
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 월드 좌표 (mm, y 위쪽) ----
  const RAIL_X = 40; // 레일 중심
  const PROFILE = [
    [-72.5, 0], [72.5, 0], [72.5, 10], [20, 28], [8.25, 40], [8.25, 125], [20, 135], [32.5, 145],
    [32.5, 166], [28, 174], [-28, 174], [-32.5, 166], [-32.5, 145], [-20, 135], [-8.25, 125],
    [-8.25, 40], [-20, 28], [-72.5, 10],
  ].map(([x, y]) => [x + RAIL_X, y + 14]); // 침목 위에 올림
  const POIS = [
    { name: "레일 머리", p: [RAIL_X, 188], n: [0, 1] },
    { name: "게이지 코너", p: [RAIL_X - 30.5, 184], n: [-0.7071, 0.7071] },
    { name: "레일 옆면(웹)", p: [RAIL_X - 8.25, 96], n: [-1, 0] },
    { name: "레일 발", p: [RAIL_X - 46, 33], n: [-0.324, 0.946] },
  ];
  const BASE = [-330, 150];
  const L1 = 250, L2 = 205, L3 = 62, STANDOFF = 92;
  const WORLD = { x0: -470, x1: 150, y0: -30, y1: 520 };

  // 레일에서 로봇 쪽(왼쪽·위)을 향한 면만 검사 대상
  const EDGES = [];
  for (let i = 0; i < PROFILE.length; i++) {
    const a = PROFILE[i], b = PROFILE[(i + 1) % PROFILE.length];
    const dx = b[0] - a[0], dy = b[1] - a[1], len = Math.hypot(dx, dy);
    const n = [dy / len, -dx / len]; // CCW 다각형의 바깥 법선
    if (n[0] < 0.25 && n[1] > -0.5) EDGES.push({ a, b, n });
  }

  let W = 0, H = 0, S = 1, OX = 0, OY = 0, dpr = 1;
  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(devicePixelRatio || 1, 2);
    W = r.width; H = r.height;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    S = Math.min(W / (WORLD.x1 - WORLD.x0), H / (WORLD.y1 - WORLD.y0));
    OX = (W - (WORLD.x1 - WORLD.x0) * S) / 2 - WORLD.x0 * S;
    OY = H - (H - (WORLD.y1 - WORLD.y0) * S) / 2 + WORLD.y0 * S;
  }
  const sx = (x) => OX + x * S;
  const sy = (y) => OY - y * S;
  const toWorld = (px, py) => [(px - OX) / S, (OY - py) / S];

  // ---- 역기구학: 카메라가 점 p를 법선 n 방향에서 바라보도록 ----
  function solveIK(p, n) {
    const wrist = [p[0] + n[0] * (STANDOFF + L3), p[1] + n[1] * (STANDOFF + L3)];
    const dx = wrist[0] - BASE[0], dy = wrist[1] - BASE[1];
    let d = Math.hypot(dx, dy);
    const reach = d <= L1 + L2 && d >= Math.abs(L1 - L2);
    d = Math.min(Math.max(d, Math.abs(L1 - L2) + 1e-3), L1 + L2 - 1e-3);
    const c2 = (d * d - L1 * L1 - L2 * L2) / (2 * L1 * L2);
    const q2 = -Math.acos(Math.max(-1, Math.min(1, c2))); // elbow-up
    const q1 = Math.atan2(dy, dx) - Math.atan2(L2 * Math.sin(q2), L1 + L2 * Math.cos(q2));
    const q3 = Math.atan2(-n[1], -n[0]) - q1 - q2;
    return { q: [q1, q2, wrapPi(q3)], reach };
  }
  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));

  function fk(q) {
    const a1 = q[0], a2 = q[0] + q[1], a3 = a2 + q[2];
    const j1 = [BASE[0] + L1 * Math.cos(a1), BASE[1] + L1 * Math.sin(a1)];
    const j2 = [j1[0] + L2 * Math.cos(a2), j1[1] + L2 * Math.sin(a2)];
    const ee = [j2[0] + L3 * Math.cos(a3), j2[1] + L3 * Math.sin(a3)];
    return { j1, j2, ee, a3 };
  }

  function nearestSurface(w) {
    let best = null;
    for (const e of EDGES) {
      const ab = [e.b[0] - e.a[0], e.b[1] - e.a[1]];
      let t = ((w[0] - e.a[0]) * ab[0] + (w[1] - e.a[1]) * ab[1]) / (ab[0] ** 2 + ab[1] ** 2);
      t = Math.max(0.04, Math.min(0.96, t));
      const p = [e.a[0] + ab[0] * t, e.a[1] + ab[1] * t];
      const d = Math.hypot(w[0] - p[0], w[1] - p[1]);
      if (!best || d < best.d) best = { p, n: e.n, d };
    }
    return best;
  }

  // ---- 상태 ----
  let q = solveIK(POIS[2].p, POIS[2].n).q.slice();
  let target = { ...POIS[0] };
  let poiIdx = 0, lastSwitch = 0, mouseActive = false, mouseTimer = 0, trail = [];

  function setTarget(p, n, name) {
    target = { p, n, name };
  }

  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    const w = toWorld(e.clientX - r.left, e.clientY - r.top);
    const s = nearestSurface(w);
    setTarget(s.p, s.n, "커서");
    mouseActive = true;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => (mouseActive = false), 2500);
  });
  canvas.addEventListener("pointerleave", () => {
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => (mouseActive = false), 600);
  });

  // ---- 그리기 ----
  const C = { ink: "#0e1a2b", line: "#e2e7ee", line2: "#cfd7e1", muted: "#6a7686", blue: "#1d6ff2", mint: "#11b3a3", white: "#fff" };

  function draw(t) {
    ctx.clearRect(0, 0, W, H);
    // 도면 그리드
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.line;
    const step = 50;
    for (let x = Math.ceil(WORLD.x0 / step) * step; x <= WORLD.x1; x += step) line(sx(x), sy(WORLD.y0), sx(x), sy(WORLD.y1));
    for (let y = Math.ceil(WORLD.y0 / step) * step; y <= WORLD.y1; y += step) line(sx(WORLD.x0), sy(y), sx(WORLD.x1), sy(y));

    // 지면 + 침목
    ctx.fillStyle = "#f1f4f7";
    ctx.fillRect(sx(WORLD.x0), sy(0), (WORLD.x1 - WORLD.x0) * S, 30 * S);
    ctx.strokeStyle = C.line2;
    line(sx(WORLD.x0), sy(0), sx(WORLD.x1), sy(0));
    ctx.fillStyle = "#e6ebf0";
    ctx.fillRect(sx(RAIL_X - 110), sy(14), 220 * S, 14 * S);

    // 레일 단면
    ctx.beginPath();
    PROFILE.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y))));
    ctx.closePath();
    ctx.fillStyle = C.white;
    ctx.fill();
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C.ink;
    ctx.stroke();
    // 중심선
    ctx.setLineDash([6, 4]);
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.line2;
    line(sx(RAIL_X), sy(0), sx(RAIL_X), sy(205));
    ctx.setLineDash([]);
    // 치수선
    ctx.fillStyle = C.muted;
    ctx.font = "11px Pretendard, 'Malgun Gothic', sans-serif";
    ctx.fillText("KR60 레일 · 높이 174mm", sx(RAIL_X - 72), sy(-20));

    // 검사 지점
    for (const poi of POIS) {
      const active = target.name === poi.name;
      ctx.beginPath();
      ctx.arc(sx(poi.p[0]), sy(poi.p[1]), active ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = active ? C.mint : C.line2;
      ctx.fill();
    }

    // 4족 베이스 (몸통 + 다리)
    const bx = BASE[0], by = BASE[1];
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = C.ink;
    ctx.fillStyle = C.white;
    roundRect(sx(bx - 120), sy(by + 4), 150 * S, 52 * S, 10 * S);
    ctx.fill(); ctx.stroke();
    for (const [lx, dir] of [[-100, -1], [-60, 1], [-10, -1], [20, 1]]) {
      ctx.beginPath();
      ctx.moveTo(sx(bx + lx), sy(by - 48));
      ctx.lineTo(sx(bx + lx + dir * 18), sy(by - 95));
      ctx.lineTo(sx(bx + lx), sy(0));
      ctx.stroke();
    }
    ctx.fillStyle = C.muted;
    ctx.fillText("4족보행 베이스", sx(bx - 112), sy(by - 34));

    // 궤적
    const k = fk(q);
    trail.push(k.ee);
    if (trail.length > 60) trail.shift();
    ctx.beginPath();
    trail.forEach(([x, y], i) => (i ? ctx.lineTo(sx(x), sy(y)) : ctx.moveTo(sx(x), sy(y))));
    ctx.strokeStyle = "rgba(29,111,242,.18)";
    ctx.lineWidth = 2;
    ctx.stroke();

    // 카메라 시야
    const camDir = [Math.cos(k.a3), Math.sin(k.a3)];
    const half = (43.5 * Math.PI) / 180; // D405 수평 화각 87°
    const reach = STANDOFF + 30;
    const lft = rot(camDir, half), rgt = rot(camDir, -half);
    ctx.beginPath();
    ctx.moveTo(sx(k.ee[0]), sy(k.ee[1]));
    ctx.lineTo(sx(k.ee[0] + lft[0] * reach), sy(k.ee[1] + lft[1] * reach));
    ctx.lineTo(sx(k.ee[0] + rgt[0] * reach), sy(k.ee[1] + rgt[1] * reach));
    ctx.closePath();
    ctx.fillStyle = "rgba(29,111,242,.07)";
    ctx.fill();
    ctx.setLineDash([4, 4]);
    ctx.strokeStyle = "rgba(29,111,242,.6)";
    ctx.lineWidth = 1.2;
    line(sx(k.ee[0]), sy(k.ee[1]), sx(target.p[0]), sy(target.p[1]));
    ctx.setLineDash([]);

    // 법선 화살표
    ctx.strokeStyle = C.mint;
    ctx.lineWidth = 1.5;
    const nEnd = [target.p[0] + target.n[0] * 40, target.p[1] + target.n[1] * 40];
    line(sx(target.p[0]), sy(target.p[1]), sx(nEnd[0]), sy(nEnd[1]));
    // 목표 마커 (맥동)
    const pr = 6 + Math.sin(t / 300) * 2;
    ctx.beginPath();
    ctx.arc(sx(target.p[0]), sy(target.p[1]), pr, 0, Math.PI * 2);
    ctx.strokeStyle = C.mint;
    ctx.stroke();

    // 링크
    const pts = [BASE, k.j1, k.j2];
    ctx.lineCap = "round";
    for (let i = 0; i < 2; i++) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = Math.max(10, 22 * S);
      line(sx(pts[i][0]), sy(pts[i][1]), sx(pts[i + 1][0]), sy(pts[i + 1][1]));
      ctx.strokeStyle = C.white;
      ctx.lineWidth = Math.max(7, 17 * S);
      line(sx(pts[i][0]), sy(pts[i][1]), sx(pts[i + 1][0]), sy(pts[i + 1][1]));
    }
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(6, 12 * S);
    line(sx(k.j2[0]), sy(k.j2[1]), sx(k.ee[0]), sy(k.ee[1]));
    // 카메라 바디
    ctx.save();
    ctx.translate(sx(k.ee[0]), sy(k.ee[1]));
    ctx.rotate(-k.a3);
    ctx.fillStyle = C.blue;
    roundRect(-4 * S - 4, -9 * S - 5, 22 * S + 8, 18 * S + 10, 3);
    ctx.fill();
    ctx.restore();
    // 관절
    for (const [x, y] of [BASE, k.j1, k.j2]) {
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), Math.max(6, 13 * S), 0, Math.PI * 2);
      ctx.fillStyle = C.white; ctx.fill();
      ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx(x), sy(y), Math.max(2, 4 * S), 0, Math.PI * 2);
      ctx.fillStyle = C.blue; ctx.fill();
    }
    ctx.lineCap = "butt";
  }

  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function rot(v, a) { return [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)]; }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---- 루프: P 제어로 관절이 목표 해에 수렴 (서보잉처럼 보이도록) ----
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!mouseActive && !reduce && t - lastSwitch > 3200) {
      poiIdx = (poiIdx + 1) % POIS.length;
      const poi = POIS[poiIdx];
      setTarget(poi.p, poi.n, poi.name);
      lastSwitch = t;
    }
    const sol = solveIK(target.p, target.n);
    const gain = reduce ? 1 : 0.075;
    let err = 0;
    for (let i = 0; i < 3; i++) {
      const e = wrapPi(sol.q[i] - q[i]);
      q[i] += gain * e;
      err += e * e;
    }
    draw(t);
    if (out.point) {
      out.point.textContent = target.name === "커서" ? "레일 표면 (커서)" : target.name;
      out.q.textContent = q.map((a) => Math.round((a * 180) / Math.PI)).join("° ") + "°";
      out.err.textContent = ((Math.sqrt(err) * 180) / Math.PI).toFixed(2) + "°";
      out.mode.textContent = mouseActive ? "수동 조작" : sol.reach ? "자동 순찰" : "도달 불가";
    }
  }

  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
