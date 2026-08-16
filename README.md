# AI Logistics Copilot

AI-powered logistics operations copilot that demonstrates how LLMs can safely interact with operational systems, external APIs, deterministic business logic, and human approval workflows.

The project is designed as a portfolio-grade example of an AI-enabled operational system rather than a standalone chatbot.

## What It Does

The copilot helps logistics operators investigate shipments, analyze delay risk, prioritize operational issues, and prepare actions that require human approval.

Example:

```text
Operator asks about shipment SHP-1010
        ↓
LLM resolves the tracking number
        ↓
Node API retrieves operational data
        ↓
Deterministic risk engine evaluates:
- shipment status
- estimated delivery date
- shipment events
- weather conditions
        ↓
Risk: HIGH / Score: 90
        ↓
LLM explains the result
        ↓
Escalation action can be proposed
        ↓
Human approval is required
```

## Key Capabilities

- Shipment and customer lookup
- Shipment event inspection
- External weather data integration
- OpenAI LLM integration
- LLM tool calling
- Multi-step tool workflows
- Deterministic delay-risk scoring
- Shipment prioritization by risk
- Structured operational recommendations
- Human-in-the-loop action proposals
- AI evaluation cases
- Safety checks
- Structured tool-call observability
- Docker-based local environment
- GitHub Actions CI

## Tech Stack

### Frontend

- React
- TypeScript
- Vite

### API

- Node.js
- TypeScript
- Express
- PostgreSQL

### AI Service

- Python
- FastAPI
- OpenAI Responses API
- Pydantic

### Infrastructure

- Docker
- Docker Compose
- GitHub Actions

### External API

- Open-Meteo weather API

## Architecture

```text
┌──────────────────────────┐
│ React + TypeScript       │
│ Operations UI            │
└─────────────┬────────────┘
              │
              ▼
┌──────────────────────────┐
│ Node.js + TypeScript API │
│ Logistics Domain         │
└─────────┬─────────┬──────┘
          │         │
          │         └──────────────► Open-Meteo
          │
          ▼
┌──────────────────────────┐
│ PostgreSQL               │
│ Operational Data         │
└──────────────────────────┘

          Node API
              │
              ▼
┌──────────────────────────┐
│ Python + FastAPI         │
│ AI Service               │
├──────────────────────────┤
│ LLM Tool Calling         │
│ Risk Engine              │
│ Human Approval Actions   │
│ Evals                    │
│ Observability            │
└─────────────┬────────────┘
              │
              ▼
         OpenAI API
```

## Project Structure

```text
ai-logistics-copilot/
├── apps/
│   ├── web/               # React + TypeScript frontend
│   ├── api/               # Node.js + TypeScript logistics API
│   └── ai-service/        # Python + FastAPI AI service
├── .github/
│   └── workflows/
│       └── ci.yml
├── docker-compose.yml
├── .env.example
└── README.md
```

## AI Tool Calling

The LLM does not access operational systems directly.

It can use a controlled set of tools:

```text
list_shipments
get_shipment
get_customer
get_shipment_events
get_weather
calculate_delay_risk
propose_shipment_escalation
```

Tracking numbers such as:

```text
SHP-1010
```

are resolved to internal numeric shipment IDs before tools requiring an internal ID are called.

## Deterministic Risk Engine

Delay risk is calculated by application code rather than invented by the LLM.

The current engine considers:

- Shipment already marked as delayed
- Estimated delivery date already passed
- No shipment events for at least 24 hours
- Heavy precipitation
- Strong winds

The engine returns:

```json
{
  "risk": "HIGH",
  "score": 90,
  "reasons": [
    "Shipment is already marked as delayed.",
    "Estimated delivery date has already passed.",
    "Shipment has had no new events for at least 24 hours."
  ],
  "recommended_action": "Escalate the shipment for immediate operational review."
}
```

Risk levels are:

```text
LOW
MEDIUM
HIGH
```

The LLM explains these results but does not generate the risk score itself.

## Human-in-the-Loop Actions

The AI can prepare operational actions, but it cannot autonomously execute them.

Example proposed action:

```json
{
  "action_type": "ESCALATE_SHIPMENT",
  "shipment_id": 10,
  "reason": "High delay risk requires operational review.",
  "requires_approval": true
}
```

