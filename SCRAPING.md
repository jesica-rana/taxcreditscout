# Scraping & Data Acquisition

**Goal:** 300 high-value tax credits in Qdrant by hour 4. Comprehensiveness is a trap. Quality > coverage.

---

## Strategy

We use OpenAI structured extraction (not regex/HTML parsing). The flow:

1. `scripts/sources.ts` — list of source URLs grouped by jurisdiction
2. Fetch the URL's text content (use `@mozilla/readability` for clean extraction)
3. Pass the text + a JSON schema to GPT-5 with `response_format: {type: "json_schema"}`
4. Get back a structured `Credit[]` array
5. Append to `data/credits.json`
6. After all sources scraped, `scripts/embed-credits.ts` reads the JSON, embeds, and uploads to Qdrant

This is forgiving to messy source HTML and ~10× faster to build than per-site scrapers.

---

## Source list (in priority order)

### Tier 1 — Federal (must-have, 30 credits, hour 1–2)

These are the credits on **IRS Form 3800** (General Business Credit). Form 3800 is a literal list of every federal business tax credit. Scrape it once, get 30+ credits.

- https://www.irs.gov/forms-pubs/about-form-3800 — the master list
- https://www.irs.gov/forms-pubs/about-form-5884 — WOTC
- https://www.irs.gov/forms-pubs/about-form-5884-a — Disaster Employee Retention
- https://www.irs.gov/forms-pubs/about-form-6765 — R&D Credit
- https://www.irs.gov/forms-pubs/about-form-8826 — Disabled Access
- https://www.irs.gov/forms-pubs/about-form-8845 — Indian Employment
- https://www.irs.gov/forms-pubs/about-form-8847 — Empowerment Zone
- https://www.irs.gov/forms-pubs/about-form-8874 — New Markets
- https://www.irs.gov/forms-pubs/about-form-8881 — Pension Plan Startup
- https://www.irs.gov/forms-pubs/about-form-8882 — Employer-Provided Childcare
- https://www.irs.gov/forms-pubs/about-form-8911 — Alternative Fuel Vehicle Refueling Property
- https://www.irs.gov/forms-pubs/about-form-8912 — Qualified Tax Credit Bonds
- https://www.irs.gov/forms-pubs/about-form-8932 — Differential Wage Payments
- https://www.irs.gov/forms-pubs/about-form-8941 — Small Employer Health Insurance
- https://www.irs.gov/forms-pubs/about-form-8994 — Paid Family/Medical Leave
- https://www.irs.gov/forms-pubs/about-form-3468 — Investment Credit (energy etc.)
- https://www.irs.gov/forms-pubs/about-form-8835 — Renewable Electricity Production
- https://www.irs.gov/forms-pubs/about-form-8910 — Alternative Motor Vehicle
- https://www.irs.gov/credits-deductions/businesses — overview hub
- https://www.irs.gov/credits-deductions/individuals/earned-income-tax-credit — for solopreneurs

### Tier 2 — State (top 10 states, 100 credits, hour 2–3)

Top 10 states by SMB count cover ~60% of US small businesses. Get 10 credits per state minimum.

| State | Source URL |
|-------|-----------|
| California | https://www.ftb.ca.gov/file/business/credits/index.html — Pub 1006 lists every CA business credit |
| Texas | https://comptroller.texas.gov/taxes/franchise/credits.php — TX has limited credits but R&D Credit is big |
| Florida | https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx |
| New York | https://www.tax.ny.gov/pit/credits/business_credits.htm |
| Pennsylvania | https://www.revenue.pa.gov/TaxCreditsIncentives/Pages/default.aspx |
| Illinois | https://www2.illinois.gov/rev/research/taxinformation/business/Pages/IncomeTaxCredits.aspx |
| Ohio | https://development.ohio.gov/business/state-incentives |
| Georgia | https://dor.georgia.gov/credits |
| North Carolina | https://www.ncdor.gov/taxes-forms/corporate-income-franchise-tax/franchise-tax-information/article-3-tax-credits |
| New Jersey | https://www.nj.gov/treasury/taxation/businesses/credits.shtml |

Also: **TaxFoundation.org** maintains a clean cross-state credit comparison: https://taxfoundation.org/state-tax-credits/

### Tier 3 — Local / city (50 credits, hour 3)

