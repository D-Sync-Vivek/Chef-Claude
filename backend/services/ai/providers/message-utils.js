// Providers that take the system prompt separately (Gemini, OpenAI Responses) need the chat
// messages split; this keeps that logic in one place.
export function splitSystemMessages(messages) {
  const system = messages.filter((m) => m.role === "system").map((m) => m.content);
  const conversation = messages.filter((m) => m.role !== "system");
  return { systemText: system.join("\n\n"), conversation };
}
