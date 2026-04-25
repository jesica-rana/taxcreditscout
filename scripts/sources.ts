/**
 * Source URLs to scrape for tax credit information.
 * See SCRAPING.md for the prioritization rationale.
 */

export interface Source {
  url: string;
  jurisdiction: "Federal" | "State" | "City" | "Private";
  state?: string;
  city?: string;
  hint?: string;
}

export const SOURCES: Source[] = [
  // ── Tier 1: Federal ──────────────────────────────────────────────────
  { url: "https://www.irs.gov/forms-pubs/about-form-3800", jurisdiction: "Federal", hint: "General Business Credit — references many specific credits" },
  { url: "https://www.irs.gov/forms-pubs/about-form-5884", jurisdiction: "Federal", hint: "Work Opportunity Tax Credit (WOTC)" },
  { url: "https://www.irs.gov/forms-pubs/about-form-5884-a", jurisdiction: "Federal", hint: "Disaster Employee Retention Credit" },
  { url: "https://www.irs.gov/forms-pubs/about-form-6765", jurisdiction: "Federal", hint: "Research & Development Credit" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8826", jurisdiction: "Federal", hint: "Disabled Access Credit" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8845", jurisdiction: "Federal", hint: "Indian Employment Credit" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8847", jurisdiction: "Federal", hint: "Credit for Contributions to Selected Community Development Corporations" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8874", jurisdiction: "Federal", hint: "New Markets Credit" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8881", jurisdiction: "Federal", hint: "Credit for Small Employer Pension Plan Startup Costs" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8882", jurisdiction: "Federal", hint: "Employer-Provided Childcare Facilities and Services" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8911", jurisdiction: "Federal", hint: "Alternative Fuel Vehicle Refueling Property" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8932", jurisdiction: "Federal", hint: "Credit for Employer Differential Wage Payments" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8941", jurisdiction: "Federal", hint: "Credit for Small Employer Health Insurance Premiums" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8994", jurisdiction: "Federal", hint: "Employer Credit for Paid Family and Medical Leave" },
  { url: "https://www.irs.gov/forms-pubs/about-form-3468", jurisdiction: "Federal", hint: "Investment Credit (energy, rehabilitation, etc.)" },
  { url: "https://www.irs.gov/forms-pubs/about-form-8835", jurisdiction: "Federal", hint: "Renewable Electricity Production Credit" },
  { url: "https://www.irs.gov/credits-deductions/businesses", jurisdiction: "Federal", hint: "Index of all business credits" },

  // ── Tier 2: Top 10 States ─────────────────────────────────────────────
  { url: "https://www.ftb.ca.gov/file/business/credits/index.html", jurisdiction: "State", state: "CA", hint: "California business credits master list" },
  { url: "https://comptroller.texas.gov/taxes/franchise/credits.php", jurisdiction: "State", state: "TX" },
  { url: "https://floridarevenue.com/taxes/taxesfees/Pages/corporate.aspx", jurisdiction: "State", state: "FL" },
  { url: "https://www.tax.ny.gov/pit/credits/business_credits.htm", jurisdiction: "State", state: "NY" },
  { url: "https://www.revenue.pa.gov/TaxCreditsIncentives/Pages/default.aspx", jurisdiction: "State", state: "PA" },
  { url: "https://tax.illinois.gov/research/taxinformation/incometax/credits.html", jurisdiction: "State", state: "IL" },
  { url: "https://development.ohio.gov/business/state-incentives", jurisdiction: "State", state: "OH" },
  { url: "https://dor.georgia.gov/credits", jurisdiction: "State", state: "GA" },
  { url: "https://www.ncdor.gov/taxes-forms/corporate-income-franchise-tax", jurisdiction: "State", state: "NC" },
  { url: "https://www.nj.gov/treasury/taxation/businesses/credits.shtml", jurisdiction: "State", state: "NJ" },

  // ── Tier 3: City / Local ──────────────────────────────────────────────
  { url: "https://www.irs.gov/credits-deductions/opportunity-zones", jurisdiction: "Federal", hint: "Federal Opportunity Zone designation (treat as one credit; filter by zip later)" },
  { url: "https://www.nyc.gov/site/finance/business/business-icap.page", jurisdiction: "City", state: "NY", city: "New York" },
  { url: "https://ewddlacity.com/business/business-incentives", jurisdiction: "City", state: "CA", city: "Los Angeles" },
  { url: "https://www.chicago.gov/city/en/depts/dcd/supp_info/tif_-_tax_increment_financing.html", jurisdiction: "City", state: "IL", city: "Chicago" },
];
