export default function IngredientsList(props) {

  const ingredientsListItems = props.ingredients.map((ingredient) => {
    return <li key={ingredient}>{ingredient}</li>;
  });
  
  return (
    props.ingredients.length > 0 && (
      <section className="main-section">
        <h2>Ingredients on hand:</h2>
        <ul className="ingredients-list">{ingredientsListItems}</ul>
        {props.ingredients.length > 3 && (
          <div className="get-recipe-container">
            <div ref={props.ref}>
              <h3>Ready for a recipe?</h3>
              <p>Generate a recipe from your list of ingredients.</p>
            </div>
            <button onClick={props.toggle}>Get a recipe</button>
          </div>
        )}
      </section>
    )
  );
}
