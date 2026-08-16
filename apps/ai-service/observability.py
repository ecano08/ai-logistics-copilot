import json
import logging
from typing import Any


logger = logging.getLogger("ai-logistics-copilot")

if not logger.handlers:
    handler = logging.StreamHandler()
    logger.addHandler(handler)

logger.setLevel(logging.INFO)


def log_event(
    event: str,
    **data: Any,
) -> None:
    payload = {
        "event": event,
        **data,
    }

    logger.info(
        json.dumps(
            payload,
            default=str,
        )
    )