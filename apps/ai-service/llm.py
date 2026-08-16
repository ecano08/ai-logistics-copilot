import json
import os
from typing import Literal

from dotenv import load_dotenv
from openai import OpenAI
from pydantic import BaseModel

from tool_schemas import TOOL_SCHEMAS
from tools import execute_tool


load_dotenv()

client = OpenAI()

MODEL = os.getenv("OPENAI_MODEL", "gpt-4.1-mini")

MAX_TOOL_ROUNDS = 5


SYSTEM_INSTRUCTIONS = """
You are a logistics operations copilot.

Use the available tools whenever you need operational data.

Rules:
- Never invent shipments, customers, shipment events, or weather data.
- If requested information cannot be found, say so clearly.
- Distinguish known operational facts from recommendations.
- You are read-only. You cannot modify shipments, customers, or send notifications.
- Be concise and practical.

Shipment identifiers:
- Shipment IDs are numeric internal IDs such as 10.
- Tracking numbers are values such as SHP-1010 and are NOT shipment IDs.
- When the user provides a tracking number, first use list_shipments to find the
  matching shipment and obtain its numeric internal ID.
- Only pass numeric internal shipment IDs to get_shipment,
  get_shipment_events, get_weather, and calculate_delay_risk.

Risk analysis:
- When the user asks about shipment risk, delay risk, which shipments need
  attention, or asks to prioritize shipments by risk, use the
  calculate_delay_risk tool.
- Never invent or estimate a risk score yourself.
- Risk scores and LOW/MEDIUM/HIGH risk levels must come from
  calculate_delay_risk.
- If the user provides a tracking number such as SHP-1010, first resolve it
  to the internal numeric shipment ID using list_shipments, then call
  calculate_delay_risk.
- calculate_delay_risk already retrieves the shipment, shipment events, and weather
  required to calculate the risk.
- When calculate_delay_risk is used, do not separately call get_shipment,
  get_shipment_events, or get_weather unless the user explicitly asks for
  additional details that are not included in the risk result.
- Resolve a tracking number with list_shipments only once. After obtaining the
  numeric internal shipment ID, reuse that ID for subsequent tool calls.
- When comparing multiple shipments, first use list_shipments to identify
  the relevant candidates.
- Calculate delay risk only for the shipments that are relevant to the
  user's request before ranking them.
- Never assign or rank a shipment by risk unless its risk came from
  calculate_delay_risk.
- When calculate_delay_risk returns a recommended_action, use that action as the
  primary operational recommendation.
- Do not replace the recommended_action with a contradictory recommendation.
- You may explain the recommended_action in clearer language, but preserve its
  operational intent.
"""


class ShipmentAnalysis(BaseModel):
    risk_level: Literal["LOW", "MEDIUM", "HIGH"]
    main_reason: str
    recommended_action: str


class ChatResult(BaseModel):
    answer: str
    tools_used: list[str]


def analyze_shipment_text(prompt: str) -> ShipmentAnalysis:
    response = client.responses.parse(
        model=MODEL,
        input=prompt,
        text_format=ShipmentAnalysis,
    )

    if response.output_parsed is None:
        raise RuntimeError("Unable to parse shipment analysis")

    return response.output_parsed


def chat_with_tools(message: str) -> ChatResult:
    response = client.responses.create(
        model=MODEL,
        instructions=SYSTEM_INSTRUCTIONS,
        input=message,
        tools=TOOL_SCHEMAS,
        tool_choice="auto",
    )

    tools_used: list[str] = []

    for _ in range(MAX_TOOL_ROUNDS):
        function_calls = [
            item
            for item in response.output
            if item.type == "function_call"
        ]

        if not function_calls:
            return ChatResult(
                answer=response.output_text,
                tools_used=tools_used,
            )

        tool_outputs = []

        for call in function_calls:
            try:
                arguments = json.loads(call.arguments)
            except json.JSONDecodeError:
                arguments = {}

            result = execute_tool(
                call.name,
                arguments,
            )

            tools_used.append(call.name)

            tool_outputs.append(
                {
                    "type": "function_call_output",
                    "call_id": call.call_id,
                    "output": result,
                }
            )

        response = client.responses.create(
            model=MODEL,
            instructions=SYSTEM_INSTRUCTIONS,
            previous_response_id=response.id,
            input=tool_outputs,
            tools=TOOL_SCHEMAS,
            tool_choice="auto",
        )

    raise RuntimeError("Maximum tool calling rounds exceeded")