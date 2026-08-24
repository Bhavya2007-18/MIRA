FROM python:3.12-slim

WORKDIR /app

COPY ml/pyproject.toml ml/README.md ./
COPY ml/mira_ml/ ./mira_ml/

RUN pip install --no-cache-dir -e .

EXPOSE 8000

CMD ["uvicorn", "mira_ml.api.app:app", "--host", "0.0.0.0", "--port", "8000"]
