"""
Mirror the regex patterns from frontend/src/lib/redactor.js and confirm that
the generated PDFs contain plenty of each PII type.
"""

import re
import subprocess
from pathlib import Path

PATTERNS = {
    "SSN":          re.compile(r"\b\d{3}-\d{2}-\d{4}\b"),
    "EIN":          re.compile(r"\b\d{2}-\d{7}\b"),
    "EMAIL":        re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    "PHONE":        re.compile(r"\b\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4}\b"),
    "ROUTING":      re.compile(r"\b(?:routing|rtn|aba)[\s#:]*\d{9}\b", re.IGNORECASE),
    "ACCOUNT":      re.compile(r"\b(?:account|acct|acc)[\s#:]*\d{6,17}\b", re.IGNORECASE),
    "ADDRESS_LINE": re.compile(
        r"\b\d{1,6}\s+[A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+){0,4}\s+"
        r"(?:Street|St|Avenue|Ave|Road|Rd|Boulevard|Blvd|Drive|Dr|Lane|Ln|Way|"
        r"Court|Ct|Place|Pl|Parkway|Pkwy|Highway|Hwy)\b\.?"
        r"(?:,?\s+(?:Apt|Suite|Ste|Unit|#)\s*[A-Za-z0-9-]+)?"
    ),
    "ZIP":          re.compile(r"\b\d{5}(?:-\d{4})?\b"),
}

DIR = Path(__file__).parent


def extract_text(pdf):
    return subprocess.check_output(["pdftotext", "-layout", str(pdf), "-"], text=True)


def main():
    pdfs = sorted(p for p in DIR.glob("*.pdf"))
    print(f"{'File':<42}{'SSN':>5}{'EIN':>5}{'EMAIL':>7}{'PHONE':>7}{'RTN':>5}{'ACCT':>6}{'ADDR':>6}{'ZIP':>5}")
    print("-" * 88)
    totals = {k: 0 for k in PATTERNS}
    for pdf in pdfs:
        text = extract_text(pdf)
        counts = {}
        for name, pat in PATTERNS.items():
            n = len(pat.findall(text))
            counts[name] = n
            totals[name] += n
        print(f"{pdf.name:<42}"
              f"{counts['SSN']:>5}{counts['EIN']:>5}{counts['EMAIL']:>7}"
              f"{counts['PHONE']:>7}{counts['ROUTING']:>5}{counts['ACCOUNT']:>6}"
              f"{counts['ADDRESS_LINE']:>6}{counts['ZIP']:>5}")
    print("-" * 88)
    print(f"{'TOTAL':<42}"
          f"{totals['SSN']:>5}{totals['EIN']:>5}{totals['EMAIL']:>7}"
          f"{totals['PHONE']:>7}{totals['ROUTING']:>5}{totals['ACCOUNT']:>6}"
          f"{totals['ADDRESS_LINE']:>6}{totals['ZIP']:>5}")


if __name__ == "__main__":
    main()
