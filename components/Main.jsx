import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import DishNameForm from "./DishNameForm";
import GeneratorTabs from "./GeneratorTabs";
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

// The server's message is already user-friendly. When the AI could not meet the chosen options
// (a 502 after retrying), also point at the options as a likely cause.
function describeFailure(err, payload) {
  const message = err.message || "Failed to generate recipe";
  const hasOptions = ["servings", "difficulty", "maxCookingTime"].some((key) => payload[key] !== undefined);
  return err.status === 502 && hasOptions ? `${message} If you set recipe options, try relaxing them.` : message;
}

export default function Main() {
  const { retry } = useAuth();
  const [mode, setMode] = useState("ingredients"); // "ingredients" | "dish"
  const [ingredients, setIngredients] = useState([]);
  const [dishName, setDishName] = useState("");
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

  function switchMode(nextMode) {
    setMode(nextMode);
    setError(""); // an error belongs to the tab it came from
  }

  function addIngredient(formData) {
    const raw = formData.get("ingredient");
    const newIngredient = raw?.trim();
    if (!newIngredient) return;
    setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
  }

  // Both tabs end up here with their own request body.
  async function generate(payload) {
    if (isLoading) return;
    setIsLoading(true);
    setError("");
    setRecipe(null);

    try {
      setRecipe(await generateRecipe(payload));
    } catch (err) {
      console.error(err);
      if (err.status === 401) {
        retry(); // session expired: re-check it so the route guard sends the user to /login
        return;
      }
      setError(describeFailure(err, payload));
    } finally {
      setIsLoading(false);
    }
  }

  const getRecipeFromIngredients = () =>
    generate({ mode: "ingredients", ingredients, ...buildPreferences(preferences) });
  const getRecipeFromDish = (cleanedName) =>
    generate({ mode: "dish", dishName: cleanedName, ...buildPreferences(preferences) });

  return (
    <main>
      <div className="generator">
        <GeneratorTabs value={mode} onChange={switchMode} disabled={isLoading} />

        <div className="generator-panel" role="tabpanel" id="generator-panel" aria-labelledby={`generator-tab-${mode}`}>
          {mode === "ingredients" ? (
            /* form */
            <form action={addIngredient} className="add-ingredient-form">
              <input
                aria-label="Add ingredient"
                type="text"
                placeholder="e.g. oregano"
                name="ingredient"
              />
              <button id="addIngredientBtn">+ Add ingridient</button>
            </form>
          ) : (
            <>
              <p className="generator-hint">
                Tell Chef Claude which dish you want to cook, for example &quot;Chocolate Brownies&quot; or
                &quot;Paneer Butter Masala&quot;. Plain dish names work best.
              </p>
              <DishNameForm
                value={dishName}
                onChange={setDishName}
                onSubmit={getRecipeFromDish}
                isLoading={isLoading}
              />
            </>
          )}

          <RecipePreferences value={preferences} onChange={setPreferences} disabled={isLoading} />

          {/* ingredients list and CTA button Component */}
          {mode === "ingredients" && (
            <IngredientsList
              ingredients={ingredients}
              toggle={getRecipeFromIngredients}
              loading={isLoading}
            />
          )}
        </div>
      </div>

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
