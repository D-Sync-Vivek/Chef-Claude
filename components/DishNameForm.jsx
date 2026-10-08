const MIN_LENGTH = 2;
const MAX_LENGTH = 80;

// "Dish recipe" input. The server checks the name again; this only avoids pointless requests.
export default function DishNameForm({ value, onChange, onSubmit, isLoading }) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const canSubmit = !isLoading && cleaned.length >= MIN_LENGTH;

  function handleSubmit(event) {
    event.preventDefault();
    if (canSubmit) onSubmit(cleaned);
  }

  return (
    <form className="add-ingredient-form dish-form" onSubmit={handleSubmit}>
      <input
        aria-label="Dish name"
        type="text"
        name="dishName"
        placeholder="e.g. Paneer Butter Masala"
        value={value}
        maxLength={MAX_LENGTH}
        onChange={(event) => onChange(event.target.value)}
      />
      <button type="submit" id="dishRecipeBtn" disabled={!canSubmit}>
        {isLoading ? "Preparing the dish..." : "Get a recipe"}
      </button>
    </form>
  );
}
