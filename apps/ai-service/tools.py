import json
from typing import Any, Callable

from api_client import LogisticsApiClient


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


TOOL_HANDLERS: dict[str, Callable[..., Any]] = {
    "list_shipments": list_shipments,
    "get_shipment": get_shipment,
    "get_customer": get_customer,
    "get_shipment_events": get_shipment_events,
    "get_weather": get_weather,
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