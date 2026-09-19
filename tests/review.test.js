import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  LABEL,
  analyzeHeuristics,
  scoreQuestions,
  topFixes,
  withStackHint
} from "../src/js/review.js";
import { validateChecks } from "../src/js/checks-loader.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const checks = JSON.parse(readFileSync(join(root, "data/checks.json"), "utf8"));

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed += 1;
    console.log("ok - " + name);
  } catch (err) {
    failed += 1;
    console.error("not ok - " + name);
    console.error("  " + (err.stack || err.message));
  }
}

test("labels are 통과/주의/위험", () => {
  assert.equal(LABEL.pass, "통과");
  assert.equal(LABEL.warn, "주의");
  assert.equal(LABEL.risk, "위험");
});

test("checks.json validates and has 4 axes × 3 questions", () => {
  const data = validateChecks(checks);
  assert.equal(data.axes.length, 4);
  for (const axis of data.axes) {
    assert.equal(axis.questions.length, 3);
  }
  assert.deepEqual(
    data.axes.map((a) => a.id),
    ["security", "ops", "scope", "maintainability"]
  );
});

test("empty paste: all questions 주의, heuristics miss diff/verify, topFixes has 3 items", () => {
  const text = "   ";
  const heuristics = analyzeHeuristics(text);
  const scores = scoreQuestions(checks, text);
  assert.equal(heuristics[0].ok, false);
  assert.equal(heuristics[1].ok, false);
  assert.equal(heuristics[2].ok, true);
  for (const s of Object.values(scores)) {
    assert.equal(s.sev, "warn");
    assert.equal(s.fix, "검수할 코드/설명을 붙여 넣으세요.");
  }
  const fixes = topFixes(scores, heuristics);
  assert.equal(fixes.length, 3);
  assert.equal(fixes[0], heuristics[0].detail);
  assert.equal(fixes[1], heuristics[1].detail);
});

test("secret assignment marks sec-1 위험", () => {
  const text = 'const api_key = "sk-live-example";\n';
  const scores = scoreQuestions(checks, text);
  assert.equal(scores["sec-1"].sev, "risk");
  assert.match(scores["sec-1"].fix, /비밀값/);
});

test("innerHTML assignment marks sec-2 위험", () => {
  const text = 'el.innerHTML = userInput;\n';
  const scores = scoreQuestions(checks, text);
  assert.equal(scores["sec-2"].sev, "risk");
});

test("eval/exec marks sec-2 위험", () => {
  const text = "eval(code);\nchild_process.exec(cmd);\n";
  const scores = scoreQuestions(checks, text);
  assert.equal(scores["sec-2"].sev, "risk");
});

test("login/payment is 범위 밖 주의 and scp-1 warn", () => {
  const text = "Add oauth login and stripe checkout.\n";
  const heuristics = analyzeHeuristics(text);
  const scores = scoreQuestions(checks, text);
  const scope = heuristics.find((h) => h.label === "범위 밖 변경 의심");
  assert.equal(scope.ok, false);
  assert.equal(scores["scp-1"].sev, "warn");
  assert.match(scores["scp-1"].fix, /로그인·결제/);
});

test("dashboard/Drive signal marks scp-1 warn", () => {
  const text = "Wire nohu-dashboard to drive.google.com via googleapis.\n";
  const scores = scoreQuestions(checks, text);
  assert.equal(scores["scp-1"].sev, "warn");
  assert.match(scores["scp-1"].fix, /대시보드\/Drive/);
});

test("try/catch, timeout, logger, test hints pass matching questions", () => {
  const text = [
    "try { run(); } catch (e) { logger.warn(e); }",
    "const c = new AbortController(); fetch(url, { signal: c.signal, timeout: 1000 });",
    "describe('suite', () => { it('works', () => {}); });",
    "npm test"
  ].join("\n");
  const scores = scoreQuestions(checks, text);
  assert.equal(scores["ops-1"].sev, "pass");
  assert.equal(scores["ops-2"].sev, "pass");
  assert.equal(scores["ops-3"].sev, "pass");
  assert.equal(scores["mnt-3"].sev, "pass");
});

test("diff / PR traces mark 디프 유무 통과", () => {
  const text = "diff --git a/app.js b/app.js\n+++ b/app.js\n@@ -1 +1 @@\n pull request #12\n";
  const heuristics = analyzeHeuristics(text);
  assert.equal(heuristics[0].ok, true);
  assert.match(heuristics[0].detail, /디프\/패치\/PR/);
});

test("검증 명령/로그 유무 detects npm test and console.error", () => {
  const byCmd = analyzeHeuristics("run npm test then pytest");
  const byLog = analyzeHeuristics("see console.error and stack trace");
  assert.equal(byCmd[1].ok, true);
  assert.equal(byLog[1].ok, true);
});

test("mobile stack without keywords adds 스택 힌트", () => {
  const heuristics = withStackHint(analyzeHeuristics("hello web only"), "mobile", "hello web only");
  const hint = heuristics.find((h) => h.label === "스택 힌트");
  assert.ok(hint);
  assert.equal(hint.ok, false);
});

test("mobile stack with flutter/kotlin does not add 스택 힌트", () => {
  const text = "Flutter + Kotlin Android screen";
  const heuristics = withStackHint(analyzeHeuristics(text), "mobile", text);
  assert.equal(heuristics.some((h) => h.label === "스택 힌트"), false);
});

test("web stack never adds 스택 힌트", () => {
  const heuristics = withStackHint(analyzeHeuristics("plain"), "web", "plain");
  assert.equal(heuristics.some((h) => h.label === "스택 힌트"), false);
});

test("topFixes always returns exactly 3 unique-priority items", () => {
  const text = 'password = "x"\ninnerHTML = y\nlogin oauth\n';
  const heuristics = analyzeHeuristics(text);
  const scores = scoreQuestions(checks, text);
  const fixes = topFixes(scores, heuristics);
  assert.equal(fixes.length, 3);
  assert.equal(new Set(fixes).size, 3);
});

test("risk outranks warn when filling remaining topFixes", () => {
  const text = 'const token = "abc";\n+++ a\n--- b\nnpm test\n';
  const heuristics = analyzeHeuristics(text);
  const scores = scoreQuestions(checks, text);
  const fixes = topFixes(scores, heuristics);
  assert.equal(fixes.length, 3);
  assert.equal(scores["sec-1"].sev, "risk");
  assert.ok(fixes.includes(scores["sec-1"].fix));
});

test("validateChecks from checks-loader rejects empty axes", () => {
  assert.throws(() => validateChecks({ axes: [] }), /형식/);
  assert.throws(() => validateChecks({}), /형식/);
});

test("pasted HTML is treated as text for scoring (no extra axes)", () => {
  const text = '<img src=x onerror="alert(1)"> const api_key = "leak";';
  const scores = scoreQuestions(checks, text);
  assert.equal(Object.keys(scores).length, 12);
  assert.equal(scores["sec-1"].sev, "risk");
});

if (failed) {
  console.error("\n" + failed + " failed, " + passed + " passed");
  process.exit(1);
}
console.log("\n" + passed + " passed");
