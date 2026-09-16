"use client";

import { useState } from "react";
import ResultCard from "./ResultCard";
import type { GradeApiError, GradeApiSuccess } from "@/lib/types";

interface Slot {
  key: "front" | "back" | "extra";
  label: string;
  required: boolean;
  file: File | null;
  previewUrl: string | null;
}

const INITIAL_SLOTS: Slot[] = [
  { key: "front", label: "Front, straight-on", required: true, file: null, previewUrl: null },
  { key: "back", label: "Back, straight-on", required: true, file: null, previewUrl: null },
  {
    key: "extra",
    label: "Optional: angled under a light (shows scratches/whitening better)",
    required: false,
    file: null,
    previewUrl: null,
  },
];

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      // Strip the "data:image/jpeg;base64," prefix.
      const comma = result.indexOf(",");
      resolve(comma >= 0 ? result.slice(comma + 1) : result);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UploadForm() {
  const [slots, setSlots] = useState<Slot[]>(INITIAL_SLOTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GradeApiSuccess["result"] | null>(null);

  const canSubmit = slots.filter((s) => s.required).every((s) => s.file !== null) && !loading;

  function handleFileChange(key: Slot["key"], file: File | null) {
    setSlots((prev) =>
      prev.map((s) => {
        if (s.key !== key) return s;
        if (s.previewUrl) URL.revokeObjectURL(s.previewUrl);
        return { ...s, file, previewUrl: file ? URL.createObjectURL(file) : null };
      })
    );
    setResult(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const activeSlots = slots.filter((s) => s.file !== null);
      const images = await Promise.all(
        activeSlots.map(async (s) => ({
          mediaType: s.file!.type || "image/jpeg",
          data: await fileToBase64(s.file!),
        }))
      );

      const res = await fetch("/api/grade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });

      const body = (await res.json()) as GradeApiSuccess | GradeApiError;

      if (!res.ok || "message" in body) {
        setError((body as GradeApiError).message || "Something went wrong. Please try again.");
        return;
      }

      setResult((body as GradeApiSuccess).result);
    } catch {
      setError("Network error — please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border border-gray-200 bg-white p-6">
        {slots.map((slot) => (
          <div key={slot.key}>
            <label className="mb-1 block text-sm font-medium text-gray-800">
              {slot.label}
              {slot.required && <span className="text-red-500"> *</span>}
            </label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={(e) => handleFileChange(slot.key, e.target.files?.[0] ?? null)}
              className="block w-full text-sm text-gray-600 file:mr-4 file:rounded-md file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:opacity-90"
            />
            {slot.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={slot.previewUrl}
                alt={`${slot.label} preview`}
                className="mt-2 h-32 rounded-md border border-gray-200 object-cover"
              />
            )}
          </div>
        ))}

        <button
          type="submit"
          disabled={!canSubmit}
          className="w-full rounded-md bg-ink px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {loading ? "Grading…" : "Grade my card"}
        </button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      {result && <ResultCard result={result} />}
    </div>
  );
}
