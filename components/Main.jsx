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

function buildPreferences({ servings, difficulty, maxCookingTime }) {
  const result = {};
  if (servings !== "") result.servings = Number(servings);
  if (difficulty) result.difficulty = difficulty;
  if (maxCookingTime !== "") result.maxCookingTime = Number(maxCookingTime);
  return result;
}

function describeFailure(err, payload) {
  const message = err.message || "Failed to generate recipe";
  const hasOptions = ["servings", "difficulty", "maxCookingTime"].some((key) => payload[key] !== undefined);
  return err.status === 502 && hasOptions
    ? `${message} If you set recipe options, try relaxing them.`
    : message;
}

export default function Main() {
  const { retry } = useAuth();
  const [mode, setMode] = useState("ingredients");
  const [ingredients, setIngredients] = useState([]);
  const [dishName, setDishName] = useState("");
  const [preferences, setPreferences] = useState(NO_PREFERENCES);
  const [recipe, setRecipe] = useState(null);
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
    setError("");
  }

  function addIngredient(formData) {
    const raw = formData.get("ingredient");
    const newIngredient = raw?.trim();
    if (!newIngredient) return;
    setIngredients((prev) => [...prev, newIngredient]);
  }

  function removeIngredient(index) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  function clearIngredients() {
    setIngredients([]);
  }

  function quickAddIngredient(name) {
    setIngredients((prev) => (prev.includes(name) ? prev : [...prev, name]));
  }

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
        retry();
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

  const canSubmit =
    mode === "ingredients"
      ? ingredients.length >= 4 && !isLoading
      : dishName.replace(/\s+/g, " ").trim().length >= 2 && !isLoading;

  function handlePrimaryClick() {
    if (!canSubmit) return;
    if (mode === "ingredients") getRecipeFromIngredients();
    else getRecipeFromDish(dishName.replace(/\s+/g, " ").trim());
  }

  return (
    <main className="flex-grow">
      {/* Hero */}
      <section className="relative pt-12 pb-14 overflow-hidden">
        <div className="absolute -top-24 right-0 -mr-20 w-96 h-96 rounded-full bg-brand-100/40 blur-3xl pointer-events-none" />
        <div className="absolute top-48 left-0 -ml-20 w-80 h-80 rounded-full bg-amber-100/30 blur-3xl pointer-events-none" />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold tracking-wide uppercase mb-6 shadow-sm">
            <svg className="w-3.5 h-3.5 text-brand-500 animate-pulse" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
            </svg>
            <span>AI Powered Recipes</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-warm-900 leading-[1.15]">
            Turn Your Ingredients into{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-amber-600 italic font-serif font-normal">
              Amazing Recipes
            </span>
          </h1>
          <p className="mt-4 text-base sm:text-lg text-warm-600 max-w-2xl mx-auto leading-relaxed">
            Tell us what you have in your kitchen, or name a craving, and Chef Claude will craft delicious, personalized recipes for you in seconds.
          </p>
        </div>
      </section>

      {/* Generator card */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white rounded-3xl border border-warm-200/90 shadow-warm-lg p-6 sm:p-8">
          <GeneratorTabs value={mode} onChange={switchMode} disabled={isLoading} />

          <div
            className="mt-8 space-y-6"
            role="tabpanel"
            id="generator-panel"
            aria-labelledby={`generator-tab-${mode}`}
          >
            {mode === "ingredients" ? (
              <>
                <form action={addIngredient} className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-grow">
                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-warm-600">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input
                      aria-label="Add ingredient"
                      type="text"
                      name="ingredient"
                      placeholder="e.g. tomatoes, onions, garlic, pasta..."
                      className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-warm-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-warm-900 bg-warm-50/50 placeholder:text-warm-600 transition outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-5 py-3.5 bg-warm-200 hover:bg-warm-300 text-warm-800 font-semibold rounded-xl text-xs sm:text-sm transition flex items-center justify-center gap-1.5 whitespace-nowrap"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                      <path d="M12 4v16m8-8H4" />
                    </svg>
                    <span>Add</span>
                  </button>
                </form>

                <IngredientsList
                  ingredients={ingredients}
                  onRemove={removeIngredient}
                  onClear={clearIngredients}
                  onQuickAdd={quickAddIngredient}
                />
              </>
            ) : (
              <>
                <div>
                  <h3 className="text-xl font-bold text-warm-900 mb-1">Craving Something Specific?</h3>
                  <p className="text-xs text-warm-600">
                    Enter a dish name and let Chef Claude tailor the perfect step-by-step recipe for you.
                  </p>
                </div>
                <DishNameForm
                  value={dishName}
                  onChange={setDishName}
                  onSubmit={getRecipeFromDish}
                  isLoading={isLoading}
                />
              </>
            )}

            <RecipePreferences value={preferences} onChange={setPreferences} disabled={isLoading} />

            <div className="mt-8">
              <button
                type="button"
                onClick={handlePrimaryClick}
                disabled={!canSubmit}
                className="w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-brand-600 to-brand-500 hover:from-brand-700 hover:to-brand-600 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-base shadow-lg shadow-brand-500/25 hover:shadow-xl transition flex items-center justify-center gap-2"
              >
                <svg className="w-5 h-5 text-amber-200" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                </svg>
                <span>{isLoading ? "Preparing the dish…" : "Generate Recipe"}</span>
              </button>
              <p className="text-[11px] text-center text-warm-600 mt-2.5">
                {mode === "ingredients"
                  ? "Add at least 4 ingredients to begin."
                  : "Enter a dish name to begin."}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Dynamic states */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        {isLoading && (
          <div className="bg-white rounded-3xl border border-warm-200 p-8 sm:p-12 text-center shadow-warm-md">
            <div className="max-w-md mx-auto space-y-6">
              <div className="relative w-20 h-20 mx-auto">
                <div className="w-20 h-20 rounded-full border-4 border-brand-100 border-t-brand-600 animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🍳</div>
              </div>
              <div>
                <h3 className="text-xl font-extrabold text-warm-900">
                  Chef Claude is writing your recipe…
                </h3>
                <p className="text-xs text-warm-600 mt-1">
                  Analyzing flavor pairings, pantry ratios, and step timing.
                </p>
              </div>
            </div>
          </div>
        )}

        {error && !isLoading && (
          <div className="bg-white rounded-3xl border border-rose-200 p-8 text-center shadow-warm-sm">
            <div className="max-w-md mx-auto space-y-4">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h3 className="text-lg font-bold text-warm-900">Failed to generate recipe</h3>
              <p className="text-xs text-warm-600" role="alert">{error}</p>
            </div>
          </div>
        )}

        {recipe && !isLoading && (
          <div ref={recipeSection} className="space-y-4">
            <p
              className="text-sm text-emerald-700 bg-emerald-50 border border-emerald-200 px-4 py-2 rounded-xl text-center"
              role="status"
            >
              ✓ Saved to{" "}
              <Link to={`/recipes/${recipe.id}`} className="font-semibold underline">
                My recipes
              </Link>
            </p>
            <ClaudeRecipe recipe={recipe} />
          </div>
        )}
      </section>
    </main>
  );
}