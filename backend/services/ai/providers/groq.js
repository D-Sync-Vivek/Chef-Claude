// Groq through the official groq-sdk (OpenAI-style chat completions).
// Docs: https://console.groq.com/docs/text-chat  and  https://console.groq.com/docs/structured-outputs
// maxRetries is 0 because retries are decided by the provider manager, not the SDK.

export function createGroqProvider({ apiKey, model, client, loadSdk = () => import("groq-sdk") }) {
  let cached = client;

  async function getClient() {
    if (!cached) {
      const { default: Groq } = await loadSdk();
      cached = new Groq({ apiKey, maxRetries: 0 });
    }
    return cached;
  }

  return {
    name: "groq",
    model,
    isConfigured: () => Boolean(apiKey && model),

    async generate({ messages, maxTokens, temperature, signal, timeoutMs }) {
      const groq = await getClient();
      const response = await groq.chat.completions.create(
        {
          model,
          messages,
          max_completion_tokens: maxTokens,
          temperature,
          response_format: { type: "json_object" }, // JSON mode; the prompts already ask for JSON
        },
        { signal, timeout: timeoutMs, maxRetries: 0 }
      );

      const choice = response?.choices?.[0];
      return {
        content: choice?.message?.content,
        finishReason: choice?.finish_reason === "length" ? "length" : choice?.finish_reason === "stop" ? "stop" : "other",
        provider: "groq",
        model,
      };
    },
  };
}
