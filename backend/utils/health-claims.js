// Best-effort filter for claims the app must not make on the AI's behalf: nutrition numbers,
// medical or weight-loss claims and allergy "guarantees". It is NOT a guarantee that a recipe is
// free of such statements; it catches the clear cases so they are retried instead of saved.
// Cooking terms such as "cured salmon" or "doctor the sauce" are deliberately not matched.
const CLAIM_PATTERNS = [
  // nutrition facts and numbers
  /\bcalor(?:ie|ies)\b/gi,
  /\bkcal\b/gi,
  /\bnutrition(?:al)?\s+(?:facts|information|value|content)\b/gi,
  /\bmacros?\b/gi,
  /\b\d+(?:\.\d+)?\s*(?:g|mg|grams?)\s+(?:of\s+)?(?:protein|fat|carbs?|carbohydrates?|sugar|sodium|fib(?:er|re))\s+per\s+serving\b/gi,
  // medical claims
  /\b(?:cures?|treats?|prevents?|heals?|fights?)\s+(?:the\s+)?(?:diabetes|cancer|disease|illness|infection|inflammation)\b/gi,
  /\blowers?\s+(?:your\s+)?(?:blood\s+pressure|cholesterol|blood\s+sugar)\b/gi,
  /\breduces?\s+(?:the\s+)?risk\s+of\b/gi,
  /\b(?:clinically|medically)\b/gi,
  /\bdiabet(?:es|ic|ics)\b/gi,
  /\bcancer\b/gi,
  // weight-loss and wellness claims
  /\bweight[- ]loss\b/gi,
  /\blose\s+weight\b/gi,
  /\bfat[- ]burning\b/gi,
  /\bdetox\b/gi,
  /\bboosts?\s+(?:your\s+|the\s+)?(?:immune|immunity|metabolism)\b/gi,
  // safety guarantees
  /\ballerg(?:en|y)[- ](?:free|safe)\b/gi,
  /\bsafe\s+for\s+(?:people\s+with\s+|those\s+with\s+|anyone\s+with\s+)?(?:allergies|celiac|diabetics)\b/gi,
  /\bguaranteed\b/gi,
];

function collectText(recipe) {
  return [
    recipe.title,
    recipe.description,
    ...recipe.instructions,
    ...recipe.ingredients.flatMap((ingredient) => [ingredient.name, ingredient.quantity, ingredient.unit]),
  ]
    .filter((value) => typeof value === "string")
    .join("\n");
}

// Returns the distinct matched phrases (lowercase). Empty array = nothing found.
export function findHealthClaims(recipe) {
  const text = collectText(recipe);
  const found = new Set();
  for (const pattern of CLAIM_PATTERNS) {
    for (const match of text.matchAll(pattern)) {
      found.add(match[0].toLowerCase().replace(/\s+/g, " "));
    }
  }
  return [...found];
}
