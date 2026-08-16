from typing import Literal

from pydantic import BaseModel


class ProposedAction(BaseModel):
    action_type: Literal["ESCALATE_SHIPMENT"]
    shipment_id: int
    reason: str
    requires_approval: bool = True


def propose_shipment_escalation(
    shipment_id: int,
    reason: str,
) -> ProposedAction:
    return ProposedAction(
        action_type="ESCALATE_SHIPMENT",
        shipment_id=shipment_id,
        reason=reason,
        requires_approval=True,
    )