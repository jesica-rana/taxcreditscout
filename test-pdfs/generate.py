"""
Generate fake IRS-style tax return PDFs stuffed with realistic-looking PII
for testing the CreditBowl client-side redactor.

All names, SSNs, EINs, addresses, phone numbers, bank info, and emails are
FAKE - generated to look real enough to exercise the redactor's regex + NER
patterns (SSN, EIN, EMAIL, PHONE, ROUTING, ACCOUNT, ADDRESS_LINE, ZIP, PERSON,
ORG) without corresponding to any real person or entity.
"""

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.lib.colors import black, HexColor
from reportlab.pdfgen import canvas
from pathlib import Path

OUT_DIR = Path(__file__).parent
LETTER_W, LETTER_H = letter


def header_block(c, form_num, form_title, year, dept_label="Department of the Treasury  -  Internal Revenue Service"):
    c.setFillColor(black)
    c.setStrokeColor(black)
    c.setLineWidth(1.2)
    c.rect(0.5 * inch, LETTER_H - 0.95 * inch, LETTER_W - 1.0 * inch, 0.55 * inch, stroke=1, fill=0)

    c.setFont("Helvetica-Bold", 22)
    c.drawString(0.62 * inch, LETTER_H - 0.78 * inch, f"Form {form_num}")

    c.setFont("Helvetica-Bold", 11)
    c.drawString(1.7 * inch, LETTER_H - 0.62 * inch, form_title)
    c.setFont("Helvetica", 8)
    c.drawString(1.7 * inch, LETTER_H - 0.75 * inch, dept_label)
    c.drawString(1.7 * inch, LETTER_H - 0.86 * inch, "For the year Jan. 1 - Dec. 31, " + str(year) + ", or other tax year beginning ____, " + str(year))

    c.setFont("Helvetica-Bold", 18)
    c.drawRightString(LETTER_W - 0.62 * inch, LETTER_H - 0.78 * inch, str(year))
    c.setFont("Helvetica", 7)
    c.drawRightString(LETTER_W - 0.62 * inch, LETTER_H - 0.88 * inch, "OMB No. 1545-0074")


def labeled_field(c, x, y, label, value, w, h=0.30 * inch, label_size=7, value_size=10, mono=False):
    c.setStrokeColor(black)
    c.setLineWidth(0.5)
    c.rect(x, y, w, h, stroke=1, fill=0)
    c.setFont("Helvetica", label_size)
    c.drawString(x + 0.04 * inch, y + h - 0.10 * inch, label)
    c.setFont("Courier-Bold" if mono else "Helvetica-Bold", value_size)
    c.drawString(x + 0.06 * inch, y + 0.07 * inch, value)


def line_item(c, x, y, num, desc, value, w=7.5 * inch):
    c.setStrokeColor(black)
    c.setLineWidth(0.4)
    c.line(x, y, x + w, y)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 0.04 * inch, y + 0.06 * inch, str(num))
    c.setFont("Helvetica", 9)
    c.drawString(x + 0.30 * inch, y + 0.06 * inch, desc)
    c.setFont("Courier", 10)
    c.drawRightString(x + w - 0.05 * inch, y + 0.06 * inch, value)


def footer(c, form_num, year, page_num=1, total_pages=1):
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#555555"))
    c.drawString(0.5 * inch, 0.4 * inch, f"For Privacy Act and Paperwork Reduction Act Notice, see separate instructions.")
    c.drawString(0.5 * inch, 0.28 * inch, f"Cat. No. 11320B")
    c.drawRightString(LETTER_W - 0.5 * inch, 0.4 * inch, f"Form {form_num} ({year})")
    c.drawRightString(LETTER_W - 0.5 * inch, 0.28 * inch, f"Page {page_num} of {total_pages}")
    c.setFillColor(black)


# ----------------------------------------------------------------------------
# Form 1040 — Individual Income Tax Return
# ----------------------------------------------------------------------------

