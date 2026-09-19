import { loadChecks } from "./checks-loader.js";
import {
  LABEL,
  analyzeHeuristics,
  scoreQuestions,
  topFixes,
  withStackHint
} from "./review.js";

function badge(sev) {
  const span = document.createElement("span");
  span.className = "badge " + sev;
  span.textContent = LABEL[sev];
  return span;
}

function renderHeuristics(list, items) {
  list.replaceChildren();
  for (const h of items) {
    const li = document.createElement("li");
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = h.ok ? "통과" : "주의";
    li.append(tag, document.createTextNode(h.label + " — " + h.detail));
    list.appendChild(li);
  }
}

function renderAxes(container, checks, scores) {
  container.replaceChildren();
  for (const axis of checks.axes) {
    const wrap = document.createElement("div");
    wrap.className = "axis";
    const heading = document.createElement("h3");
    heading.textContent = axis.name;
    wrap.appendChild(heading);
    for (const q of axis.questions) {
      const s = scores[q.id];
      const row = document.createElement("div");
      row.className = "q-row";
      const text = document.createElement("div");
      text.textContent = q.text;
      row.append(text, badge(s.sev));
      wrap.appendChild(row);
    }
    container.appendChild(wrap);
  }
}

function renderFixes(list, fixes) {
  list.replaceChildren();
  for (const f of fixes) {
    const li = document.createElement("li");
    li.textContent = f;
    list.appendChild(li);
  }
}

function showLoadError(message) {
  const box = document.getElementById("loadError");
  box.hidden = false;
  box.textContent = message;
}

async function main() {
  const runBtn = document.getElementById("runBtn");
  const stackEl = document.getElementById("stack");
  const sourceEl = document.getElementById("source");
  const heuristicsPanel = document.getElementById("heuristicsPanel");
  const resultsPanel = document.getElementById("resultsPanel");
  const fixesPanel = document.getElementById("fixesPanel");

  runBtn.disabled = true;
  const checks = await loadChecks();
  runBtn.disabled = false;

  runBtn.addEventListener("click", () => {
    const stack = stackEl.value;
    const text = sourceEl.value;
    const heuristics = withStackHint(analyzeHeuristics(text), stack, text);
    const scores = scoreQuestions(checks, text);

    renderHeuristics(document.getElementById("heuristics"), heuristics);
    heuristicsPanel.hidden = false;

    renderAxes(document.getElementById("axes"), checks, scores);
    resultsPanel.hidden = false;

    renderFixes(document.getElementById("fixes"), topFixes(scores, heuristics));
    fixesPanel.hidden = false;

    heuristicsPanel.focus();
  });
}

main().catch((e) => {
  console.error(e);
  showLoadError("data/checks.json을 불러오지 못했습니다. README대로 로컬 서버로 열어 주세요.");
});
