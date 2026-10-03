// Extracts a JSON value from raw model text. Models sometimes wrap JSON in ```json fences
// or add a sentence around it. This only finds candidate JSON; callers must still validate it.
export function parseModelJson(text) {
  if (typeof text !== "string" || text.trim() === "") {
    return { ok: false, reason: "the response was empty" };
  }

  let candidate = text.trim();
  const fenced = candidate.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fenced) candidate = fenced[1];

  try {
    return { ok: true, value: JSON.parse(candidate) };
  } catch {
    // fall through to the brace-slice attempt below
  }

  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start !== -1 && end > start) {
    try {
      return { ok: true, value: JSON.parse(candidate.slice(start, end + 1)) };
    } catch {
      // not valid JSON either
    }
  }

  return { ok: false, reason: "the response was not valid JSON" };
}
