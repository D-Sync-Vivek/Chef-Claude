const DIFFICULTY_LABELS = { easy: "Easy", medium: "Medium", hard: "Hard" };

function formatIngredient({ quantity, unit, name }) {
  return [quantity, unit, name].filter(Boolean).join(" ");
}

// Renders a structured recipe. All values are shown as plain text (React escapes them).
export default function ClaudeRecipe({ recipe }) {
  return (
    <section className="recipe-section suggested-recipe-container" aria-live="polite">
      <p className="recipe-eyebrow">Chef Claude Recommends:</p>
      <h2>{recipe.title}</h2>
      <p className="recipe-description">{recipe.description}</p>

      <ul className="recipe-meta" aria-label="Recipe details">
        <li>Prep: {recipe.prepTime} min</li>
        <li>Cook: {recipe.cookTime} min</li>
        <li>Serves {recipe.servings}</li>
        <li>{DIFFICULTY_LABELS[recipe.difficulty] ?? recipe.difficulty}</li>
      </ul>

      <h3>Ingredients</h3>
      <ul>
        {recipe.ingredients.map((ingredient, index) => (
          <li key={index}>{formatIngredient(ingredient)}</li>
        ))}
      </ul>

      <h3>Instructions</h3>
      <ol>
        {recipe.instructions.map((step, index) => (
          <li key={index}>{step}</li>
        ))}
      </ol>
    </section>
  );
}