def make_1040():
    path = OUT_DIR / "test_1040_individual.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    header_block(c, "1040", "U.S. Individual Income Tax Return", 2024)

    # Filing status
    y = LETTER_H - 1.15 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.5 * inch, y, "Filing Status")
    c.setFont("Helvetica", 9)
    c.drawString(1.4 * inch, y, "[X] Married filing jointly    [ ] Single    [ ] Head of household    [ ] Qualifying surviving spouse")

    # Taxpayer block
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Your first name and middle initial", "Marcus J.", 2.6 * inch)
    labeled_field(c, 3.15 * inch, y, "Last name", "Hollingsworth", 2.6 * inch)
    labeled_field(c, 5.80 * inch, y, "Your social security number", "542-19-8836", 1.7 * inch, mono=True)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "If joint return, spouse's first name and middle initial", "Priya R.", 2.6 * inch)
    labeled_field(c, 3.15 * inch, y, "Last name", "Hollingsworth", 2.6 * inch)
    labeled_field(c, 5.80 * inch, y, "Spouse's social security number", "613-44-7029", 1.7 * inch, mono=True)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Home address (number and street). If you have a P.O. box, see instructions.", "4827 Magnolia Ridge Drive", 5.3 * inch)
    labeled_field(c, 5.85 * inch, y, "Apt. no.", "Apt 12B", 1.65 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "City, town, or post office", "Asheville", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "State", "NC", 0.7 * inch)
    labeled_field(c, 4.30 * inch, y, "ZIP code", "28804-3217", 1.4 * inch, mono=True)
    labeled_field(c, 5.75 * inch, y, "Foreign country name", "", 1.75 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Daytime phone number", "(828) 555-0173", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "Email address (optional)", "marcus.hollingsworth@gmail.com", 4.35 * inch)

    # Dependents
    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(0.5 * inch, y, "Dependents (see instructions):")
    y -= 0.18 * inch
    c.setFont("Helvetica", 8)
    headers = ["(1) First and last name", "(2) Social security number", "(3) Relationship", "(4) CTC", "(5) ODC"]
    xs = [0.5 * inch, 3.0 * inch, 4.8 * inch, 6.4 * inch, 7.0 * inch]
    for h, x in zip(headers, xs):
        c.drawString(x, y, h)
    y -= 0.05 * inch
    c.line(0.5 * inch, y, LETTER_W - 0.5 * inch, y)

    deps = [
        ("Aiden M. Hollingsworth", "726-83-1199", "Son", "X", ""),
        ("Eleanor S. Hollingsworth", "748-22-9304", "Daughter", "X", ""),
        ("Lillian B. Hollingsworth", "759-31-4470", "Daughter", "X", ""),
    ]
    c.setFont("Courier", 9)
    for name, ssn, rel, ctc, odc in deps:
        y -= 0.20 * inch
        c.setFont("Helvetica", 9)
        c.drawString(0.5 * inch, y, name)
        c.setFont("Courier", 9)
        c.drawString(3.0 * inch, y, ssn)
        c.setFont("Helvetica", 9)
        c.drawString(4.8 * inch, y, rel)
        c.drawString(6.55 * inch, y, ctc)
        c.drawString(7.15 * inch, y, odc)

    # Income lines
    y -= 0.40 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Income")
    y -= 0.15 * inch
    items = [
        ("1a", "Total amount from Form(s) W-2, box 1", "184,650.00"),
        ("1b", "Household employee wages not reported on Form(s) W-2", "0.00"),
        ("2a", "Tax-exempt interest", "1,247.00"),
        ("2b", "Taxable interest (from Schedule B if required)", "3,829.00"),
        ("3a", "Qualified dividends", "5,108.00"),
        ("3b", "Ordinary dividends", "6,422.00"),
        ("4a", "IRA distributions", "0.00"),
        ("5a", "Pensions and annuities", "0.00"),
        ("6a", "Social security benefits", "0.00"),
        ("7",  "Capital gain or (loss). Attach Schedule D if required", "12,915.00"),
        ("8",  "Additional income from Schedule 1, line 10", "0.00"),
        ("9",  "Add lines 1z, 2b, 3b, 4b, 5b, 6b, 7, and 8. This is your total income", "207,816.00"),
        ("10", "Adjustments to income from Schedule 1, line 26", "7,000.00"),
        ("11", "Subtract line 10 from line 9. This is your adjusted gross income", "200,816.00"),
        ("12", "Standard deduction or itemized deductions (from Schedule A)", "29,200.00"),
        ("13", "Qualified business income deduction from Form 8995", "0.00"),
        ("14", "Add lines 12 and 13", "29,200.00"),
        ("15", "Subtract line 14 from line 11. If zero or less, enter -0-. Taxable income", "171,616.00"),
    ]
    for num, desc, val in items:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Tax & Refund
    y -= 0.10 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Refund / Amount You Owe")
    y -= 0.15 * inch
    line_item(c, 0.5 * inch, y, "34", "Amount of line 33 you want refunded to you", "4,217.00")
    y -= 0.20 * inch
    line_item(c, 0.5 * inch, y, "35a", "Amount of line 34 you want refunded by direct deposit", "4,217.00")
    y -= 0.20 * inch

    c.setFont("Helvetica", 9)
    c.drawString(0.7 * inch, y, "35b Routing number")
    c.setFont("Courier-Bold", 10)
    c.drawString(2.2 * inch, y, "053000196")
    c.setFont("Helvetica", 9)
    c.drawString(3.7 * inch, y, "35c Type:  [X] Checking  [ ] Savings")
    y -= 0.18 * inch
    c.setFont("Helvetica", 9)
    c.drawString(0.7 * inch, y, "35d Account number")
    c.setFont("Courier-Bold", 10)
    c.drawString(2.2 * inch, y, "Account # 44198873320142")

    # Sign Here
    y -= 0.40 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Sign Here")
    y -= 0.15 * inch
    c.setFont("Helvetica", 8)
    c.drawString(0.5 * inch, y, "Under penalties of perjury, I declare that I have examined this return and to the best of my knowledge it is true, correct, and complete.")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Your signature", "/s/ Marcus J. Hollingsworth", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Your occupation", "Senior Mechanical Engineer", 2.5 * inch)
    labeled_field(c, 6.10 * inch, y, "Date", "04/12/2025", 1.4 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Spouse's signature (if joint, BOTH must sign)", "/s/ Priya R. Hollingsworth", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Spouse's occupation", "Pediatric Dentist", 2.5 * inch)
    labeled_field(c, 6.10 * inch, y, "Date", "04/12/2025", 1.4 * inch)

    # Paid preparer
    y -= 0.40 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Paid Preparer Use Only")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Preparer's name", "Daniela Espinoza-Trent, EA", 2.6 * inch)
    labeled_field(c, 3.15 * inch, y, "PTIN", "P01938472", 1.4 * inch, mono=True)
    labeled_field(c, 4.60 * inch, y, "Phone no.", "704-555-0298", 1.5 * inch, mono=True)
    labeled_field(c, 6.15 * inch, y, "Firm's EIN", "56-2841906", 1.35 * inch, mono=True)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Firm's name", "Espinoza-Trent & Hassan CPAs, PLLC", 4.0 * inch)
    labeled_field(c, 4.55 * inch, y, "Firm's address", "200 South Tryon Street Suite 1700, Charlotte NC 28202", 2.95 * inch)

    footer(c, "1040", 2024, 1, 1)
    c.showPage()
    c.save()
    return path


