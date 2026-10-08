import { useRef } from "react";

const TABS = [
  { id: "ingredients", label: "Ingredients recipe" },
  { id: "dish", label: "Dish recipe" },
];

// Tabs for choosing how to get a recipe. Arrow keys, Home and End move between tabs.
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
    <div className="generator-tabs" role="tablist" aria-label="How do you want to get a recipe?" onKeyDown={handleKeyDown}>
      {TABS.map((tab) => (
        <button
          key={tab.id}
          ref={(element) => {
            tabRefs.current[tab.id] = element;
          }}
          type="button"
          role="tab"
          id={`generator-tab-${tab.id}`}
          className="generator-tab"
          aria-selected={value === tab.id}
          aria-controls="generator-panel"
          tabIndex={value === tab.id ? 0 : -1}
          disabled={disabled}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
