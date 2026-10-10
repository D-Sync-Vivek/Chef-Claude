// Hugging Face Inference Providers (the AI layer this project used before the fallback system).
// Model ids may carry a provider suffix, e.g. "Qwen/Qwen2.5-7B-Instruct:featherless-ai".
// Docs: https://huggingface.co/docs/inference-providers

export function createHuggingFaceProvider({ apiKey, model, client, loadSdk = () => import("@huggingface/inference") }) {
  let cached = client;

  async function getClient() {
    if (!cached) {
      const { InferenceClient } = await loadSdk();
      cached = new InferenceClient(apiKey);
    }
    return cached;
  }

  return {
    name: "huggingface",
    model,
    isConfigured: () => Boolean(apiKey && model),

    async generate({ messages, maxTokens, temperature, signal }) {
      const hf = await getClient();
      const response = await hf.chatCompletion(
        { model, messages, max_tokens: maxTokens, temperature },
        { signal }
      );
      const choice = response?.choices?.[0];
      return {
        content: choice?.message?.content,
        finishReason: choice?.finish_reason === "length" ? "length" : choice?.finish_reason === "stop" ? "stop" : "other",
        provider: "huggingface",
        model,
      };
    },
  };
}
