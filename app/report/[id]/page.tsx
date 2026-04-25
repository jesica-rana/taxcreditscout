import { getSession } from "@/lib/kv";
import { notFound, redirect } from "next/navigation";
import type { ReportSection } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ReportPage({
  params,
}: {
  params: { id: string };
}) {
  const session = await getSession(params.id);
  if (!session) notFound();
  if (!session.paid) redirect(`/results/${params.id}`);

  const { report } = session;

  return (
    <main className="min-h-screen bg-paper">
      <div className="max-w-3xl mx-auto px-6 py-12">
        <header className="border-b border-ink/10 pb-6 mb-10">
          <p className="text-sm text-ink/50 uppercase tracking-wider">
            Tax Credit Audit
          </p>
          <h1 className="text-4xl font-serif mt-2">
            {report.business_summary}
          </h1>
          <p className="text-sm text-ink/60 mt-3">
            Generated {new Date(report.generated_at).toLocaleDateString()} ·{" "}
            <a
              href={`/api/report/${params.id}/pdf`}
              className="underline hover:text-accent"
            >
              Download PDF
            </a>
          </p>
        </header>

        <section className="mb-12 p-6 bg-money/5 border border-money/20 rounded-md">
          <p className="text-sm uppercase tracking-wide text-ink/60">
            Total estimated credits found
          </p>
          <p className="text-5xl font-serif text-money mt-2">
            ${report.total_estimated_low.toLocaleString()} – $
            {report.total_estimated_high.toLocaleString()}
          </p>
        </section>

        {report.critical_deadlines.length > 0 && (
          <Block title="⚠ Critical deadlines" tone="warning">
            {report.critical_deadlines.map((s) => (
              <CreditBlock key={s.credit_id} s={s} />
            ))}
          </Block>
        )}

        {report.federal.length > 0 && (
          <Block title="Federal credits">
            {report.federal.map((s) => (
              <CreditBlock key={s.credit_id} s={s} />
            ))}
          </Block>
        )}

        {report.state.length > 0 && (
          <Block title="State credits">
            {report.state.map((s) => (
              <CreditBlock key={s.credit_id} s={s} />
            ))}
          </Block>
        )}

        {report.local.length > 0 && (
          <Block title="Local & opportunity zone credits">
            {report.local.map((s) => (
              <CreditBlock key={s.credit_id} s={s} />
            ))}
          </Block>
        )}

        <Block title="Action plan">
          <Plan title="This week" items={report.action_plan_this_week} />
          <Plan title="This month" items={report.action_plan_this_month} />
          <Plan title="This quarter" items={report.action_plan_this_quarter} />
        </Block>

        <Block title="Email this to your CPA">
          <p className="text-ink/80 leading-relaxed whitespace-pre-line">
            {report.cpa_handoff_summary}
          </p>
        </Block>

        <footer className="mt-16 pt-8 border-t border-ink/10 text-sm text-ink/50">
          <p>{report.disclaimer}</p>
        </footer>
      </div>
    </main>
  );
}

function Block({
  title,
  tone,
  children,
}: {
  title: string;
  tone?: "warning";
  children: React.ReactNode;
}) {
  return (
    <section
      className={`mb-10 ${
        tone === "warning" ? "p-6 bg-warning/5 border border-warning/30 rounded-md" : ""
      }`}
    >
      <h2
        className={`text-2xl font-serif mb-6 ${
          tone === "warning" ? "text-warning" : ""
        }`}
      >
        {title}
      </h2>
      <div className="space-y-6">{children}</div>
    </section>
  );
}

function CreditBlock({ s }: { s: ReportSection }) {
  return (
    <div className="border-l-4 border-accent pl-4 py-2">
      <div className="flex justify-between items-baseline gap-4">
        <h3 className="text-lg font-semibold">{s.name}</h3>
        <p className="text-money font-serif text-lg whitespace-nowrap">
          ${s.estimated_low.toLocaleString()}–$
          {s.estimated_high.toLocaleString()}
        </p>
      </div>
      <p className="mt-2 text-ink/80">{s.why_you_qualify}</p>
      <ul className="mt-3 list-disc list-inside text-sm text-ink/70 space-y-1">
        {s.action_steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-ink/50">
        Form: {s.form} · Deadline: {s.deadline} ·{" "}
        <a href={s.source_url} className="underline" target="_blank">
          source
        </a>
      </p>
    </div>
  );
}

function Plan({ title, items }: { title: string; items: string[] }) {
  return (
    <div>
      <h3 className="font-semibold text-ink mb-2">{title}</h3>
      <ul className="list-disc list-inside text-ink/80 space-y-1">
        {items.map((i, idx) => (
          <li key={idx}>{i}</li>
        ))}
      </ul>
    </div>
  );
}
