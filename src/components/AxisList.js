import { LABEL } from "../lib/evaluate.js";

function badge(sev) {
  const span = document.createElement("span");
  span.className = "badge " + sev;
  span.textContent = LABEL[sev];
  return span;
}

export function AxisList() {
  const container = document.createElement("div");
  container.id = "axes";

  return {
    el: container,
    render(checks, scores) {
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
  };
}
