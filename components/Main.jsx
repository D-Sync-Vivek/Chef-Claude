import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import IngredientsList from "./IngredientsList";
import RecipePreferences from "./RecipePreferences";
import { generateRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const NO_PREFERENCES = { servings: "", difficulty: "", maxCookingTime: "" };

// Only fields the user filled in are sent.
function buildPreferences({ servings, difficulty, maxCookingTime }) {
  const result = {};
  if (servings !== "") result.servings = Number(servings);
  if (difficulty) result.difficulty = difficulty;
  if (maxCookingTime !== "") result.maxCookingTime = Number(maxCookingTime);
  return result;
}

export default function Main() {
  const { retry } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [preferences, setPreferences] = useState(NO_PREFERENCES);
  const [recipe, setRecipe] = useState(null); // the saved, structured recipe from the server
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recipeSection = useRef(null);

  useEffect(() => {
    if (recipe && recipeSection.current !== null) {
      recipeSection.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [recipe]);

  function addIngredient(formData) {
    const raw = formData.get("ingredient");
    const newIngredient = raw?.trim();
    if (!newIngredient) return;
    setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
  }

  async function getRecipe() {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setRecipe(null);

    try {
      setRecipe(await generateRecipe({ ingredients, ...buildPreferences(preferences) }));
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        retry(); // session expired: re-check it so the route guard sends the user to /login
        return;
      }
      setError(err.message || "Failed to generate recipe");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main>
      {/* form */}
      <form action={addIngredient} className="add-ingredient-form">
        <input
          aria-label="Add ingredient"
          type="text"
          placeholder="e.g. oregano"
          name="ingredient"
        />
        <button id="addIngredientBtn">+ Add ingridient</button>
      </form>

      <RecipePreferences value={preferences} onChange={setPreferences} disabled={isLoading} />

      {/* ingredients list and CTA button Component */}
      <IngredientsList
        ingredients={ingredients}
        toggle={getRecipe}
        loading={isLoading}
      />

      {isLoading && (
        <p className="recipe-status" role="status">
          Chef Claude is writing your recipe… this can take up to a minute.
        </p>
      )}
      {error && (
        <p className="recipe-error" role="alert">{error}</p>
      )}

      {recipe && (
        <div ref={recipeSection}>
          <p className="recipe-saved" role="status">
            ✓ Saved to <Link to={`/recipes/${recipe.id}`}>My recipes</Link>
          </p>
          <ClaudeRecipe recipe={recipe} />
        </div>
      )}
    </main>
  );
}
