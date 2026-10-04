import { DIFFICULTY_LABELS } from "../src/recipeFormat";

function formatIngredient({ quantity, unit, name }) {
  return [quantity, unit, name].filter(Boolean).join(" ");
}

// Renders a structured recipe. All values are shown as plain text (React escapes them).
export default function ClaudeRecipe({ recipe, eyebrow = "Chef Claude Recommends:" }) {
  return (
    <section className="recipe-section suggested-recipe-container" aria-live="polite">
      <p className="recipe-eyebrow">{eyebrow}</p>
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

      <p className="recipe-disclaimer">
        AI-generated recipe. Check the ingredients against your allergies and dietary needs. This is not
        medical or nutritional advice.
      </p>
    </section>
  );
}
