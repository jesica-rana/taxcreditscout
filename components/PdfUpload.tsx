"use client";

import { useCallback, useState } from "react";
import { parsePdf, overlayRedactionBanner } from "@/lib/pdf-parser";
import { redact, type PiiToken } from "@/lib/redactor";
import RedactionPreview from "./RedactionPreview";
import { useRouter } from "next/navigation";

type Stage = "idle" | "parsing" | "redacting" | "preview" | "submitting";

export interface PreparedPage {
  pageNumber: number;
  redactedText: string;
  redactedImageDataUrl: string;
  tokens: PiiToken[];
}

export default function PdfUpload({
  hint,
}: {
  hint?: { state?: string; city?: string };
}) {
  const router = useRouter();
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [pages, setPages] = useState<PreparedPage[]>([]);
  const [allTokens, setAllTokens] = useState<PiiToken[]>([]);
  const [reviewed, setReviewed] = useState(false);

  const onFile = useCallback(async (file: File) => {
    setError(null);
    setStage("parsing");
    try {
      const parsed = await parsePdf(file);
      setStage("redacting");
      const prepared: PreparedPage[] = [];
      const aggregated: PiiToken[] = [];
      for (const p of parsed.pages) {
        const r = redact(p.text);
        const overlaid = await overlayRedactionBanner(
          p.imageDataUrl,
          r.tokens.length,
          p.width,
          p.height
        );
        prepared.push({
          pageNumber: p.pageNumber,
          redactedText: r.redactedText,
          redactedImageDataUrl: overlaid,
          tokens: r.tokens,
        });
        aggregated.push(...r.tokens);
      }
      setPages(prepared);
      setAllTokens(aggregated);
      setStage("preview");
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed to parse PDF");
      setStage("idle");
    }
  }, []);

  const submit = useCallback(async () => {
    setStage("submitting");
    setError(null);
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "pdf",
          hint: hint || null,
          pages: pages.map((p) => ({
            redactedText: p.redactedText,
            redactedImageDataUrl: p.redactedImageDataUrl,
          })),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Pipeline failed");
      }
      const data = await res.json();
      // PII tokens stay client-side; stash them keyed by session ID for later
      // re-injection at PDF download time.
      try {
        sessionStorage.setItem(
          `pii:${data.session_id}`,
          JSON.stringify(allTokens)
        );
      } catch {}
      router.push(`/results/${data.session_id}`);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "Failed");
      setStage("preview");
    }
  }, [pages, allTokens, hint, router]);

  if (stage === "idle") {
    return (
      <DropZone
        onFile={onFile}
        error={error}
      />
    );
  }

  if (stage === "parsing" || stage === "redacting" || stage === "submitting") {
    return (
      <div className="py-20 text-center">
        <div className="inline-block w-12 h-12 border-4 border-ink/20 border-t-accent rounded-full animate-spin" />
        <p className="mt-6 text-lg text-ink/80">
          {stage === "parsing"
            ? "Reading your PDF (in your browser)..."
            : stage === "redacting"
            ? "Redacting personal information (in your browser)..."
            : "Sending only de-identified data..."}
        </p>
      </div>
    );
  }

  // stage === "preview"
  return (
    <RedactionPreview
      pages={pages}
      tokens={allTokens}
      reviewed={reviewed}
      setReviewed={setReviewed}
      onSubmit={submit}
      onReset={() => {
        setStage("idle");
        setPages([]);
        setAllTokens([]);
        setReviewed(false);
      }}
      error={error}
    />
  );
}

function DropZone({
  onFile,
  error,
}: {
  onFile: (f: File) => void;
  error: string | null;
}) {
  const [dragging, setDragging] = useState(false);
  return (
    <div>
      <label
        htmlFor="pdf-input"
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const f = e.dataTransfer.files?.[0];
          if (f) onFile(f);
        }}
        className={`block border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition ${
          dragging
            ? "border-accent bg-accent/5"
            : "border-ink/20 hover:border-ink/40"
        }`}
      >
        <p className="text-lg font-semibold">Drop your tax return PDF here</p>
        <p className="text-ink/60 text-sm mt-2">
          or click to browse · Form 1040 Schedule C, 1120, 1120-S, 1065, or
          P&amp;L statement
        </p>
        <p className="mt-6 text-xs text-money font-semibold">
          🔒 Your file never leaves this browser. Parsing and redaction happen
          locally.
        </p>
        <input
          id="pdf-input"
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
          }}
        />
      </label>
      {error && (
        <div className="mt-4 p-3 bg-warning/10 border border-warning rounded-md text-sm">
          {error}
        </div>
      )}
    </div>
  );
}
