export function InputPanel({ onRun }) {
  const section = document.createElement("section");
  section.className = "panel";
  section.setAttribute("aria-labelledby", "input-heading");

  const heading = document.createElement("h2");
  heading.id = "input-heading";
  heading.textContent = "입력";

  const stackLabel = document.createElement("label");
  stackLabel.className = "field";
  stackLabel.htmlFor = "stack";
  const stackCaption = document.createElement("span");
  stackCaption.textContent = "스택";
  const stackEl = document.createElement("select");
  stackEl.id = "stack";
  stackEl.name = "stack";
  const optWeb = document.createElement("option");
  optWeb.value = "web";
  optWeb.textContent = "웹";
  const optMobile = document.createElement("option");
  optMobile.value = "mobile";
  optMobile.textContent = "모바일";
  stackEl.append(optWeb, optMobile);
  stackLabel.append(stackCaption, stackEl);

  const sourceLabel = document.createElement("label");
  sourceLabel.className = "field";
  sourceLabel.htmlFor = "source";
  const sourceCaption = document.createElement("span");
  sourceCaption.textContent = "코드 / 설명";
  const sourceEl = document.createElement("textarea");
  sourceEl.id = "source";
  sourceEl.name = "source";
  sourceEl.rows = 16;
  sourceEl.placeholder = "코드 또는 설명 텍스트를 붙여 넣으세요.";
  sourceLabel.append(sourceCaption, sourceEl);

  const runBtn = document.createElement("button");
  runBtn.type = "button";
  runBtn.id = "runBtn";
  runBtn.className = "primary";
  runBtn.textContent = "검수 실행";
  runBtn.disabled = true;
  runBtn.addEventListener("click", () => {
    onRun({ stack: stackEl.value, text: sourceEl.value });
  });

  section.append(heading, stackLabel, sourceLabel, runBtn);

  return {
    el: section,
    setRunDisabled(disabled) {
      runBtn.disabled = disabled;
    }
  };
}
