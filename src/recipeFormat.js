export const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}
