import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import ClaudeRecipe from "./ClaudeRecipe";
import { saveTransformedRecipe, transformRecipe } from "../src/api";
import { useAuth } from "../src/auth/useAuth";

const MIN_LENGTH = 3;
const MAX_LENGTH = 300;

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
  const [preview, setPreview] = useState(null);
  const [notice, setNotice] = useState(null);
  const [error, setError] = useState("");

  const isBusy = isTransforming || isSaving;
  const trimmedLength = instruction.trim().length;
  const canSubmit = !isBusy && trimmedLength >= MIN_LENGTH && trimmedLength <= MAX_LENGTH;

  function fillInstruction(text) {
    setInstruction(text);
    inputRef.current?.focus();
  }

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
    <section className="mt-10 pt-8 border-t border-warm-200" aria-labelledby="transform-heading">
      <h3 id="transform-heading" className="text-xl font-bold text-warm-900 mb-1">
        Customize with AI
      </h3>
      <p className="text-xs text-warm-600 mb-4">
        The AI rewrites a copy of this recipe; your saved recipe stays as it is until you choose to save.
        Results are not checked for allergies, dietary needs or nutrition, so review them before you cook.
      </p>

      <div className="flex flex-wrap gap-2 mb-4">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.label}
            type="button"
            disabled={isBusy}
            onClick={() => fillInstruction(action.text)}
            className="px-3 py-1.5 rounded-full border border-warm-200 bg-white text-warm-800 text-xs font-medium hover:border-brand-500 hover:text-brand-600 disabled:opacity-60 transition"
          >
            {action.label}
          </button>
        ))}
      </div>

      <form className="flex flex-col gap-2" onSubmit={handleTransform}>
        <label htmlFor="transform-instruction" className="text-xs font-semibold text-warm-700">
          How should the recipe change?
        </label>
        <input
          id="transform-instruction"
          ref={inputRef}
          type="text"
          value={instruction}
          maxLength={MAX_LENGTH}
          placeholder="e.g. Make this recipe vegetarian"
          disabled={isBusy}
          onChange={(event) => setInstruction(event.target.value)}
          className="px-3.5 py-2.5 rounded-xl border border-warm-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm bg-warm-50/50 outline-none transition"
        />
        <button
          type="submit"
          disabled={!canSubmit}
          className="self-start px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold transition"
        >
          {isTransforming ? "Transforming…" : "Transform recipe"}
        </button>
      </form>

      {isTransforming && (
        <p className="text-xs text-warm-600 text-center mt-3" role="status">
          Chef Claude is rewriting your recipe… this can take up to a minute.
        </p>
      )}
      {error && (
        <p className="bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl p-3 mt-3" role="alert">
          {error}
        </p>
      )}

      {notice?.type === "unchanged" && (
        <p className="text-xs text-warm-600 text-center mt-3" role="status">
          The AI didn&apos;t change the recipe. Try describing the change differently.
        </p>
      )}
      {notice?.type === "savedNew" && (
        <p className="text-xs text-emerald-700 text-center mt-3" role="status">
          ✓ Saved as a new recipe.{" "}
          <Link to={`/recipes/${notice.id}`} className="font-semibold underline">
            Open the new recipe
          </Link>
        </p>
      )}
      {notice?.type === "replaced" && (
        <p className="text-xs text-emerald-700 text-center mt-3" role="status">
          ✓ This recipe has been updated.
        </p>
      )}

      {preview && (
        <section className="mt-6 p-5 border-2 border-dashed border-brand-500/70 rounded-2xl" aria-label="Changed recipe preview">
          <p className="text-sm text-warm-800 mb-3">
            <strong>Preview, not saved yet.</strong> Choose what to do with the changed recipe below.
          </p>
          <ClaudeRecipe recipe={preview} eyebrow="Changed recipe" />
          <div className="flex flex-wrap items-center gap-3 mt-5">
            <button
              type="button"
              onClick={handleSaveAsNew}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-60 text-white text-xs font-bold transition"
            >
              {isSaving ? "Saving…" : "Save as new recipe"}
            </button>
            <button
              type="button"
              onClick={handleReplace}
              disabled={isBusy}
              className="px-4 py-2.5 rounded-xl border border-warm-900 bg-white text-warm-900 hover:bg-warm-100 disabled:opacity-60 text-xs font-bold transition"
            >
              Replace this recipe
            </button>
            <button
              type="button"
              onClick={() => setPreview(null)}
              disabled={isBusy}
              className="text-xs text-brand-600 hover:underline font-medium"
            >
              Discard
            </button>
          </div>
        </section>
      )}
    </section>
  );
}