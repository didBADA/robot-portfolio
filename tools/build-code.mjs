// js/data.js의 code 목록에 있는 파일 내용을 js/code-data.js에 그대로 적어 넣습니다.
// 바탕화면 바로가기(file://)로 열면 브라우저가 코드 파일 읽기를 막기 때문에,
// 코드를 JS 파일 안에 미리 넣어 두면 어디서 열든 코드가 보입니다.
// 코드 파일을 바꾸거나 data.js의 code 목록을 고친 뒤 실행:  node tools/build-code.mjs
import fs from "node:fs";
import vm from "node:vm";

const ctx = { window: {} };
vm.runInNewContext(fs.readFileSync("js/data.js", "utf8"), ctx);
const paths = [...new Set(ctx.window.PORTFOLIO.projects.flatMap((p) => (p.code || []).map((c) => c.path)))];

const out = {};
for (const p of paths) {
  if (!fs.existsSync(p)) {
    console.warn("없는 파일:", p);
    continue;
  }
  out[p] = fs.readFileSync(p, "utf8").replace(/\r\n/g, "\n");
}
fs.writeFileSync(
  "js/code-data.js",
  "/* 자동 생성 파일 — 직접 고치지 말고 node tools/build-code.mjs 로 다시 만드세요. */\nwindow.PORTFOLIO_CODE = " + JSON.stringify(out, null, 1) + ";\n"
);
console.log(`js/code-data.js: 코드 ${Object.keys(out).length}개`);
