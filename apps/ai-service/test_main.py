import os
from types import SimpleNamespace

os.environ.setdefault("OPENAI_API_KEY", "test-api-key")

from fastapi.testclient import TestClient

import main
from main import app


client = TestClient(app)


def test_health():
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "ai-service",
    }


def test_analyze_shipment(monkeypatch):
    def fake_analyze_shipment_text(prompt: str):
        assert "SHP-1001" in prompt
        assert "Morelia, Michoacan" in prompt
        assert "Ciudad de Mexico" in prompt
        assert "18.6 C" in prompt
        assert "0.5 mm" in prompt
        assert "8.6 km/h" in prompt

        return SimpleNamespace(
            risk_level="LOW",
            main_reason="Weather conditions are stable.",
            recommended_action="Continue monitoring the shipment.",
        )

    monkeypatch.setattr(
        main,
        "analyze_shipment_text",
        fake_analyze_shipment_text,
    )

    response = client.post(
        "/analyze-shipment",
        json={
            "tracking_number": "SHP-1001",
            "origin": "Morelia, Michoacan",
            "destination": "Ciudad de Mexico",
            "status": "in_transit",
            "temperature": 18.6,
            "precipitation": 0.5,
            "wind_speed": 8.6,
        },
    )

    assert response.status_code == 200
    assert response.json() == {
        "risk_level": "LOW",
        "main_reason": "Weather conditions are stable.",
        "recommended_action": "Continue monitoring the shipment.",
    }