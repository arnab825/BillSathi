from pathlib import Path
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors


def create_invoice_pdf(
    file_path: Path,
    vendor_name: str,
    vendor_address: str,
    invoice_number: str,
    invoice_date: str,
    due_date: str,
    bill_to: str,
    items: list[tuple[str, str, str]],  # (desc, qty, amount)
    subtotal_str: str,
    tax_str: str,
    total_str: str,
    notes: str = "Thank you for your business. Payment terms: Net 30.",
):
    """Generates a professional, realistic synthetic PDF invoice with exact vector text."""
    c = canvas.Canvas(str(file_path), pagesize=letter)
    width, height = letter

    # Header banner
    c.setFillColor(colors.HexColor("#0f172a"))  # Slate 900
    c.rect(0, height - 90, width, 90, fill=True, stroke=False)

    c.setFillColor(colors.white)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(54, height - 55, vendor_name)
    c.setFont("Helvetica", 10)
    c.drawString(54, height - 75, vendor_address)

    c.setFont("Helvetica-Bold", 20)
    c.drawRightString(width - 54, height - 55, "INVOICE")
    c.setFont("Helvetica", 10)
    c.drawRightString(width - 54, height - 75, f"Invoice #: {invoice_number}")

    # Metadata section
    c.setFillColor(colors.HexColor("#334155"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(54, height - 120, "BILLED TO:")
    c.setFont("Helvetica", 10)
    c.drawString(54, height - 135, bill_to)

    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 150, height - 120, "INVOICE DATE:")
    c.drawRightString(width - 150, height - 135, "DUE DATE:")
    c.setFont("Helvetica", 10)
    c.drawString(width - 140, height - 120, invoice_date)
    c.drawString(width - 140, height - 135, due_date)

    # Line Items Table Header
    y = height - 175
    c.setFillColor(colors.HexColor("#f1f5f9"))
    c.rect(54, y - 5, width - 108, 22, fill=True, stroke=False)
    c.setFillColor(colors.HexColor("#0f172a"))
    c.setFont("Helvetica-Bold", 10)
    c.drawString(64, y + 2, "DESCRIPTION")
    c.drawString(380, y + 2, "QTY")
    c.drawRightString(width - 64, y + 2, "AMOUNT")

    # Table rows
    y -= 25
    c.setFont("Helvetica", 10)
    for desc, qty, amount in items:
        c.setFillColor(colors.HexColor("#1e293b"))
        c.drawString(64, y, desc)
        c.drawString(385, y, qty)
        c.drawRightString(width - 64, y, f"${amount}")
        y -= 22

    # Divider line
    y -= 10
    c.setStrokeColor(colors.HexColor("#cbd5e1"))
    c.setLineWidth(1)
    c.line(54, y, width - 54, y)

    # Summary totals section
    y -= 25
    c.setFont("Helvetica-Bold", 10)
    c.drawRightString(width - 150, y, "SUBTOTAL:")
    c.drawRightString(width - 64, y, f"${subtotal_str}")

    y -= 20
    c.drawRightString(width - 150, y, "TAX (10%):")
    c.drawRightString(width - 64, y, f"${tax_str}")

    y -= 25
    c.setFillColor(colors.HexColor("#2563eb"))  # Accent Blue
    c.setFont("Helvetica-Bold", 14)
    c.drawRightString(width - 150, y, "TOTAL DUE:")
    c.drawRightString(width - 64, y, f"${total_str}")

    # Footer notes
    c.setFillColor(colors.HexColor("#64748b"))
    c.setFont("Helvetica", 9)
    c.drawString(54, 50, notes)
    c.drawRightString(width - 54, 50, "Verified with BillSathi Evidence Intelligence")

    c.save()


def generate_all_demo_invoices(target_dir: Path) -> dict[str, Path]:
    """Generates the 3 synthetic demonstration invoices."""
    target_dir.mkdir(parents=True, exist_ok=True)

    # 1. Normal Clean Invoice
    norm_path = target_dir / "invoice_normal_acme.pdf"
    create_invoice_pdf(
        file_path=norm_path,
        vendor_name="Acme Cloud Infrastructure",
        vendor_address="100 Enterprise Way, Suite 400, San Francisco, CA 94105",
        invoice_number="INV-2026-001",
        invoice_date="2026-10-01",
        due_date="2026-10-31",
        bill_to="Freelance Studio Ltd, 12 Tech Park, NY",
        items=[
            ("Dedicated Kubernetes Cluster - Oct 2026", "1", "800.00"),
            ("High-Performance NVMe Storage (2TB)", "1", "200.00"),
        ],
        subtotal_str="1,000.00",
        tax_str="100.00",
        total_str="1,100.00",
    )

    # 2. Duplicate Invoice (same vendor & invoice number)
    dup_path = target_dir / "invoice_duplicate_acme.pdf"
    create_invoice_pdf(
        file_path=dup_path,
        vendor_name="Acme Cloud Infrastructure",
        vendor_address="100 Enterprise Way, Suite 400, San Francisco, CA 94105",
        invoice_number="INV-2026-001",
        invoice_date="2026-10-01",
        due_date="2026-10-31",
        bill_to="Freelance Studio Ltd, 12 Tech Park, NY",
        items=[
            ("Dedicated Kubernetes Cluster - Oct 2026", "1", "800.00"),
            ("High-Performance NVMe Storage (2TB)", "1", "200.00"),
        ],
        subtotal_str="1,000.00",
        tax_str="100.00",
        total_str="1,100.00",
    )

    # 3. Arithmetic Inconsistent Invoice (Apex Supplies: 800 + 100 printed as 950!)
    err_path = target_dir / "invoice_arithmetic_error_apex.pdf"
    create_invoice_pdf(
        file_path=err_path,
        vendor_name="Apex Office Supplies",
        vendor_address="45 Industrial Parkway, Chicago, IL 60601",
        invoice_number="INV-2026-042",
        invoice_date="2026-10-05",
        due_date="2026-11-04",
        bill_to="Freelance Studio Ltd, 12 Tech Park, NY",
        items=[
            ("Ergonomic Mesh Office Chair", "2", "600.00"),
            ("Standing Desk Converter", "1", "200.00"),
        ],
        subtotal_str="800.00",
        tax_str="100.00",
        total_str="950.00",  # DELIBERATE ARITHMETIC ERROR: 800 + 100 != 950
        notes="Notice: Subtotal $800.00 + Tax $100.00 does not equal Total $950.00.",
    )

    return {
        "normal": norm_path,
        "duplicate": dup_path,
        "arithmetic_error": err_path,
    }
