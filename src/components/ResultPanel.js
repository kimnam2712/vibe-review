import { AxisList } from "./AxisList.js";

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

function renderFixes(list, fixes) {
  list.replaceChildren();
  for (const f of fixes) {
    const li = document.createElement("li");
    li.textContent = f;
    list.appendChild(li);
  }
}

export function ResultPanel() {
  const heuristicsPanel = document.createElement("section");
  heuristicsPanel.className = "panel";
  heuristicsPanel.id = "heuristicsPanel";
  heuristicsPanel.hidden = true;
  heuristicsPanel.tabIndex = -1;
  heuristicsPanel.setAttribute("aria-labelledby", "heuristics-heading");
  const heuristicsHeading = document.createElement("h2");
  heuristicsHeading.id = "heuristics-heading";
  heuristicsHeading.textContent = "추가 체크 (규칙 기반)";
  const heuristicsList = document.createElement("ul");
  heuristicsList.id = "heuristics";
  heuristicsList.className = "heuristics";
  heuristicsList.setAttribute("aria-live", "polite");
  heuristicsPanel.append(heuristicsHeading, heuristicsList);

  const resultsPanel = document.createElement("section");
  resultsPanel.className = "panel";
  resultsPanel.id = "resultsPanel";
  resultsPanel.hidden = true;
  resultsPanel.setAttribute("aria-labelledby", "results-heading");
  const resultsHeading = document.createElement("h2");
  resultsHeading.id = "results-heading";
  resultsHeading.textContent = "축별 결과";
  const axisList = AxisList();
  resultsPanel.append(resultsHeading, axisList.el);

  const fixesPanel = document.createElement("section");
  fixesPanel.className = "panel";
  fixesPanel.id = "fixesPanel";
  fixesPanel.hidden = true;
  fixesPanel.setAttribute("aria-labelledby", "fixes-heading");
  const fixesHeading = document.createElement("h2");
  fixesHeading.id = "fixes-heading";
  fixesHeading.textContent = "다음에 고칠 것 3개";
  const fixesList = document.createElement("ol");
  fixesList.id = "fixes";
  fixesPanel.append(fixesHeading, fixesList);

  const el = document.createDocumentFragment();
  el.append(heuristicsPanel, resultsPanel, fixesPanel);

  return {
    el,
    render({ heuristics, checks, scores, fixes }) {
      renderHeuristics(heuristicsList, heuristics);
      heuristicsPanel.hidden = false;

      axisList.render(checks, scores);
      resultsPanel.hidden = false;

      renderFixes(fixesList, fixes);
      fixesPanel.hidden = false;
    },
    focus() {
      heuristicsPanel.focus();
    }
  };
}
