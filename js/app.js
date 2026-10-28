/* 공통 레이아웃(헤더/푸터) + 각 페이지 렌더링.
   내용은 js/data.js 의 window.PORTFOLIO 에서 읽습니다. */
(function () {
  const D = window.PORTFOLIO;
  const page = document.body.dataset.page;

  const STATUS = {
    active: "진행 중",
    prototype: "프로토타입",
    hardware: "하드웨어 완료",
    experiment: "실험 중",
    done: "완료",
    draft: "자료 준비 중",
  };
  const EVIDENCE = { sim: "시뮬레이션 결과", real: "실물 결과", none: "" };

  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const $ = (sel, root = document) => root.querySelector(sel);
  const statusBadge = (s) => `<span class="status status-${s}">${STATUS[s] || esc(s)}</span>`;
  const empty = (msg) => `<div class="card empty" style="grid-column:1/-1">${msg}</div>`;

  /* ---------- 헤더 / 푸터 ---------- */
  const NAV = [
    ["home", "index.html", "홈"],
    ["projects", "projects.html", "프로젝트"],
    ["research", "research.html", "연구"],
    ["log", "log.html", "개발 기록"],
    ["about", "about.html", "소개"],
  ];
  const current = page === "project" ? "projects" : page;

  const header = document.createElement("header");
  header.className = "site-header";
  header.innerHTML = `
    <a class="skip" href="#main">본문으로 건너뛰기</a>
    <nav class="container nav" aria-label="주 메뉴">
      <a class="logo" href="index.html"><span class="logo-mark">${esc(D.profile.initials)}</span><span>${esc(D.profile.name)} <span style="color:var(--muted);font-weight:500">로보틱스</span></span></a>
      <button class="menu-btn" aria-expanded="false" aria-controls="nav-links" aria-label="메뉴 열기">☰</button>
      <ul class="nav-links" id="nav-links">
        ${NAV.map(([k, href, label]) => `<li><a href="${href}" ${k === current ? 'aria-current="page"' : ""}>${label}</a></li>`).join("")}
      </ul>
      <button class="btn btn-ghost btn-sm nav-agent" data-open-agent><span class="dot"></span>AI 에이전트</button>
    </nav>`;
  document.body.prepend(header);

  const menuBtn = $(".menu-btn", header);
  menuBtn.addEventListener("click", () => {
    const open = $(".nav-links", header).classList.toggle("open");
    menuBtn.setAttribute("aria-expanded", open);
  });
  addEventListener("scroll", () => header.classList.toggle("scrolled", scrollY > 8), { passive: true });

  const footer = document.createElement("footer");
  footer.className = "site-footer";
  footer.innerHTML = `
    <div class="container">
      <span>© ${new Date().getFullYear()} ${esc(D.profile.name)} · ${esc(D.profile.role)}</span>
      <span>
        ${D.profile.github ? `<a href="${esc(D.profile.github)}" target="_blank" rel="noopener">GitHub</a>` : ""}
        ${D.profile.email ? ` · <a href="mailto:${esc(D.profile.email)}">${esc(D.profile.email)}</a>` : ""}
      </span>
    </div>`;
  document.body.append(footer);

  /* ---------- 도면 스타일 일러스트 (사진이 없을 때) ---------- */
  const ILLU = {
    rail: `<svg viewBox="0 0 320 200" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round">
      <g stroke="#cfd7e1" stroke-width="1"><path d="M0 170h320"/><path d="M20 0v200M60 0v200M100 0v200M140 0v200M180 0v200M220 0v200M260 0v200M300 0v200" opacity=".5"/></g>
      <g color="#0e1a2b"><path d="M196 170h80v-6l-28-8v-50l10-6v-16l-4-4h-36l-4 4v16l10 6v50l-28 8z" fill="#fff"/>
      <rect x="38" y="120" width="96" height="30" rx="8" fill="#fff"/><path d="M50 150l-8 20M70 150l6 20M104 150l-6 20M124 150l8 20"/>
      <circle cx="120" cy="118" r="5" fill="#fff"/><path d="M120 118l40-58 34 26"/><circle cx="160" cy="60" r="4.5" fill="#fff"/><circle cx="194" cy="86" r="4" fill="#fff"/>
      <rect x="188" y="94" width="12" height="9" rx="2" fill="#1d6ff2" stroke="#1d6ff2"/></g>
      <path d="M200 103l21 23M196 104l25 22" stroke="#1d6ff2" stroke-dasharray="3 3"/><circle cx="222" cy="126" r="3" fill="#11b3a3" stroke="#11b3a3"/></svg>`,
    hand: `<svg viewBox="0 0 320 200" fill="none" stroke="#0e1a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#cfd7e1" stroke-width="1" opacity=".6"><path d="M0 40h320M0 80h320M0 120h320M0 160h320"/></g>
      <path d="M120 180v-60l-14-40a7 7 0 0 1 13-5l14 32V60a7 7 0 0 1 14 0v40-50a7 7 0 0 1 14 0v52-44a7 7 0 0 1 14 0v48-30a7 7 0 0 1 14 0v64c0 30-18 40-30 40z" fill="#fff"/>
      <path d="M140 60v60M154 50v60M168 58v56M182 72v46" stroke="#1d6ff2" stroke-dasharray="2 4"/>
      <circle cx="140" cy="60" r="3" fill="#11b3a3" stroke="none"/><circle cx="154" cy="50" r="3" fill="#11b3a3" stroke="none"/><circle cx="168" cy="58" r="3" fill="#11b3a3" stroke="none"/><circle cx="182" cy="72" r="3" fill="#11b3a3" stroke="none"/><circle cx="106" cy="80" r="3" fill="#11b3a3" stroke="none"/>
      <rect x="230" y="62" width="56" height="40" rx="6" fill="#fff"/><circle cx="258" cy="82" r="10"/><circle cx="258" cy="82" r="4" fill="#1d6ff2" stroke="none"/>
      <path d="M228 82h-26" stroke-dasharray="3 3"/></svg>`,
    humanoid: `<svg viewBox="0 0 320 200" fill="none" stroke="#0e1a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <g stroke="#cfd7e1" stroke-width="1" opacity=".6"><path d="M0 186h320"/></g>
      <rect x="146" y="18" width="28" height="24" rx="6" fill="#fff"/><circle cx="160" cy="30" r="4" fill="#1d6ff2" stroke="none"/>
      <rect x="138" y="48" width="44" height="54" rx="8" fill="#fff"/><rect x="148" y="60" width="24" height="16" rx="2" stroke="#11b3a3"/>
      <path d="M138 56l-22 26 4 30M182 56l22 26-4 30"/><path d="M148 102l-6 40 4 40M172 102l6 40-4 40"/><path d="M134 184h18M168 184h18"/>
      <g fill="#fff"><circle cx="138" cy="56" r="4"/><circle cx="182" cy="56" r="4"/><circle cx="116" cy="82" r="4"/><circle cx="204" cy="82" r="4"/><circle cx="148" cy="104" r="4"/><circle cx="172" cy="104" r="4"/><circle cx="142" cy="142" r="4"/><circle cx="178" cy="142" r="4"/></g></svg>`,
    agents: `<svg viewBox="0 0 320 200" fill="none" stroke="#0e1a2b" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
      <path d="M90 100h50M180 100h50M160 80V50M160 50h-60v30M160 50h60v30" stroke="#cfd7e1" stroke-dasharray="4 4"/>
      <g fill="#fff"><rect x="40" y="80" width="56" height="40" rx="10"/><rect x="132" y="80" width="56" height="40" rx="10"/><rect x="224" y="80" width="56" height="40" rx="10"/></g>
      <circle cx="68" cy="100" r="6" fill="#1d6ff2" stroke="none"/><circle cx="160" cy="100" r="6" fill="#11b3a3" stroke="none"/><circle cx="252" cy="100" r="6" fill="#0e1a2b" stroke="none"/></svg>`,
    line: `<svg viewBox="0 0 320 200" fill="none" stroke="#0e1a2b" stroke-width="1.6" stroke-linecap="round">
      <path d="M20 150c60 0 60-90 130-90s60 90 150 90" stroke="#0e1a2b" stroke-width="8" opacity=".12"/>
      <path d="M20 150c60 0 60-90 130-90s60 90 150 90" stroke="#1d6ff2" stroke-dasharray="2 6"/>
      <rect x="128" y="44" width="44" height="32" rx="8" fill="#fff"/><circle cx="134" cy="80" r="6" fill="#fff"/><circle cx="166" cy="80" r="6" fill="#fff"/></svg>`,
  };
  const media = (p) =>
    p.image ? `<img src="${esc(p.image)}" alt="${esc(p.title)}" loading="lazy">` : ILLU[p.illustration] || ILLU.rail;

  /* ---------- 프로젝트 카드 ---------- */
  const projectCard = (p) => `
    <a class="card project-card reveal" href="project.html?id=${encodeURIComponent(p.id)}">
      <div class="project-media">${media(p)}${p.status ? statusBadge(p.status) : ""}</div>
      <div class="project-body">
        <span class="cat">${esc(p.category)}</span>
        <h3>${esc(p.title)}${p.subtitle ? `<small>${esc(p.subtitle)}</small>` : ""}</h3>
        <p>${esc(p.summary)}</p>
        <div class="tags">${(p.tags || []).slice(0, 4).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
        <div class="card-foot">
          <span class="evidence">${EVIDENCE[p.evidence] || ""}</span>
          <span class="more">자세히 보기 <span class="arrow">→</span></span>
        </div>
      </div>
    </a>`;

  /* ---------- 페이지 ---------- */
  const R = {};

  R.home = () => {
    const featured = D.projects.filter((p) => p.featured);
    $("#featured").innerHTML = featured.length ? featured.map(projectCard).join("") : empty("아직 등록된 프로젝트가 없습니다. 곧 공개할 예정입니다.");
    $("#stat-projects").textContent = D.projects.length;
    $("#stat-research").textContent = D.research.length;
    $("#stat-logs").textContent = D.logs.length;
    $("#home-logs").innerHTML = D.logs.length
      ? D.logs
          .slice(0, 3)
          .map(
            (l) => `<a class="card reveal" style="padding:24px;color:inherit;display:block" href="log.html#${l.id}">
          <span class="evidence">${esc(l.date)}${l.tags?.length ? " · " + l.tags.map(esc).join(" / ") : ""}</span>
          <h3 style="margin:8px 0 8px;font-size:18px">${esc(l.title)}</h3>
          <p style="margin:0;color:var(--ink-2);font-size:15px">${esc(l.learned)}</p></a>`
          )
          .join("")
      : empty("아직 등록된 개발 기록이 없습니다.");
  };

  R.projects = () => {
    const grid = $("#project-grid");
    const filters = $("#filters");
    if (!D.projects.length) {
      grid.innerHTML = empty("아직 등록된 프로젝트가 없습니다. 곧 공개할 예정입니다.");
      return;
    }
    const cats = ["전체", ...new Set(D.projects.map((p) => p.category).filter(Boolean))];
    filters.innerHTML = cats.map((c, i) => `<button class="filter" aria-pressed="${i === 0}">${esc(c)}</button>`).join("");
    const draw = (cat) => {
      const list = cat === "전체" ? D.projects : D.projects.filter((p) => p.category === cat);
      grid.innerHTML = list.map(projectCard).join("");
      observe(grid);
    };
    filters.addEventListener("click", (e) => {
      const b = e.target.closest(".filter");
      if (!b) return;
      filters.querySelectorAll(".filter").forEach((x) => x.setAttribute("aria-pressed", x === b));
      draw(b.textContent);
    });
    draw("전체");
  };

  R.project = () => {
    const id = new URLSearchParams(location.search).get("id");
    const p = D.projects.find((x) => x.id === id);
    const root = $("#project-root");
    if (!p) {
      root.innerHTML = `<div class="container page-head"><h1>프로젝트를 찾을 수 없습니다</h1><p><a href="projects.html">← 프로젝트 목록으로</a></p></div>`;
      return;
    }
    document.title = `${p.title} — ${D.profile.name} 로보틱스`;
    const list = (arr, cls = "") =>
      arr && arr.length ? `<ul class="${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="placeholder">자료 준비 중입니다.</p>`;
    const table = (t) => `
      <div class="data-table">${t.title ? `<h3>${esc(t.title)}</h3>` : ""}
        <div class="table-scroll"><table>
          <thead><tr>${t.head.map((h) => `<th>${esc(h)}</th>`).join("")}</tr></thead>
          <tbody>${t.rows.map((r) => `<tr>${r.map((c) => `<td>${esc(c)}</td>`).join("")}</tr>`).join("")}</tbody>
        </table></div>${t.note ? `<p class="table-note">${esc(t.note)}</p>` : ""}
      </div>`;
    const text = (t) => (t ? `<p>${esc(t)}</p>` : `<p class="placeholder">자료 준비 중입니다.</p>`);
    const sections = [
      ["goal", "프로젝트 목표", text(p.goal)],
      ["problem", "해결하려는 문제", text(p.problem)],
      ["hardware", "하드웨어 구성", list(p.hardware) + (p.tables || []).map(table).join("")],
      ["software", "소프트웨어 구조", list(p.software)],
      ["control", "제어 알고리즘", text(p.control)],
      ["process", "개발 과정", p.process?.length ? `<ol class="steps">${p.process.map((x) => `<li>${esc(x)}</li>`).join("")}</ol>` : text("")],
      ["lessons", "시행착오와 개선", list(p.lessons)],
      [
        "results",
        "실험 결과",
        (p.evidence === "sim" ? `<div class="callout note" style="margin-bottom:12px">아래 수치는 <b>시뮬레이션</b> 결과이며 실물 검증 전입니다.</div>` : "") + list(p.results, "result-list"),
      ],
      [
        "links",
        "영상 및 코드",
        p.links?.length || p.code?.length
          ? (p.code?.length ? codeViewer(p.code) : "") +
            (p.links?.length
              ? `<div class="tags">${p.links.map((l) => `<a class="btn btn-ghost btn-sm" href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join("")}</div>`
              : "")
          : `<p class="placeholder">영상과 코드는 정리 후 공개 예정입니다.</p>`,
      ],
    ];
    root.innerHTML = `
      <div class="container">
        <div class="detail-hero">
          <div>
            <div class="breadcrumb"><a href="projects.html">프로젝트</a>${p.category ? ` / ${esc(p.category)}` : ""}</div>
            <h1 style="font-size:clamp(32px,4.2vw,50px);letter-spacing:-.03em;line-height:1.15;margin:14px 0 6px">${esc(p.title)}</h1>
            ${p.subtitle ? `<p style="color:var(--muted);margin:0 0 4px;font-size:18px">${esc(p.subtitle)}</p>` : ""}
            <div class="meta-row">${p.status ? statusBadge(p.status) : ""}${p.period ? `<span class="chip">${esc(p.period)}</span>` : ""}${EVIDENCE[p.evidence] ? `<span class="evidence">${EVIDENCE[p.evidence]}</span>` : ""}</div>
            <p style="color:var(--ink-2);font-size:17px">${esc(p.summary)}</p>
            <div class="tags" style="margin-top:14px">${(p.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          </div>
          <div class="project-media">${media(p)}</div>
        </div>
        ${
          p.gallery?.length
            ? `<div class="gallery reveal">${p.gallery
                .map(
                  (g) => `<figure><a href="${esc(g.src)}" target="_blank" rel="noopener"><img src="${esc(g.src)}" alt="${esc(g.caption)}" loading="lazy"></a><figcaption>${esc(g.caption)}</figcaption></figure>`
                )
                .join("")}</div>`
            : ""
        }
      </div>
      <div class="container detail-layout">
        <nav class="toc" aria-label="목차">${sections.map(([k, t]) => `<a href="#${k}">${t}</a>`).join("")}</nav>
        <article>${sections
          .map(([k, t, body], i) => `<section class="doc-section reveal" id="${k}"><h2><span class="idx">${String(i + 1).padStart(2, "0")}</span>${t}</h2>${body}</section>`)
          .join("")}</article>
      </div>`;
    tocSpy();
    if (p.code?.length) initCodeViewer(p.code);
  };

  /* ---------- 코드 뷰어 (프로젝트 상세) ---------- */
  const codeViewer = (files) => `
    <div class="code-viewer">
      <div class="code-tabs" role="tablist">${files
        .map((f, i) => `<button class="code-tab" role="tab" aria-selected="${i === 0}" data-i="${i}">${esc(f.label)}</button>`)
        .join("")}</div>
      <div class="code-bar"><span class="code-path mono"></span><button class="code-copy" type="button">복사</button></div>
      <pre class="code-body"><code></code></pre>
    </div>`;

  let hljsLoading;
  const loadHljs = () =>
    (hljsLoading ||= new Promise((resolve) => {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/styles/github-dark.min.css";
      document.head.appendChild(css);
      const js = document.createElement("script");
      js.src = "https://cdn.jsdelivr.net/npm/@highlightjs/cdn-assets@11.9.0/highlight.min.js";
      js.onload = () => resolve(window.hljs);
      js.onerror = () => resolve(null); // 하이라이트 없이 일반 텍스트로 표시
      document.head.appendChild(js);
    }));

  function initCodeViewer(files) {
    const box = $(".code-viewer");
    const code = $(".code-body code", box);
    const cache = {};
    let current = "";
    const show = async (i) => {
      const f = files[i];
      box.querySelectorAll(".code-tab").forEach((b) => b.setAttribute("aria-selected", b.dataset.i == i));
      $(".code-path", box).textContent = f.path.split("/").pop();
      code.className = "";
      code.textContent = "불러오는 중…";
      try {
        cache[f.path] ??= await fetch(f.path).then((r) => (r.ok ? r.text() : Promise.reject(r.status)));
      } catch {
        code.textContent = "코드를 불러오지 못했습니다. 아래 GitHub 링크에서 확인해 주세요.";
        return;
      }
      current = cache[f.path];
      const hljs = await loadHljs();
      if (files[i] !== f || !hljs) return void (code.textContent = current);
      const lang = /\.py$/.test(f.path) ? "python" : /\.(ino|cpp|c|h)$/.test(f.path) ? "cpp" : "plaintext";
      code.innerHTML = hljs.highlight(current, { language: lang }).value;
    };
    $(".code-tabs", box).addEventListener("click", (e) => {
      const b = e.target.closest(".code-tab");
      if (b) show(+b.dataset.i);
    });
    $(".code-copy", box).addEventListener("click", async (e) => {
      try {
        await navigator.clipboard.writeText(current);
        e.target.textContent = "복사됨";
      } catch {
        e.target.textContent = "복사 실패";
      }
      setTimeout(() => (e.target.textContent = "복사"), 1500);
    });
    show(0);
  }

  R.research = () => {
    const ul = (arr, cls = "") => (arr?.length ? `<ul class="${cls}">${arr.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>` : `<p class="placeholder">자료 준비 중입니다.</p>`);
    $("#research-list").innerHTML = D.research.length
      ? D.research
          .map(
            (r, i) => `
      <article class="card paper reveal" id="${r.id}">
        <div class="paper-head">
          <div><span class="evidence">연구 ${String(i + 1).padStart(2, "0")}</span>
            <h2>${esc(r.title)}</h2>${r.subtitle ? `<p class="ko">${esc(r.subtitle)}</p>` : ""}</div>
          ${r.status ? `<span class="status status-active">${esc(r.status)}</span>` : ""}
        </div>
        <div class="paper-grid">
          <div class="wide"><h3>연구 배경 · 문제 정의</h3>${r.background ? `<p>${esc(r.background)}</p>` : `<p class="placeholder">자료 준비 중입니다.</p>`}</div>
          <div><h3>적용 기술</h3>${ul(r.approach)}</div>
          <div><h3>실험 환경</h3>${ul(r.environment)}</div>
          <div><h3>주요 결과</h3>${ul(r.results, "result-list")}</div>
          <div><h3>한계</h3>${ul(r.limits)}</div>
          <div class="wide"><h3>향후 개선 방향</h3>${ul(r.next)}</div>
        </div>
      </article>`
          )
          .join("")
      : empty("아직 등록된 연구가 없습니다. 곧 공개할 예정입니다.");
  };

  R.log = () => {
    const steps = [
      ["problem", "01 문제 상황", ""],
      ["cause", "02 원인 분석", ""],
      ["tried", "03 시도한 방법", ""],
      ["observed", "04 실패와 관찰", "fail"],
      ["improved", "05 개선 과정", ""],
      ["learned", "06 결과 · 배운 점", "done"],
    ];
    if (!D.logs.length) {
      $("#log-list").innerHTML = empty("아직 등록된 개발 기록이 없습니다.");
      return;
    }
    $("#log-list").innerHTML = D.logs
      .map(
        (l) => `
      <details class="card log reveal" id="${l.id}">
        <summary><span class="date">${esc(l.date)}</span><h3>${esc(l.title)}</h3><span class="plus" aria-hidden="true">+</span></summary>
        <div class="log-body">
          <div class="tags" style="margin-bottom:16px">${(l.tags || []).map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div>
          <ol class="timeline">${steps.map(([k, label, cls]) => `<li class="${cls}"><h4>${label}</h4><p>${esc(l[k]) || '<span class="placeholder">작성 중</span>'}</p></li>`).join("")}</ol>
        </div>
      </details>`
      )
      .join("");
    const target = location.hash && document.getElementById(location.hash.slice(1));
    if (target) {
      target.open = true;
      setTimeout(() => target.scrollIntoView({ block: "start" }), 50);
    } else {
      const first = $("#log-list details");
      if (first) first.open = true;
    }
  };

  R.about = () => {
    const P = D.profile;
    const pending = `<p class="placeholder" style="margin:0">자료 준비 중입니다.</p>`;
    $("#about-goal").textContent = P.goal || "로봇을 직접 만들고, 제어하고, 실험하는 엔지니어입니다.";
    $("#about-interests").innerHTML = P.interests?.length ? P.interests.map((x) => `<span class="chip">${esc(x)}</span>`).join("") : pending;
    $("#about-using").innerHTML = D.skills.using.length
      ? D.skills.using
          .map((g) => `<div class="skill-group"><h3>${esc(g.group)}</h3><div class="tags">${g.items.map((t) => `<span class="tag">${esc(t)}</span>`).join("")}</div></div>`)
          .join("")
      : pending;
    $("#about-learning").innerHTML = D.skills.learning.length
      ? D.skills.learning.map((x) => `<div class="learning-item"><span style="color:var(--amber)">◔</span><span>${esc(x)}</span></div>`).join("")
      : pending;
    $("#about-contact").innerHTML = `
      ${P.github ? `<a class="btn btn-ghost" href="${esc(P.github)}" target="_blank" rel="noopener">GitHub ↗</a>` : ""}
      ${P.email ? `<a class="btn btn-ghost" href="mailto:${esc(P.email)}">이메일</a>` : ""}
      ${P.resume ? `<a class="btn btn-primary" href="${esc(P.resume)}" download>이력서 다운로드</a>` : `<span class="btn btn-ghost" aria-disabled="true" style="opacity:.6;cursor:default">이력서 · 준비 중</span>`}`;
  };

  /* ---------- 스크롤 등장 효과 ---------- */
  const io =
    "IntersectionObserver" in window
      ? new IntersectionObserver(
          (entries) =>
            entries.forEach((e) => {
              if (e.isIntersecting) {
                e.target.classList.add("in");
                io.unobserve(e.target);
              }
            }),
          { threshold: 0.12 }
        )
      : null;
  function observe(root = document) {
    root.querySelectorAll(".reveal:not(.in)").forEach((el, i) => {
      el.style.transitionDelay = `${Math.min(i % 6, 5) * 60}ms`;
      io ? io.observe(el) : el.classList.add("in");
    });
  }

  function tocSpy() {
    const links = [...document.querySelectorAll(".toc a")];
    if (!links.length || !io) return;
    const spy = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) links.forEach((a) => a.classList.toggle("active", a.getAttribute("href") === "#" + e.target.id));
        }),
      { rootMargin: "-30% 0px -60% 0px" }
    );
    document.querySelectorAll(".doc-section").forEach((s) => spy.observe(s));
  }

  R[page]?.();
  observe();
})();
