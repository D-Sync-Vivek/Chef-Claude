const MIN_LENGTH = 2;
const MAX_LENGTH = 80;

export default function DishNameForm({ value, onChange, onSubmit, isLoading }) {
  const cleaned = value.replace(/\s+/g, " ").trim();
  const canSubmit = !isLoading && cleaned.length >= MIN_LENGTH;

  function handleSubmit(event) {
    event.preventDefault();
    if (canSubmit) onSubmit(cleaned);
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <div className="relative flex-grow">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-warm-600">
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            viewBox="0 0 24 24"
          >
            <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          aria-label="Dish name"
          type="text"
          name="dishName"
          placeholder="e.g. Paneer Butter Masala, Creamy Tuscan Pasta..."
          value={value}
          maxLength={MAX_LENGTH}
          onChange={(event) => onChange(event.target.value)}
          className="w-full pl-10 pr-4 py-3.5 rounded-xl border border-warm-200 focus:border-brand-500 focus:ring-2 focus:ring-brand-500/20 text-sm text-warm-900 bg-warm-50/50 placeholder:text-warm-600 transition outline-none"
        />
      </div>
      <button
        type="submit"
        disabled={!canSubmit}
        className="px-5 py-3.5 bg-warm-200 hover:bg-warm-300 disabled:opacity-60 disabled:cursor-not-allowed text-warm-800 font-semibold rounded-xl text-xs sm:text-sm transition whitespace-nowrap"
      >
        {isLoading ? "Preparing…" : "Use this dish"}
      </button>
    </form>
  );
}