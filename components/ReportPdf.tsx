import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Link,
} from "@react-pdf/renderer";
import type { Report, ReportSection } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10.5, fontFamily: "Helvetica", color: "#0B0B0F" },
  eyebrow: {
    fontSize: 8,
    color: "#6B7280",
    letterSpacing: 1.4,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  badge: {
    alignSelf: "flex-start",
    fontSize: 8,
    color: "#0F7B3F",
    backgroundColor: "#E6F4EC",
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 999,
    marginBottom: 14,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  h1: { fontSize: 26, fontFamily: "Times-Roman", marginBottom: 6 },
  total: {
    fontSize: 30,
    color: "#0F7B3F",
    fontFamily: "Times-Roman",
    marginVertical: 12,
  },
  summary: { fontSize: 11, lineHeight: 1.5, color: "#1F2937", marginBottom: 20 },
  metaRow: {
    flexDirection: "row",
    gap: 18,
    paddingVertical: 14,
    borderTop: "0.5pt solid #E5E7EB",
    borderBottom: "0.5pt solid #E5E7EB",
    marginBottom: 22,
  },
  metaCell: { flexGrow: 1, flexBasis: 0 },
  metaNum: { fontSize: 18, fontFamily: "Times-Roman", color: "#0B0B0F" },
  metaLabel: { fontSize: 7.5, color: "#6B7280", letterSpacing: 1, marginTop: 4, textTransform: "uppercase" },
  warning: {
    backgroundColor: "#FEF2F2",
    border: "0.5pt solid #FCA5A5",
    padding: 12,
    marginBottom: 18,
    borderRadius: 4,
  },
  warningTitle: { fontWeight: 700, color: "#B91C1C", fontSize: 11 },
  warningBody: { marginTop: 4, fontSize: 10, color: "#7F1D1D", lineHeight: 1.4 },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Times-Roman",
    marginTop: 22,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "0.5pt solid #E5E7EB",
  },
  sectionTitleWarn: {
    fontSize: 16,
    fontFamily: "Times-Roman",
    marginTop: 22,
    marginBottom: 12,
    paddingBottom: 6,
    borderBottom: "0.5pt solid #FCA5A5",
    color: "#B91C1C",
  },
  card: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeft: "1.5pt solid #0F7B3F",
  },
  cardWarn: {
    marginBottom: 16,
    paddingLeft: 12,
    borderLeft: "1.5pt solid #DC2626",
  },
  cardHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  cardName: { fontSize: 12, fontWeight: 700, color: "#0B0B0F", flexGrow: 1, paddingRight: 8 },
  cardAmount: { fontSize: 11, color: "#0F7B3F", fontWeight: 700 },
  ircTag: {
    fontSize: 7.5,
    color: "#6B7280",
    marginTop: 3,
    letterSpacing: 0.5,
  },
  confidenceRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  confidencePillYes: {
    fontSize: 7.5,
    color: "#0F7B3F",
    backgroundColor: "#E6F4EC",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  confidencePillLikely: {
    fontSize: 7.5,
    color: "#0B6BCB",
    backgroundColor: "#E0EEFB",
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 3,
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  blockLabel: {
    fontSize: 7.5,
    color: "#6B7280",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  blockLabelWarn: {
    fontSize: 7.5,
    color: "#B91C1C",
    letterSpacing: 1,
    marginTop: 8,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  blockLabelPitfall: {
    fontSize: 7.5,
    color: "#9A3412",
    letterSpacing: 1,
    marginBottom: 4,
    textTransform: "uppercase",
  },
  blockText: { fontSize: 10.5, lineHeight: 1.45, color: "#1F2937" },
  bullet: { fontSize: 10.5, lineHeight: 1.45, color: "#1F2937", marginLeft: 10, marginTop: 2 },
  verifyBlock: {
    backgroundColor: "#FFF7ED",
    borderLeft: "1.5pt solid #F59E0B",
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  verifyBullet: { fontSize: 10, color: "#7C2D12", marginTop: 2 },
  pitfallBlock: {
    backgroundColor: "#FEF2F2",
    borderLeft: "1.5pt solid #DC2626",
    padding: 8,
    marginTop: 8,
    marginBottom: 4,
  },
  pitfallBullet: { fontSize: 10, color: "#7F1D1D", marginTop: 2 },
  factsBlock: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#F9FAFB",
    border: "0.5pt solid #E5E7EB",
    borderRadius: 3,
  },
  factRow: { marginBottom: 4 },
  factLabel: {
    fontSize: 7,
    color: "#6B7280",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 1,
  },
  factValue: { fontSize: 10, color: "#1F2937", lineHeight: 1.35 },
  docsBlock: {
    marginTop: 8,
    paddingTop: 6,
    borderTop: "0.5pt dotted #E5E7EB",
  },
  meta: {
    fontSize: 8.5,
    color: "#6B7280",
    marginTop: 8,
    paddingTop: 6,
    borderTop: "0.5pt solid #E5E7EB",
  },
  link: { color: "#0F7B3F", textDecoration: "none" },
  planGrid: { flexDirection: "row", gap: 12, marginTop: 8 },
  planCol: { flexBasis: 0, flexGrow: 1 },
  planTitle: { fontSize: 10, fontWeight: 700, marginBottom: 4, color: "#0B0B0F" },
  cpaCard: {
    marginTop: 8,
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderLeft: "1.5pt solid #0F7B3F",
    fontSize: 10.5,
    lineHeight: 1.55,
    color: "#1F2937",
  },
  disclaimer: {
    marginTop: 22,
    paddingTop: 10,
    borderTop: "0.5pt solid #E5E7EB",
    fontSize: 8.5,
    color: "#6B7280",
    fontStyle: "italic",
    lineHeight: 1.4,
  },
});

function shortUrl(url?: string | null): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + u.pathname.replace(/\/$/, "");
  } catch {
    return url;
  }
}

