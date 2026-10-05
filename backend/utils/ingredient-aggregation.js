// Merges the ingredient lists of several recipes into shopping-list lines.
//
// Same ingredient (ignoring case, plural form and words like "chopped") -> one line.
// Amounts are added up where that is safe:
//   - plain counts and counted units ("3 cloves") are added per unit
//   - weights and volumes are added together, converting between units when they differ
//     (500 ml + 500 ml -> "1 L", 200 g + 0.5 kg -> "700 g")
//   - amounts that cannot be added (to taste, or "2" next to "100 g") are listed side by side
//     ("2 + 100 g") instead of being guessed.

const FRACTION_CHARS = { "½": "1/2", "⅓": "1/3", "⅔": "2/3", "¼": "1/4", "¾": "3/4", "⅛": "1/8", "⅜": "3/8", "⅝": "5/8", "⅞": "7/8" };

// [display unit, size in grams or millilitres, kind, accepted spellings]
const UNIT_DEFINITIONS = [
  ["g", 1, "mass", ["g", "gram", "grams", "gr"]],
  ["kg", 1000, "mass", ["kg", "kilogram", "kilograms"]],
  ["mg", 0.001, "mass", ["mg", "milligram", "milligrams"]],
  ["oz", 28.3495, "mass", ["oz", "ounce", "ounces"]],
  ["lb", 453.592, "mass", ["lb", "lbs", "pound", "pounds"]],
  ["ml", 1, "volume", ["ml", "milliliter", "milliliters", "millilitre", "millilitres"]],
  ["L", 1000, "volume", ["l", "liter", "liters", "litre", "litres"]],
  ["tsp", 4.92892, "volume", ["tsp", "teaspoon", "teaspoons"]],
  ["tbsp", 14.7868, "volume", ["tbsp", "tbs", "tablespoon", "tablespoons"]],
  ["cup", 236.588, "volume", ["cup", "cups"]],
  ["fl oz", 29.5735, "volume", ["fl oz", "floz", "fluid ounce", "fluid ounces"]],
];
const MEASURES = new Map();
for (const [label, size, kind, spellings] of UNIT_DEFINITIONS) {
  for (const spelling of spellings) MEASURES.set(spelling, { label, size, kind });
}

// "2 pieces" and "2" mean the same thing: a plain count.
const PLAIN_COUNT_WORDS = new Set(["", "piece", "pieces", "pc", "pcs", "whole", "each", "item", "items", "unit", "units"]);

// Describes how an ingredient is prepared or sized, not what it is.
const DESCRIPTOR_WORDS = new Set(["large", "small", "medium", "big", "fresh", "ripe", "chopped", "diced", "minced", "sliced", "finely", "roughly"]);

const IRREGULAR_PLURALS = { leaves: "leaf", loaves: "loaf", halves: "half", knives: "knife" };

// Not a real dictionary singular: it only has to give "tomato"/"tomatoes" the same result.
function stem(word) {
  if (IRREGULAR_PLURALS[word]) return IRREGULAR_PLURALS[word];
  if (word.length <= 3) return word;
  if (word.endsWith("ies")) return `${word.slice(0, -3)}y`;
  if (word.endsWith("ie")) return `${word.slice(0, -2)}y`;
  if (/(oes|ches|shes|xes|sses|zes)$/.test(word)) return word.slice(0, -2);
  if (word.endsWith("s") && !/(ss|us|is)$/.test(word)) return word.slice(0, -1);
  return word;
}

function pluralize(word, amount) {
  if (amount === 1) return word;
  if (/(ch|sh|x|s|z)$/.test(word)) return `${word}es`;
  if (/[^aeiou]y$/.test(word)) return `${word.slice(0, -1)}ies`;
  return `${word}s`;
}

