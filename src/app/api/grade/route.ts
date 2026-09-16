import { NextResponse } from "next/server";
import { getAnthropicClient, GRADE_MODEL } from "@/lib/anthropic";
import { GRADE_SYSTEM_PROMPT, buildUserPrompt } from "@/lib/gradePrompt";
import { checkAndConsumeGradingCredit, getVisitorId } from "@/lib/rateLimit";

export const runtime = "nodejs";
// Grading calls a vision model and can take a little while; give it room
// before Vercel's function timeout kicks in.
export const maxDuration = 60;

const ALLOWED_MEDIA_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB per image, decoded

interface IncomingImage {
  mediaType: string;
  data: string; // base64, no "data:image/...;base64," prefix
}

function base64ByteLength(base64: string): number {
  const padding = (base64.match(/=+$/) || [""])[0].length;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function POST(req: Request) {
  let body: { images?: IncomingImage[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid_request", message: "Malformed JSON body." }, { status: 400 });
  }

  const images = body.images ?? [];
  if (!Array.isArray(images) || images.length === 0) {
    return NextResponse.json(
      { error: "invalid_request", message: "Include at least one photo (front of the card)." },
      { status: 400 }
    );
  }
  if (images.length > MAX_IMAGES) {
    return NextResponse.json(
      { error: "invalid_request", message: `Send at most ${MAX_IMAGES} photos.` },
      { status: 400 }
    );
  }
  for (const img of images) {
    if (!img || typeof img.data !== "string" || !ALLOWED_MEDIA_TYPES.has(img.mediaType)) {
      return NextResponse.json(
        { error: "invalid_request", message: "Photos must be JPEG, PNG, or WEBP." },
        { status: 400 }
      );
    }
    if (base64ByteLength(img.data) > MAX_IMAGE_BYTES) {
      return NextResponse.json(
        { error: "invalid_request", message: "Each photo must be 5MB or smaller." },
        { status: 400 }
      );
    }
  }

  const visitorId = getVisitorId(req.headers);
  const rateLimitResult = await checkAndConsumeGradingCredit(visitorId);
  if (!rateLimitResult.allowed) {
    const message =
      rateLimitResult.reason === "global"
        ? "GradeScout has hit its free daily grading limit across all visitors. Please try again tomorrow."
        : `You've used your ${rateLimitResult.cap} free gradings for today. Please try again tomorrow.`;
    return NextResponse.json({ error: "rate_limited", message }, { status: 429 });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: GRADE_MODEL,
      max_tokens: 1024,
      system: GRADE_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: buildUserPrompt(images.length) },
            ...images.map((img) => ({
              type: "image" as const,
              source: {
                type: "base64" as const,
                media_type: img.mediaType as "image/jpeg" | "image/png" | "image/webp",
                data: img.data,
              },
            })),
          ],
        },
      ],
    });

    const textBlock = response.content.find((block) => block.type === "text");
    const rawText = textBlock && "text" in textBlock ? textBlock.text : "";

    let parsed: unknown;
    try {
      // Models occasionally wrap JSON in a markdown fence despite instructions -- strip it.
      const cleaned = rawText.trim().replace(/^```json\s*/i, "").replace(/```$/, "").trim();
      parsed = JSON.parse(cleaned);
    } catch {
      return NextResponse.json(
        {
          error: "grading_parse_failed",
          message: "The grading model returned something unexpected. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ result: parsed });
  } catch (err) {
    console.error("GradeScout grading error:", err);
    return NextResponse.json(
      { error: "grading_failed", message: "Something went wrong while grading. Please try again." },
      { status: 500 }
    );
  }
}
