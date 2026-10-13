import pytest
from app.validation.deterministic_rules import to_cents, format_cents


def test_to_cents_conversion():
    assert to_cents("100.00") == 10000
    assert to_cents("$1,250.50") == 125050
    assert to_cents("€45.99") == 4599
    assert to_cents("0") == 0
    assert to_cents(None) == 0
    assert to_cents("invalid") == 0


def test_format_cents_display():
    assert format_cents(10000, "USD") == "$100.00"
    assert format_cents(125050, "USD") == "$1250.50"
    assert format_cents(4599, "EUR") == "€45.99"
    assert format_cents(350, "GBP") == "£3.50"


def test_arithmetic_consistency_logic():
    # Test that integer arithmetic does not suffer floating point inaccuracies
    subtotal_cents = to_cents("0.10")  # 10 cents
    tax_cents = to_cents("0.20")       # 20 cents
    total_cents = to_cents("0.30")     # 30 cents

    assert subtotal_cents + tax_cents == total_cents

    # Test mismatch detection
    mismatched_total_cents = to_cents("0.35")
    assert subtotal_cents + tax_cents != mismatched_total_cents
