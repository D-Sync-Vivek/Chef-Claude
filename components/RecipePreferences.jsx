// Optional generation settings. Empty fields are simply not sent to the server.
export default function RecipePreferences({ value, onChange, disabled }) {
  const update = (field) => (event) => onChange({ ...value, [field]: event.target.value });

  return (
    <details className="preferences">
      <summary>Recipe options (optional)</summary>
      <div className="preferences-grid">
        <label>
          Servings
          <input type="number" min="1" max="20" step="1" value={value.servings}
            onChange={update("servings")} disabled={disabled} />
        </label>
        <label>
          Difficulty
          <select value={value.difficulty} onChange={update("difficulty")} disabled={disabled}>
            <option value="">Any</option>
            <option value="easy">Easy</option>
            <option value="medium">Medium</option>
            <option value="hard">Hard</option>
          </select>
        </label>
        <label>
          Max cooking time (minutes)
          <input type="number" min="1" max="600" step="1" value={value.maxCookingTime}
            onChange={update("maxCookingTime")} disabled={disabled} />
        </label>
      </div>
    </details>
  );
}
