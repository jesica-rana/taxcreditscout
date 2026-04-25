import Link from "next/link";
import { getSession } from "@/lib/kv";
import { notFound, redirect } from "next/navigation";
import DeadlineBanner from "@/components/DeadlineBanner";

export const dynamic = "force-dynamic";

export default async function ResultsPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();
  if (session.paid) redirect(`/report/${params.id}`);

  const { report } = session;
  const allSections = [
    ...report.critical_deadlines,
    ...report.federal,
    ...report.state,
    ...report.local,
  ];

  const totalAvg = Math.round(
    (report.total_estimated_low + report.total_estimated_high) / 2
  );

  return (
    <main className="min-h-screen">
      <DeadlineBanner />
      <div className="max-w-3xl mx-auto px-6 py-12">
        <p className="text-sm text-ink/60 uppercase tracking-wide">
          Preview · {allSections.length} credits found
        </p>
        <h1 className="text-5xl font-serif mt-2 mb-4">
          We found <span className="text-money">${totalAvg.toLocaleString()}</span>
        </h1>
        <p className="text-ink/70 text-lg">
          across {allSections.length} tax credits you likely qualify for.
          Estimated range:{" "}
          <strong>
            ${report.total_estimated_low.toLocaleString()} – $
            {report.total_estimated_high.toLocaleString()}
          </strong>
          .
        </p>

        {report.critical_deadlines.length > 0 && (
          <div className="mt-8 p-4 bg-warning/10 border border-warning rounded-md">
            <p className="font-semibold text-warning">
              ⚠ {report.critical_deadlines.length} of these credits have hard
              deadlines.
            </p>
            <p className="text-sm text-ink/70 mt-1">
              Including the July 4, 2026 retroactive R&amp;D election. Miss it
              and the money is permanently gone.
            </p>
          </div>
        )}

        <ul className="mt-8 space-y-3">
          {allSections.map((s) => (
            <li
              key={s.credit_id}
              className="border border-ink/10 rounded-md p-4 bg-white"
            >
              <div className="flex justify-between items-start gap-4">
                <div>
                  <p className="font-semibold">{s.name}</p>
                  <p className="text-sm text-ink/60">
                    {s.jurisdiction}
                    {s.deadline_critical && (
                      <span className="ml-2 text-warning font-semibold">
                        · Deadline-critical
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-serif blur-amount">$X,XXX</p>
                  <p className="text-xs text-ink/40">unlock to see</p>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <div className="mt-12 p-6 bg-ink text-paper rounded-md">
          <h2 className="text-2xl font-serif mb-2">Unlock the full report</h2>
          <p className="text-paper/70 mb-6">
            Per-credit dollar estimates · why you qualify · IRS form numbers ·
            week-by-week action plan · single-page CPA handoff. Delivered as a
            12-page PDF.
          </p>
          <Link
            href={`/api/checkout?session=${params.id}`}
            className="inline-block bg-accent text-paper px-8 py-4 text-lg font-semibold rounded-md hover:bg-accent/90 transition"
          >
            Unlock full report — $99
          </Link>
          <p className="mt-3 text-xs text-paper/60">
            Money-back if we found less than $1,000 · 7-day full refund
          </p>
        </div>
      </div>
    </main>
  );
}