# ----------------------------------------------------------------------------
# Form 1120-S — S Corporation Income Tax Return + Schedule K-1s
# ----------------------------------------------------------------------------

def make_1120s():
    path = OUT_DIR / "test_1120s_scorp_with_k1s.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)

    # ----- Page 1: 1120-S -----
    header_block(c, "1120-S", "U.S. Income Tax Return for an S Corporation", 2024)

    y = LETTER_H - 1.10 * inch
    labeled_field(c, 0.5 * inch, y, "A  S election effective date", "01/01/2017", 1.6 * inch)
    labeled_field(c, 2.15 * inch, y, "B  Business activity code", "541512", 1.4 * inch, mono=True)
    labeled_field(c, 3.60 * inch, y, "C  Schedule M-3 attached", "[ ] Yes  [X] No", 1.6 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Name", "Northwind Civic Analytics, Inc.", 4.5 * inch)
    labeled_field(c, 5.05 * inch, y, "D  Employer identification number (EIN)", "47-3829104", 2.45 * inch, mono=True)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Number, street, and room or suite no.", "1819 Westbrook Commerce Boulevard Suite 410", 4.5 * inch)
    labeled_field(c, 5.05 * inch, y, "E  Date incorporated", "03/14/2016", 2.45 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "City or town", "Bellevue", 2.5 * inch)
    labeled_field(c, 3.05 * inch, y, "State", "WA", 0.6 * inch)
    labeled_field(c, 3.70 * inch, y, "ZIP code", "98007-4421", 1.3 * inch, mono=True)
    labeled_field(c, 5.05 * inch, y, "F  Total assets (see instructions)", "$ 4,827,193.00", 2.45 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Contact phone", "(425) 555-0148", 2.0 * inch, mono=True)
    labeled_field(c, 2.55 * inch, y, "Contact email", "alistair.kovachevski@northwindcivic.com", 4.95 * inch)

    # Income
    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Income")
    y -= 0.15 * inch
    items = [
        ("1a", "Gross receipts or sales", "8,294,711.00"),
        ("1b", "Returns and allowances", "112,408.00"),
        ("1c", "Balance. Subtract line 1b from line 1a", "8,182,303.00"),
        ("2",  "Cost of goods sold (attach Form 1125-A)", "0.00"),
        ("3",  "Gross profit. Subtract line 2 from line 1c", "8,182,303.00"),
        ("4",  "Net gain (loss) from Form 4797", "0.00"),
        ("5",  "Other income (loss)", "47,219.00"),
        ("6",  "Total income (loss). Add lines 3 through 5", "8,229,522.00"),
    ]
    for num, desc, val in items:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Deductions
    y -= 0.10 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Deductions (see instructions for limitations)")
    y -= 0.15 * inch
    items2 = [
        ("7",  "Compensation of officers", "412,000.00"),
        ("8",  "Salaries and wages (less employment credits)", "2,948,116.00"),
        ("9",  "Repairs and maintenance", "84,219.00"),
        ("10", "Bad debts", "12,408.00"),
        ("11", "Rents", "318,000.00"),
        ("12", "Taxes and licenses", "172,449.00"),
        ("13", "Interest (see instructions)", "48,221.00"),
        ("14", "Depreciation not claimed on Form 1125-A or elsewhere", "94,300.00"),
        ("15", "Depletion (Do not deduct oil and gas depletion.)", "0.00"),
        ("16", "Advertising", "227,840.00"),
        ("17", "Pension, profit-sharing, etc., plans", "184,500.00"),
        ("18", "Employee benefit programs", "319,202.00"),
        ("19", "Other deductions (attach statement)", "1,442,118.00"),
        ("20", "Total deductions. Add lines 7 through 19", "6,263,373.00"),
        ("21", "Ordinary business income (loss). Subtract line 20 from line 6", "1,966,149.00"),
    ]
    for num, desc, val in items2:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Sign here
    y -= 0.20 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Sign Here")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Signature of officer", "/s/ Alistair Kovachevski", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Title", "Chief Executive Officer", 2.0 * inch)
    labeled_field(c, 5.60 * inch, y, "Date", "03/14/2025", 1.9 * inch)

    footer(c, "1120-S", 2024, 1, 4)
    c.showPage()

    # ----- Page 2: Schedule K-1 #1 -----
    header_block(c, "1120-S", "Schedule K-1: Shareholder's Share of Income, Deductions, Credits, etc.", 2024)
    y = LETTER_H - 1.15 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part I  Information About the Corporation")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "A  Corporation's employer identification number", "47-3829104", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "B  Corporation's name", "Northwind Civic Analytics, Inc.", 4.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Address, city, state, ZIP", "1819 Westbrook Commerce Boulevard Suite 410, Bellevue, WA 98007-4421", 7.0 * inch)

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part II  Information About the Shareholder")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "E  Shareholder's identifying number (SSN)", "418-29-7714", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "F  Shareholder's name", "Alistair P. Kovachevski", 4.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Shareholder's address", "37 Briar Hollow Lane, Mercer Island, WA 98040-2218", 5.6 * inch)
    labeled_field(c, 6.15 * inch, y, "G  Shareholder %", "62.5000%", 1.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Phone", "(206) 555-0192", 2.0 * inch, mono=True)
    labeled_field(c, 2.55 * inch, y, "Email", "alistair.kovachevski@northwindcivic.com", 4.95 * inch)

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part III  Shareholder's Share of Current Year Income, Deductions, Credits")
    y -= 0.20 * inch
    items3 = [
        ("1",  "Ordinary business income (loss)", "1,228,843.00"),
        ("2",  "Net rental real estate income (loss)", "0.00"),
        ("3",  "Other net rental income (loss)", "0.00"),
        ("4",  "Interest income", "8,420.00"),
        ("5a", "Ordinary dividends", "12,118.00"),
        ("5b", "Qualified dividends", "10,994.00"),
        ("13a", "Other credits — Research credit (Form 6765 pass-through)", "37,228.00"),
        ("13d", "Work opportunity credit (Form 5884 pass-through)", "4,800.00"),
        ("16",  "Items affecting shareholder basis — Distributions", "245,000.00"),
    ]
    for num, desc, val in items3:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    footer(c, "1120-S", 2024, 2, 4)
    c.showPage()

    # ----- Page 3: Schedule K-1 #2 -----
    header_block(c, "1120-S", "Schedule K-1: Shareholder's Share of Income, Deductions, Credits, etc.", 2024)
    y = LETTER_H - 1.15 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part I  Information About the Corporation")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "A  Corporation's employer identification number", "47-3829104", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "B  Corporation's name", "Northwind Civic Analytics, Inc.", 4.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Address, city, state, ZIP", "1819 Westbrook Commerce Boulevard Suite 410, Bellevue, WA 98007-4421", 7.0 * inch)

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part II  Information About the Shareholder")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "E  Shareholder's identifying number (SSN)", "523-67-3389", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "F  Shareholder's name", "Yuna Sato-Bergmann", 4.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Shareholder's address", "1402 Lakeshore Crescent Way, Kirkland, WA 98033-7714", 5.6 * inch)
    labeled_field(c, 6.15 * inch, y, "G  Shareholder %", "27.5000%", 1.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Phone", "425.555.0227", 2.0 * inch, mono=True)
    labeled_field(c, 2.55 * inch, y, "Email", "y.sato-bergmann@northwindcivic.com", 4.95 * inch)

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part III  Shareholder's Share of Current Year Income, Deductions, Credits")
    y -= 0.20 * inch
    items4 = [
        ("1",  "Ordinary business income (loss)", "540,691.00"),
        ("4",  "Interest income", "3,704.00"),
        ("5a", "Ordinary dividends", "5,332.00"),
        ("13a", "Other credits — Research credit (Form 6765 pass-through)", "16,378.00"),
        ("13d", "Work opportunity credit (Form 5884 pass-through)", "2,112.00"),
        ("16",  "Items affecting shareholder basis — Distributions", "108,000.00"),
    ]
    for num, desc, val in items4:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    footer(c, "1120-S", 2024, 3, 4)
    c.showPage()

    # ----- Page 4: Schedule K-1 #3 + bank info -----
    header_block(c, "1120-S", "Schedule K-1: Shareholder's Share of Income, Deductions, Credits, etc.", 2024)
    y = LETTER_H - 1.15 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part II  Information About the Shareholder")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "E  Shareholder's identifying number (SSN)", "601-44-9128", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "F  Shareholder's name", "Devonte Mwangi-Olusegun", 4.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Shareholder's address", "8821 Cedar Ridge Parkway Apt 4C, Redmond, WA 98052-9933", 5.6 * inch)
    labeled_field(c, 6.15 * inch, y, "G  Shareholder %", "10.0000%", 1.35 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Phone", "+1-425-555-0381", 2.0 * inch, mono=True)
    labeled_field(c, 2.55 * inch, y, "Email", "devonte.mwangi@gmail.com", 4.95 * inch)

    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part III  Shareholder's Share of Current Year Income, Deductions, Credits")
    y -= 0.20 * inch
    items5 = [
        ("1",  "Ordinary business income (loss)", "196,615.00"),
        ("4",  "Interest income", "1,348.00"),
        ("13a", "Other credits — Research credit (Form 6765 pass-through)", "5,956.00"),
        ("13d", "Work opportunity credit (Form 5884 pass-through)", "768.00"),
        ("16",  "Items affecting shareholder basis — Distributions", "39,000.00"),
    ]
    for num, desc, val in items5:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Banking info
    y -= 0.30 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Corporate Banking Information (for refunds and direct payments)")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Bank name", "First Cascadia National Bank", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Routing number", "RTN: 125000024", 2.0 * inch, mono=True)
    labeled_field(c, 5.60 * inch, y, "Account number", "Acct # 77281149320", 1.9 * inch, mono=True)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Bank branch address", "300 Pine Street Suite 200, Seattle, WA 98101-2244", 5.0 * inch)
    labeled_field(c, 5.55 * inch, y, "Branch phone", "(206) 555-0177", 1.95 * inch, mono=True)

    footer(c, "1120-S", 2024, 4, 4)
    c.showPage()
    c.save()
    return path


# ----------------------------------------------------------------------------
# W-2 Wage and Tax Statement
# ----------------------------------------------------------------------------

def make_w2():
    path = OUT_DIR / "test_w2_wage_statement.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)

    c.setStrokeColor(black)
    c.setLineWidth(1.2)
    # Outer box
    margin = 0.5 * inch
    c.rect(margin, 0.6 * inch, LETTER_W - 2 * margin, LETTER_H - 1.0 * inch)

    # Title
    c.setFont("Helvetica-Bold", 14)
    c.drawString(margin + 0.15 * inch, LETTER_H - 0.62 * inch, "Form W-2  Wage and Tax Statement")
    c.setFont("Helvetica", 9)
    c.drawString(margin + 0.15 * inch, LETTER_H - 0.78 * inch, "Department of the Treasury - Internal Revenue Service")
    c.setFont("Helvetica-Bold", 16)
    c.drawRightString(LETTER_W - margin - 0.15 * inch, LETTER_H - 0.62 * inch, "2024")
    c.setFont("Helvetica", 8)
    c.drawRightString(LETTER_W - margin - 0.15 * inch, LETTER_H - 0.78 * inch, "OMB No. 1545-0008")

    # Top row: control + EIN
    y = LETTER_H - 1.15 * inch
    labeled_field(c, margin + 0.10 * inch, y, "a  Employee's social security number", "542-19-8836", 2.5 * inch, mono=True)
    labeled_field(c, margin + 2.70 * inch, y, "b  Employer identification number (EIN)", "82-4719306", 2.5 * inch, mono=True)
    labeled_field(c, margin + 5.30 * inch, y, "OMB control no.", "1545-0008", 1.6 * inch, mono=True)

    y -= 0.95 * inch
    # Employer block: empty labeled_field gives us a box with just the label,
    # then we paint the multi-line value ourselves
    labeled_field(c, margin + 0.10 * inch, y, "c  Employer's name, address, and ZIP code", "", 7.10 * inch, h=0.85 * inch, label_size=7)
    c.setFont("Helvetica-Bold", 11)
    c.drawString(margin + 0.16 * inch, y + 0.60 * inch, "PrecisionForge Aerospace Components, LLC")
    c.setFont("Helvetica", 10)
    c.drawString(margin + 0.16 * inch, y + 0.42 * inch, "2715 Industrial Park Boulevard")
    c.drawString(margin + 0.16 * inch, y + 0.26 * inch, "Building C-12, Loading Dock 4")
    c.drawString(margin + 0.16 * inch, y + 0.10 * inch, "Wichita, KS 67219-3812")

    y -= 0.36 * inch
    labeled_field(c, margin + 0.10 * inch, y, "d  Control number", "EMP-00382-K9-2024", 7.10 * inch, mono=True)

    y -= 0.36 * inch
    # Employee block
    labeled_field(c, margin + 0.10 * inch, y, "e  Employee's first name and initial   |   Last name   |   Suff.",
                  "Marcus J.   |   Hollingsworth", 7.10 * inch, h=0.40 * inch, value_size=11)

    y -= 0.46 * inch
    labeled_field(c, margin + 0.10 * inch, y, "f  Employee's address and ZIP code",
                  "4827 Magnolia Ridge Drive Apt 12B, Asheville, NC 28804-3217",
                  7.10 * inch, h=0.40 * inch)

    # Wage boxes — two-column grid
    y -= 0.50 * inch
    box_w = 3.55 * inch
    rows = [
        ("1   Wages, tips, other compensation", "184,650.00", "2   Federal income tax withheld", "32,118.00"),
        ("3   Social security wages", "168,600.00", "4   Social security tax withheld", "10,453.20"),
        ("5   Medicare wages and tips", "184,650.00", "6   Medicare tax withheld", "2,677.43"),
        ("7   Social security tips", "0.00", "8   Allocated tips", "0.00"),
        ("9   Verification code", "—", "10  Dependent care benefits", "5,000.00"),
        ("11  Nonqualified plans", "0.00", "12a See instructions for box 12  D", "18,500.00"),
        ("13  Statutory  Retirement  Sick", "[ ] [X] [ ]", "12b  DD", "14,820.00"),
        ("14  Other — UNION DUES", "1,200.00", "12c  W", "3,200.00"),
    ]
    for left_label, left_val, right_label, right_val in rows:
        labeled_field(c, margin + 0.10 * inch, y, left_label, left_val, box_w, mono=True)
        labeled_field(c, margin + 0.10 * inch + box_w, y, right_label, right_val, box_w, mono=True)
        y -= 0.36 * inch

    # State
    y -= 0.10 * inch
    labeled_field(c, margin + 0.10 * inch, y, "15  State", "NC", 0.6 * inch)
    labeled_field(c, margin + 0.75 * inch, y, "Employer's state ID number", "NC-08-1294-67-83", 2.4 * inch, mono=True)
    labeled_field(c, margin + 3.20 * inch, y, "16  State wages, tips, etc.", "184,650.00", 2.0 * inch, mono=True)
    labeled_field(c, margin + 5.25 * inch, y, "17  State income tax", "8,402.18", 1.95 * inch, mono=True)
    y -= 0.36 * inch
    labeled_field(c, margin + 0.10 * inch, y, "18  Local wages, tips, etc.", "0.00", 2.5 * inch, mono=True)
    labeled_field(c, margin + 2.65 * inch, y, "19  Local income tax", "0.00", 2.5 * inch, mono=True)
    labeled_field(c, margin + 5.20 * inch, y, "20  Locality name", "BUNCOMBE", 2.0 * inch)

    # HR contact info
    y -= 0.50 * inch
    c.setFont("Helvetica-Bold", 9)
    c.drawString(margin + 0.10 * inch, y, "Issued by Payroll - Questions:")
    c.setFont("Helvetica", 9)
    y -= 0.16 * inch
    c.drawString(margin + 0.10 * inch, y, "Payroll Manager: Reginald Featherstone-Voss   Phone: (316) 555-0231   Email: payroll@precisionforge-aero.com")
    y -= 0.14 * inch
    c.drawString(margin + 0.10 * inch, y, "ADP Service ID: 8839204  |  HR mailing address: 2715 Industrial Park Boulevard Building A, Wichita, KS 67219-3812")
    y -= 0.14 * inch
    c.drawString(margin + 0.10 * inch, y, "Direct deposit on file - routing: 101000019  account: 559200847163  (First National Bank of Kansas)")

    # Footer
    c.setFont("Helvetica", 7)
    c.setFillColor(HexColor("#555555"))
    c.drawString(margin + 0.10 * inch, 0.4 * inch, "Copy B—To Be Filed With Employee's FEDERAL Tax Return.  Cat. No. 10134D")
    c.drawRightString(LETTER_W - margin - 0.10 * inch, 0.4 * inch, "Form W-2 (2024)")

    c.showPage()
    c.save()
    return path


# ----------------------------------------------------------------------------
# Form 941 — Employer's Quarterly Federal Tax Return
# ----------------------------------------------------------------------------

def make_941():
    path = OUT_DIR / "test_941_employer_quarterly.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    header_block(c, "941", "Employer's QUARTERLY Federal Tax Return", 2024)

    y = LETTER_H - 1.15 * inch
    labeled_field(c, 0.5 * inch, y, "Employer identification number (EIN)", "82-4719306", 2.6 * inch, mono=True)
    labeled_field(c, 3.15 * inch, y, "Report for this Quarter (check one)", "[X] 1: Jan/Feb/Mar  [ ] 2  [ ] 3  [ ] 4", 4.35 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Name (not your trade name)", "PrecisionForge Aerospace Components, LLC", 7.0 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Trade name (if any)", "PrecisionForge Aero", 7.0 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Number, street, and suite", "2715 Industrial Park Boulevard Building C-12", 5.0 * inch)
    labeled_field(c, 5.55 * inch, y, "Suite/Apt", "Suite 410", 1.95 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "City", "Wichita", 2.5 * inch)
    labeled_field(c, 3.05 * inch, y, "State", "KS", 0.6 * inch)
    labeled_field(c, 3.70 * inch, y, "ZIP code", "67219-3812", 1.3 * inch, mono=True)
    labeled_field(c, 5.05 * inch, y, "Foreign country (if any)", "", 2.45 * inch)

    # Part 1
    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part 1: Answer these questions for this quarter.")
    y -= 0.20 * inch
    items = [
        ("1",  "Number of employees who received wages for the pay period including March 12", "187"),
        ("2",  "Wages, tips, and other compensation", "12,418,720.00"),
        ("3",  "Federal income tax withheld from wages, tips, and other compensation", "1,847,219.00"),
        ("4",  "If no wages, tips, and other compensation are subject to social security or Medicare tax", "[ ] Check and go to line 6"),
        ("5a", "Taxable social security wages × 0.124", "11,892,400.00"),
        ("5c", "Taxable Medicare wages & tips × 0.029", "12,418,720.00"),
        ("6",  "Total taxes before adjustments", "2,853,418.00"),
        ("7",  "Current quarter's adjustment for fractions of cents", "(2.18)"),
        ("8",  "Current quarter's sick pay", "0.00"),
        ("9",  "Current quarter's adjustments for tips and group-term life insurance", "0.00"),
        ("10", "Total taxes after adjustments. Combine lines 6 through 9", "2,853,415.82"),
        ("11a", "Qualified small business payroll tax credit for increasing research activities (Form 8974)", "47,500.00"),
        ("12",  "Total taxes after adjustments and nonrefundable credits", "2,805,915.82"),
        ("13",  "Total deposits for this quarter", "2,805,915.82"),
        ("14",  "Balance due", "0.00"),
        ("15",  "Overpayment", "0.00"),
    ]
    for num, desc, val in items:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.19 * inch

    # Part 5 - signature
    y -= 0.20 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Part 5: Sign here. You MUST complete all three pages of Form 941 and SIGN it.")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Sign your name here", "/s/ Theodora Marchetti-Khan", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Print your name here", "Theodora Marchetti-Khan", 2.5 * inch)
    labeled_field(c, 6.10 * inch, y, "Date", "04/29/2024", 1.4 * inch)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Print your title here", "Chief Financial Officer", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Best daytime phone", "(316) 555-0488", 2.5 * inch, mono=True)
    labeled_field(c, 6.10 * inch, y, "Email", "tmarchetti@precisionforge-aero.com", 1.4 * inch)

    # Paid preparer
    y -= 0.40 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Paid Preparer Use Only")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Preparer's name", "Heinrich Olafsson-Bekele, CPA", 2.6 * inch)
    labeled_field(c, 3.15 * inch, y, "PTIN", "P00829471", 1.4 * inch, mono=True)
    labeled_field(c, 4.60 * inch, y, "Phone", "316-555-0612", 1.5 * inch, mono=True)
    labeled_field(c, 6.15 * inch, y, "Firm's EIN", "73-8194062", 1.35 * inch, mono=True)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Firm's name", "Olafsson-Bekele Tax Advisors, LLP", 4.0 * inch)
    labeled_field(c, 4.55 * inch, y, "Firm's address", "421 East Douglas Avenue Suite 800, Wichita KS 67202", 2.95 * inch)

    footer(c, "941", 2024, 1, 1)
    c.showPage()
    c.save()
    return path


