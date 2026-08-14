# AI Logistics Copilot

AI-powered logistics operations copilot built to explore how LLMs can safely interact with operational systems, external APIs and human workflows.

## Tech Stack

- React
- TypeScript
- Node.js
- Express
- Python
- FastAPI
- PostgreSQL
- Docker
- GitHub Actions

## Architecture

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

## Project Structure

apps/
├── web/          React + TypeScript
├── api/          Node.js + TypeScript
└── ai-service/   Python + FastAPI

## Current Status

PR1 — Bootstrap and project architecture.

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

## Run Locally

Run:

docker compose up --build

Then open:

Web:
http://localhost:5173

API:
http://localhost:3000/health

AI Service:
http://localhost:3000/health/ai

## Development Roadmap

Upcoming work:

- Logistics domain models
- Shipment APIs
- Operations dashboard
- External weather API
- LLM integration
- Tool calling
- AI risk analysis
- Human-in-the-loop actions
- AI evaluations and observability