import asyncio
import json
import time
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))
from app.core.config import settings
from app.demo_data.generator import generate_all_demo_invoices
from app.extraction.pdf_parser import parse_pdf_document
from app.models_ai.factory import get_active_model
from app.validation.deterministic_rules import to_cents

EVAL_DIR = Path(__file__).parent
GROUND_TRUTH_FILE = EVAL_DIR / "ground_truth.json"


async def run_evaluation():
    print("=" * 70)
    print("BillSathi Open-Weight AI Model Evaluation Benchmark")
    print("=" * 70)

    # 1. Ensure demo PDFs exist
    demo_files = generate_all_demo_invoices(settings.DATA_DIR / "demo_invoices")
    with open(GROUND_TRUTH_FILE, "r") as f:
        ground_truth_list = json.load(f)

    # 2. Get active extraction model
    model = await get_active_model()
    provider_info = model.get_provider_info()
    print(f"Active Provider: {provider_info['provider']}")
    print(f"Model ID:        {provider_info['model']}")
    print(f"Dataset Size:    {len(ground_truth_list)} synthetic financial documents\n")

    total_fields = 0
    correct_fields = 0
    total_time_ms = 0.0
    field_breakdown = {}

    for item in ground_truth_list:
        doc_key = item["document_key"]
        pdf_path = demo_files[doc_key]
        gt = item["ground_truth"]

        # Parse text
        parsed = parse_pdf_document(pdf_path, settings.PREVIEW_DIR, f"eval_{doc_key}")

        t0 = time.time()
        extracted = await model.extract(parsed.raw_text)
        duration_ms = (time.time() - t0) * 1000
        total_time_ms += duration_ms

        print(f"--- Document: {item['filename']} (Latency: {duration_ms:.1f}ms) ---")

        eval_fields = [
            ("vendor_name", gt.get("vendor_name"), extracted.vendor_name),
            ("invoice_number", gt.get("invoice_number"), extracted.invoice_number),
            ("invoice_date", gt.get("invoice_date"), extracted.invoice_date),
            ("subtotal", to_cents(gt.get("subtotal")), to_cents(extracted.subtotal)),
            ("tax_amount", to_cents(gt.get("tax_amount")), to_cents(extracted.tax_amount)),
            ("total_amount", to_cents(gt.get("total_amount")), to_cents(extracted.total_amount)),
            ("category", gt.get("category_suggestion"), extracted.category_suggestion),
        ]

        for fname, expected, actual in eval_fields:
            total_fields += 1
            is_match = False
            if fname in ["subtotal", "tax_amount", "total_amount"]:
                is_match = (expected == actual)
            else:
                is_match = (str(expected).lower().strip() == str(actual).lower().strip())

            if is_match:
                correct_fields += 1
                status_str = "PASS"
            else:
                status_str = f"FAIL (Expected '{expected}', Got '{actual}')"

            if fname not in field_breakdown:
                field_breakdown[fname] = {"total": 0, "correct": 0}
            field_breakdown[fname]["total"] += 1
            if is_match:
                field_breakdown[fname]["correct"] += 1

            print(f"  [{status_str:4}] {fname:16}: {actual}")
        print()

    overall_accuracy = (correct_fields / total_fields * 100.0) if total_fields else 0
    avg_latency = total_time_ms / len(ground_truth_list)

    print("=" * 70)
    print("EVALUATION SUMMARY")
    print(f"Overall Field Accuracy: {overall_accuracy:.1f}% ({correct_fields}/{total_fields} fields)")
    print(f"Average Inference Latency: {avg_latency:.1f}ms per document")
    print("\nField-by-Field Accuracy:")
    for f, stats in field_breakdown.items():
        pct = (stats["correct"] / stats["total"]) * 100
        print(f"  - {f:16}: {pct:5.1f}% ({stats['correct']}/{stats['total']})")
    print("=" * 70)


if __name__ == "__main__":
    asyncio.run(run_evaluation())
