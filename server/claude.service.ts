// server/claude.service.ts
// Claude Sonnet integration with Anthropic prompt caching.
// The system prompt + knowledge base are marked as cacheable, so only
// new messages are billed at full price. Cache lasts up to 5 min (ephemeral)
// or 1 hour (extended). This cuts API costs ~90% for a busy villa.

import Anthropic from "@anthropic-ai/sdk";
import {
  getVillaPrompt,
  getVillaKnowledge,
  getMessagesForClaude,
} from "./whatsapp.db";
import { getAllOccupiedDates } from "./db";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const MODEL = "claude-sonnet-4-6";
const MAX_TOKENS = 1024;
/** How many recent messages to include as context for Claude */
const CONTEXT_MESSAGES = 20;

/**
 * Build the availability section dynamically so Claude always has
 * up-to-date occupied dates when answering booking questions.
 */
async function buildAvailabilitySection(): Promise<string> {
  const dates = await getAllOccupiedDates();
  if (!dates.length) {
    return "\n\n## Disponibilidad\nActualmente no hay fechas ocupadas registradas.";
  }
  const list = dates.map((d) => `- ${d.date}`).join("\n");
  return `\n\n## Fechas ocupadas (no disponibles)\n${list}`;
}

/**
 * Generate an AI reply for an incoming WhatsApp message.
 *
 * Uses Anthropic prompt caching:
 * - system prompt → cache_control "ephemeral" (5 min TTL by default)
 * - knowledge base → cache_control "ephemeral"
 * - availability (changes often) → NOT cached
 * - conversation history → NOT cached (changes every message)
 */
export async function generateReply(conversationId: number, incomingText: string): Promise<string> {
  const [systemPrompt, knowledge, availability, history] = await Promise.all([
    getVillaPrompt(),
    getVillaKnowledge(),
    buildAvailabilitySection(),
    getMessagesForClaude(conversationId, CONTEXT_MESSAGES),
  ]);

  // Build messages array: history + new incoming message
  const messages: Anthropic.MessageParam[] = [
    ...history,
    { role: "user", content: incomingText },
  ];

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    system: [
      {
        type: "text",
        text: systemPrompt,
        // @ts-ignore — cache_control is supported but not yet in all SDK typedefs
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        text: knowledge,
        // @ts-ignore
        cache_control: { type: "ephemeral" },
      },
      {
        type: "text",
        // Availability is NOT cached — it changes when dates are added/removed
        text: availability,
      },
    ],
    messages,
  });

  const block = response.content[0];
  if (block.type !== "text") {
    throw new Error("Unexpected response type from Claude");
  }

  return block.text;
}
