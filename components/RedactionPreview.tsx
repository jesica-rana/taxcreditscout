"use client";

import { useMemo, useState } from "react";
import type { PreparedPage } from "./PdfUpload";
import type { PiiToken, PiiType } from "@/lib/redactor";

const TYPE_LABELS: Record<PiiType, string> = {
  SSN: "Social Security Number",
  EIN: "Employer ID Number",
  PHONE: "Phone number",
  EMAIL: "Email address",
  ZIP: "ZIP code",
  ACCOUNT: "Account number",
  ROUTING: "Routing number",
  PERSON: "Person name",
  ORG: "Organization name",
  ADDRESS_LINE: "Street address",
};

export default function RedactionPreview({
  pages,
  tokens,
  reviewed,
  setReviewed,
  onSubmit,
  onReset,
  error,
}: {
  pages: PreparedPage[];
  tokens: PiiToken[];
  reviewed: boolean;
  setReviewed: (b: boolean) => void;
  onSubmit: () => void;
  onReset: () => void;
  error: string | null;
}) {
  const [activePage, setActivePage] = useState(0);

  const grouped = useMemo(() => {
    const map = new Map<PiiType, number>();
    for (const t of tokens) map.set(t.type, (map.get(t.type) ?? 0) + 1);
    return Array.from(map.entries());
  }, [tokens]);

  const page = pages[activePage];

  return (
    <div className="space-y-6">
      <div className="p-4 bg-money/5 border border-money/30 rounded-md">
        <p className="font-semibold text-money">
          🔒 Redaction complete — {tokens.length} pieces of personal information
          removed.
        </p>
        <p className="text-sm text-ink/70 mt-1">
          Review what we're sending below. Nothing has left your browser yet.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div>
          <h3 className="font-semibold mb-2">Page preview (with overlays)</h3>
          <div className="flex gap-2 mb-2">
            {pages.map((_, i) => (
              <button
                key={i}
                onClick={() => setActivePage(i)}
                className={`px-3 py-1 rounded text-sm ${
                  i === activePage
                    ? "bg-ink text-paper"
                    : "bg-paper border border-ink/20"
                }`}
              >
                Page {i + 1}
              </button>
            ))}
          </div>
          <div className="border border-ink/10 rounded overflow-hidden bg-white">
            <img
              src={page.redactedImageDataUrl}
              alt={`Redacted page ${activePage + 1}`}
              className="w-full block"
            />
          </div>
        </div>

        <div>
          <h3 className="font-semibold mb-2">
            What's being sent ({tokens.length} redactions)
          </h3>
          <div className="border border-ink/10 rounded p-3 bg-white max-h-64 overflow-y-auto text-sm">
            <ul className="space-y-1">
              {grouped.map(([type, count]) => (
                <li key={type} className="flex justify-between">
                  <span className="text-ink/70">{TYPE_LABELS[type]}</span>
                  <span className="font-mono text-ink/50">×{count}</span>
                </li>
              ))}
              {grouped.length === 0 && (
                <li className="text-ink/50 italic">
                  No personal information detected. The document may already be
                  de-identified.
                </li>
              )}
            </ul>
          </div>

          <h3 className="font-semibold mt-4 mb-2">Redacted text excerpt</h3>
          <pre className="border border-ink/10 rounded p-3 bg-white max-h-48 overflow-y-auto text-xs whitespace-pre-wrap font-mono">
            {page.redactedText.slice(0, 1500)}
            {page.redactedText.length > 1500 ? "\n\n..." : ""}
          </pre>
        </div>
      </div>

      <div className="border-t border-ink/10 pt-6">
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={reviewed}
            onChange={(e) => setReviewed(e.target.checked)}
            className="mt-1"
          />
          <span>
            I've reviewed what's being sent. Only redacted text and the
            black-banner image will leave my device. My PII stays in this
            browser.
          </span>
        </label>

        {error && (
          <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="mt-6 flex gap-3">
          <button
            onClick={onSubmit}
            disabled={!reviewed}
            className="flex-1 bg-ink text-paper px-6 py-4 text-lg font-semibold rounded-md disabled:opacity-40 disabled:cursor-not-allowed hover:bg-ink/90 transition"
          >
            Send redacted data → find my credits
          </button>
          <button
            onClick={onReset}
            className="px-6 py-4 border border-ink/20 rounded-md hover:bg-ink/5"
          >
            Use a different file
          </button>
        </div>
      </div>
    </div>
  );
}
