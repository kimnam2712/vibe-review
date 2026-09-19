const CHECKS_URL = new URL("../../data/checks.json", import.meta.url);

function validateChecks(data) {
  if (!data || !Array.isArray(data.axes) || data.axes.length === 0) {
    throw new Error("checks.json 형식이 올바르지 않습니다.");
  }
  for (const axis of data.axes) {
    if (!axis || typeof axis.id !== "string" || typeof axis.name !== "string" || !Array.isArray(axis.questions)) {
      throw new Error("checks.json 형식이 올바르지 않습니다.");
    }
    for (const q of axis.questions) {
      if (!q || typeof q.id !== "string" || typeof q.text !== "string") {
        throw new Error("checks.json 형식이 올바르지 않습니다.");
      }
    }
  }
  return data;
}

async function loadChecks(url = CHECKS_URL) {
  const res = await fetch(url);
  if (!res.ok) throw new Error("checks.json " + res.status);
  return validateChecks(await res.json());
}

export { CHECKS_URL, validateChecks, loadChecks };