function cleanName(raw) {
  const tokens = String(raw ?? "")
    .toLowerCase()
    .split(/[,(]/)[0] // "onion, finely chopped" -> "onion"
    .split(/\s+/)
    .filter((token) => token && !DESCRIPTOR_WORDS.has(token));
  return tokens.join(" ");
}

function nameKey(cleaned) {
  const tokens = cleaned.split(" ");
  tokens[tokens.length - 1] = stem(tokens[tokens.length - 1]);
  return tokens.join(" ");
}

const capitalize = (text) => text.charAt(0).toUpperCase() + text.slice(1);

function parseNumberToken(token) {
  if (/^\d+(\.\d+)?$/.test(token)) return Number(token);
  const fraction = token.match(/^(\d+)\/(\d+)$/);
  if (fraction && Number(fraction[2]) !== 0) return Number(fraction[1]) / Number(fraction[2]);
  return NaN;
}

// "2", "2.5", "1/2", "1 1/2" -> number, anything else -> NaN
function parseSingleAmount(text) {
  const parts = text.split(/\s+/);
  if (parts.length === 1) return parseNumberToken(parts[0]);
  if (parts.length === 2 && /^\d+$/.test(parts[0])) {
    const fraction = parseNumberToken(parts[1]);
    if (fraction < 1) return Number(parts[0]) + fraction;
  }
  return NaN;
}

// Returns { value } for an amount that can be added up, or { note } for text such as "to taste".
export function parseQuantity(raw) {
  const original = raw == null ? "" : String(raw).trim();
  if (original === "") return { note: "as needed" };

  const text = original.replace(/[½⅓⅔¼¾⅛⅜⅝⅞]/g, (char) => ` ${FRACTION_CHARS[char]} `).replace(/\s+/g, " ").trim();

  let value = parseSingleAmount(text);
  if (Number.isNaN(value)) {
    // "2-3" or "2 to 3": buy for the larger number
    const range = text.match(/^(.+?)\s*(?:-|–|—|\bto\b)\s*(.+)$/);
    if (range) value = Math.max(parseSingleAmount(range[1].trim()), parseSingleAmount(range[2].trim()));
  }
  return Number.isFinite(value) && value > 0 ? { value } : { note: original };
}

function classifyUnit(raw) {
  const unit = String(raw ?? "").toLowerCase().replace(/\.$/, "").replace(/\s+/g, " ").trim();
  const measure = MEASURES.get(unit);
  if (measure) return { type: "measure", ...measure };
  if (PLAIN_COUNT_WORDS.has(unit)) return { type: "count", key: "", label: "" };
  const label = stem(unit);
  return { type: "count", key: label, label };
}

const roundTo = (value, decimals) => Math.round(value * 10 ** decimals) / 10 ** decimals;
const formatNumber = (value) => String(roundTo(value, 2));

// Weight/volume total: keep the cook's own unit when only one unit was used (3 cups, 2 lb);
// otherwise convert to grams/millilitres and use kg/L from 1000 up.
function formatMeasureTotal(bucket, smallUnit, bigUnit) {
  if (bucket.labels.size === 1) {
    const [label] = bucket.labels;
    if (label !== smallUnit) return `${formatNumber(bucket.rawTotal)} ${label === "cup" ? pluralize("cup", bucket.rawTotal) : label}`;
  }
  const base = roundTo(bucket.baseTotal, 1);
  if (base >= 1000) return `${formatNumber(base / 1000)} ${bigUnit}`;
  return `${base >= 10 ? Math.round(base) : base} ${smallUnit}`;
}

// ingredients: [{ name, quantity, unit }]  ->  [{ name, quantity }] sorted by name
export function aggregateIngredients(ingredients) {
  const groups = new Map();

  for (const ingredient of ingredients) {
    const cleaned = cleanName(ingredient.name);
    if (!cleaned) continue;
    const key = nameKey(cleaned);

    if (!groups.has(key)) {
      groups.set(key, {
        forms: new Set(),
        counts: new Map(), // unit key -> { label, total }
        mass: { baseTotal: 0, rawTotal: 0, labels: new Set() },
        volume: { baseTotal: 0, rawTotal: 0, labels: new Set() },
        notes: new Set(),
      });
    }
    const group = groups.get(key);
    group.forms.add(cleaned);

    const amount = parseQuantity(ingredient.quantity);
    if (amount.note !== undefined) {
      group.notes.add(amount.note);
      continue;
    }

    const unit = classifyUnit(ingredient.unit);
    if (unit.type === "measure") {
      const bucket = group[unit.kind];
      bucket.baseTotal += amount.value * unit.size;
      bucket.rawTotal += amount.value;
      bucket.labels.add(unit.label);
    } else {
      const entry = group.counts.get(unit.key) ?? { label: unit.label, total: 0 };
      entry.total += amount.value;
      group.counts.set(unit.key, entry);
    }
  }

  const lines = [];
  for (const group of groups.values()) {
    const parts = [];

    // plain counts first, then counted units (cloves, cans, ...)
    const countEntries = [...group.counts.entries()].sort(([a], [b]) => (a === "" ? -1 : b === "" ? 1 : a.localeCompare(b)));
    for (const [, entry] of countEntries) {
      const rounded = roundTo(entry.total, 2);
      parts.push(entry.label ? `${formatNumber(entry.total)} ${pluralize(entry.label, rounded)}` : formatNumber(entry.total));
    }
    if (group.mass.labels.size > 0) parts.push(formatMeasureTotal(group.mass, "g", "kg"));
    if (group.volume.labels.size > 0) parts.push(formatMeasureTotal(group.volume, "ml", "L"));

    // A note ("as needed") adds nothing when there is already a real amount; keep the others.
    for (const note of group.notes) {
      if (note === "as needed" && parts.length > 0) continue;
      parts.push(note);
    }

    // "Tomatoes" for 5, "Tomato" for 1 - pick the plural spelling only when more than one is needed.
    const plainTotal = group.counts.get("")?.total ?? 0;
    const forms = [...group.forms].sort((a, b) => a.length - b.length);
    const name = capitalize(plainTotal > 1 ? forms[forms.length - 1] : forms[0]);

    lines.push({ name, quantity: parts.join(" + ").slice(0, 200) });
  }

  return lines.sort((a, b) => a.name.localeCompare(b.name));
}
