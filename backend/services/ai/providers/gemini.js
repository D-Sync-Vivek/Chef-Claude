import { splitSystemMessages } from "./message-utils.js";

// Google Gemini API through the official @google/genai SDK.
// Docs: https://ai.google.dev/gemini-api/docs/text-generation
// Gemini calls the assistant role "model" and takes the system prompt as `systemInstruction`.

export function createGeminiProvider({ apiKey, model, client, loadSdk = () => import("@google/genai") }) {
  let cached = client;

  async function getClient() {
    if (!cached) {
      const { GoogleGenAI } = await loadSdk();
      cached = new GoogleGenAI({ apiKey });
    }
    return cached;
  }

  return {
    name: "gemini",
    model,
    isConfigured: () => Boolean(apiKey && model),

    async generate({ messages, maxTokens, temperature, signal, timeoutMs }) {
      const ai = await getClient();
      const { systemText, conversation } = splitSystemMessages(messages);

      const response = await ai.models.generateContent({
        model,
        contents: conversation.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
        config: {
          ...(systemText ? { systemInstruction: systemText } : {}),
          maxOutputTokens: maxTokens,
          temperature,
          responseMimeType: "application/json", // the recipe format is a JSON object
          abortSignal: signal,
          httpOptions: { timeout: timeoutMs },
        },
      });

      const finish = response?.candidates?.[0]?.finishReason;
      return {
        content: response?.text, // undefined when the response was blocked or empty; validation handles it
        finishReason: finish === "MAX_TOKENS" ? "length" : finish === "STOP" ? "stop" : "other",
        provider: "gemini",
        model,
      };
    },
  };
}
