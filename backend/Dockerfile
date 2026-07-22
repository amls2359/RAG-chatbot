FROM python:3.11-slim

WORKDIR /app

# Install system dependencies needed by some Python packages (e.g. faiss, sentence-transformers)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Python dependencies first (better Docker layer caching —
# this step only re-runs when requirements.txt actually changes)
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download the HuggingFace embedding model at build time,
# so it's baked into the image instead of re-downloading on every cold start
RUN python -c "from langchain_huggingface import HuggingFaceEmbeddings; HuggingFaceEmbeddings(model_name='sentence-transformers/all-MiniLM-L6-v2')"

# Now copy the rest of the application code
COPY . .

# Ensure Python logs show up immediately in Render's log viewer
ENV PYTHONUNBUFFERED=1

EXPOSE 8000

# Render assigns the actual port via $PORT at runtime — shell form (no brackets)
# is required here so the environment variable gets substituted correctly
CMD uvicorn main:app --host 0.0.0.0 --port $PORT