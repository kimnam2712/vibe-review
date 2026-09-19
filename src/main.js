import { InputPanel } from "./components/InputPanel.js";
import { ResultPanel } from "./components/ResultPanel.js";
import { loadChecks, scoreQuestions, topFixes } from "./lib/evaluate.js";
import { analyzeHeuristics, withStackHint } from "./lib/heuristics.js";

function showLoadError(message) {
  const box = document.getElementById("loadError");
  box.hidden = false;
  box.textContent = message;
}

async function main() {
  const app = document.getElementById("app");
  const results = ResultPanel();
  let checks;
  const input = InputPanel({
    onRun({ stack, text }) {
      const heuristics = withStackHint(analyzeHeuristics(text), stack, text);
      const scores = scoreQuestions(checks, text);
      results.render({
        heuristics,
        checks,
        scores,
        fixes: topFixes(scores, heuristics)
      });
      results.focus();
    }
  });

  app.append(input.el, results.el);

  checks = await loadChecks();
  input.setRunDisabled(false);
}

main().catch((e) => {
  console.error(e);
  showLoadError("src/data/checklist.json을 불러오지 못했습니다. README대로 로컬 서버로 열어 주세요.");
});
