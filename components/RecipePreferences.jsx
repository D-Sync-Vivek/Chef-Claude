export default function RecipePreferences({ value, onChange, disabled }) {
  const update = (field) => (event) => onChange({ ...value, [field]: event.target.value });

  const fieldClass =
    "w-full text-xs font-medium rounded-xl border border-warm-200 py-2.5 px-3 bg-warm-50/50 text-warm-900 focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none transition";

  return (
    <div className="mt-8 pt-6 border-t border-warm-100">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-warm-600">
          Preferences (Optional)
        </span>
        <span className="text-xs text-warm-600">Customized to your schedule</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-xs font-semibold text-warm-700 mb-1.5" htmlFor="pref-servings">
            Servings
          </label>
          <input
            id="pref-servings"
            type="number"
            min="1"
            max="20"
            step="1"
            value={value.servings}
            onChange={update("servings")}
            disabled={disabled}
            placeholder="Any"
            className={fieldClass}
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-warm-700 mb-1.5" htmlFor="pref-difficulty">
            Difficulty
          </label>
          <select
            id="pref-difficulty"
            value={value.difficulty}
            onChange={update("difficulty")}
            disabled={disabled}
            className={fieldClass}
          >
            <option value="">Any Level</option>
            <option value="easy">🟢 Easy</option>
            <option value="medium">🟡 Medium</option>
            <option value="hard">🔴 Advanced</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-semibold text-warm-700 mb-1.5" htmlFor="pref-time">
            Max Cooking Time
          </label>
          <input
            id="pref-time"
            type="number"
            min="1"
            max="600"
            step="1"
            value={value.maxCookingTime}
            onChange={update("maxCookingTime")}
            disabled={disabled}
            placeholder="Any"
            className={fieldClass}
          />
        </div>
      </div>
    </div>
  );
}