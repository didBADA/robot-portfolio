// Vercel 서버리스 함수: 방문자 질문 → Claude → 답변.
// API 키는 Vercel 환경변수 ANTHROPIC_API_KEY 에만 두고, 브라우저에는 절대 보내지 않습니다.
// 답변 근거는 js/data.js(사이트와 같은 데이터)만 사용합니다.
import Anthropic from "@anthropic-ai/sdk";
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const client = new Anthropic(); // ANTHROPIC_API_KEY 환경변수를 자동으로 읽음

function loadPortfolio() {
  const code = fs.readFileSync(path.join(process.cwd(), "js", "data.js"), "utf8");
  const sandbox = { window: {} };
  vm.runInNewContext(code, sandbox);
  return sandbox.window.PORTFOLIO;
}

const PORTFOLIO = loadPortfolio();

const SYSTEM = `당신은 로봇 엔지니어 ${PORTFOLIO.profile.name}의 포트폴리오 사이트에 있는 "Lab Assistant"입니다.
방문자(채용 담당자, 교수, 동료 엔지니어)가 프로젝트·연구·개발 기록을 탐색하도록 돕습니다.

규칙:
- 아래 <portfolio> 자료에 있는 내용만 근거로 답합니다. 자료에 없는 성과, 수치, 기술, 경력은 만들지 않습니다.
- 자료에 없는 질문이면 "그 내용은 아직 포트폴리오에 공개되지 않았습니다"라고 말하고, 대신 물어볼 만한 관련 주제를 제안합니다.
- evidence가 "sim"인 결과는 반드시 시뮬레이션 결과라고 밝힙니다. status가 draft인 프로젝트는 자료 준비 중이라고 말합니다.
- 방문자가 쓴 언어로, 3~6문장 정도로 간결하게 답합니다. 마크다운 기호는 쓰지 않습니다.
- 관련 페이지가 있으면 끝에 "자세히: project.html?id=<id>"처럼 경로를 알려 줍니다.

<portfolio>
${JSON.stringify(PORTFOLIO)}
</portfolio>`;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  const raw = Array.isArray(req.body?.messages) ? req.body.messages : [];
  // 남용 방지: 최근 10개, 메시지당 500자, user/assistant 교대만 허용
  const messages = raw
    .slice(-10)
    .filter((m) => (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
    .map((m) => ({ role: m.role, content: m.content.slice(0, 500) }));
  while (messages.length && messages[0].role !== "user") messages.shift();
  if (!messages.length || messages.at(-1).role !== "user") return res.status(400).json({ error: "bad request" });

  try {
    const response = await client.beta.messages.create({
      model: "claude-opus-5-5",
      max_tokens: 2048,
      output_config: { effort: "low" }, // 짧은 Q&A라 낮은 effort로 충분
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default", // 안전 분류기가 거절하면 서버에서 다른 모델로 재시도
      system: [{ type: "text", text: SYSTEM, cache_control: { type: "ephemeral" } }],
      messages,
    });

    if (response.stop_reason === "refusal") {
      return res.status(200).json({ reply: "이 질문에는 답변할 수 없습니다. 프로젝트나 기술에 대해 물어봐 주세요." });
    }
    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();
    return res.status(200).json({ reply: reply || "답변을 만들지 못했습니다. 다시 질문해 주세요." });
  } catch (err) {
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "rate_limited" });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("Anthropic API error", err.status, err.message);
      return res.status(502).json({ error: "upstream_error" });
    }
    console.error(err);
    return res.status(500).json({ error: "server_error" });
  }
}
