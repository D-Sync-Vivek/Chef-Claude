const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function fetchRecipe(ingredients) {
  const res = await fetch(`${BASE_URL}/api/recipe`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ingredients })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }

  return res.json();
}
