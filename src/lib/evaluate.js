const LABEL = { pass: "통과", warn: "주의", risk: "위험" };

const CHECKLIST_URL = new URL("../data/checklist.json", import.meta.url);

const RISK_PATTERNS = [
  { re: /(api[_-]?key|secret|password|passwd|token|private[_-]?key)\s*[:=]/i, q: "sec-1", sev: "risk", fix: "하드코딩된 비밀값·토큰을 제거하고 환경변수/비밀저장소로 옮기세요." },
  { re: /(innerHTML|dangerouslySetInnerHTML|document\.write)\s*[=(]/i, q: "sec-2", sev: "risk", fix: "HTML 삽입 대신 textContent/안전한 템플릿을 쓰고 입력을 이스케이프하세요." },
  { re: /\b(eval\(|new Function\(|child_process|exec\()/i, q: "sec-2", sev: "risk", fix: "동적 실행·쉘 호출을 제거하고 안전한 API로 바꾸세요." },
  { re: /\b(login|oauth|payment|stripe|checkout)\b/i, q: "scp-1", sev: "warn", fix: "로그인·결제 등 범위 밖 기능을 이번 산출물에서 빼 주세요." },
  { re: /\b(nohu-dashboard|drive\.google|googleapis)\b/i, q: "scp-1", sev: "warn", fix: "대시보드/Drive 연동을 합치지 말고 검수 툴만 유지하세요." }
];

const PASS_HINTS = [
  { re: /\b(try\s*\{|catch\s*\(|\.catch\()/i, q: "ops-1", sev: "pass" },
  { re: /\b(timeout|AbortController|signal)\b/i, q: "ops-2", sev: "pass" },
  { re: /\b(console\.(info|warn|error)|logger)\b/i, q: "ops-3", sev: "pass" },
  { re: /\b(test|describe\(|it\(|pytest|npm test)\b/i, q: "mnt-3", sev: "pass" }
];

function validateChecks(data) {
  if (!data || !Array.isArray(data.axes) || data.axes.length === 0) {
    throw new Error("checklist.json 형식이 올바르지 않습니다.");
  }
  for (const axis of data.axes) {
    if (!axis || typeof axis.id !== "string" || typeof axis.name !== "string" || !Array.isArray(axis.questions)) {
      throw new Error("checklist.json 형식이 올바르지 않습니다.");
    }
    for (const q of axis.questions) {
      if (!q || typeof q.id !== "string" || typeof q.text !== "string") {
        throw new Error("checklist.json 형식이 올바르지 않습니다.");
      }
    }
  }
  return data;
}

async function loadChecks(url = CHECKLIST_URL) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("checklist.json " + res.status);
  return validateChecks(await res.json());
}

function scoreQuestions(checks, text) {
  const scores = {};
  for (const axis of checks.axes) {
    for (const q of axis.questions) {
      scores[q.id] = { sev: "warn", fix: null, text: q.text, axisName: axis.name };
    }
  }
  for (const h of PASS_HINTS) {
    if (h.re.test(text) && scores[h.q]) scores[h.q] = { ...scores[h.q], sev: "pass" };
  }
  const rank = { pass: 0, warn: 1, risk: 2 };
  for (const r of RISK_PATTERNS) {
    if (r.re.test(text) && scores[r.q] && rank[r.sev] >= rank[scores[r.q].sev]) {
      scores[r.q] = { ...scores[r.q], sev: r.sev, fix: r.fix };
    }
  }
  if (!text.trim()) {
    for (const id of Object.keys(scores)) {
      scores[id] = { ...scores[id], sev: "warn", fix: "검수할 코드/설명을 붙여 넣으세요." };
    }
  }
  return scores;
}

function topFixes(scores, heuristics) {
  const fixes = [];
  for (const h of heuristics) {
    if (!h.ok) fixes.push(h.detail);
  }
  const ordered = Object.values(scores).sort((a, b) => {
    const rank = { risk: 2, warn: 1, pass: 0 };
    return rank[b.sev] - rank[a.sev];
  });
  for (const s of ordered) {
    if (s.sev === "pass") continue;
    const msg = s.fix || `[${s.axisName}] ${s.text}`;
    if (!fixes.includes(msg)) fixes.push(msg);
    if (fixes.length >= 3) break;
  }
  while (fixes.length < 3) fixes.push("문항 결과를 보고 위험/주의 항목부터 손으로 확인하세요.");
  return fixes.slice(0, 3);
}

export {
  LABEL,
  CHECKLIST_URL,
  RISK_PATTERNS,
  PASS_HINTS,
  validateChecks,
  loadChecks,
  scoreQuestions,
  topFixes
};
