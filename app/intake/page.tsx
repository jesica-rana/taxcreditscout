"use client";

import { useState } from "react";
import IntakeForm from "@/components/IntakeForm";
import PdfUpload from "@/components/PdfUpload";
import DeadlineBanner from "@/components/DeadlineBanner";

export default function IntakePage() {
  const [tab, setTab] = useState<"pdf" | "form">("pdf");

  return (
    <main className="min-h-screen">
      <DeadlineBanner />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-4xl font-serif mb-2">Find your tax credits.</h1>
        <p className="text-ink/60 mb-8">
          Two ways to start. Both stay private — pick whichever you have handy.
        </p>

        <div className="flex gap-2 mb-8 border-b border-ink/10">
          <Tab active={tab === "pdf"} onClick={() => setTab("pdf")}>
            🔒 Upload tax return PDF
          </Tab>
          <Tab active={tab === "form"} onClick={() => setTab("form")}>
            ✍️ Answer 5 questions
          </Tab>
        </div>

        {tab === "pdf" ? (
          <div>
            <p className="mb-6 text-ink/70">
              We'll parse the PDF entirely in your browser, redact your name,
              SSN, EIN, address, phone, and account numbers, and let you review
              everything before anything is sent.
            </p>
            <PdfUpload />
          </div>
        ) : (
          <div>
            <p className="mb-6 text-ink/70">
              5 questions, 60 seconds. We'll match your business against 300+
              federal, state, and local tax credits.
            </p>
            <IntakeForm />
          </div>
        )}
      </div>
    </main>
  );
}

function Tab({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 font-semibold border-b-2 -mb-px transition ${
        active
          ? "border-accent text-ink"
          : "border-transparent text-ink/50 hover:text-ink/70"
      }`}
    >
      {children}
    </button>
  );
}
