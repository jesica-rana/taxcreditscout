// Flexible API client for the Vite frontend.
//
// Backend (Next.js taxcreditscout) `POST /api/intake` returns:
//   { session_id, total_low, total_high, credits_found, timing_ms }
// — but NOT the full Report JSON (the report is rendered server-side on /results & /report).
//
// This client adapts to whatever the backend returns:
//   1. If response includes `report` → use directly (future-proof)
//   2. Else if response has session_id + totals → keep real totals,
//      synthesize report sections locally from activities
//   3. Else (backend down/error) → full local fallback so UI keeps working

const ACTIVITY_LEGACY_MAP = {
  hiredRecently: 'hired_recently',
  specialHires: 'hired_disadvantaged',
  rdWork: 'built_software',
  energyUpgrades: 'renewable_energy',
  equipmentInvestment: 'bought_equipment',
}

function toRawIntake(answers) {
  const activities = Array.isArray(answers.activities)
    ? answers.activities.map((a) => ACTIVITY_LEGACY_MAP[a] ?? a)
    : []

  return {
    business_description: answers.businessDescription || '',
    state: answers.state || '',
    city: answers.city || null,
    employee_count: Number(answers.employeeCount) || 0,
    revenue_band: answers.revenueBand || '500k_2m',
    activities,
    free_text: answers.freeText || null,
    email: answers.email || null,
  }
}