The workflow is:

```text
Risk detected
      ↓
AI proposes action
      ↓
Structured ProposedAction
      ↓
requires_approval = true
      ↓
Human decides
```

This project intentionally separates:

```text
Recommendation
≠
Execution
```

## Safety Principles

The AI service follows several operational safety rules:

- Never invent shipment, customer, event, or weather data.
- Risk scores must come from the deterministic risk engine.
- Operational facts and recommendations are kept separate.
- Proposed escalations always require human approval.
- The LLM cannot claim an action was executed without an execution tool confirming it.
- Tool access is explicitly defined and limited.

## AI Evaluations

The project includes evaluation cases that validate expected AI behavior.

Current scenarios include:

```text
shipment_status_lookup
shipment_risk_analysis
high_risk_action_proposal
no_autonomous_execution
```

The eval system checks:

- Required tools were used.
- Forbidden tools were not used.
- Proposed actions preserve human approval.
- Unsafe actions fail evaluation.

Example:

```text
Prompt
  ↓
LLM + tools
  ↓
Expected tools?
Forbidden tools?
Unsafe actions?
  ↓
PASS / FAIL
```

## Observability

Tool execution emits structured JSON events.

Example:

```json
{
  "event": "tool_call_started",
  "tool": "calculate_delay_risk",
  "arguments": {
    "shipment_id": 10
  }
}
```

and:

```json
{
  "event": "tool_call_finished",
  "tool": "calculate_delay_risk",
  "success": true
}
```

This makes agent behavior inspectable instead of treating the LLM as a black box.

## Example Questions

The copilot can answer questions such as:

```text
What is happening with shipment SHP-1010?
```

```text
What is the delay risk for shipment SHP-1010?
```

```text
Which 3 shipments should I worry about most right now?
```

```text
What is the risk for shipment SHP-1010 and what should operations do about it?
```

```text
Shipment SHP-1010 is high risk. Prepare the appropriate action.
```

## Run Locally

### Requirements

- Docker Desktop
- Docker Compose
- OpenAI API key

Configure the required environment variables before starting the services.

Then run:

```bash
docker compose up --build
```

Services are available at:

### Web

```text
http://localhost:5173
```

### Node API

```text
http://localhost:3000
```

Health check:

```text
http://localhost:3000/health
```

### AI Service

```text
http://localhost:8000
```

Health check:

```text
http://localhost:8000/health
```

FastAPI documentation:

```text
http://localhost:8000/docs
```

## Testing

### AI Service

From:

```text
apps/ai-service
```

activate the Python virtual environment and run:

```bash
pytest -v
```

The current AI service suite contains **23 tests** covering:

- API client failures
- Tool calling
- Sequential tool calls
- Tool safety
- Maximum tool-call rounds
- FastAPI endpoints
- Deterministic risk scoring
- Evaluation logic
- Human approval safety

### Node API

```bash
cd apps/api
npm test
```

### Web

```bash
cd apps/web
npm run lint
npm run build
```

## Continuous Integration

GitHub Actions validates:

```text
Web
├── npm ci
├── lint
└── build

API
├── npm ci
├── tests
└── build

AI Service
├── dependency install
└── pytest

Docker
├── web image build
├── API image build
└── AI service image build
```

No production OpenAI credentials are required for the automated Python test suite.

## Design Philosophy

This project explores a practical pattern for production AI systems:

```text
LLM reasoning
+
controlled tools
+
deterministic business logic
+
external APIs
+
human approval
+
evals
+
observability
```

The goal is not to let an LLM control logistics operations autonomously.

The goal is to use AI as an operational copilot while keeping business rules, safety boundaries, and final decisions under application and human control.

## Project Status

Implemented:

- Project architecture and Docker environment
- Logistics domain API
- React operations interface
- PostgreSQL integration
- Weather API integration
- OpenAI integration
- LLM tool calling
- Multi-step AI workflows
- Deterministic shipment risk analysis
- Shipment risk prioritization
- Human-in-the-loop escalation proposals
- AI safety evaluations
- Structured observability
- Automated tests
- GitHub Actions CI

The project is currently in its final portfolio-polish phase.