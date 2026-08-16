from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from pydantic import BaseModel

from llm import analyze_shipment_text, chat_with_tools

app = FastAPI()


class ShipmentAnalysisRequest(BaseModel):
    tracking_number: str
    origin: str
    destination: str
    status: str
    temperature: float
    precipitation: float
    wind_speed: float

class ChatRequest(BaseModel):
    message: str


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "ai-service",
    }


@app.post("/analyze-shipment")
def analyze_shipment(request: ShipmentAnalysisRequest):
    prompt = f"""
You are an AI logistics operations assistant.

Analyze this shipment:

Tracking: {request.tracking_number}
Origin: {request.origin}
Destination: {request.destination}
Status: {request.status}
Temperature: {request.temperature} C
Precipitation: {request.precipitation} mm
Wind speed: {request.wind_speed} km/h

Determine the operational risk and recommend the next action.
Be concise and practical.
"""

    analysis = analyze_shipment_text(prompt)

    return {
        "risk_level": analysis.risk_level,
        "main_reason": analysis.main_reason,
        "recommended_action": analysis.recommended_action,
    }

@app.post("/chat")
def chat(request: ChatRequest):
    result = chat_with_tools(request.message)

    return {
        "answer": result.answer,
        "tools_used": result.tools_used,
        "proposed_actions": result.proposed_actions,
    }