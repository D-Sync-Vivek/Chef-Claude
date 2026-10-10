import { splitSystemMessages } from "./message-utils.js";

// OpenAI through the official `openai` SDK and the Responses API (OpenAI's recommended API).
// Docs: https://platform.openai.com/docs/api-reference/responses
// - System messages become `instructions`; the rest is sent as `input`.
// - `temperature` is intentionally not sent: newer reasoning models reject it.
// - `reasoningEffort` (optional, from OPENAI_REASONING_EFFORT) is sent only when set, because only
//   reasoning models accept it. Reasoning tokens count toward max_output_tokens.
// maxRetries is 0 because retries are decided by the provider manager, not the SDK.

export function createOpenAIProvider({ apiKey, model, reasoningEffort, client, loadSdk = () => import("openai") }) {
  let cached = client;

  async function getClient() {
    if (!cached) {
      const { default: OpenAI } = await loadSdk();
      cached = new OpenAI({ apiKey, maxRetries: 0 });
    }
    return cached;
  }

  return {
    name: "openai",
    model,
    isConfigured: () => Boolean(apiKey && model),

    async generate({ messages, maxTokens, signal, timeoutMs }) {
      const openai = await getClient();
      const { systemText, conversation } = splitSystemMessages(messages);

      const response = await openai.responses.create(
        {
          model,
          ...(systemText ? { instructions: systemText } : {}),
          input: conversation.map((m) => ({ role: m.role, content: m.content })),
          max_output_tokens: maxTokens,
          text: { format: { type: "json_object" } },
          ...(reasoningEffort ? { reasoning: { effort: reasoningEffort } } : {}),
          store: false, // do not keep user prompts on OpenAI's side
        },
        { signal, timeout: timeoutMs, maxRetries: 0 }
      );

      const incomplete = response?.status === "incomplete";
      const cutOff = incomplete && response?.incomplete_details?.reason === "max_output_tokens";
      return {
        content: response?.output_text,
        finishReason: cutOff ? "length" : response?.status === "completed" ? "stop" : "other",
        provider: "openai",
        model,
      };
    },
  };
}
