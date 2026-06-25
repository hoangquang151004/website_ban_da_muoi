#!/bin/sh
set -e

cd /app
alembic upgrade head

uvicorn app.main:app --host 127.0.0.1 --port 8000 &

cd /app/frontend
exec env HOSTNAME=0.0.0.0 PORT="${PORT:-3000}" node server.js
