# Test PDFs for PII redactor

Fake IRS-style tax-return PDFs for exercising the client-side redactor
in [frontend/src/lib/redactor.js](../frontend/src/lib/redactor.js).

All names, SSNs, EINs, addresses, phone numbers, emails, and bank
routing/account numbers are **fabricated**. None correspond to real
people, businesses, or accounts.

## Files

| File | Form | What's in it |
|---|---|---|
| `test_1040_individual.pdf` | 1040 | Joint return: 2 taxpayer SSNs, 3 dependent SSNs, address, phone, email, preparer EIN/PTIN, bank routing + account |
| `test_w2_wage_statement.pdf` | W-2 | Employee SSN, employer EIN, both addresses, payroll contact phone/email, direct-deposit routing + account |
| `test_941_employer_quarterly.pdf` | 941 | Employer EIN, business address, officer name + phone + email, preparer EIN |
| `test_1120s_scorp_with_k1s.pdf` | 1120-S + 3× K-1 | Corporate EIN, 3 shareholder SSNs with addresses/phones/emails, corporate bank routing + account |
| `test_1120_ccorp.pdf` | 1120 | Corporate EIN, 4 officer SSNs with addresses/phones/emails, 2 bank accounts (routing + account) |

## Token counts

What the regex pass alone (no NER) extracts per file:

```
File                                  SSN  EIN  EMAIL  PHONE  RTN  ACCT  ADDR  ZIP
test_1040_individual.pdf                5    1      1      2    0     1     1    1
test_1120_ccorp.pdf                     4    2      5      7    2     2     6    7
test_1120s_scorp_with_k1s.pdf           3    3      4      5    1     1     7    7
test_941_employer_quarterly.pdf         0    2      1      2    0     0     2    2
test_w2_wage_statement.pdf              1    1      1      1    1     1     3    4
TOTAL                                  13    9     12     17    4     5    19   21
```

Person/Org names are caught by the `compromise` NER pass at runtime,
so they don't show up in this regex-only count.

## Regenerate

```
python3 generate.py   # rebuilds all five PDFs
python3 verify.py     # re-extracts + re-counts PII tokens
```

`pdftotext` and `reportlab` are the only dependencies.
