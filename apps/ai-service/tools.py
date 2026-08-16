import json
from typing import Any, Callable

from api_client import LogisticsApiClient
from risk import calculate_delay_risk


api = LogisticsApiClient()


def list_shipments() -> Any:
    return api.list_shipments()


def get_shipment(shipment_id: int) -> Any:
    return api.get_shipment(shipment_id)


def get_customer(customer_id: int) -> Any:
    return api.get_customer(customer_id)


def get_shipment_events(shipment_id: int) -> Any:
    return api.get_shipment_events(shipment_id)


def get_weather(shipment_id: int) -> Any:
    return api.get_weather(shipment_id)

def calculate_delay_risk_tool(shipment_id: int) -> Any:
    shipment = get_shipment(shipment_id)

    if isinstance(shipment, dict) and shipment.get("ok") is False:
        return shipment

    events = get_shipment_events(shipment_id)

    if isinstance(events, dict) and events.get("ok") is False:
        return events

    weather = get_weather(shipment_id)

    if isinstance(weather, dict) and weather.get("ok") is False:
        weather = None

    result = calculate_delay_risk(
        shipment=shipment,
        events=events,
        weather=weather,
    )

    return result.model_dump()

TOOL_HANDLERS: dict[str, Callable[..., Any]] = {
    "list_shipments": list_shipments,
    "get_shipment": get_shipment,
    "get_customer": get_customer,
    "get_shipment_events": get_shipment_events,
    "get_weather": get_weather,
    "calculate_delay_risk": calculate_delay_risk_tool,
}


def execute_tool(name: str, arguments: dict[str, Any]) -> str:
    handler = TOOL_HANDLERS.get(name)

    if handler is None:
        return json.dumps({
            "ok": False,
            "error": "unknown_tool",
        })

    try:
        result = handler(**arguments)

        return json.dumps(
            result,
            ensure_ascii=False,
            default=str,
        )

    except TypeError:
        return json.dumps({
            "ok": False,
            "error": "invalid_tool_arguments",
        })