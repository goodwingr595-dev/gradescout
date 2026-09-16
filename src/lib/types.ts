export interface GradeResult {
  grade_range: string;
  most_likely: string;
  confidence: "low" | "medium" | "high";
  confidence_reason: string;
  centering: string;
  corners: string;
  edges: string;
  surface: string;
  dealbreakers: string[];
  swing_factors: string;
  photo_quality_notes: string;
}

export interface NoCardDetected {
  error: "no_card_detected";
  message: string;
}

export type GradeApiSuccess = { result: GradeResult | NoCardDetected };
export type GradeApiError = { error: string; message: string };
