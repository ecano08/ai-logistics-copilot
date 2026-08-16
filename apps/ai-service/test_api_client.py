import httpx

from api_client import LogisticsApiClient


def test_api_client_returns_api_unavailable_on_request_error(monkeypatch):
    def fake_get(*args, **kwargs):
        raise httpx.RequestError("connection failed")

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
        "error": "api_unavailable",
    }


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