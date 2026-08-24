# AI Logistics Copilot

AI Logistics Copilot is a project exploring how AI can support logistics teams when operational decisions depend on changing conditions, external information, and human judgment.

The goal is not to automate logistics blindly, but to understand how AI can help people **identify risks earlier, gather relevant context, recommend actions, and make better operational decisions while keeping humans in control**.

> **Active Development** — The project is currently under construction. The core architecture is in place, and logistics workflows, external data integrations, AI reasoning, and human-in-the-loop capabilities are being added incrementally.

## Why I Built This

Logistics interested me because it is a good example of a real-world environment where software has to deal with uncertainty.

A shipment can be planned correctly and still be affected by weather, delays, changing conditions, external services, or operational decisions made during the day.

That led me to a question:

**Could AI help an operations team understand what is happening, identify potential risks, and recommend what to do next without taking control away from the people responsible for the operation?**

I started AI Logistics Copilot to explore that problem.

Rather than building an AI assistant that only answers questions, I wanted to understand what happens when an AI system has to work with real operational data, external information, business rules, and actions that may have consequences.

The project is also a way for me to learn how AI systems should behave when the answer is not always obvious.

As I build it, I am exploring questions such as:

- How much context does an AI system need before making a useful recommendation?
- How should it communicate uncertainty or risk?
- Which decisions can be automated safely?
- Which actions should always require human approval?
- How can we measure whether an AI recommendation is actually useful?

The biggest idea behind the project is simple:

**AI should help people make better decisions, not remove them from the decision-making process.**

AI Logistics Copilot is still evolving, and the development process itself is part of what I want the project to demonstrate: taking an idea, turning it into a working system, testing its limitations, and improving it incrementally.

## What This Project Demonstrates

- **Problem-driven product thinking** — Starting from an operational problem rather than adding AI to an application without a clear reason.
- **End-to-end engineering** — Building the frontend, backend, AI service, database, infrastructure, testing, and CI as one system.
- **Applied AI** — Exploring LLMs, tool calling, external data, and AI-assisted operational reasoning.
- **Human-centered automation** — Designing workflows where AI can recommend actions while important decisions remain under human control.
- **Reliability mindset** — Treating testing, observability, failure handling, and evaluation as part of the AI system itself.
- **Incremental development** — Building the project through focused milestones instead of treating it as a one-shot prototype.

## The Problem

Logistics operations often depend on information coming from multiple places:

- shipment and delivery data
- operational status
- weather conditions
- external services
- delays and exceptions
- business rules
- human decisions

The long-term goal of AI Logistics Copilot is to bring that context together so an operations user can move from:

**event → context → risk → recommendation → human decision → action**

The AI should assist that process rather than make sensitive operational decisions independently.

## Planned Workflow

A typical future workflow could look like this:

1. A shipment or operational event is detected.
2. The system gathers relevant shipment and external context.
3. The AI analyzes possible risks or exceptions.
4. It explains what it found and proposes an action.
5. A human reviews the recommendation when required.
6. The approved action is executed.
7. The result can later be evaluated and observed.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Frontend | React, TypeScript |
| API | Node.js, TypeScript, Express |
| AI Service | Python, FastAPI |
| Database | PostgreSQL |
| Infrastructure | Docker |
| CI | GitHub Actions |

## Architecture

```text
React + TypeScript
        ↓
Node.js + TypeScript
        ↓
PostgreSQL

Node.js + TypeScript
        ↓
Python + FastAPI
        ↓
LLM / Tool Calling
```

The Node.js API acts as the main application layer, while the Python service isolates AI-specific workloads and future LLM/tool integrations.

## Project Structure

```text
apps/
├── web/          React + TypeScript
├── api/          Node.js + TypeScript
└── ai-service/   Python + FastAPI
```

## Current Status

### PR1 — Bootstrap and Project Architecture

The first milestone establishes the foundation for the project.

Implemented:

- React frontend
- Node.js API
- FastAPI AI service
- PostgreSQL
- Docker Compose
- Service health checks
- Node → PostgreSQL communication
- Node → FastAPI communication
- React → Node communication
- Automated tests
- GitHub Actions CI

The current milestone focuses on infrastructure and service communication. Logistics-specific intelligence and AI workflows are intentionally being introduced in later PRs.

## Development Roadmap

The next stages will move the project from technical foundation toward the full logistics copilot workflow.

### Planned

- Logistics domain models
- Shipment APIs
- Operations dashboard
- External weather integration
- LLM integration
- Tool calling
- Shipment risk analysis
- Context-aware recommendations
- Human-in-the-loop actions
- AI evaluations
- Observability
- Failure and fallback handling

The roadmap will continue evolving as the system is tested against more realistic operational scenarios.

## Run Locally

```bash
docker compose up --build
```

Then open:

**Web**

```text
http://localhost:5173
```

**API Health**

```text
http://localhost:3000/health
```

**AI Service Health**

```text
http://localhost:3000/health/ai
```

## Project Status

AI Logistics Copilot is an **active portfolio project under development**.

The current repository represents the working state of the project as capabilities are added incrementally through pull requests. Some planned AI and logistics workflows are not implemented yet and are intentionally documented as roadmap items.
