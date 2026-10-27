# BADA 로보틱스 — 로봇 엔지니어 포트폴리오

빌드 도구 없이 HTML/CSS/JS로 만든 정적 사이트입니다. `index.html`을 더블클릭하면 바로 열립니다.
(바탕화면의 **"로봇 포트폴리오"** 바로가기도 같은 파일을 엽니다.)

```
robot-portfolio/
├─ index.html          홈 (인터랙티브 로봇팔 히어로)
├─ projects.html       프로젝트 목록 (분야 필터)
├─ project.html        프로젝트 상세 (?id=프로젝트id)
├─ research.html       연구
├─ log.html            Engineering Log
├─ about.html          소개 · 기술 · 연락처
├─ css/style.css       디자인 (색상은 맨 위 :root 변수에서 변경)
├─ js/data.js          ★ 모든 내용이 여기 있음 — 수정은 이 파일만
├─ js/config.js        AI 에이전트 연결 설정
├─ js/app.js           페이지 렌더링
├─ js/agent.js         AI 에이전트 패널 (데모 모드 / 연결 모드)
├─ js/robot-arm.js     히어로 로봇팔 애니메이션
└─ api/chat.js         실제 AI 연결용 서버 함수 (Vercel)
```

## 1. 콘텐츠 추가·수정하기

전부 `js/data.js` 에서 합니다. 지금은 내용이 비어 있고, 각 배열 아래에 주석으로 된 **예시**가 있습니다.
예시를 복사해 주석(`/*` `*/`) 밖으로 꺼내 고쳐 쓰고, 저장한 뒤 브라우저를 새로고침하면 반영됩니다.
항목이 여러 개면 사이에 쉼표(`,`)를 꼭 넣으세요. 화면이 비면 대개 쉼표나 따옴표가 빠진 것입니다.

**프로젝트 추가** — `projects: [ ... ]` 배열 안에 항목을 넣습니다.

| 필드 | 설명 |
|---|---|
| `id` | 주소에 쓰이는 영문 id (`project.html?id=이값`), 겹치면 안 됨 |
| `title` / `subtitle` | 제목 / 부제목(선택) |
| `featured` | `true`면 홈 화면에 노출 |
| `status` | `active` 진행 중 · `prototype` 프로토타입 · `hardware` 하드웨어 완료 · `experiment` 실험 중 · `done` 완료 · `draft` 자료 준비 중 |
| `evidence` | `sim` 시뮬레이션 결과 · `real` 실물 결과 · `none` 결과 미공개 |
| `image` | 사진 경로 (예: `assets/img/hand.jpg`). 비우면 도면 스타일 일러스트 |
| `illustration` | 사진이 없을 때 쓸 그림: `rail` `hand` `humanoid` `agents` `line` |
| `goal` `problem` `control` | 문단 |
| `hardware` `software` `process` `lessons` `results` | 목록 (문자열 배열) |
| `links` | `[{ label: "GitHub", url: "https://..." }, { label: "YouTube", url: "..." }]` |

비어 있는 항목은 상세 페이지에 "자료 준비 중"으로 표시됩니다.

**사진 넣기** — `assets/img/` 폴더를 만들고 사진을 넣은 뒤 `image: "assets/img/파일명.jpg"`.
가로 1600px 이하, JPG/WebP로 줄여 넣으면 로딩이 빠릅니다.

**연구 / 로그 / 기술 / 연락처** — 같은 파일의 `research`, `logs`, `skills`, `profile` 을 고칩니다.
`profile.email`, `profile.resume`(예: `assets/resume.pdf`)을 채우면 소개 페이지에 버튼이 생깁니다.
`skills.using` 은 실제 프로젝트에서 써 본 것, `skills.learning` 은 공부 중인 것으로 나눠 적어 주세요.

## 2. 무료 배포 (Vercel 추천)

AI 에이전트 서버 함수까지 같이 올릴 수 있어서 Vercel을 추천합니다.

1. GitHub에 새 저장소를 만들고 이 폴더를 올립니다.
   ```
   git init && git add . && git commit -m "portfolio"
   git branch -M main
   git remote add origin https://github.com/didBADA/robot-portfolio.git
   git push -u origin main
   ```
2. https://vercel.com 에 GitHub 계정으로 로그인 → **Add New → Project** → 저장소 선택 → **Deploy**.
   Framework Preset은 **Other**, 빌드 설정은 비워 둡니다.
3. 몇 초 뒤 `https://robot-portfolio-xxxx.vercel.app` 주소가 생깁니다. 이후 `git push` 할 때마다 자동 재배포됩니다.

AI 연결이 필요 없다면 **GitHub Pages**도 됩니다: 저장소 Settings → Pages → Branch `main` / root → Save.
(GitHub Pages에서는 `api/chat.js`가 동작하지 않으므로 에이전트는 데모 모드로 남습니다.)

## 3. 실제 AI 에이전트 연결하기

지금 에이전트는 **데모 모드**입니다. 실제 AI 없이 `data.js` 의 자료를 검색해 보여 주며,
패널 상단에 "데모 모드"라고 표시됩니다.

실제 AI(Claude)로 바꾸려면:

1. https://console.anthropic.com 에서 API 키를 발급합니다. (유료, 사용량만큼 과금)
2. Vercel 프로젝트 → **Settings → Environment Variables** 에
   `ANTHROPIC_API_KEY` = 발급한 키 를 추가합니다. **키를 코드나 `config.js`에 절대 넣지 마세요.**
3. `js/config.js` 의 `endpoint: ""` 를 `endpoint: "/api/chat"` 로 바꾸고 push 합니다.
4. 배포가 끝나면 패널 상단이 "AI 연결됨"으로 바뀝니다.

동작 방식: 브라우저 → `/api/chat`(Vercel 서버) → Claude API. 서버가 `js/data.js` 를 읽어
"이 자료에 있는 것만 답하고, 없으면 공개되지 않았다고 말하라"는 지시와 함께 보냅니다.
그래서 사이트 내용을 고치면 AI 답변도 자동으로 따라갑니다.

비용 메모: `api/chat.js` 는 기본값으로 `claude-opus-5-5` 모델을 씁니다(입력 100만 토큰당 $4).
방문자가 많아 비용을 줄이고 싶다면 `model` 을 `claude-haiku-5-5` 로 바꾸면 훨씬 저렴합니다(입력 100만 토큰당 $0.10).
Anthropic 콘솔에서 월 사용 한도를 걸어 두는 것을 권장합니다.

> 로컬(더블클릭)로 열었을 때는 서버가 없으므로 항상 데모 모드로 동작합니다.
