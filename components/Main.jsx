import React, { useEffect, useRef } from "react";
import { useState } from "react";
import ClaudeRecipe from "./ClaudeRecipe";
import IngredientsList from "./IngredientsList";
import { fetchRecipe } from "../src/api";

export default function Main() {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const recipeSection = useRef(null);

  useEffect(() => {
    if (recipe !== "" && recipeSection.current !== null) {
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

    try {
      const data = await fetchRecipe(ingredients);
      setRecipe(data.recipe);
    } catch (err) {
      console.error(err);
      alert("Failed to generate recipe");
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

      {/* ingredients list and CTA button Component */}
      <IngredientsList
        ingredients={ingredients}
        toggle={getRecipe}
        loading={isLoading}
        ref={recipeSection}
      />

      {/* show ClaudeRecipe Component when we have more than 3 ingredients. */}
      {recipe && <ClaudeRecipe recipe={recipe} />}
    </main>
  );
}
