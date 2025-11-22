import Markdown from "react-markdown";
export default function ClaudeRecipe(props) {
  return (
    <section
      className="recipe-section suggested-recipe-container"
      aria-live="polite"
    >
      <h2>Chef Claude Recommends:</h2>
      <Markdown>{props.recipe}</Markdown>
    </section>
  );
}