function confidencePercent(value?: number | null): number {
  const n = Math.round(((value as number) || 0) * 100);
  return Math.min(99, Math.max(0, n));
}

const QUAL_LABEL: Record<string, string> = {
  yes: "Qualifies",
  likely: "Likely qualifies",
  no: "Does not qualify",
};

export function ReportPdf({ report }: { report: Report }) {
  const totalCredits =
    report.critical_deadlines.length +
    report.federal.length +
    report.state.length +
    report.local.length;
  const stateLocalCount = report.state.length + report.local.length;

  return (
    <Document>
      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.eyebrow}>Opportunity report · CreditBowl</Text>
        <Text style={styles.badge}>Delivered</Text>
        <Text style={styles.eyebrow}>Total estimated credits found</Text>
        <Text style={styles.total}>
          ${report.total_estimated_low.toLocaleString()} – $
          {report.total_estimated_high.toLocaleString()}
        </Text>
        <Text style={styles.summary}>{report.business_summary}</Text>

        <View style={styles.metaRow}>
          <View style={styles.metaCell}>
            <Text style={styles.metaNum}>{totalCredits}</Text>
            <Text style={styles.metaLabel}>Credits matched</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaNum}>{report.critical_deadlines.length}</Text>
            <Text style={styles.metaLabel}>Deadline-sensitive</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaNum}>{report.federal.length}</Text>
            <Text style={styles.metaLabel}>Federal</Text>
          </View>
          <View style={styles.metaCell}>
            <Text style={styles.metaNum}>{stateLocalCount}</Text>
            <Text style={styles.metaLabel}>State &amp; local</Text>
          </View>
        </View>

        {report.critical_deadlines.length > 0 && (
          <View style={styles.warning}>
            <Text style={styles.warningTitle}>
              ⚠ {report.critical_deadlines.length} of these credits have hard
              deadlines
            </Text>
            <Text style={styles.warningBody}>
              Including the July 4, 2026 retroactive R&amp;D election. Miss it
              and the money is permanently gone.
            </Text>
          </View>
        )}

        {report.critical_deadlines.length > 0 && (
          <Block
            title="Critical deadlines"
            sections={report.critical_deadlines}
            tone="warn"
          />
        )}
      </Page>

      {(report.federal.length > 0 ||
        report.state.length > 0 ||
        report.local.length > 0) && (
        <Page size="LETTER" style={styles.page} wrap>
          {report.federal.length > 0 && (
            <Block title="Federal credits" sections={report.federal} />
          )}
          {report.state.length > 0 && (
            <Block title="State credits" sections={report.state} />
          )}
          {report.local.length > 0 && (
            <Block title="Local & private credits" sections={report.local} />
          )}
        </Page>
      )}

      <Page size="LETTER" style={styles.page} wrap>
        <Text style={styles.sectionTitle}>Action plan</Text>
        <View style={styles.planGrid}>
          <Plan title="This week" items={report.action_plan_this_week} />
          <Plan title="This month" items={report.action_plan_this_month} />
          <Plan title="This quarter" items={report.action_plan_this_quarter} />
        </View>

        <Text style={styles.sectionTitle}>CPA handoff</Text>
        <View style={styles.cpaCard}>
          <Text>{report.cpa_handoff_summary}</Text>
        </View>

        <Text style={styles.disclaimer}>
          {report.disclaimer ||
            "Informational research, not tax advice. Verify with a qualified CPA before filing."}
        </Text>
      </Page>
    </Document>
  );
}

