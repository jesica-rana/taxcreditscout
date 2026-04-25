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
  page: { padding: 56, fontSize: 11, fontFamily: "Helvetica", color: "#0B0B0F" },
  h1: { fontSize: 24, marginBottom: 12, fontFamily: "Times-Roman" },
  h2: { fontSize: 16, marginTop: 18, marginBottom: 10, fontFamily: "Times-Roman" },
  h3: { fontSize: 13, fontWeight: 700, marginTop: 8, marginBottom: 4 },
  total: { fontSize: 28, color: "#0F7B3F", fontFamily: "Times-Roman", marginVertical: 12 },
  section: {
    marginBottom: 12,
    paddingLeft: 10,
    borderLeft: "2pt solid #FF5733",
  },
  amount: { fontSize: 13, color: "#0F7B3F", fontWeight: 700 },
  meta: { fontSize: 9, color: "#666", marginTop: 4 },
  warning: {
    backgroundColor: "#FEE",
    border: "1pt solid #D63838",
    padding: 10,
    marginVertical: 10,
  },
  bullet: { marginLeft: 12, marginTop: 2 },
  disclaimer: {
    marginTop: 24,
    paddingTop: 12,
    borderTop: "1pt solid #DDD",
    fontSize: 9,
    color: "#666",
    fontStyle: "italic",
  },
});

export function ReportPdf({ report }: { report: Report }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={{ fontSize: 9, color: "#888", marginBottom: 4 }}>
          TAX CREDIT AUDIT
        </Text>
        <Text style={styles.h1}>{report.business_summary}</Text>
        <Text style={styles.meta}>
          Generated {new Date(report.generated_at).toLocaleDateString()}
        </Text>

        <Text style={{ fontSize: 9, color: "#666", marginTop: 16 }}>
          TOTAL ESTIMATED CREDITS FOUND
        </Text>
        <Text style={styles.total}>
          ${report.total_estimated_low.toLocaleString()} – $
          {report.total_estimated_high.toLocaleString()}
        </Text>

        {report.critical_deadlines.length > 0 && (
          <View style={styles.warning}>
            <Text style={{ fontWeight: 700, color: "#D63838" }}>
              ⚠ {report.critical_deadlines.length} of these credits have hard
              deadlines
            </Text>
            <Text style={{ marginTop: 4, fontSize: 10 }}>
              Including the July 4, 2026 retroactive R&D election. Miss it and
              the money is permanently gone.
            </Text>
          </View>
        )}

        {report.critical_deadlines.length > 0 && (
          <Block title="⚠ Critical Deadlines" sections={report.critical_deadlines} />
        )}
      </Page>

      <Page size="LETTER" style={styles.page}>
        {report.federal.length > 0 && <Block title="Federal Credits" sections={report.federal} />}
        {report.state.length > 0 && <Block title="State Credits" sections={report.state} />}
        {report.local.length > 0 && <Block title="Local & Opportunity Zone Credits" sections={report.local} />}
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Action Plan</Text>
        <Plan title="This week" items={report.action_plan_this_week} />
        <Plan title="This month" items={report.action_plan_this_month} />
        <Plan title="This quarter" items={report.action_plan_this_quarter} />

        <Text style={styles.h2}>Email This to Your CPA</Text>
        <Text style={{ lineHeight: 1.5 }}>{report.cpa_handoff_summary}</Text>

        <Text style={styles.disclaimer}>{report.disclaimer}</Text>
      </Page>
    </Document>
  );
}

function Block({ title, sections }: { title: string; sections: ReportSection[] }) {
  return (
    <View>
      <Text style={styles.h2}>{title}</Text>
      {sections.map((s) => (
        <View key={s.credit_id} style={styles.section}>
          <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
            <Text style={styles.h3}>{s.name}</Text>
            <Text style={styles.amount}>
              ${s.estimated_low.toLocaleString()}–${s.estimated_high.toLocaleString()}
            </Text>
          </View>
          <Text style={{ marginTop: 4, lineHeight: 1.4 }}>{s.why_you_qualify}</Text>
          {s.action_steps.map((step, i) => (
            <Text key={i} style={styles.bullet}>• {step}</Text>
          ))}
          <Text style={styles.meta}>
            Form: {s.form} · Deadline: {s.deadline} ·{" "}
            <Link src={s.source_url}>source</Link>
          </Text>
        </View>
      ))}
    </View>
  );
}

function Plan({ title, items }: { title: string; items: string[] }) {
  return (
    <View style={{ marginVertical: 6 }}>
      <Text style={styles.h3}>{title}</Text>
      {items.map((i, idx) => (
        <Text key={idx} style={styles.bullet}>• {i}</Text>
      ))}
    </View>
  );
}
