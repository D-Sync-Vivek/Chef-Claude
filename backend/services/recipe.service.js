import { InferenceClient } from "@huggingface/inference";
import { env } from "../config/env.js";
import { ApiError } from "../utils/api-response.js";

const SYSTEM_PROMPT = `
You are an assistant that receives a list of ingredients that a user has and suggests a recipe they could make with some or all of those ingredients. You don't need to use every ingredient they mention in your recipe. The recipe can include additional ingredients they didn't mention, but try not to include too many extra ingredients. Format your response in markdown to make it easier to render to a web page.
`;

let client;
function getClient() {
  if (!env.hfAccessToken) {
    throw new ApiError(500, "Recipe service is not configured");
  }
  client ??= new InferenceClient(env.hfAccessToken);
  return client;
}

export async function generateRecipe(ingredients) {
  const hf = getClient();

  let response;
  try {
    response = await hf.chatCompletion({
      model: env.hfModel,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `I have ${ingredients.join(", ")}. Please give me a recipe you'd recommend I make!`,
        },
      ],
      max_tokens: 512,
    });
  } catch (err) {
    console.error("Hugging Face request failed:", err);
    throw new ApiError(502, "The recipe model is unavailable. Please try again.");
  }

  const recipe = response?.choices?.[0]?.message?.content;
  if (typeof recipe !== "string" || recipe.trim() === "") {
    console.error("Hugging Face returned an empty or malformed response");
    throw new ApiError(502, "The recipe model returned an empty response.");
  }

  return recipe;
}
