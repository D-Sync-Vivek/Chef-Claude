import React, { useEffect, useRef } from "react";
import { useState } from "react";
import ClaudeRecipe from "./ClaudeRecipe";
import IngredientsList from "./IngredientsList";
import { getRecipeFromMistral } from "../src/ai";

export default function Main() {
  const [ingredients, setIngredients] = useState([]);
  const [recipe, setRecipe] = useState("");
  const recipeSection = useRef(null);

  useEffect(() =>{
    if(recipe !== "" && recipeSection.current !== null){
      recipeSection.current.scrollIntoView({behavior: "smooth"})
    }
  }, [recipe])

  function addIngredient(formData) {
    const raw = formData.get("ingredient");
    const newIngredient = raw?.trim();
    if (!newIngredient) return;
    setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
  }

  async function getRecipe() {
    const recipeMarkdown = await getRecipeFromMistral(ingredients);
    setRecipe(recipeMarkdown);
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
        <button>+ Add ingridient</button>
      </form>

      {/* ingredients list and CTA button Component */}
      <IngredientsList
        ingredients={ingredients}
        toggle={getRecipe}
        ref={recipeSection}
      />

      {/* show ClaudeRecipe Component when we have more than 3 ingredients. */}
      {recipe && <ClaudeRecipe recipe={recipe} />}
    </main>
  );
}
