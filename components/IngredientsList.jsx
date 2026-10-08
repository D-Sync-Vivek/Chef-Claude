const QUICK_INGREDIENTS = [
  "chicken",
  "potato",
  "egg",
  "spinach",
  "cheese",
  "mushrooms",
  "heavy cream",
];

export default function IngredientsList({ ingredients, onRemove, onClear, onQuickAdd }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-warm-600 uppercase tracking-wider">
            Your Kitchen Pantry ({ingredients.length})
          </span>
          {ingredients.length > 0 && (
            <button
              type="button"
              onClick={onClear}
              className="text-xs text-brand-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 min-h-[44px] p-2 bg-warm-50/70 border border-warm-200/70 rounded-xl">
          {ingredients.length === 0 && (
            <span className="text-xs text-warm-600 px-2 py-1.5">
              No ingredients yet. Add at least 4 to get a recipe.
            </span>
          )}
          {ingredients.map((item, index) => (
            <span
              key={`${item}-${index}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-warm-200 rounded-lg text-xs font-medium text-warm-800 shadow-sm"
            >
              <span>{item}</span>
              <button
                type="button"
                onClick={() => onRemove(index)}
                aria-label={`Remove ${item}`}
                className="text-warm-600 hover:text-brand-600 font-bold leading-none"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      </div>

      <div>
        <span className="text-xs text-warm-600 font-medium block mb-2">
          Try these popular ingredients:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {QUICK_INGREDIENTS.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => onQuickAdd(item)}
              className="px-2.5 py-1 text-xs bg-warm-100 hover:bg-warm-200 text-warm-700 rounded-md transition"
            >
              + {item}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}