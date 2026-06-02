# Full-stack: Next.js (public) + FastAPI (internal :8000)
# Deploy: Railway detects this Dockerfile at repo root.

# --- Stage 1: Build Next.js standalone ---
FROM node:20-alpine AS frontend-builder

WORKDIR /app/frontend

COPY frontend/package.json frontend/package-lock.json* ./
RUN npm ci

COPY frontend/ .

ENV NEXT_PUBLIC_API_URL=/api/v1
ENV INTERNAL_API_URL=http://127.0.0.1:8000/api/v1

RUN npm run build

# --- Stage 2: Python runtime + Next standalone ---
FROM python:3.11-slim AS runtime

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    default-libmysqlclient-dev \
    ca-certificates \
    curl \
    && curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
    && apt-get install -y --no-install-recommends nodejs \
    && rm -rf /var/lib/apt/lists/*

COPY backend/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY backend/ .

COPY --from=frontend-builder /app/frontend/.next/standalone ./frontend/
COPY --from=frontend-builder /app/frontend/.next/static ./frontend/.next/static
COPY --from=frontend-builder /app/frontend/public ./frontend/public

COPY scripts/docker-entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

RUN mkdir -p static/uploads chroma_db

ENV PORT=3000
EXPOSE 3000

ENTRYPOINT ["/entrypoint.sh"]
