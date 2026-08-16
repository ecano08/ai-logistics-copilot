import os
from typing import Any

import httpx


API_BASE_URL = os.getenv("API_BASE_URL", "http://127.0.0.1:3000")
API_TIMEOUT = 10.0


class LogisticsApiClient:
    def __init__(
        self,
        base_url: str = API_BASE_URL,
        timeout: float = API_TIMEOUT,
    ):
        self.base_url = base_url.rstrip("/")
        self.timeout = timeout

    def _get(self, path: str) -> dict[str, Any] | list[dict[str, Any]]:
        try:
            response = httpx.get(
                f"{self.base_url}{path}",
                timeout=self.timeout,
            )

            if response.status_code == 404:
                return {
                    "ok": False,
                    "error": "not_found",
                }

            if response.status_code >= 400:
                return {
                    "ok": False,
                    "error": "api_error",
                }

            return response.json()

        except httpx.TimeoutException:
            return {
                "ok": False,
                "error": "api_timeout",
            }

        except httpx.RequestError:
            return {
                "ok": False,
                "error": "api_unavailable",
            }

        except ValueError:
            return {
                "ok": False,
                "error": "invalid_api_response",
            }

    def list_shipments(self):
        return self._get("/shipments")

    def get_shipment(self, shipment_id: int):
        return self._get(f"/shipments/{shipment_id}")

    def get_customer(self, customer_id: int):
        return self._get(f"/customers/{customer_id}")

    def get_shipment_events(self, shipment_id: int):
        return self._get(f"/shipments/{shipment_id}/events")

    def get_weather(self, shipment_id: int):
        return self._get(f"/shipments/{shipment_id}/weather")

def test_api_client_returns_not_found_on_404(monkeypatch):
    class FakeResponse:
        status_code = 404

        def json(self):
            return {}

    monkeypatch.setattr(
        httpx,
        "get",
        lambda *args, **kwargs: FakeResponse(),
    )

    client = LogisticsApiClient(
        base_url="http://api:3000",
    )

    result = client.get_shipment(999)

    assert result == {
        "ok": False,
        "error": "not_found",
    }


def test_api_client_returns_api_timeout(monkeypatch):
    def fake_get(*args, **kwargs):
        raise httpx.TimeoutException("timeout")

    monkeypatch.setattr(
        httpx,
        "get",
        fake_get,
    )

    client = LogisticsApiClient(
        base_url="http://api:3000",
    )

    result = client.get_shipment(10)

    assert result == {
        "ok": False,
        "error": "api_timeout",
    }


def test_api_client_returns_api_error_on_server_error(monkeypatch):
    class FakeResponse:
        status_code = 500

        def json(self):
            return {}

    monkeypatch.setattr(
        httpx,
        "get",
        lambda *args, **kwargs: FakeResponse(),
    )

    client = LogisticsApiClient(
        base_url="http://api:3000",
    )

    result = client.get_shipment(10)

    assert result == {
        "ok": False,
        "error": "api_error",
    }


def test_api_client_returns_invalid_api_response(monkeypatch):
    class FakeResponse:
        status_code = 200

        def json(self):
            raise ValueError("invalid json")

    monkeypatch.setattr(
        httpx,
        "get",
        lambda *args, **kwargs: FakeResponse(),
    )

    client = LogisticsApiClient(
        base_url="http://api:3000",
    )

    result = client.get_shipment(10)

    assert result == {
        "ok": False,
        "error": "invalid_api_response",
    }