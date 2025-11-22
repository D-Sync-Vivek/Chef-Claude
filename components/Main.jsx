import React from "react";
import { useState } from "react";
import ClaudeRecipe from "./ClaudeRecipe";
import IngredientsList from "./IngredientsList";

export default function Main() {
  const [ingredients, setIngredients] = useState([]);
  const [recipeShown, setRecipeShown] = useState(false)

  function addIngredient(formData) {
    const newIngredient = formData.get("ingredient");
    setIngredients((prevIngredients) => [...prevIngredients, newIngredient]);
  }

  function toggleRecipeShown(){
    setRecipeShown(prevShown => !prevShown)
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
      <IngredientsList ingredients={ingredients} toggle={toggleRecipeShown}/>

      {/* show ClaudeRecipe Component when we have more than 3 ingredients. */}
      {recipeShown && <ClaudeRecipe/>}
      
    </main>
  );
}
