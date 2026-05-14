import { NextResponse } from "next/server";
import type { AnalysisResult } from "@/types";

export async function POST(_request: Request) {
  // Placeholder: returns a static dummy AnalysisResult.
  // Real analysis pipeline (parser -> frequency -> transition -> probability ->
  // entropy -> normalization -> summary) will be wired up in a later feature.
  const dummy: AnalysisResult = {
    frequency: {},
    transition: {},
    ranking: [],
    entropy: 0,
    summary: "Placeholder response from /api/analyze.",
  };

  return NextResponse.json({
    ok: true,
    data: dummy,
  });
}
