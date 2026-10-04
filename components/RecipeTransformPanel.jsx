import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import { saveTransformedRecipe, transformRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const MIN_LENGTH = 3;
const MAX_LENGTH = 300;

// Each button only fills in the text box; nothing is sent until the user presses "Transform".
const QUICK_ACTIONS = [
  { label: "Make vegetarian", text: "Make this recipe vegetarian" },
  { label: "Make it vegan", text: "Make this recipe vegan" },
  { label: "Increase protein", text: "Increase the protein in this recipe" },
  { label: "Reduce cooking time", text: "Reduce the cooking time of this recipe" },
  { label: "Double servings", text: "Double the servings of this recipe" },
  { label: "Reduce ingredients", text: "Use fewer ingredients in this recipe" },
  { label: "Change cuisine style", text: "Change the cuisine style of this recipe to " },
];

export default function RecipeTransformPanel({ recipe, onReplaced }) {
  const { retry } = useAuth();
  const inputRef = useRef(null);
  const [instruction, setInstruction] = useState("");
  const [isTransforming, setIsTransforming] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [preview, setPreview] = useState(null); // the AI's changed recipe, NOT saved yet
  const [notice, setNotice] = useState(null); // { type: "unchanged" | "savedNew" | "replaced", id? }
  const [error, setError] = useState("");

  const isBusy = isTransforming || isSaving;
  const trimmedLength = instruction.trim().length;
  const canSubmit = !isBusy && trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH;

  function fillInstruction(text) {
    setInstruction(text);
    inputRef.current?.focus();
  }

  // Shared error handling: an expired session sends the user to the login page.
  function handleFailure(err) {
    if (err.status === 401) {
      retry();
      return;
    }
    setError(err.message || "Something went wrong. Please try again.");
  }

  async function handleTransform(event) {
    event.preventDefault();
    if (!canSubmit) return;
    setIsTransforming(true);
    setError("");
    setNotice(null);
    setPreview(null);
    try {
      const result = await transformRecipe(recipe.id, instruction.trim());
      if (result.changed) setPreview(result.recipe);
      else setNotice({ type: "unchanged" });
    } catch (err) {
      handleFailure(err);
    } finally {
      setIsTransforming(false);
    }
  }

  async function handleSaveAsNew() {
    if (isBusy) return;
    setIsSaving(true);
    setError("");
    try {
      const saved = await saveTransformedRecipe(recipe.id, "new", preview);
      setPreview(null);
      setNotice({ type: "savedNew", id: saved.id });
    } catch (err) {
      handleFailure(err);
    } finally {
      setIsSaving(false);
    }
  }

  async function handleReplace() {
    if (isBusy) return;
    if (!window.confirm("Replace this recipe with the changed version? The original text will be lost.")) return;
    setIsSaving(true);
    setError("");
    try {
      const updated = await saveTransformedRecipe(recipe.id, "replace", preview);
      setPreview(null);
      setInstruction("");
      setNotice({ type: "replaced" });
      onReplaced(updated);
    } catch (err) {
      handleFailure(err);
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <section className="transform-panel" aria-labelledby="transform-heading">
      <h3 id="transform-heading">Customize with AI</h3>
      <p className="transform-disclaimer">
        The AI rewrites a copy of this recipe; your saved recipe stays as it is until you choose to save.
        Results are not checked for allergies, dietary needs or nutrition, so review them before you cook.
      </p>

      <div className="quick-actions">
        {QUICK_ACTIONS.map((action) => (
          <button key={action.label} type="button" className="chip" disabled={isBusy}
            onClick={() => fillInstruction(action.text)}>
            {action.label}
          </button>
        ))}
      </div>

      <form className="transform-form" onSubmit={handleTransform}>
        <label htmlFor="transform-instruction">How should the recipe change?</label>
        <input
          id="transform-instruction"
          ref={inputRef}
          type="text"
          value={instruction}
          maxLength={MAX_LENGTH}
          placeholder="e.g. Make this recipe vegetarian"
          disabled={isBusy}
          onChange={(event) => setInstruction(event.target.value)}
        />
        <button type="submit" className="auth-button" disabled={!canSubmit}>
          {isTransforming ? "Transforming…" : "Transform recipe"}
        </button>
      </form>

      {isTransforming && (
        <p className="recipe-status" role="status">
          Chef Claude is rewriting your recipe… this can take up to a minute.
        </p>
      )}
      {error && <p className="recipe-error" role="alert">{error}</p>}

      {notice?.type === "unchanged" && (
        <p className="recipe-status" role="status">
          The AI didn&apos;t change the recipe. Try describing the change differently.
        </p>
      )}
      {notice?.type === "savedNew" && (
        <p className="recipe-saved" role="status">
          ✓ Saved as a new recipe. <Link to={`/recipes/${notice.id}`}>Open the new recipe</Link>
        </p>
      )}
      {notice?.type === "replaced" && (
        <p className="recipe-saved" role="status">✓ This recipe has been updated.</p>
      )}

      {preview && (
        <section className="transform-preview" aria-label="Changed recipe preview">
          <p className="transform-preview-note">
            <strong>Preview, not saved yet.</strong> Choose what to do with the changed recipe below.
          </p>
          <ClaudeRecipe recipe={preview} eyebrow="Changed recipe" />
          <div className="transform-actions">
            <button type="button" className="auth-button" onClick={handleSaveAsNew} disabled={isBusy}>
              {isSaving ? "Saving…" : "Save as new recipe"}
            </button>
            <button type="button" className="secondary-button" onClick={handleReplace} disabled={isBusy}>
              Replace this recipe
            </button>
            <button type="button" className="link-button" onClick={() => setPreview(null)} disabled={isBusy}>
              Discard
            </button>
          </div>
        </section>
      )}
    </section>
  );
}
