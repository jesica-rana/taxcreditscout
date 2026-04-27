// Flexible API client for the Vite frontend.
//
// `POST /api/intake` returns the full Report inline; older deploys may return
// only summary totals (we fall back to a synthesized view in that case).
// `GET /api/session/:id` rehydrates a stored session so a results URL works
// after page refresh or from an emailed link.
//
// This client adapts to whatever the backend returns:
//   1. If response includes `report` → use directly
//   2. Else if response has session_id + totals → keep real totals,
//      synthesize report sections locally from activities
//   3. Else (backend down/error) → full local fallback so UI keeps working

export async function getSessionData(id) {
  if (!id) return null
  try {
    const res = await fetch(`/api/session/${id}`)
    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}

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

// Local credit knowledge — used when backend doesn't hand us a full report.
// Each entry carries the enriched fields surfaced in the report (qualification
// confidence, eligibility, pitfalls, cashflow, stacking, source authority,
// typical industry finding). Keep in sync with `lib/types.ts::ReportSection`.
const CREDIT_LIBRARY = [
  {
    activity: 'built_software', credit_id: 'rd-credit', jurisdiction: 'Federal',
    name: 'Research and Development Credit', irc_section: '41',
    estimated_low: 8500, estimated_high: 42000,
    why_you_qualify: 'You reported software, product, process, or technical improvement work — qualifying R&D activity under §41.',
    how_it_works: 'Section 41 lets you claim 6–14% of qualified research expenses (wages, supplies, contractor costs) as a credit. Startups can apply up to $500K against payroll taxes.',
    action_steps: ['Identify qualified research projects', 'Collect payroll and contractor costs', 'Document uncertainty and experimentation'],
    form: 'Form 6765', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-6765',
    documentation: ['Project documentation', 'Time tracking', 'Expense receipts'],
    what_to_verify: ['Confirm activities meet the §41 four-part test (technological, uncertainty, experimentation, business component)', 'Confirm wage allocation between R&D and non-R&D work'],
    qualification_status: 'likely', qualification_confidence: 0.82,
    how_we_estimated: 'Estimated at ~14% of qualified R&D wages, applied to a typical engineering team at this size.',
    eligibility_criteria: ['Must perform technical work resolving uncertainty', 'Must document the experimentation process', 'No revenue cap; payroll-tax offset capped at 5 years and $500K/yr', 'Available to all states (federal credit)'],
    common_pitfalls: ['Don\'t double-count the same wages under both §41 and WOTC', 'Section 174 capitalization (TCJA) does NOT exempt you from §41 documentation rules', 'Contractor R&D is limited to 65% of cost'],
    cashflow_treatment: 'Nonrefundable for income tax · 1-year back, 20-year forward · Refundable up to $500K/yr against payroll for QSBs',
    stacks_with: ['work-opportunity', 'wotc-vet', 'small-employer-health'],
    source_authority: 'IRC §41 · IRS Form 6765 instructions',
    typical_industry_finding: 'Median small software shop claims $18,000–$32,000.',
  },
  {
    activity: 'hired_recently', credit_id: 'work-opportunity', jurisdiction: 'Federal',
    name: 'Work Opportunity Tax Credit (WOTC)', irc_section: '51',
    estimated_low: 2400, estimated_high: 9600,
    why_you_qualify: 'Recent hiring may include eligible worker categories — veterans, SNAP recipients, ex-felons, long-term unemployed.',
    how_it_works: 'WOTC provides $2,400–$9,600 per qualifying hire from one of 10 targeted groups. Credit is calculated as a percentage of first-year wages (40% above 400 hours).',
    action_steps: ['Review new-hire eligibility against targeted groups', 'Submit Form 8850 within 28 days of hire', 'Confirm certification from state workforce agency'],
    form: 'Form 5884', deadline: 'Form 8850 within 28 days of hire', deadline_critical: true,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-5884',
    documentation: ['Form 8850', 'ETA Form 9061 or 9062'],
    what_to_verify: ['Form 8850 must be signed by the employee BEFORE the job offer date', 'State workforce agency must certify within 28 days'],
    qualification_status: 'likely', qualification_confidence: 0.78,
    how_we_estimated: 'Estimated at $2,400–$9,600 per qualifying hire across plausible new-hire counts at this business size.',
    eligibility_criteria: ['Hires must come from one of 10 targeted groups (veterans, SNAP, TANF, ex-felons, etc.)', 'Form 8850 must be filed within 28 days of hire start', 'No employer size restriction', 'Available to all states (federal credit)'],
    common_pitfalls: ['Form 8850 must be SIGNED before or on the offer date — not after', 'Re-hires don\'t qualify even if the original hire did', 'Credit only applies to first-year wages'],
    cashflow_treatment: 'Nonrefundable · 1-year back, 20-year forward',
    stacks_with: ['rd-credit', 'small-employer-health', 'paid-family-leave'],
    source_authority: 'IRC §51 · IRS Form 5884 instructions · DOL ETA Form 9061',
    typical_industry_finding: 'Median small employer claims $4,800 across 1–2 hires/year.',
  },
  {
    activity: 'hired_disadvantaged', credit_id: 'wotc-vet', jurisdiction: 'Federal',
    name: 'WOTC — Qualified Veteran Hires', irc_section: '51',
    estimated_low: 4800, estimated_high: 9600,
    why_you_qualify: 'Hiring veterans, particularly disabled or long-term unemployed veterans, qualifies for the highest WOTC tier.',
    how_it_works: 'Veteran-tier WOTC pays up to $9,600 per disabled or long-term-unemployed veteran. Standard veterans qualify for $2,400–$5,600.',
    action_steps: ['Verify veteran status with DD-214', 'Check service-disability or unemployment status', 'File Form 8850 within 28 days'],
    form: 'Form 5884', deadline: 'Form 8850 within 28 days of hire', deadline_critical: true,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-5884',
    documentation: ['DD-214', 'VA disability rating'],
    what_to_verify: ['Confirm DD-214 character of discharge', 'Confirm unemployment-period dates with state workforce agency'],
    qualification_status: 'likely', qualification_confidence: 0.74,
    how_we_estimated: 'Estimated at $4,800–$9,600 per veteran hire (mid to top tier).',
    eligibility_criteria: ['Veteran with service-connected disability OR 4+ weeks unemployment', 'Form 8850 within 28 days of hire', 'Hired from a qualifying veteran subgroup', 'No employer size restriction'],
    common_pitfalls: ['Self-attestation alone isn\'t enough — DD-214 + VA letter required', 'Tier depends on disability rating AND unemployment duration combined'],
    cashflow_treatment: 'Nonrefundable · 1-year back, 20-year forward',
    stacks_with: ['work-opportunity', 'rd-credit', 'paid-family-leave'],
    source_authority: 'IRC §51(d)(3) · DOL ETA Form 9062',
    typical_industry_finding: 'Median credit per qualified veteran hire: $7,200.',
  },
  {
    activity: 'renewable_energy', credit_id: 'commercial-energy', jurisdiction: 'Federal',
    name: 'Investment Tax Credit (Solar / Energy)', irc_section: '48',
    estimated_low: 5000, estimated_high: 36000,
    why_you_qualify: 'Solar, EV charging, HVAC, or energy efficiency projects qualify for the Investment Tax Credit and bonus depreciation.',
    how_it_works: 'The §48 ITC is 30% of eligible energy property cost (40–50% with prevailing-wage and domestic-content adders). 100% bonus depreciation may also apply.',
    action_steps: ['Pull invoices and system specs', 'Confirm placed-in-service dates', 'Review prevailing wage and apprenticeship requirements'],
    form: 'Form 3468', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-3468',
    documentation: ['System invoices', 'Commissioning report'],
    what_to_verify: ['Confirm placed-in-service date is in the tax year claimed', 'Confirm prevailing-wage/apprenticeship rules met for projects ≥1MW'],
    qualification_status: 'likely', qualification_confidence: 0.85,
    how_we_estimated: 'Estimated at 30% of typical commercial solar/HVAC project cost ($16K–$120K install).',
    eligibility_criteria: ['Property placed in service during tax year', 'Located in the United States', 'Original-use requirement (not used)', '≥1MW projects must meet prevailing-wage + apprenticeship rules'],
    common_pitfalls: ['Bonus depreciation reduces the basis used to compute ITC', 'Recapture if property is sold within 5 years', 'Prevailing-wage rules apply project-wide, not just employees you hired'],
    cashflow_treatment: 'Nonrefundable · 3-year back, 22-year forward · Transferable for cash under IRA §6418',
    stacks_with: ['section-179'],
    source_authority: 'IRC §48 · IRS Form 3468 instructions · IRA 2022',
    typical_industry_finding: 'Median commercial install claims $14,500 in ITC.',
  },
  {
    activity: 'bought_equipment', credit_id: 'section-179', jurisdiction: 'Federal',
    name: 'Section 179 Expensing + Bonus Depreciation', irc_section: '179',
    estimated_low: 4000, estimated_high: 28000,
    why_you_qualify: 'Equipment, machinery, or vehicle purchases over $5K qualify for accelerated deduction under §179.',
    how_it_works: 'Section 179 lets you deduct the full cost of qualifying equipment in the year placed in service (up to $1.16M in 2024). Bonus depreciation (60% in 2024) covers the remainder.',
    action_steps: ['Classify assets', 'Confirm in-service dates', 'Apply §179 election on Form 4562'],
    form: 'Form 4562', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-4562',
    documentation: ['Asset purchase records', 'In-service dates'],
    what_to_verify: ['Confirm assets are tangible business property used >50% for business', 'Confirm in-service date is in the tax year claimed'],
    qualification_status: 'likely', qualification_confidence: 0.88,
    how_we_estimated: 'Estimated as the tax-saved value of immediate expensing on $20K–$140K of qualifying equipment at typical effective rates.',
    eligibility_criteria: ['Tangible personal property used >50% for business', 'Placed in service during the tax year', '$3.05M total purchase phaseout (2024)', 'Cannot exceed taxable business income'],
    common_pitfalls: ['SUVs are capped at ~$30K under §179 — not the full vehicle', 'Real-property improvements (roof, HVAC) qualify only as §179 not as bonus dep.', 'Listed property has stricter business-use rules'],
    cashflow_treatment: 'Deduction (not credit) · Recaptures if business use drops below 50%',
    stacks_with: ['commercial-energy'],
    source_authority: 'IRC §179 · IRS Pub 946',
    typical_industry_finding: 'Median small business expenses $42,000 under §179 annually.',
  },
  {
    activity: 'employee_health', credit_id: 'small-employer-health', jurisdiction: 'Federal',
    name: 'Small Employer Health Care Credit', irc_section: '45R',
    estimated_low: 1200, estimated_high: 8400,
    why_you_qualify: 'Employer-paid health insurance for fewer than 25 FTE employees qualifies for credit up to 50% of premiums.',
    how_it_works: 'The §45R credit covers up to 50% of employer-paid premiums (35% for tax-exempts) for businesses with <25 FTE and average wages under $62K. Must purchase via SHOP marketplace.',
    action_steps: ['Verify FTE count under 25', 'Confirm avg wages under $58K', 'File Form 8941'],
    form: 'Form 8941', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-8941',
    documentation: ['Health insurance premiums paid', 'FTE worksheet'],
    what_to_verify: ['Confirm coverage is purchased via SHOP marketplace', 'Confirm employer pays ≥50% of premiums uniformly across employees'],
    qualification_status: 'likely', qualification_confidence: 0.7,
    how_we_estimated: 'Estimated at 35–50% of typical small-employer health premium contribution.',
    eligibility_criteria: ['Fewer than 25 FTE employees', 'Average wage under ~$62K (2024)', 'Employer pays ≥50% of premiums uniformly', 'Coverage purchased via SHOP marketplace'],
    common_pitfalls: ['Owners and family don\'t count as eligible employees', 'Claimable only for 2 consecutive years', 'Phases out as FTE approaches 25 / wages approach $62K'],
    cashflow_treatment: 'Nonrefundable for for-profits · Refundable for tax-exempt employers',
    stacks_with: ['rd-credit', 'work-opportunity', 'paid-family-leave'],
    source_authority: 'IRC §45R · IRS Form 8941 instructions',
    typical_industry_finding: 'Median qualifying employer claims $3,400.',
  },
  {
    activity: 'paid_leave', credit_id: 'paid-family-leave', jurisdiction: 'Federal',
    name: 'Employer Credit for Paid Family Leave (§45S)', irc_section: '45S',
    estimated_low: 800, estimated_high: 6000,
    why_you_qualify: 'Employer-paid family or medical leave qualifies for 12.5%–25% credit on wages paid during leave.',
    how_it_works: '§45S provides 12.5%–25% credit on wages paid during family/medical leave. Rate scales with the % of normal wages the employer pays during leave.',
    action_steps: ['Document written paid-leave policy', 'Track wages paid during leave', 'File Form 8994'],
    form: 'Form 8994', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-8994',
    documentation: ['Written PFML policy', 'Wage records during leave'],
    what_to_verify: ['Confirm written policy was in effect BEFORE the leave was taken', 'Confirm leave is for FMLA-qualifying reasons'],
    qualification_status: 'likely', qualification_confidence: 0.68,
    how_we_estimated: 'Estimated at 12.5–25% of wages paid to employees on FMLA-qualifying leave.',
    eligibility_criteria: ['Written family/medical leave policy in place', 'Pays ≥50% of normal wages during leave', 'Leave is FMLA-qualifying (birth/adoption, serious illness, military caregiver)', 'Available to all states (federal credit)'],
    common_pitfalls: ['Vacation/sick leave doesn\'t count — must be specifically FMLA-qualifying', 'Policy must be written before leave is taken — retroactive policies don\'t count', 'State-mandated paid-leave wages don\'t qualify for §45S'],
    cashflow_treatment: 'Nonrefundable · 1-year back, 20-year forward',
    stacks_with: ['work-opportunity', 'wotc-vet', 'small-employer-health'],
    source_authority: 'IRC §45S · IRS Form 8994 instructions',
    typical_industry_finding: 'Median employer claims $2,100 across 1–3 leave events/year.',
  },
  {
    activity: 'started_retirement', credit_id: 'retirement-startup', jurisdiction: 'Federal',
    name: 'Retirement Plan Startup Credit', irc_section: '45E',
    estimated_low: 500, estimated_high: 5000,
    why_you_qualify: 'Starting a 401(k), SEP, or SIMPLE plan qualifies for credit up to $5K/year for first 3 years.',
    how_it_works: '§45E covers 100% of plan-startup costs for employers with ≤50 employees (50% for 51–100), capped at $5K/year for 3 years. SECURE 2.0 added an auto-enrollment bonus credit.',
    action_steps: ['Document plan startup costs', 'Confirm fewer than 100 employees', 'File Form 8881'],
    form: 'Form 8881', deadline: 'File with annual return', deadline_critical: false,
    source_url: 'https://www.irs.gov/forms-pubs/about-form-8881',
    documentation: ['Plan documents', 'Setup invoices'],
    what_to_verify: ['Confirm plan covers at least one non-highly-compensated employee', 'Confirm prior-3-year no-plan rule was met'],
    qualification_status: 'likely', qualification_confidence: 0.83,
    how_we_estimated: 'Estimated at 100% of plan-startup costs ($500–$5,000 typical) for the first 3 plan years.',
    eligibility_criteria: ['≤100 employees with $5K+ comp', 'No qualified plan in prior 3 years', 'Plan must cover ≥1 NHCE', 'Available to all states (federal credit)'],
    common_pitfalls: ['Credit applies to setup costs, not employer matches (different SECURE 2.0 credit handles matches)', 'Successor plans don\'t qualify under the prior-3-year rule', 'Sole-prop solo-401(k)s don\'t qualify (no NHCE)'],
    cashflow_treatment: 'Nonrefundable · 1-year back, 20-year forward',
    stacks_with: ['rd-credit', 'small-employer-health', 'work-opportunity'],
    source_authority: 'IRC §45E · IRS Form 8881 instructions · SECURE 2.0',
    typical_industry_finding: 'Median first-year startup credit: $2,800.',
  },
  {
    activity: 'in_oz', credit_id: 'opportunity-zone', jurisdiction: 'State',
    name: 'Opportunity Zone & Enterprise Zone Incentives', irc_section: null,
    estimated_low: 2500, estimated_high: 18000,
    why_you_qualify: 'Located in a designated opportunity or enterprise zone — local hiring, investment, and property credits may apply.',
    how_it_works: 'Federal Opportunity Zones defer/reduce capital gains via QOF investment. State enterprise-zone programs add credits for local hiring (~$3K/employee), investment (~5–10%), and property tax abatements.',
    action_steps: ['Confirm address against zone maps', 'Review state DOR program', 'Prepare location documentation'],
    form: 'Varies by state', deadline: 'Varies by jurisdiction', deadline_critical: false,
    source_url: 'https://www.irs.gov/credits-deductions/businesses/opportunity-zones',
    documentation: ['Address verification', 'Zone designation letter'],
    what_to_verify: ['Confirm exact OZ/EZ designation via state DOR', 'Confirm hiring/investment thresholds met for state credit'],
    qualification_status: 'likely', qualification_confidence: 0.62,
    how_we_estimated: 'Estimated as a blend of state hiring credits (~$3K/employee) and property/investment incentives typical of EZ programs.',
    eligibility_criteria: ['Business operates inside a designated zone (federal OZ or state EZ)', 'Some programs require minimum local-hire %', 'Some require property investment threshold', 'State-specific filing — varies by jurisdiction'],
    common_pitfalls: ['Federal OZ is a deferral/reduction tool, not a credit — different from state EZ credits', 'Many states require pre-certification BEFORE the qualifying activity', 'Address must match the zone tract — not just the city'],
    cashflow_treatment: 'Varies by state · Federal OZ defers capital gains until 2026',
    stacks_with: [],
    source_authority: 'IRC §1400Z-2 (federal OZ) · State DOR program rules',
    typical_industry_finding: 'Median EZ-state employer claims $6,400 across hiring + property incentives.',
  },
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

  // Resolve stacking IDs into the credit names that ARE in this report
  const idToName = new Map(items.map((c) => [c.credit_id, c.name]))
  const sections = items.map((c) => ({
    credit_id: c.credit_id,
    name: c.name,
    jurisdiction: c.jurisdiction,
    irc_section: c.irc_section ?? null,
    estimated_low: c.estimated_low,
    estimated_high: c.estimated_high,
    why_you_qualify: c.why_you_qualify,
    how_it_works: c.how_it_works ?? '',
    action_steps: c.action_steps,
    form: c.form,
    deadline: c.deadline,
    deadline_critical: c.deadline_critical,
    documentation: c.documentation,
    source_url: c.source_url,
    what_to_verify: c.what_to_verify ?? [],
    qualification_status: c.qualification_status ?? 'likely',
    qualification_confidence: c.qualification_confidence ?? 0.7,
    how_we_estimated: c.how_we_estimated ?? '',
    eligibility_criteria: c.eligibility_criteria ?? [],
    common_pitfalls: c.common_pitfalls ?? [],
    cashflow_treatment: c.cashflow_treatment ?? '',
    stacks_with: (c.stacks_with ?? [])
      .map((id) => idToName.get(id))
      .filter((n) => Boolean(n) && n !== c.name),
    source_authority: c.source_authority ?? '',
    typical_industry_finding: c.typical_industry_finding ?? '',
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
