import os
from typing import Literal

from openai import OpenAI
from pydantic import BaseModel

client = OpenAI()

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")


class ShipmentAnalysis(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    main_reason: str
    recommended_action: str

def analyze_shipment_text(prompt: str) -> ShipmentAnalysis:
    response = client.responses.parse(
        model=MODEL,
        input=prompt,
        text_format=ShipmentAnalysis,
    )

    if response.output_parsed is None:
        raise RuntimeError("Unable to parse shipment analysis")

    return response.output_parsed