function Block({
  title,
  sections,
  tone,
}: {
  title: string;
  sections: ReportSection[];
  tone?: "warn";
}) {
  return (
    <View>
      <Text style={tone === "warn" ? styles.sectionTitleWarn : styles.sectionTitle}>
        {title}
      </Text>
      {sections.map((s) => {
        const status = s.qualification_status || "likely";
        const pct = confidencePercent(s.qualification_confidence);
        const pillStyle =
          status === "yes" ? styles.confidencePillYes : styles.confidencePillLikely;
        return (
          <View key={s.credit_id} style={tone === "warn" ? styles.cardWarn : styles.card} wrap={false}>
            <View style={styles.cardHead}>
              <View style={{ flexGrow: 1, paddingRight: 8 }}>
                <Text style={styles.cardName}>{s.name}</Text>
                <View style={styles.confidenceRow}>
                  {s.irc_section && (
                    <Text style={styles.ircTag}>IRC §{s.irc_section}</Text>
                  )}
                  {s.qualification_confidence != null && (
                    <Text style={pillStyle}>
                      {QUAL_LABEL[status]} · {pct}% confidence
                    </Text>
                  )}
                </View>
              </View>
              <Text style={styles.cardAmount}>
                ${s.estimated_low.toLocaleString()}–$
                {s.estimated_high.toLocaleString()}
              </Text>
            </View>

            {s.how_it_works && (
              <>
                <Text style={styles.blockLabel}>How this credit works</Text>
                <Text style={styles.blockText}>{s.how_it_works}</Text>
              </>
            )}

            <Text style={styles.blockLabel}>Why you qualify</Text>
            <Text style={styles.blockText}>{s.why_you_qualify}</Text>

            {s.how_we_estimated && (
              <>
                <Text style={styles.blockLabel}>How we estimated this</Text>
                <Text style={styles.blockText}>{s.how_we_estimated}</Text>
              </>
            )}

            {s.eligibility_criteria?.length > 0 && (
              <>
                <Text style={styles.blockLabel}>Eligibility criteria</Text>
                {s.eligibility_criteria.map((step, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {step}
                  </Text>
                ))}
              </>
            )}

            {s.action_steps?.length > 0 && (
              <>
                <Text style={styles.blockLabel}>Action steps</Text>
                {s.action_steps.map((step, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {step}
                  </Text>
                ))}
              </>
            )}

            {s.what_to_verify?.length > 0 && (
              <View style={styles.verifyBlock}>
                <Text style={styles.blockLabelWarn}>Confirm with your CPA</Text>
                {s.what_to_verify.map((step, i) => (
                  <Text key={i} style={styles.verifyBullet}>
                    • {step}
                  </Text>
                ))}
              </View>
            )}

            {s.common_pitfalls?.length > 0 && (
              <View style={styles.pitfallBlock}>
                <Text style={styles.blockLabelPitfall}>Common pitfalls</Text>
                {s.common_pitfalls.map((p, i) => (
                  <Text key={i} style={styles.pitfallBullet}>
                    • {p}
                  </Text>
                ))}
              </View>
            )}

            {(s.cashflow_treatment ||
              (s.stacks_with && s.stacks_with.length > 0) ||
              s.typical_industry_finding) && (
              <View style={styles.factsBlock}>
                {s.cashflow_treatment && (
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>Cashflow treatment</Text>
                    <Text style={styles.factValue}>{s.cashflow_treatment}</Text>
                  </View>
                )}
                {s.stacks_with && s.stacks_with.length > 0 && (
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>Stacks with</Text>
                    <Text style={styles.factValue}>{s.stacks_with.join(" · ")}</Text>
                  </View>
                )}
                {s.typical_industry_finding && (
                  <View style={styles.factRow}>
                    <Text style={styles.factLabel}>Typical industry finding</Text>
                    <Text style={styles.factValue}>{s.typical_industry_finding}</Text>
                  </View>
                )}
              </View>
            )}

            {s.documentation?.length > 0 && (
              <View style={styles.docsBlock}>
                <Text style={styles.blockLabel}>
                  Documentation required ({s.documentation.length})
                </Text>
                {s.documentation.map((d, i) => (
                  <Text key={i} style={styles.bullet}>
                    • {d}
                  </Text>
                ))}
              </View>
            )}

            <Text style={styles.meta}>
              {s.jurisdiction} · {s.form} · {s.deadline}
              {s.source_authority ? ` · ${s.source_authority}` : ""}
              {s.source_url ? "  ·  " : ""}
              {s.source_url && (
                <Link src={s.source_url} style={styles.link}>
                  {shortUrl(s.source_url)}
                </Link>
              )}
            </Text>
          </View>
        );
      })}
    </View>
  );
}

function Plan({ title, items }: { title: string; items: string[] }) {
  if (!items?.length) return null;
  return (
    <View style={styles.planCol}>
      <Text style={styles.planTitle}>{title}</Text>
      {items.map((i, idx) => (
        <Text key={idx} style={styles.bullet}>
          • {i}
        </Text>
      ))}
    </View>
  );
}
