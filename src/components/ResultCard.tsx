import type { GradeResult, NoCardDetected } from "@/lib/types";

function isNoCard(result: GradeResult | NoCardDetected): result is NoCardDetected {
  return "error" in result;
}

const CONFIDENCE_STYLES: Record<string, string> = {
  low: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-green-100 text-green-800",
};

export default function ResultCard({ result }: { result: GradeResult | NoCardDetected }) {
  if (isNoCard(result)) {
    return (
      <div className="rounded-lg border border-gray-200 bg-white p-6 text-center">
        <p className="font-medium text-gray-900">Couldn&apos;t read a card in those photos</p>
        <p className="mt-1 text-sm text-gray-600">{result.message}</p>
      </div>
    );
  }

  const confidenceClass = CONFIDENCE_STYLES[result.confidence] ?? "bg-gray-100 text-gray-800";

  return (
    <div className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <div>
          <p className="text-sm text-gray-500">Estimated grade range</p>
          <p className="text-3xl font-bold text-ink">{result.grade_range}</p>
          <p className="text-sm text-gray-600">Most likely: {result.most_likely}</p>
        </div>
        <span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${confidenceClass}`}>
          {result.confidence} confidence
        </span>
      </div>
      <p className="text-sm text-gray-600">{result.confidence_reason}</p>

      <dl className="grid grid-cols-1 gap-3 border-t border-gray-100 pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Centering</dt>
          <dd className="text-sm text-gray-800">{result.centering}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Corners</dt>
          <dd className="text-sm text-gray-800">{result.corners}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Edges</dt>
          <dd className="text-sm text-gray-800">{result.edges}</dd>
        </div>
        <div>
          <dt className="text-xs font-semibold uppercase tracking-wide text-gray-400">Surface</dt>
          <dd className="text-sm text-gray-800">{result.surface}</dd>
        </div>
      </dl>

      {result.dealbreakers.length > 0 && (
        <div className="border-t border-gray-100 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Top issues limiting the grade
          </p>
          <ul className="mt-1 list-inside list-disc text-sm text-gray-800">
            {result.dealbreakers.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="border-t border-gray-100 pt-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Swing factors</p>
        <p className="text-sm text-gray-800">{result.swing_factors}</p>
      </div>

      {result.photo_quality_notes && (
        <div className="rounded-md bg-gray-50 p-3 text-sm text-gray-600">
          <span className="font-medium text-gray-700">About these photos: </span>
          {result.photo_quality_notes}
        </div>
      )}
    </div>
  );
}
