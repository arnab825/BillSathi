# User Validation & Customer Feedback Protocol — BillSathi

## 1. Status of User Testing

**Honest Disclosure:**  
During the rapid prototype cycle for the Hacktoberfest 2026 DEV Open-Source AI Challenge (Week 2), BillSathi was evaluated through simulated walkthroughs with a target freelancer profile and verified against synthetic accounting benchmarks. **No large-scale external commercial beta cohort has been formally tested yet.**

Below is the documented testing protocol and preliminary feedback from an initial design review session with a freelance full-stack developer.

---

## 2. Testing Protocol (Single-User Observational Test)

### Participant
- **Profile:** Independent freelance software consultant processing ~25 software, cloud, and hardware receipts each month.
- **Environment:** Windows 11 with Podman Desktop & Chrome browser.

### Test Tasks Given to Participant:
1. **Intake:** Drag and drop a monthly cloud hosting PDF invoice.
2. **Evidence Inspection:** Click the extracted "Total Due" value and check if the bounding box accurately outlines the amount on the PDF.
3. **Anomaly Identification:** Review a deliberately flawed invoice where Subtotal + Tax != Total.
4. **Correction:** Edit the miscalculated line item and confirm the document.
5. **Accountant Handoff:** Export the verified CSV register and inspect columns in Excel.

---

## 3. Observed Outcomes & User Feedback

### What Worked Well:
- **Spatial Bounding Box (Proof Before Trust):** The user expressed immediate relief that clicking an amount drew a blue glowing box directly over the number on the PDF:
  > *"Usually AI scanner apps give me an Excel file, and when my tax guy asks 'where did this $1,100 come from?', I have to open 30 PDFs to find it. Seeing the highlight on the actual page saves 10 minutes per document."*
- **Explainable Anomaly Alerts:** The arithmetic check caught the deliberate discrepancy without accusing the vendor of fraud, displaying the exact mathematical diff (`$900 vs $950`).
- **Clean RFC 4180 CSV:** Opened in Excel with zero formatting breakage or missing date fields.

### Confusions & Areas for Improvement:
1. **First-Time Dropzone Clarity:** The user initially looked for an "Upload" button before noticing the drag-and-drop dashed boundary. Added an explicit *"browse files"* link to resolve this.
2. **Review Confirmation Gate:** The user wanted reassurance on whether editing a field changed the original PDF (it does not; original text is preserved alongside the corrected value in SQLite). Added a badge clarifying `Original vs Corrected`.
3. **Multi-Currency Clarity:** The user inquired about EUR to USD exchange conversions. While BillSathi flags foreign currencies in the Anomaly Center, automatic daily FX rate conversion is planned for v1.1.

---

## 4. Next Steps for Customer Validation

1. Recruit 5 freelance web designers and 2 small agency owners for a 14-day receipt processing trial.
2. Measure the exact reduction in manual data entry time (target: >75% reduction in verification time).
3. Validate pricing hypotheses ($12/month freelance tier vs $39/month agency tier).
