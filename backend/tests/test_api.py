import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.core.database import Base, engine


def test_root_endpoint():
    with TestClient(app) as client:
        res = client.get("/")
        assert res.status_code == 200
        data = res.json()
        assert data["app"] == "BillSathi"
        assert data["concept"] == "Proof Before Trust"


def test_system_health():
    with TestClient(app) as client:
        res = client.get("/api/system/health")
        assert res.status_code == 200
        data = res.json()
        assert data["status"] == "healthy"
        assert "ai" in data


def test_dashboard_stats():
    with TestClient(app) as client:
        res = client.get("/api/system/dashboard")
        assert res.status_code == 200
        data = res.json()
        assert "total_documents" in data
        assert "unresolved_anomalies" in data


def test_demo_seed_and_verification_workflow():
    with TestClient(app) as client:
        # 1. Reset database first for clean testing
        client.post("/api/system/reset")

        # 2. Seed the synthetic demonstration invoices
        seed_res = client.post("/api/system/seed-demo")
        assert seed_res.status_code == 200
        seed_data = seed_res.json()
        assert len(seed_data["documents"]) == 3

        # 3. Check dashboard reflects seeded data
        dash_res = client.get("/api/system/dashboard")
        assert dash_res.status_code == 200
        dash_data = dash_res.json()
        assert dash_data["total_documents"] >= 3
        assert dash_data["unresolved_anomalies"] >= 1

        # 4. Check documents listing
        docs_res = client.get("/api/documents")
        assert docs_res.status_code == 200
        docs = docs_res.json()
        assert len(docs) >= 3

        # 5. Check that one document has an arithmetic anomaly
        anom_res = client.get("/api/anomalies")
        assert anom_res.status_code == 200
        anomalies = anom_res.json()
        arithmetic_anomalies = [a for a in anomalies if a["rule_code"] == "ARITHMETIC_MISMATCH"]
        assert len(arithmetic_anomalies) >= 1

        # 6. Check CSV export
        csv_res = client.get("/api/export/csv")
        assert csv_res.status_code == 200
        assert "text/csv" in csv_res.headers["content-type"]
        assert "Document_ID" in csv_res.text
        assert "Acme Cloud Infrastructure" in csv_res.text
