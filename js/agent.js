/* AI 에이전트 패널.
   - 데모 모드(endpoint 없음): data.js 의 자료만 검색해 답합니다. AI가 아니라는 것을 화면에 표시합니다.
   - 연결 모드(endpoint 있음): 서버(api/chat.js)를 거쳐 Claude가 등록 자료를 근거로 답합니다. */
(function () {
  const D = window.PORTFOLIO;
  const CFG = window.AGENT_CONFIG || {};
  // 더블클릭(file://)으로 열면 서버가 없으므로 항상 데모 모드
  const LIVE = Boolean(CFG.endpoint) && location.protocol !== "file:";
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

  const BOT_ICON = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="8" width="16" height="11" rx="3"/><path d="M12 4v4M9 13h.01M15 13h.01M9.5 16.5h5"/><circle cx="12" cy="3.5" r="1"/></svg>`;

  const SUGGESTIONS = [
    ["featured", "대표 프로젝트는 무엇인가요?"],
    ["arm", "로봇팔은 어떤 방식으로 제어했나요?"],
    ["hardware", "사용한 하드웨어와 센서는?"],
    ["problems", "연구 과정에서 해결한 문제는?"],
    ["ai", "프로젝트에 적용된 AI 기술은?"],
    ["skills", "기술 역량과 사용 도구는?"],
  ];

  /* ---------- UI ---------- */
  const fab = document.createElement("button");
  fab.className = "agent-fab";
  fab.setAttribute("aria-haspopup", "dialog");
  fab.innerHTML = `<span class="pulse"></span><span class="bot">${BOT_ICON}</span>AI 어시스턴트`;

  const panel = document.createElement("section");
  panel.className = "agent-panel";
  panel.setAttribute("role", "dialog");
  panel.setAttribute("aria-label", "포트폴리오 AI 에이전트");
  panel.setAttribute("aria-hidden", "true");
  panel.innerHTML = `
    <div class="agent-head">
      <div class="avatar">${BOT_ICON}</div>
      <div>
        <h2>연구실 어시스턴트</h2>
        <div class="mode">${
          LIVE
            ? `<span class="dot"></span>AI 연결됨 · 등록된 자료 기반 답변`
            : `<span class="dot demo"></span>데모 모드 · 등록 자료 검색`
        }</div>
      </div>
      <button class="close" aria-label="닫기">×</button>
    </div>
    <div class="agent-log" aria-live="polite"></div>
    <div class="agent-chips">${SUGGESTIONS.map(([k, q]) => `<button data-intent="${k}">${q}</button>`).join("")}</div>
    <form class="agent-form">
      <label class="skip" for="agent-input">질문 입력</label>
      <input id="agent-input" autocomplete="off" maxlength="500" placeholder="프로젝트, 센서, 제어 방법 등을 물어보세요">
      <button type="submit">보내기</button>
    </form>`;
  document.body.append(fab, panel);

  const log = panel.querySelector(".agent-log");
  const form = panel.querySelector(".agent-form");
  const input = panel.querySelector("input");
  const sendBtn = form.querySelector("button");
  const history = [];
  let greeted = false;

  function open() {
    panel.classList.add("open");
    panel.setAttribute("aria-hidden", "false");
    fab.style.visibility = "hidden";
    if (!greeted) {
      greeted = true;
      if (!LIVE)
        add(
          "notice",
          "지금은 <b>데모 모드</b>입니다. 실제 AI가 아니라 이 사이트에 등록된 프로젝트·연구·개발 기록에서 관련 내용을 찾아 보여 줍니다."
        );
      add(
        "bot",
        `안녕하세요, ${esc(D.profile.name)}의 로봇 연구실 어시스턴트입니다. 프로젝트, 하드웨어, 제어 방법, 시행착오 기록에 대해 물어보세요. 등록되지 않은 내용은 지어내지 않고 아직 공개되지 않았다고 알려 드릴게요.`
      );
    }
    setTimeout(() => input.focus(), 200);
  }
  function close() {
    panel.classList.remove("open");
    panel.setAttribute("aria-hidden", "true");
    fab.style.visibility = "";
    fab.focus();
  }
  fab.addEventListener("click", open);
  panel.querySelector(".close").addEventListener("click", close);
  document.addEventListener("click", (e) => {
    if (e.target.closest("[data-open-agent]")) {
      e.preventDefault();
      open();
    }
  });
  document.addEventListener("keydown", (e) => e.key === "Escape" && panel.classList.contains("open") && close());

  function add(kind, html) {
    const el = document.createElement("div");
    el.className = `msg ${kind}`;
    el.innerHTML = html;
    log.append(el);
    log.scrollTop = log.scrollHeight;
    return el;
  }

  panel.querySelector(".agent-chips").addEventListener("click", (e) => {
    const b = e.target.closest("button");
    if (b) ask(b.textContent, b.dataset.intent);
  });
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const q = input.value.trim();
    if (q) ask(q);
    input.value = "";
  });

  async function ask(question, intent) {
    add("user", esc(question));
    const typing = add("bot", `<span class="typing"><i></i><i></i><i></i></span>`);
    sendBtn.disabled = true;
    try {
      if (LIVE) {
        history.push({ role: "user", content: question });
        const res = await fetch(CFG.endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history.slice(-10) }),
        });
        if (!res.ok) throw new Error(String(res.status));
        const { reply } = await res.json();
        history.push({ role: "assistant", content: reply });
        typing.innerHTML = esc(reply).replace(/\n/g, "<br>");
      } else {
        await new Promise((r) => setTimeout(r, 450));
        typing.innerHTML = demoAnswer(question, intent);
      }
    } catch (err) {
      typing.innerHTML = "지금은 답변 서버에 연결할 수 없습니다. 잠시 후 다시 시도해 주세요.";
    }
    sendBtn.disabled = false;
    log.scrollTop = log.scrollHeight;
  }

  /* ---------- 데모 모드: 등록 자료 기반 응답 ---------- */
  const projLink = (p) => `<a href="project.html?id=${encodeURIComponent(p.id)}">${esc(p.title)}</a>`;
  const src = (links) => `<div class="src">${links.map(([href, label]) => `<a href="${href}">${esc(label)}</a>`).join("")}</div>`;
  const STATUS = { active: "진행 중", prototype: "프로토타입", hardware: "하드웨어 완료", experiment: "실험 중", done: "완료", draft: "자료 준비 중" };

  const INTENTS = {
    featured: {
      kw: ["대표", "주요", "프로젝트", "뭐 만들", "무엇을 만들", "featured", "project"],
      answer() {
        const f = D.projects.filter((p) => p.featured);
        const list = f.length ? f : D.projects;
        if (!list.length) return NONE;
        return `등록된 ${f.length ? "대표 " : ""}프로젝트는 ${list.length}개입니다.<ul>${list
          .map((p) => `<li><b>${esc(p.title)}</b>${p.status ? ` (${STATUS[p.status] || esc(p.status)})` : ""} — ${esc(p.summary)}</li>`)
          .join("")}</ul>${src(list.map((p) => [`project.html?id=${p.id}`, p.title]))}`;
      },
    },
    arm: {
      kw: ["로봇팔", "팔", "매니퓰레이터", "제어", "서보잉", "역기구학", "자코비안", "pbvs", "arm", "control"],
      answer() {
        const ps = D.projects.filter((p) => p.control);
        if (!ps.length) return NONE;
        return `프로젝트별로 등록된 제어 방식입니다.<ul>${ps
          .map((p) => `<li><b>${esc(p.title)}</b> — ${esc(p.control)}</li>`)
          .join("")}</ul>${src(ps.map((p) => [`project.html?id=${p.id}`, p.title]))}`;
      },
    },
    hardware: {
      kw: ["하드웨어", "센서", "부품", "모터", "서보", "카메라", "imu", "esp32", "아두이노", "hardware", "sensor"],
      answer() {
        const ps = D.projects.filter((p) => p.hardware?.length);
        if (!ps.length) return NONE;
        return `프로젝트별로 등록된 하드웨어 구성입니다.${ps
          .map((p) => `<br><b>${esc(p.title)}</b><ul>${p.hardware.map((h) => `<li>${esc(h)}</li>`).join("")}</ul>`)
          .join("")}${src(ps.map((p) => [`project.html?id=${p.id}`, p.title]))}`;
      },
    },
    problems: {
      kw: ["문제", "해결", "시행착오", "실패", "트러블", "버그", "어려", "problem", "debug"],
      answer() {
        if (!D.logs.length) return NONE;
        return `개발 기록에 등록된 문제 해결 사례입니다.<ul>${D.logs
          .map((l) => `<li><b>${esc(l.title)}</b> — ${esc(l.learned)}</li>`)
          .join("")}</ul>${src([["log.html", "개발 기록 전체 보기"]])}`;
      },
    },
    ai: {
      kw: ["ai", "인공지능", "신경망", "딥러닝", "학습", "모델", "비전", "mediapipe", "pytorch", "llm", "에이전트"],
      answer() {
        const AI = /ai|인공지능|신경망|딥러닝|머신러닝|학습|비전|vision|pytorch|tensorflow|mediapipe|opencv|yolo|llm|에이전트|강화/i;
        const ps = D.projects.filter((p) => AI.test([p.category, ...(p.tags || []), p.software?.join(" ")].join(" ")));
        if (!ps.length) return NONE;
        return `AI 관련 기술이 들어간 프로젝트입니다.<ul>${ps
          .map((p) => `<li><b>${esc(p.title)}</b> — ${esc((p.tags || []).join(", "))}${p.summary ? `<br>${esc(p.summary)}` : ""}</li>`)
          .join("")}</ul>${src(ps.map((p) => [`project.html?id=${p.id}`, p.title]))}`;
      },
    },
    skills: {
      kw: ["역량", "기술 스택", "스택", "도구", "툴", "언어", "할 줄", "skill", "tool"],
      answer() {
        const { using, learning } = D.skills;
        if (!using.length && !learning.length) return NONE;
        return `${using.length ? `<b>실제로 사용한 기술</b><ul>${using.map((g) => `<li>${esc(g.group)}: ${g.items.map(esc).join(", ")}</li>`).join("")}</ul>` : ""}${
          learning.length ? `<b>학습 중</b><ul>${learning.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : ""
        }${src([["about.html", "소개 페이지"]])}`;
      },
    },
  };
  const NONE = "이 부분은 아직 포트폴리오에 등록된 자료가 없습니다. 자료가 공개되면 답해 드릴게요.";

  // 등록 자료 전체를 검색용 문서로 펼침
  const DOCS = [
    ...D.projects.map((p) => ({
      label: p.title,
      href: `project.html?id=${p.id}`,
      title: p.title,
      text: [p.title, p.subtitle, p.summary, p.goal, p.problem, p.control, ...(p.tags || []), ...(p.hardware || []), ...(p.software || []), ...(p.process || []), ...(p.lessons || []), ...(p.results || [])].join(" "),
      best: p.summary,
    })),
    ...D.research.map((r) => ({
      label: "연구",
      href: `research.html#${r.id}`,
      title: r.title,
      text: [r.title, r.subtitle, r.background, ...(r.approach || []), ...(r.environment || []), ...(r.results || []), ...(r.limits || []), ...(r.next || [])].join(" "),
      best: r.background,
    })),
    ...D.logs.map((l) => ({
      label: "개발 기록",
      href: `log.html#${l.id}`,
      title: l.title,
      text: [l.title, l.problem, l.cause, l.tried, l.observed, l.improved, l.learned, ...(l.tags || [])].join(" "),
      best: `${l.problem} → ${l.improved}`,
    })),
  ];

  // 한글 덩어리와 영문·숫자 덩어리를 따로 자름 ("MPU6050은" → "mpu6050", "은")
  const words = (s) => s.toLowerCase().match(/[\p{Script=Hangul}]+|[a-z0-9]+/gu) || [];
  function wordGrams(w) {
    if (/^[a-z0-9]+$/.test(w)) return w.length > 1 ? [w] : [];
    const g = [];
    for (let i = 0; i < w.length - 1; i++) g.push(w.slice(i, i + 2));
    return g;
  }
  const grams = (s) => new Set(words(s).flatMap(wordGrams));
  // 질문에서 "내용"이 아닌 말 — 검색과 미등록 주제 판단에서 제외
  const FILLER = /^(어떤|무엇|뭐|뭘|어디|어떻게|왜|언제|누구|경험|사용|활용|관련|대해|정보|궁금|알려|설명|있|없|했|하|해|된|되|썼|써|만들|좀|이|그|저|요|나요|인가|무슨|혹시|가장|제일|주로|직접|the|what|how|did|do|you|is|are|use|used)/;
  DOCS.forEach((d) => (d.g = grams(d.text)));
  const CORPUS = new Set(DOCS.flatMap((d) => [...d.g]));
  const INTENT_KW = Object.values(INTENTS).flatMap((v) => v.kw);

  const contentWords = (q) => [...new Set(words(q))].filter((w) => w.length >= 2 && !FILLER.test(w));
  // 조사 하나는 빠져도 같은 단어로 봄 ("로봇손은" ≈ "로봇손")
  function has(set, w) {
    const g = wordGrams(w);
    return g.filter((x) => set.has(x)).length >= Math.max(1, g.length - 1);
  }

  function demoAnswer(q, intent) {
    if (intent) return INTENTS[intent].answer();
    const lq = q.toLowerCase();
    let best = null, bestHits = 0;
    for (const [k, v] of Object.entries(INTENTS)) {
      const hits = v.kw.filter((w) => lq.includes(w)).length;
      if (hits > bestHits) (best = k), (bestHits = hits);
    }
    const W = contentWords(q);
    const unknown = W.filter((w) => !has(CORPUS, w) && !INTENT_KW.some((k) => w.includes(k)));
    // 몇 개 문서에만 나오는 단어 = 질문의 핵심 (예: "MPU6050", "전원")
    const specific = W.filter((w) => {
      if (INTENT_KW.some((k) => w.includes(k))) return false;
      const n = DOCS.filter((d) => has(d.g, w)).length;
      return n >= 1 && n <= 2;
    });

    if (specific.length) return searchAnswer(rank(specific));
    // 핵심 단어가 자료에 없으면, 비슷한 단어("제어")가 걸려도 아는 척하지 않음
    if (unknown.length) {
      const head = `'${esc(unknown.join(", "))}'에 관한 내용은 아직 이 포트폴리오에 공개되지 않았습니다.`;
      if (best) return `${head}<br><br>대신 등록된 관련 자료를 보여 드릴게요.<br>${INTENTS[best].answer()}`;
      return `${head} 프로젝트, 하드웨어, 제어 방법, 시행착오 기록에 대해 물어보시면 등록된 자료로 답해 드릴게요.`;
    }
    if (best) return INTENTS[best].answer();
    const found = rank(W);
    return found.length ? searchAnswer(found) : notFound();
  }

  function rank(ws) {
    return DOCS.map((d) => ({ d, score: ws.filter((w) => has(d.g, w)).length }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3);
  }

  function searchAnswer(found) {
    return `등록된 자료에서 관련 내용을 찾았습니다.<ul>${found
      .map(({ d }) => `<li><b>${esc(d.title)}</b> — ${esc(d.best)}</li>`)
      .join("")}</ul>${src(found.map(({ d }) => [d.href, d.label]))}`;
  }

  function notFound() {
    return `그 질문에 대한 정보는 아직 이 포트폴리오에 공개되지 않았습니다. 프로젝트, 하드웨어, 제어 방법, 시행착오 기록에 대해 물어보시면 등록된 자료로 답해 드릴게요.`;
  }
})();
