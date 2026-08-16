FROM python:3.13-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY main.py .
COPY llm.py .
COPY api_client.py .
COPY tools.py .
COPY tool_schemas.py .
COPY risk.py .
COPY actions.py .

EXPOSE 8000

CMD ["fastapi", "run", "main.py", "--host", "0.0.0.0", "--port", "8000"]