/* 히어로의 인터랙티브 휴머노이드 (정면도).
   직접 만든 16관절 휴머노이드를 단순화한 그림입니다.
   마우스를 움직이면 눈과 고개가 커서를 보고, 가까운 쪽 팔이 2관절 역기구학으로 커서를 향해 뻗습니다.
   가만히 두면 인사 → 제자리 걸음 → 균형 잡기 동작을 순서대로 반복합니다.
   아래 표시판에는 서보 채널 값(가동 범위 실측표 기준으로 제한), IMU 기울기, 움직이는 서보 수가 나옵니다. */
(function () {
  const canvas = document.getElementById("arm-canvas");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const out = {
    point: document.getElementById("ro-point"),
    q: document.getElementById("ro-q"),
    err: document.getElementById("ro-err"),
    mode: document.getElementById("ro-mode"),
    moving: document.getElementById("ro-moving"),
  };
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---- 월드 좌표 (y 위쪽) ----
  const WORLD = { x0: -300, x1: 300, y0: -40, y1: 560 };
  const HIP_Y = 205, HIP_X = 36, THIGH = 95, SHIN = 92;
  const SHOULDER_Y = 372, SHOULDER_X = 84, UPPER = 88, FORE = 82;
  const NECK_Y = 392;

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
  const wrapPi = (a) => Math.atan2(Math.sin(a), Math.cos(a));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const deg = (r) => (r * 180) / Math.PI;

  // ---- 관절 상태 ----
  // 팔 각도는 "바깥쪽이 -x"인 왼쪽 팔 기준으로 저장하고, 오른쪽 팔은 그릴 때 좌우를 뒤집습니다.
  // a1: 위팔의 절대 각도 (아래로 늘어뜨림 = -π/2), a2: 팔꿈치 상대 각도
  const REST_ARM = { a1: -Math.PI / 2 - 0.16, a2: 0.12 };
  const joint = {
    arm: [{ ...REST_ARM }, { ...REST_ARM }], // [0] 화면 왼쪽(로봇 오른팔), [1] 화면 오른쪽(로봇 왼팔)
    lift: [0, 0], // 다리 들기 0~1
    sway: 0, // 골반 좌우 이동
    tilt: 0, // 몸 전체 기울기 (rad)
    look: [0, 0], // 눈동자 방향
    headTilt: 0,
  };
  const goal = JSON.parse(JSON.stringify(joint));

  // 16채널 가상 서보값 (움직이는 서보 수를 세는 데 사용)
  let servo = new Array(16).fill(90), prevServo = servo.slice();

  // ---- 마우스 ----
  let pointer = null, mouseActive = false, mouseTimer = 0;
  canvas.addEventListener("pointermove", (e) => {
    const r = canvas.getBoundingClientRect();
    pointer = toWorld(e.clientX - r.left, e.clientY - r.top);
    mouseActive = true;
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => (mouseActive = false), 2500);
  });
  canvas.addEventListener("pointerleave", () => {
    clearTimeout(mouseTimer);
    mouseTimer = setTimeout(() => (mouseActive = false), 600);
  });

  // 2관절 역기구학 (왼쪽 팔 기준 좌표)
  function armIK(dx, dy) {
    dx = Math.min(dx, -6); // 몸통 안쪽으로는 뻗지 않음
    const d = clamp(Math.hypot(dx, dy), Math.abs(UPPER - FORE) + 4, UPPER + FORE - 0.5);
    const c2 = (d * d - UPPER * UPPER - FORE * FORE) / (2 * UPPER * FORE);
    const a2 = Math.acos(clamp(c2, -1, 1));
    const ang = Math.atan2(dy, dx);
    const a1 = ang - Math.atan2(FORE * Math.sin(a2), UPPER + FORE * Math.cos(a2));
    return { a1, a2, reach: Math.hypot(dx, dy) <= UPPER + FORE };
  }

  // ---- 동작 (자동) ----
  const MODES = ["인사", "제자리 걸음", "균형 잡기"];
  let modeIdx = 0, modeStart = 0;

  function setGoals(t) {
    goal.arm[0] = { ...REST_ARM };
    goal.arm[1] = { ...REST_ARM };
    goal.lift = [0, 0];
    goal.sway = 0;
    goal.tilt = 0;
    goal.look = [0, 0];
    goal.headTilt = 0;

    if (mouseActive && pointer) {
      const [px, py] = pointer;
      const side = px < 0 ? 0 : 1; // 커서와 가까운 쪽 팔
      const m = side === 0 ? 1 : -1;
      const ik = armIK(m * (px - m * -SHOULDER_X) * 1, py - SHOULDER_Y);
      goal.arm[side] = { a1: ik.a1, a2: ik.a2 };
      const hx = 0, hy = NECK_Y + 45;
      const v = [px - hx, py - hy], n = Math.hypot(v[0], v[1]) || 1;
      goal.look = [v[0] / n, v[1] / n];
      goal.headTilt = clamp(-px / 900, -0.18, 0.18);
      goal.sway = clamp(px / 30, -6, 6);
      return { label: "손 뻗기", reach: ik.reach };
    }
    if (reduce) return { label: "대기", reach: true };

    const mode = MODES[modeIdx];
    const k = (t - modeStart) / 1000;
    if (mode === "인사") {
      const wave = Math.sin(k * 7);
      goal.arm[0] = { a1: 2.35, a2: -0.8 + wave * 0.38 };
      goal.look = [-0.25, 0.1];
      goal.headTilt = 0.08;
    } else if (mode === "제자리 걸음") {
      const ph = Math.sin(k * 4.2);
      goal.lift = [Math.max(0, ph), Math.max(0, -ph)];
      goal.sway = -ph * 10; // 디딤발 쪽으로 무게 이동
      goal.arm[0] = { a1: REST_ARM.a1 - 0.12 * Math.max(0, -ph), a2: 0.35 };
      goal.arm[1] = { a1: REST_ARM.a1 - 0.12 * Math.max(0, ph), a2: 0.35 };
      goal.tilt = -ph * 0.025;
    } else {
      const ph = Math.sin(k * 1.9);
      goal.tilt = ph * 0.11;
      // 기울어진 반대쪽 팔을 벌려 균형
      goal.arm[0] = { a1: -Math.PI / 2 - 0.25 - Math.max(0, ph) * 1.0, a2: 0.1 };
      goal.arm[1] = { a1: -Math.PI / 2 - 0.25 - Math.max(0, -ph) * 1.0, a2: 0.1 };
      goal.look = [0, -0.15];
    }
    return { label: mode, reach: true };
  }

  // ---- 기구학 (그리기용 점 계산) ----
  function armPoints(i) {
    const side = i === 0 ? 1 : -1; // 왼쪽 팔 기준 좌표를 화면 좌표로
    const sh = [-side * SHOULDER_X, SHOULDER_Y];
    const { a1, a2 } = joint.arm[i];
    const el = [sh[0] + side * UPPER * Math.cos(a1), sh[1] + UPPER * Math.sin(a1)];
    const hd = [el[0] + side * FORE * Math.cos(a1 + a2), el[1] + FORE * Math.sin(a1 + a2)];
    return { sh, el, hd };
  }
  function legPoints(i) {
    const side = i === 0 ? -1 : 1;
    const hip = [side * HIP_X + joint.sway, HIP_Y];
    const flex = joint.lift[i] * 0.95;
    const foot = [side * (HIP_X + 6), 0];
    const kneeY = HIP_Y - THIGH * Math.cos(flex);
    const ankleY = HIP_Y - (THIGH + SHIN) * Math.cos(flex);
    const ankle = [foot[0], Math.max(ankleY, 14 + joint.lift[i] * 4)];
    const knee = [(hip[0] + ankle[0]) / 2 + side * 6 * joint.lift[i], kneeY];
    return { hip, knee, ankle, flex };
  }

  // ---- 그리기 ----
  const C = { ink: "#0e1a2b", line: "#e2e7ee", line2: "#cfd7e1", muted: "#6a7686", blue: "#1d6ff2", mint: "#11b3a3", white: "#fff" };

  function draw(t, label) {
    ctx.clearRect(0, 0, W, H);
    // 도면 그리드
    ctx.lineWidth = 1;
    ctx.strokeStyle = C.line;
    const step = 50;
    for (let x = Math.ceil(WORLD.x0 / step) * step; x <= WORLD.x1; x += step) line(sx(x), sy(WORLD.y0), sx(x), sy(WORLD.y1));
    for (let y = Math.ceil(WORLD.y0 / step) * step; y <= WORLD.y1; y += step) line(sx(WORLD.x0), sy(y), sx(WORLD.x1), sy(y));

    // 지면 + 그림자
    ctx.fillStyle = "#f1f4f7";
    ctx.fillRect(sx(WORLD.x0), sy(0), (WORLD.x1 - WORLD.x0) * S, 40 * S);
    ctx.strokeStyle = C.line2;
    line(sx(WORLD.x0), sy(0), sx(WORLD.x1), sy(0));
    ctx.beginPath();
    ctx.ellipse(sx(joint.sway * 0.6), sy(-4), 95 * S, 9 * S, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(14,26,43,.07)";
    ctx.fill();
    ctx.fillStyle = C.muted;
    ctx.font = "11px Pretendard, 'Malgun Gothic', sans-serif";
    ctx.fillText("16관절 휴머노이드 · ESP32 + PCA9685 · MG90S × 16", sx(WORLD.x0 + 14), sy(-24));

    // 기울기 기준선 (IMU)
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = C.line2;
    line(sx(0), sy(0), sx(0), sy(520));
    ctx.setLineDash([]);

    // 몸 전체를 발목 중심으로 기울임
    ctx.save();
    ctx.translate(sx(0), sy(0));
    ctx.rotate(joint.tilt);
    ctx.translate(-sx(0), -sy(0));

    if (Math.abs(joint.tilt) > 0.01) {
      ctx.setLineDash([3, 4]);
      ctx.strokeStyle = "rgba(17,179,163,.7)";
      ctx.lineWidth = 1.2;
      line(sx(0), sy(0), sx(0), sy(520));
      ctx.setLineDash([]);
    }

    const legs = [legPoints(0), legPoints(1)];
    const arms = [armPoints(0), armPoints(1)];
    const pelvisX = joint.sway;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 다리 (드는 다리를 뒤에)
    for (const i of joint.lift[0] > joint.lift[1] ? [0, 1] : [1, 0]) {
      const L = legs[i];
      limb([L.hip, L.knee, L.ankle], 20);
      // 발
      ctx.fillStyle = C.white;
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = 1.6;
      const fw = 52, fh = 14;
      roundRect(sx(L.ankle[0] - fw / 2 + (i === 0 ? -6 : 6)), sy(L.ankle[1] - 2), fw * S, fh * S, 4 * S);
      ctx.fill(); ctx.stroke();
    }

    // 골반 / 허리
    box(pelvisX - 62, HIP_Y + 38, 124, 44, 10);
    // 몸통
    const tx = pelvisX * 0.5;
    box(tx - 82, NECK_Y - 4, 164, 150, 16);
    // 몸통 안 보드
    ctx.fillStyle = "#eef3fb";
    ctx.strokeStyle = C.line2;
    ctx.lineWidth = 1;
    roundRect(sx(tx - 52), sy(NECK_Y - 62), 104 * S, 56 * S, 4 * S);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = C.muted;
    ctx.font = `${Math.max(8, 13 * S)}px Pretendard, 'Malgun Gothic', sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText("ESP32", sx(tx), sy(NECK_Y - 84));
    ctx.fillText("PCA9685", sx(tx), sy(NECK_Y - 64 - 38));
    ctx.textAlign = "start";
    // 가슴 거리 센서 (VL53L0X)
    ctx.fillStyle = C.ink;
    roundRect(sx(tx - 12), sy(NECK_Y - 18), 24 * S, 12 * S, 2 * S);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx(tx), sy(NECK_Y - 24), Math.max(1.5, 3 * S), 0, Math.PI * 2);
    ctx.fillStyle = C.mint;
    ctx.fill();

    // 팔
    for (const i of [0, 1]) {
      const A = arms[i];
      const sh = [A.sh[0] + tx, A.sh[1]], el = [A.el[0] + tx, A.el[1]], hd = [A.hd[0] + tx, A.hd[1]];
      limb([sh, el, hd], 18);
      ctx.beginPath();
      ctx.arc(sx(hd[0]), sy(hd[1]), Math.max(5, 12 * S), 0, Math.PI * 2);
      ctx.fillStyle = C.white; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = C.ink; ctx.stroke();
    }

    // 목 + 머리
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = Math.max(6, 14 * S);
    line(sx(tx), sy(NECK_Y - 6), sx(tx), sy(NECK_Y + 16));
    ctx.save();
    ctx.translate(sx(tx), sy(NECK_Y + 10));
    ctx.rotate(joint.headTilt);
    ctx.translate(-sx(tx), -sy(NECK_Y + 10));
    box(tx - 58, NECK_Y + 100, 116, 86, 18);
    // 눈 (커서를 봄)
    const blink = !reduce && t % 4200 < 130;
    for (const ex of [-24, 24]) {
      const cx = sx(tx + ex), cy = sy(NECK_Y + 58);
      ctx.beginPath();
      if (blink) {
        ctx.lineWidth = 2; ctx.strokeStyle = C.ink;
        line(cx - 9 * S, cy, cx + 9 * S, cy);
        continue;
      }
      ctx.arc(cx, cy, Math.max(5, 12 * S), 0, Math.PI * 2);
      ctx.fillStyle = C.white; ctx.fill();
      ctx.lineWidth = 1.6; ctx.strokeStyle = C.ink; ctx.stroke();
      ctx.beginPath();
      ctx.arc(cx + joint.look[0] * 5 * S, cy - joint.look[1] * 5 * S, Math.max(2.5, 5.5 * S), 0, Math.PI * 2);
      ctx.fillStyle = C.blue; ctx.fill();
    }
    // 머리 위 서보 혼 (목 서보 ch0)
    ctx.fillStyle = C.blue;
    roundRect(sx(tx - 10), sy(NECK_Y + 106), 20 * S, 6 * S, 2 * S);
    ctx.fill();
    ctx.restore();

    // 관절 (서보) 표시
    const joints = [
      ...legs.flatMap((L) => [L.hip, L.knee, L.ankle]),
      ...arms.flatMap((A) => [[A.sh[0] + tx, A.sh[1]], [A.el[0] + tx, A.el[1]]]),
    ];
    for (const [x, y] of joints) servoDot(x, y);
    ctx.restore();

    // 커서 목표
    if (mouseActive && pointer) {
      const pr = 6 + Math.sin(t / 300) * 2;
      ctx.beginPath();
      ctx.arc(sx(pointer[0]), sy(pointer[1]), pr, 0, Math.PI * 2);
      ctx.strokeStyle = C.mint;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.lineCap = "butt";
  }

  function limb(pts, w) {
    for (let i = 0; i < pts.length - 1; i++) {
      ctx.strokeStyle = C.ink;
      ctx.lineWidth = Math.max(9, (w + 5) * S);
      line(sx(pts[i][0]), sy(pts[i][1]), sx(pts[i + 1][0]), sy(pts[i + 1][1]));
      ctx.strokeStyle = C.white;
      ctx.lineWidth = Math.max(6, w * S);
      line(sx(pts[i][0]), sy(pts[i][1]), sx(pts[i + 1][0]), sy(pts[i + 1][1]));
    }
  }
  function servoDot(x, y) {
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), Math.max(5, 11 * S), 0, Math.PI * 2);
    ctx.fillStyle = C.white; ctx.fill();
    ctx.lineWidth = 2; ctx.strokeStyle = C.ink; ctx.stroke();
    ctx.beginPath();
    ctx.arc(sx(x), sy(y), Math.max(2, 3.5 * S), 0, Math.PI * 2);
    ctx.fillStyle = C.blue; ctx.fill();
  }
  function box(x, yTop, w, h, r) {
    ctx.fillStyle = C.white;
    ctx.strokeStyle = C.ink;
    ctx.lineWidth = 1.6;
    roundRect(sx(x), sy(yTop), w * S, h * S, r * S);
    ctx.fill(); ctx.stroke();
  }
  function line(x1, y1, x2, y2) { ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); }
  function roundRect(x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath();
  }

  // ---- 서보 채널 값 (실측 가동 범위로 제한) ----
  function updateServos() {
    const A = joint.arm, Lg = [legPoints(0), legPoints(1)];
    servo = [
      clamp(90 + deg(joint.headTilt) * 3 + joint.look[0] * 30, 0, 180), // 0 목
      clamp(90 - deg(wrapPi(A[0].a1 + Math.PI / 2)) * 0.6, 0, 180), // 1 오른어깨 (팔을 들수록 커짐)
      clamp(125 + deg(A[0].a2) * 0.6, 70, 180), // 2 오른팔 (70~180 실측)
      90, // 3 오른팔
      clamp(90 + deg(wrapPi(A[1].a1 + Math.PI / 2)) * 0.6, 0, 180), // 4 왼어깨
      clamp(45 - deg(A[1].a2) * 0.4, 0, 90), // 5 왼팔 (0~90 실측)
      90, // 6 왼팔
      clamp(100 + joint.sway, 0, 180), // 7 허리 중앙 (중립 100)
      clamp(90 + deg(joint.tilt), 90, 180), // 8 허리·골반
      clamp(110 + deg(joint.tilt), 0, 110), // 9 허리·골반
      clamp(90 + deg(Lg[0].flex), 90, 160), // 10 오른다리
      clamp(90 - deg(Lg[0].flex), 0, 90), // 11 오른다리
      clamp(80 - deg(joint.tilt) * 2, 0, 80), // 12 오른다리
      clamp(90 - deg(Lg[1].flex), 0, 90), // 13 왼다리
      clamp(90 + deg(Lg[1].flex), 90, 160), // 14 왼다리
      clamp(70 + deg(joint.tilt) * 2, 70, 180), // 15 왼다리
    ];
  }

  // ---- 루프: 관절이 목표 자세로 부드럽게 따라감 ----
  let visible = true;
  new IntersectionObserver(([e]) => (visible = e.isIntersecting)).observe(canvas);

  function frame(t) {
    requestAnimationFrame(frame);
    if (!visible) return;
    if (!mouseActive && !reduce && t - modeStart > 4800) {
      modeIdx = (modeIdx + 1) % MODES.length;
      modeStart = t;
    }
    const g = setGoals(t);
    const k = reduce ? 1 : 0.12;
    for (const i of [0, 1]) {
      joint.arm[i].a1 += k * wrapPi(goal.arm[i].a1 - joint.arm[i].a1);
      joint.arm[i].a2 += k * wrapPi(goal.arm[i].a2 - joint.arm[i].a2);
      joint.lift[i] += k * (goal.lift[i] - joint.lift[i]);
      joint.look[i] += k * (goal.look[i] - joint.look[i]);
    }
    joint.sway += k * (goal.sway - joint.sway);
    joint.tilt += k * (goal.tilt - joint.tilt);
    joint.headTilt += k * (goal.headTilt - joint.headTilt);

    prevServo = servo;
    updateServos();
    draw(t, g.label);

    if (out.point) {
      out.point.textContent = g.label;
      out.q.textContent = [servo[0], servo[1], servo[2]].map((a) => Math.round(a) + "°").join(" ");
      const tiltDeg = -deg(joint.tilt);
      out.err.textContent = (tiltDeg >= 0 ? "+" : "") + tiltDeg.toFixed(1) + "°";
      out.mode.textContent = mouseActive ? (g.reach ? "수동 조작" : "닿지 않음") : reduce ? "대기" : "자동 동작";
      if (out.moving) out.moving.textContent = `${servo.filter((v, i) => Math.abs(v - prevServo[i]) > 0.05).length} / 16`;
    }
  }

  addEventListener("resize", resize);
  resize();
  requestAnimationFrame(frame);
})();
