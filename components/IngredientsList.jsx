export default function IngredientsList(props) {

  return (
    props.ingredient.length > 0 && (
      <section className="main-section">
        <h2>Ingredients on hand:</h2>
        <ul className="ingredients-list">{props.list}</ul>
        {props.ingredient.length > 3 && (
          <div className="get-recipe-container">
            <div>
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
