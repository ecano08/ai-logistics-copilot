from datetime import datetime, timezone
from typing import Any

from pydantic import BaseModel


class DelayRiskResult(BaseModel):
    risk: str
    score: int
    reasons: list[str]
    recommended_action: str


def calculate_delay_risk(
    shipment: dict[str, Any],
    events: list[dict[str, Any]],
    weather: dict[str, Any] | None = None,
) -> DelayRiskResult:
    score = 0
    reasons: list[str] = []

    status = shipment.get("status")

    if status == "delayed":
        score += 50
        reasons.append("Shipment is already marked as delayed.")

    estimated_delivery = shipment.get("estimated_delivery")

    if estimated_delivery:
        eta = datetime.fromisoformat(
            estimated_delivery.replace("Z", "+00:00")
        )

        if eta < datetime.now(timezone.utc):
            score += 25
            reasons.append("Estimated delivery date has already passed.")

    if events:
        latest_event = events[-1]
        occurred_at = latest_event.get("occurred_at")

        if occurred_at:
            event_time = datetime.fromisoformat(
                occurred_at.replace("Z", "+00:00")
            )

            hours_since_event = (
                datetime.now(timezone.utc) - event_time
            ).total_seconds() / 3600

            if hours_since_event >= 24:
                score += 15
                reasons.append(
                    "Shipment has had no new events for at least 24 hours."
                )

    if weather:
        precipitation = weather.get("precipitation", 0)
        wind_speed = weather.get("windSpeed", 0)

        if precipitation >= 20:
            score += 10
            reasons.append("Heavy precipitation may affect the route.")

        if wind_speed >= 50:
            score += 10
            reasons.append("Strong winds may affect transportation.")

    score = min(score, 100)

    if score >= 70:
        risk = "HIGH"
    elif score >= 35:
        risk = "MEDIUM"
    else:
        risk = "LOW"

    if risk == "HIGH":
        recommended_action = (
            "Escalate the shipment for immediate operational review."
        )
    elif risk == "MEDIUM":
        recommended_action = (
            "Monitor the shipment closely and review recent operational events."
        )
    else:
        recommended_action = (
            "Continue normal monitoring."
        )

    return DelayRiskResult(
        risk=risk,
        score=score,
        reasons=reasons,
        recommended_action=recommended_action,
    )