- **Opportunity Zones** — IRS publishes one CSV with all 8,764 census tracts: https://www.irs.gov/credits-deductions/opportunity-zones — load this as ONE Qdrant entry with city/state filters, not 8,764 entries.
- NYC ICAP (Industrial & Commercial Abatement Program) — https://www.nyc.gov/site/finance/business/business-icap.page
- LA Enterprise Zone — https://ewddlacity.com/business/business-incentives
- Chicago TIF — https://www.chicago.gov/city/en/depts/dcd/supp_info/tif_-_tax_increment_financing.html
- Detroit Renaissance Zone — https://www.michiganbusiness.org/services/research-tax-credit/
- Top 20 cities by SMB density — collect their economic-development page

### Tier 4 — Federal grants masquerading as credits (50 entries, hour 3–4)

- **Grants.gov** — https://www.grants.gov/web/grants/search-grants.html — filter for SMB-eligible
- **SBA loan programs** — these aren't credits but qualify as financial benefits we surface
- **USDA Rural Business Development Grants** — https://www.rd.usda.gov/programs-services/business-programs

Skip private foundation grants for v1 (Candid Foundation Directory is paywalled).

---

## Extraction prompt

The exact GPT-5 prompt is in `lib/prompts/credit-extractor.ts`. The schema:

```ts
{
  credits: [
    {
      name: string,
      jurisdiction: "Federal" | "State" | "City" | "Private",
      state: string | null,
      city: string | null,
      credit_amount_min: number,
      credit_amount_max: number,
      credit_type: "per_employee" | "percent_of_expense" | "flat" | "percent_of_revenue",
      industries: string[],
      company_size_min_employees: number,
      company_size_max_employees: number | null,
      revenue_min: number | null,
      revenue_max: number | null,
      form: string,
      filing_deadline: string,
      deadline_critical: boolean,
      deadline_date: string | null,
      eligibility_text: string,        // the 200-500 word IRS-style description
      documentation_required: string[],
      url: string,
      estimated_avg_finding: number    // your best guess based on the description
    }
  ]
}
```

---

## Quality controls

After extraction, run `scripts/extract-credits.ts --validate`:

1. Drop any credit where `eligibility_text` is < 100 chars (extraction failed)
2. Drop duplicates by `(name, jurisdiction, state)` — keep the one with the longest eligibility text
3. Sanity-check `credit_amount_max` < $10M (otherwise probably misparsed)
4. Sanity-check that every credit has a `url` for source attribution

Manual spot-check: open `data/credits.json`, scan for the credits you know well (R&D, WOTC, Section 179) — if those look right, the rest is probably fine.

---

## Embedding strategy

For each credit, the text we embed is:

```
{name}. {jurisdiction} credit{state ? ` for ${state}` : ""}{city ? ` (${city})` : ""}.
Industries: {industries.join(", ")}.
{eligibility_text}
Who qualifies: businesses that {plain language summary derived from eligibility_text}.
Common scenarios: {3 example scenarios the LLM generates}.
```

That last line — **"Common scenarios"** — is the big unlock. We have GPT-5 generate 3 plain-language scenarios for each credit ("a manufacturer that hired a veteran in the last 12 months," "a retail business with under 25 employees that pays health insurance," etc.) and append to the embedding text. This dramatically increases recall on user inputs that describe activities rather than legal categories.

---

## What NOT to scrape

- ❌ Tax court cases or regulations text (too long, low signal)
- ❌ Form instructions PDFs (use the form's "About" page instead — already plain-language)
- ❌ Anything behind a paywall (Candid, etc.)
- ❌ Vendor sites (TaxCredit.ai, Neo.Tax) — they're competitors and their content is biased
- ❌ Wikipedia (out of date and unsourced)

---

## Time budget

| Hour | Activity | Output |
|------|----------|--------|
| 1.0 | Tier 1 federal (20 URLs) | 30 credits |
| 1.5 | Tier 2 state (10 URLs) | 100 credits |
| 2.5 | Tier 3 local (15 URLs) | 50 credits |
| 3.0 | Tier 4 grants (5 URLs) | 50 credits |
| 3.5 | Quality review + dedupe | ~200 deduped credits |
| 4.0 | Embed + upload to Qdrant | Vector DB ready |

If you're running short, **stop at Tier 1 + 2 (130 credits)** — that's enough for the demo. Add Tier 3 + 4 later.