// Local credit knowledge — used when backend doesn't hand us a full report
const CREDIT_LIBRARY = [
  { activity: 'built_software', credit_id: 'rd-credit', jurisdiction: 'Federal', name: 'Research and Development Credit', estimated_low: 8500, estimated_high: 42000, why_you_qualify: 'You reported software, product, process, or technical improvement work — qualifying R&D activity under §41.', action_steps: ['Identify qualified research projects', 'Collect payroll and contractor costs', 'Document uncertainty and experimentation'], form: 'Form 6765', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-6765', documentation: ['Project documentation', 'Time tracking', 'Expense receipts'] },
  { activity: 'hired_recently', credit_id: 'work-opportunity', jurisdiction: 'Federal', name: 'Work Opportunity Tax Credit (WOTC)', estimated_low: 2400, estimated_high: 9600, why_you_qualify: 'Recent hiring may include eligible worker categories — veterans, SNAP recipients, ex-felons, long-term unemployed.', action_steps: ['Review new-hire eligibility against targeted groups', 'Submit Form 8850 within 28 days of hire', 'Confirm certification from state workforce agency'], form: 'Form 5884', deadline: 'Form 8850 within 28 days of hire', deadline_critical: true, source_url: 'https://www.irs.gov/forms-pubs/about-form-5884', documentation: ['Form 8850', 'ETA Form 9061 or 9062'] },
  { activity: 'hired_disadvantaged', credit_id: 'wotc-vet', jurisdiction: 'Federal', name: 'WOTC — Qualified Veteran Hires', estimated_low: 4800, estimated_high: 9600, why_you_qualify: 'Hiring veterans, particularly disabled or long-term unemployed veterans, qualifies for the highest WOTC tier.', action_steps: ['Verify veteran status with DD-214', 'Check service-disability or unemployment status', 'File Form 8850 within 28 days'], form: 'Form 5884', deadline: 'Form 8850 within 28 days of hire', deadline_critical: true, source_url: 'https://www.irs.gov/forms-pubs/about-form-5884', documentation: ['DD-214', 'VA disability rating'] },
  { activity: 'renewable_energy', credit_id: 'commercial-energy', jurisdiction: 'Federal', name: 'Investment Tax Credit (Solar / Energy)', estimated_low: 5000, estimated_high: 36000, why_you_qualify: 'Solar, EV charging, HVAC, or energy efficiency projects qualify for the Investment Tax Credit and bonus depreciation.', action_steps: ['Pull invoices and system specs', 'Confirm placed-in-service dates', 'Review prevailing wage and apprenticeship requirements'], form: 'Form 3468', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-3468', documentation: ['System invoices', 'Commissioning report'] },
  { activity: 'bought_equipment', credit_id: 'section-179', jurisdiction: 'Federal', name: 'Section 179 Expensing + Bonus Depreciation', estimated_low: 4000, estimated_high: 28000, why_you_qualify: 'Equipment, machinery, or vehicle purchases over $5K qualify for accelerated deduction under §179.', action_steps: ['Classify assets', 'Confirm in-service dates', 'Apply §179 election on Form 4562'], form: 'Form 4562', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-4562', documentation: ['Asset purchase records', 'In-service dates'] },
  { activity: 'employee_health', credit_id: 'small-employer-health', jurisdiction: 'Federal', name: 'Small Employer Health Care Credit', estimated_low: 1200, estimated_high: 8400, why_you_qualify: 'Employer-paid health insurance for fewer than 25 FTE employees qualifies for credit up to 50% of premiums.', action_steps: ['Verify FTE count under 25', 'Confirm avg wages under $58K', 'File Form 8941'], form: 'Form 8941', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-8941', documentation: ['Health insurance premiums paid', 'FTE worksheet'] },
  { activity: 'paid_leave', credit_id: 'paid-family-leave', jurisdiction: 'Federal', name: 'Employer Credit for Paid Family Leave (§45S)', estimated_low: 800, estimated_high: 6000, why_you_qualify: 'Employer-paid family or medical leave qualifies for 12.5%–25% credit on wages paid during leave.', action_steps: ['Document written paid-leave policy', 'Track wages paid during leave', 'File Form 8994'], form: 'Form 8994', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-8994', documentation: ['Written PFML policy', 'Wage records during leave'] },
  { activity: 'started_retirement', credit_id: 'retirement-startup', jurisdiction: 'Federal', name: 'Retirement Plan Startup Credit', estimated_low: 500, estimated_high: 5000, why_you_qualify: 'Starting a 401(k), SEP, or SIMPLE plan qualifies for credit up to $5K/year for first 3 years.', action_steps: ['Document plan startup costs', 'Confirm fewer than 100 employees', 'File Form 8881'], form: 'Form 8881', deadline: 'File with annual return', deadline_critical: false, source_url: 'https://www.irs.gov/forms-pubs/about-form-8881', documentation: ['Plan documents', 'Setup invoices'] },
  { activity: 'in_oz', credit_id: 'opportunity-zone', jurisdiction: 'State', name: 'Opportunity Zone & Enterprise Zone Incentives', estimated_low: 2500, estimated_high: 18000, why_you_qualify: 'Located in a designated opportunity or enterprise zone — local hiring, investment, and property credits may apply.', action_steps: ['Confirm address against zone maps', 'Review state DOR program', 'Prepare location documentation'], form: 'Varies by state', deadline: 'Varies by jurisdiction', deadline_critical: false, source_url: 'https://www.irs.gov/credits-deductions/businesses/opportunity-zones', documentation: ['Address verification', 'Zone designation letter'] },
]

const DEFAULT_DISCLAIMER =
  'Informational research, not tax advice. All findings should be verified with a qualified CPA before filing.'

function buildSyntheticReport({ answers, sessionId, totalsFromBackend }) {
  const acts = Array.isArray(answers.activities)
    ? answers.activities.map((a) => ACTIVITY_LEGACY_MAP[a] ?? a)
    : []
  const matched = CREDIT_LIBRARY.filter((c) => acts.includes(c.activity))
  const items = matched.length > 0 ? matched : CREDIT_LIBRARY.slice(0, 3)

  const sumLow = items.reduce((s, x) => s + x.estimated_low, 0)
  const sumHigh = items.reduce((s, x) => s + x.estimated_high, 0)
  const totalLow = totalsFromBackend?.total_low ?? sumLow
  const totalHigh = totalsFromBackend?.total_high ?? sumHigh

  const sections = items.map((c) => ({
    credit_id: c.credit_id,
    name: c.name,
    jurisdiction: c.jurisdiction,
    estimated_low: c.estimated_low,
    estimated_high: c.estimated_high,
    why_you_qualify: c.why_you_qualify,
    action_steps: c.action_steps,
    form: c.form,
    deadline: c.deadline,
    deadline_critical: c.deadline_critical,
    documentation: c.documentation,
    source_url: c.source_url,
  }))

  return {
    session_id: sessionId ?? `local-${Date.now().toString(36)}`,
    generated_at: new Date().toISOString(),
    business_summary:
      answers.businessDescription ||
      `Business in ${answers.state || 'your state'} with ${answers.employeeCount || 0} employees.`,
    total_estimated_low: totalLow,
    total_estimated_high: totalHigh,
    critical_deadlines: sections.filter((s) => s.deadline_critical),
    federal: sections.filter((s) => s.jurisdiction === 'Federal'),
    state: sections.filter((s) => s.jurisdiction === 'State'),
    local: sections.filter((s) => s.jurisdiction === 'City' || s.jurisdiction === 'Private'),
    action_plan_this_week: [
      'Pull payroll and contractor reports for the last 12 months',
      'List equipment and software purchases over $5K',
      'Forward this report to your CPA',
    ],
    action_plan_this_month: [
      'Gather supporting documentation listed under each credit',
      'Verify Form 8850 was filed within 28 days for any new hires',
      'Confirm in-service dates for energy and equipment purchases',
    ],
    action_plan_this_quarter: [
      'File credits with your annual return',
      'Set up a tracking sheet for ongoing qualifying activities',
      'Re-run intake before next filing season',
    ],
    cpa_handoff_summary: `Please review this audit. We identified ${items.length} potential credits totaling an estimated $${totalLow.toLocaleString()}–$${totalHigh.toLocaleString()} for ${answers.businessDescription || 'this business'} (${answers.state || '—'}, ${answers.employeeCount || 0} employees). Forms involved: ${[...new Set(items.map((i) => i.form))].join(', ')}. Let us know what supporting documentation you need.`,
    disclaimer: DEFAULT_DISCLAIMER,
  }
}

/**
 * Submit redacted PDF pages to the agent pipeline.
 *
 * Backend (Jesica's pivot 3ef68f0) accepts `source: "pdf"` with redacted page
 * text + image data URLs. The Vision API extracts a RawIntake from the redacted
 * doc, then the same 4-stage pipeline runs.
 *
 * `pages` shape: [{ redactedText, redactedImageDataUrl }]
 * `hint` shape: { state?, city? } | null
 */
export async function runIntakeFromPdf({ pages, hint = null }) {
  const payload = {
    source: 'pdf',
    hint,
    pages: pages.map((p) => ({
      redactedText: p.redactedText,
      redactedImageDataUrl: p.redactedImageDataUrl,
    })),
  }

  let backendData = null
  try {
    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) backendData = await res.json()
  } catch {
    // network error — fall through to offline preview
  }

  if (backendData?.report?.federal) {
    return {
      mode: 'live',
      session_id: backendData.session_id,
      report: backendData.report,
      profile: backendData.profile ?? null,
      timing_ms: backendData.timing_ms ?? null,
    }
  }

  if (backendData?.session_id && typeof backendData.total_low === 'number') {
    // Backend ran the Vision-extracted RawIntake but didn't return the report.
    // Synthesize sections — we don't know the user's activities, so use a generic set.
    const synthesizedAnswers = {
      businessDescription: 'Business identified from your tax return',
      state: hint?.state ?? '',
      city: hint?.city ?? null,
      employeeCount: 0,
      activities: [
        'hired_recently',
        'built_software',
        'bought_equipment',
        'employee_health',
      ],
    }
    const report = buildSyntheticReport({
      answers: synthesizedAnswers,
      sessionId: backendData.session_id,
      totalsFromBackend: {
        total_low: backendData.total_low,
        total_high: backendData.total_high,
      },
    })
    return {
      mode: 'hybrid',
      session_id: backendData.session_id,
      report,
      profile: null,
      timing_ms: backendData.timing_ms ?? null,
    }
  }

  // Offline: synthesize from a generous activity set since we have no quiz data
  const offlineAnswers = {
    businessDescription: 'Business identified from your tax return',
    state: hint?.state ?? '',
    city: hint?.city ?? null,
    employeeCount: 0,
    activities: [
      'hired_recently',
      'built_software',
      'bought_equipment',
      'renewable_energy',
      'employee_health',
    ],
  }
  const report = buildSyntheticReport({ answers: offlineAnswers })
  return {
    mode: 'local',
    session_id: report.session_id,
    report,
    profile: null,
    timing_ms: null,
  }
}

export async function runIntake(answers) {
  const payload = { source: 'form', ...toRawIntake(answers) }

  // 1. Try the backend (proxied via Vite dev server to localhost:3000)
  let backendData = null
  try {
    const res = await fetch('/api/intake', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (res.ok) backendData = await res.json()
  } catch {
    // network error — fall through to local
  }

  // Mode A: backend returned a full report inline (future-proof shape)
  if (backendData?.report?.federal) {
    return {
      mode: 'live',
      session_id: backendData.session_id,
      report: backendData.report,
      profile: backendData.profile ?? null,
      timing_ms: backendData.timing_ms ?? null,
    }
  }

  // Mode B: backend returned partial summary — keep real totals, synth sections
  if (backendData?.session_id && typeof backendData.total_low === 'number') {
    const report = buildSyntheticReport({
      answers,
      sessionId: backendData.session_id,
      totalsFromBackend: {
        total_low: backendData.total_low,
        total_high: backendData.total_high,
      },
    })
    return {
      mode: 'hybrid',
      session_id: backendData.session_id,
      report,
      profile: null,
      timing_ms: backendData.timing_ms ?? null,
    }
  }

  // Mode C: backend unavailable — full local fallback
  const report = buildSyntheticReport({ answers })
  return {
    mode: 'local',
    session_id: report.session_id,
    report,
    profile: null,
    timing_ms: null,
  }
}
