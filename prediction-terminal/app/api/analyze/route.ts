import { NextResponse } from "next/server";
import type { AnalysisResult, Draw } from "@/types";
import { parseDraws } from "@/lib/parser";
import { computeFrequency } from "@/lib/frequency";
import { computeTransitionMatrix } from "@/lib/transition";
import { rankByInteraction, notice } from "@/lib/intelligence";
import { computeEntropy } from "@/lib/entropy";
import { generateSummary } from "@/lib/summary";
import sample from "@/data/sample-history.json";

/**
 * POST /api/analyze
 *
 * Body (JSON, all fields optional):
 *   - input: string of raw text or JSON to parse via parseDraws
 *   - draws: pre-parsed Draw[]
 *   - numberLength: candidate width (defaults to digit-count mode of draws)
 *   - topK: how many candidates to return (defaults to 10)
 *
 * When neither input nor draws is supplied, the route falls back to the
 * bundled sample-history.json fixture.
 *
 * Output is probabilistic intelligence, NOT deterministic prediction. The
 * `notice` field surfaces this contract on every response.
 */
export const dynamic = "force-dynamic";

interface RequestBody {
  input?: unknown;
  draws?: unknown;
  numberLength?: unknown;
  topK?: unknown;
}

function isDrawArray(value: unknown): value is Draw[] {
  if (!Array.isArray(value)) return false;
  return value.every((entry) => {
    if (!entry || typeof entry !== "object") return false;
    const draw = entry as { id?: unknown; digits?: unknown };
    if (typeof draw.id !== "string") return false;
    if (!Array.isArray(draw.digits)) return false;
    return draw.digits.every(
      (d) => typeof d === "number" && Number.isFinite(d),
    );
  });
}

async function readBody(request: Request): Promise<[RequestBody, boolean]> {
  let text: string;
  try {
    text = await request.text();
  } catch {
    return [{}, false];
  }
  if (!text || !text.trim()) return [{}, false];
  try {
    const parsed: unknown = JSON.parse(text);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      return [parsed as RequestBody, false];
    }
    return [{}, false];
  } catch {
    // Malformed JSON: treat as empty body so the caller falls back to the
    // sample fixture rather than throwing a 500.
    return [{}, true];
  }
}

export async function POST(request: Request) {
  try {
    const [body, malformed] = await readBody(request);

    let draws: Draw[] = [];
    if (typeof body.input === "string" && body.input.trim().length > 0) {
      draws = parseDraws(body.input);
    } else if (isDrawArray(body.draws)) {
      draws = body.draws as Draw[];
    }

    if (draws.length === 0) {
      // Fallback to the bundled fixture so the dashboard always has data.
      draws = (sample as { draws: Draw[] }).draws ?? [];
    }

    const numberLengthOpt =
      typeof body.numberLength === "number" && body.numberLength > 0
        ? Math.trunc(body.numberLength)
        : undefined;
    const topKOpt =
      typeof body.topK === "number" && body.topK > 0
        ? Math.trunc(body.topK)
        : undefined;

    const intelligence = rankByInteraction(draws, {
      numberLength: numberLengthOpt,
      topK: topKOpt,
    });

    const data: AnalysisResult = {
      frequency: computeFrequency(draws),
      transition: computeTransitionMatrix(draws),
      ranking: intelligence.perDigit,
      entropy: computeEntropy(draws),
      summary: "",
      intelligence,
    };
    data.summary = generateSummary(data);

    return NextResponse.json({
      ok: true,
      data,
      notice,
      degraded: malformed ? "Malformed JSON body; served sample fixture." : undefined,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "unknown error";
    return NextResponse.json(
      {
        ok: false,
        error: message,
        notice,
      },
      { status: 400 },
    );
  }
}
