TOOL_SCHEMAS = [
    {
        "type": "function",
        "name": "list_shipments",
        "description": "List shipments available in the logistics system.",
        "parameters": {
            "type": "object",
            "properties": {},
            "required": [],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_shipment",
        "description": (
            "Get detailed information about one shipment using its numeric internal "
            "shipment ID, for example 10. Do not pass tracking numbers such as SHP-1010. "
            "If you only know a tracking number, use list_shipments first."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "shipment_id": {
                    "type": "integer",
                    "description": "Numeric shipment ID.",
                }
            },
            "required": ["shipment_id"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_customer",
        "description": "Get a customer by its numeric customer ID.",
        "parameters": {
            "type": "object",
            "properties": {
                "customer_id": {
                    "type": "integer",
                    "description": "Numeric customer ID.",
                }
            },
            "required": ["customer_id"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_shipment_events",
        "description": (
            "Get the event history for a shipment using its numeric internal shipment ID. "
            "Do not pass tracking numbers such as SHP-1010."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "shipment_id": {
                    "type": "integer",
                    "description": "Numeric shipment ID.",
                }
            },
            "required": ["shipment_id"],
            "additionalProperties": False,
        },
        "strict": True,
    },
    {
        "type": "function",
        "name": "get_weather",
        "description": (
            "Get current weather information associated with a shipment destination "
            "using its numeric internal shipment ID. Do not pass tracking numbers such "
            "as SHP-1010. Use list_shipments first when necessary."
        ),
        "parameters": {
            "type": "object",
            "properties": {
                "shipment_id": {
                    "type": "integer",
                    "description": "Numeric shipment ID.",
                }
            },
            "required": ["shipment_id"],
            "additionalProperties": False,
        },
        "strict": True,
    },
]