import { useRef } from "react";

const TABS = [
  { id: "ingredients", label: "Ingredients Recipe" },
  { id: "dish", label: "Dish Recipe" },
];

export default function GeneratorTabs({ value, onChange, disabled }) {
  const tabRefs = useRef({});

  function handleKeyDown(event) {
    const current = TABS.findIndex((tab) => tab.id === value);
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    let next;
    if (step) next = (current + step + TABS.length) % TABS.length;
    else if (event.key === "Home") next = 0;
    else if (event.key === "End") next = TABS.length - 1;
    else return;

    event.preventDefault();
    onChange(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  }

  return (
    <div
      className="flex p-1.5 bg-warm-100 rounded-2xl max-w-md mx-auto border border-warm-200/60"
      role="tablist"
      aria-label="How do you want to get a recipe?"
      onKeyDown={handleKeyDown}
    >
      {TABS.map((tab) => {
        const active = value === tab.id;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            type="button"
            role="tab"
            id={`generator-tab-${tab.id}`}
            aria-selected={active}
            aria-controls="generator-panel"
            tabIndex={active ? 0 : -1}
            disabled={disabled}
            onClick={() => onChange(tab.id)}
            className={`flex-1 py-2.5 px-4 text-xs sm:text-sm rounded-xl transition text-center ${
              active
                ? "shadow-sm bg-brand-600 text-white font-semibold"
                : "text-warm-600 font-semibold hover:text-warm-900"
            } disabled:cursor-not-allowed`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}