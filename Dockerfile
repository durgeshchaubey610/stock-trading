# Production Dockerfile for FastAPI Backend
FROM python:3.11-slim

# Prevent writing .pyc files and enable unbuffered output
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    APP_HOME=/app

WORKDIR $APP_HOME

# Install essential system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies (with CPU-optimized torch to keep image light and fast)
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir --extra-index-url https://download.pytorch.org/whl/cpu -r requirements.txt

# Copy wait script, helper scripts, and application code
COPY wait_for_db.py .
COPY run.py .
COPY populate_baskets.py .
COPY update_db.py .
COPY reset_db.py .
COPY app ./app

# Expose the API port
EXPOSE 8000

# Wait for DB to be healthy and ready, then launch uvicorn
CMD ["sh", "-c", "python wait_for_db.py && uvicorn app.main:app --host 0.0.0.0 --port 8000"]
