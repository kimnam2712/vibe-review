const LABEL = { pass: "통과", warn: "주의", risk: "위험" };

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

function analyzeHeuristics(text) {
  const hasDiff = /(\bdiff\b|\bpatch\b|\+\+\+\s|\-\-\-\s|^@@ |\bPR\s*#|\bpull request\b)/im.test(text);
  const hasVerify = /\b(npm test|pytest|cargo test|go test|curl |jest|vitest|playwright|검증|테스트)\b/i.test(text)
    || /\b(console\.(log|error)|logger\.|stack trace)\b/i.test(text);
  const outOfScope = /\b(login|oauth|payment|stripe|nohu-dashboard|drive oauth|자동\s*PR|automerge)\b/i.test(text);
  return [
    { label: "디프 유무", ok: hasDiff, detail: hasDiff ? "디프/패치/PR 흔적이 보입니다." : "디프·패치·PR 흔적이 거의 없습니다. 변경 범위를 붙이면 검수가 쉬워집니다." },
    { label: "검증 명령/로그 유무", ok: hasVerify, detail: hasVerify ? "테스트·검증 명령 또는 로그 흔적이 있습니다." : "검증 명령/로그가 안 보입니다. README에 실행·확인 한 줄을 남기세요." },
    { label: "범위 밖 변경 의심", ok: !outOfScope, detail: outOfScope ? "로그인·결제·다른 앱 합치기 등 범위 밖 신호가 있습니다." : "범위 밖 신호는 크게 안 보입니다. (휴리스틱)" }
  ];
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

function badge(sev) {
  return `<span class="badge ${sev}">${LABEL[sev]}</span>`;
}

async function main() {
  const checks = await fetch("data/checks.json").then((r) => {
    if (!r.ok) throw new Error("checks.json " + r.status);
    return r.json();
  });
  document.getElementById("runBtn").addEventListener("click", () => {
    const stack = document.getElementById("stack").value;
    const text = document.getElementById("source").value;
    const heuristics = analyzeHeuristics(text);
    if (stack === "mobile" && !/android|ios|react native|flutter|swift|kotlin/i.test(text)) {
      heuristics.push({ label: "스택 힌트", ok: false, detail: "모바일로 선택했지만 모바일 스택 키워드가 적습니다. 플랫폼을 본문에 명시하세요." });
    }
    const scores = scoreQuestions(checks, text);

    document.getElementById("heuristics").innerHTML = heuristics
      .map((h) => `<li><span class="tag">${h.ok ? "통과" : "주의"}</span>${h.label} — ${h.detail}</li>`)
      .join("");
    document.getElementById("heuristicsPanel").hidden = false;

    document.getElementById("axes").innerHTML = checks.axes.map((axis) => {
      const rows = axis.questions.map((q) => {
        const s = scores[q.id];
        return `<div class="q-row"><div>${q.text}</div>${badge(s.sev)}</div>`;
      }).join("");
      return `<div class="axis"><h3>${axis.name}</h3>${rows}</div>`;
    }).join("");
    document.getElementById("resultsPanel").hidden = false;

    document.getElementById("fixes").innerHTML = topFixes(scores, heuristics)
      .map((f) => `<li>${f}</li>`).join("");
    document.getElementById("fixesPanel").hidden = false;
  });
}

main().catch((e) => {
  console.error(e);
  alert("data/checks.json을 불러오지 못했습니다. README대로 로컬 서버로 열어 주세요.");
});