# ----------------------------------------------------------------------------
# Form 1120 — U.S. Corporation Income Tax Return
# ----------------------------------------------------------------------------

def make_1120():
    path = OUT_DIR / "test_1120_ccorp.pdf"
    c = canvas.Canvas(str(path), pagesize=letter)
    header_block(c, "1120", "U.S. Corporation Income Tax Return", 2024)

    y = LETTER_H - 1.15 * inch
    labeled_field(c, 0.5 * inch, y, "A  Check if: 1a Consolidated return", "[ ]", 2.5 * inch)
    labeled_field(c, 3.05 * inch, y, "B  Employer identification number", "27-4910583", 2.5 * inch, mono=True)
    labeled_field(c, 5.60 * inch, y, "C  Date incorporated", "08/22/2009", 1.9 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Name", "Vermillion Bay Logistics Holdings Corporation", 5.05 * inch)
    labeled_field(c, 5.60 * inch, y, "D  Total assets", "$ 28,419,720.00", 1.9 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Number, street, and room or suite no.", "9047 Harbor View Industrial Parkway Suite 1200", 5.05 * inch)
    labeled_field(c, 5.60 * inch, y, "E  Check if (1) Initial return", "[ ]", 1.9 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "City or town", "Long Beach", 2.5 * inch)
    labeled_field(c, 3.05 * inch, y, "State", "CA", 0.6 * inch)
    labeled_field(c, 3.70 * inch, y, "ZIP code", "90802-4419", 1.85 * inch, mono=True)
    labeled_field(c, 5.60 * inch, y, "Country", "USA", 1.9 * inch)

    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Officer contact phone", "(562) 555-0192", 2.5 * inch, mono=True)
    labeled_field(c, 3.05 * inch, y, "Officer email", "samira.al-najjar@vermillionbay.com", 4.45 * inch)

    # Income
    y -= 0.45 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Income")
    y -= 0.15 * inch
    items = [
        ("1a", "Gross receipts or sales", "47,829,118.00"),
        ("1b", "Returns and allowances", "284,920.00"),
        ("1c", "Balance. Subtract line 1b from line 1a", "47,544,198.00"),
        ("2",  "Cost of goods sold (attach Form 1125-A)", "31,418,920.00"),
        ("3",  "Gross profit. Subtract line 2 from line 1c", "16,125,278.00"),
        ("4",  "Dividends and inclusions", "184,200.00"),
        ("5",  "Interest", "92,418.00"),
        ("6",  "Gross rents", "0.00"),
        ("7",  "Gross royalties", "0.00"),
        ("8",  "Capital gain net income", "412,809.00"),
        ("9",  "Net gain or (loss) from Form 4797", "0.00"),
        ("10", "Other income (see instructions—attach statement)", "318,420.00"),
        ("11", "Total income. Add lines 3 through 10", "17,133,125.00"),
    ]
    for num, desc, val in items:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Deductions
    y -= 0.10 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Deductions")
    y -= 0.15 * inch
    items2 = [
        ("12", "Compensation of officers (see instructions—attach Form 1125-E)", "1,420,000.00"),
        ("13", "Salaries and wages (less employment credits)", "6,894,318.00"),
        ("14", "Repairs and maintenance", "419,820.00"),
        ("15", "Bad debts", "84,920.00"),
        ("16", "Rents", "1,248,000.00"),
        ("17", "Taxes and licenses", "892,418.00"),
        ("18", "Interest (see instructions)", "284,919.00"),
        ("26", "Other deductions (attach statement)", "3,194,820.00"),
        ("27", "Total deductions. Add lines 12 through 26", "14,439,215.00"),
        ("28", "Taxable income before NOL deduction and special deductions", "2,693,910.00"),
        ("31", "Total tax (Schedule J, Part I, line 11)", "565,721.00"),
    ]
    for num, desc, val in items2:
        line_item(c, 0.5 * inch, y, num, desc, val)
        y -= 0.20 * inch

    # Sign here
    y -= 0.30 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Sign Here")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Signature of officer", "/s/ Samira Al-Najjar", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Title", "Chief Financial Officer", 2.0 * inch)
    labeled_field(c, 5.60 * inch, y, "Date", "03/28/2025", 1.9 * inch)
    y -= 0.20 * inch
    c.setFont("Helvetica", 8)
    c.drawString(0.5 * inch, y, "May the IRS discuss this return with the preparer shown below?  [X] Yes  [ ] No")

    # Paid preparer
    y -= 0.30 * inch
    c.setFont("Helvetica-Bold", 10)
    c.drawString(0.5 * inch, y, "Paid Preparer Use Only")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Preparer's name", "Beatrix Chen-Goldberg, CPA", 2.6 * inch)
    labeled_field(c, 3.15 * inch, y, "PTIN", "P02847193", 1.4 * inch, mono=True)
    labeled_field(c, 4.60 * inch, y, "Phone", "213-555-0344", 1.5 * inch, mono=True)
    labeled_field(c, 6.15 * inch, y, "Firm's EIN", "95-3819204", 1.35 * inch, mono=True)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Firm's name", "Chen-Goldberg & Associates, P.C.", 4.0 * inch)
    labeled_field(c, 4.55 * inch, y, "Firm's address", "555 West Fifth Street Suite 3800, Los Angeles CA 90013", 2.95 * inch)

    # Bank info on next page
    footer(c, "1120", 2024, 1, 2)
    c.showPage()

    # Page 2: Schedule with bank info & officer roster
    header_block(c, "1120", "Schedule E - Officers, Directors, and Banking", 2024)
    y = LETTER_H - 1.15 * inch

    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Compensation of Officers (Form 1125-E)")
    y -= 0.20 * inch
    c.setFont("Helvetica", 8)
    headers = ["Name", "SSN", "% Time", "% Stock", "Compensation"]
    xs = [0.5 * inch, 2.6 * inch, 4.1 * inch, 4.9 * inch, 5.9 * inch]
    for h, x in zip(headers, xs):
        c.drawString(x, y, h)
    y -= 0.04 * inch
    c.line(0.5 * inch, y, LETTER_W - 0.5 * inch, y)

    officers = [
        ("Samira Al-Najjar",      "428-19-7204", "100%", "12.4%", "$ 412,000.00"),
        ("Tobias Linnerud-Park",  "612-83-4419", "100%", "9.8%",  "$ 384,000.00"),
        ("Wenjun Okonkwo-Reyes",  "583-29-1147", "100%", "8.2%",  "$ 348,000.00"),
        ("Marisol Bergstrom-Patel","497-72-3308","100%", "5.6%",  "$ 276,000.00"),
    ]
    for name, ssn, pct1, pct2, comp in officers:
        y -= 0.22 * inch
        c.setFont("Helvetica", 9)
        c.drawString(0.5 * inch, y, name)
        c.setFont("Courier", 9)
        c.drawString(2.6 * inch, y, ssn)
        c.setFont("Helvetica", 9)
        c.drawString(4.1 * inch, y, pct1)
        c.drawString(4.9 * inch, y, pct2)
        c.setFont("Courier", 9)
        c.drawString(5.9 * inch, y, comp)

    y -= 0.40 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Officer contact addresses (for K-1 distribution and IRS correspondence)")
    y -= 0.20 * inch
    contacts = [
        ("Samira Al-Najjar",       "1742 Belmont Shore Promenade, Long Beach CA 90803-2218",
                                   "(562) 555-0192", "samira.al-najjar@vermillionbay.com"),
        ("Tobias Linnerud-Park",   "8829 Naples Plaza Drive Apt 14, Long Beach CA 90803-4419",
                                   "562.555.0247", "tobias.l-park@vermillionbay.com"),
        ("Wenjun Okonkwo-Reyes",   "201 South Catalina Avenue Suite 8, Redondo Beach CA 90277-1102",
                                   "+1 (310) 555-0388", "wokonkwo@vermillionbay.com"),
        ("Marisol Bergstrom-Patel","4419 Pacific Coast Highway Unit C, Manhattan Beach CA 90266-3318",
                                   "310-555-0511", "mbergstrom-patel@vermillionbay.com"),
    ]
    for name, addr, phone, email in contacts:
        c.setFont("Helvetica-Bold", 9)
        c.drawString(0.5 * inch, y, name)
        y -= 0.14 * inch
        c.setFont("Helvetica", 9)
        c.drawString(0.7 * inch, y, addr)
        y -= 0.13 * inch
        c.setFont("Courier", 9)
        c.drawString(0.7 * inch, y, f"phone: {phone}    email: {email}")
        y -= 0.20 * inch

    # Banking
    y -= 0.20 * inch
    c.setFont("Helvetica-Bold", 11)
    c.drawString(0.5 * inch, y, "Corporate Banking Information")
    y -= 0.30 * inch
    labeled_field(c, 0.5 * inch, y, "Primary deposit account — Bank", "Pacific Crest Commerce Bank", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "Routing number", "RTN 122000661", 2.0 * inch, mono=True)
    labeled_field(c, 5.60 * inch, y, "Account number", "ACCT: 88294471032", 1.9 * inch, mono=True)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Branch address", "300 South Grand Avenue, Los Angeles CA 90071-3147", 5.0 * inch)
    labeled_field(c, 5.55 * inch, y, "Branch phone", "(213) 555-0411", 1.95 * inch, mono=True)
    y -= 0.32 * inch
    labeled_field(c, 0.5 * inch, y, "Secondary payroll account — Bank", "Atlantic Federal Trust Company", 3.0 * inch)
    labeled_field(c, 3.55 * inch, y, "ABA routing", "ABA: 021000089", 2.0 * inch, mono=True)
    labeled_field(c, 5.60 * inch, y, "Account #", "Acct # 1193382447019", 1.9 * inch, mono=True)

    footer(c, "1120", 2024, 2, 2)
    c.showPage()
    c.save()
    return path


if __name__ == "__main__":
    paths = [
        make_1040(),
        make_1120s(),
        make_w2(),
        make_941(),
        make_1120(),
    ]
    print("Generated:")
    for p in paths:
        size_kb = p.stat().st_size / 1024
        print(f"  {p.name:48s}  {size_kb:7.1f} KB")
