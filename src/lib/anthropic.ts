import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

/** Lazily-constructed singleton so builds without the env var set don't crash at import time. */
export function getAnthropicClient(): Anthropic {
  if (!client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Add it in your Vercel project's Environment Variables " +
          "(or .env.local for local dev) -- see .env.example."
      );
    }
    client = new Anthropic({ apiKey });
  }
  return client;
}

export const GRADE_MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-4-5";
