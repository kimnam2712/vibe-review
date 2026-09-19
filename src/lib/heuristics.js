const MOBILE_STACK_RE = /android|ios|react native|flutter|swift|kotlin/i;

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

function withStackHint(heuristics, stack, text) {
  if (stack === "mobile" && !MOBILE_STACK_RE.test(text)) {
    heuristics.push({
      label: "스택 힌트",
      ok: false,
      detail: "모바일로 선택했지만 모바일 스택 키워드가 적습니다. 플랫폼을 본문에 명시하세요."
    });
  }
  return heuristics;
}

export { analyzeHeuristics, withStackHint };
