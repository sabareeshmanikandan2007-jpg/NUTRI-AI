#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────
# NutriAI — Linux/macOS Start Script
# Run from the project root:  bash start.sh
# ─────────────────────────────────────────────────────────────────

set -e
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT"

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   NutriAI Diet Planner — Starting All Services${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""

# ── 1. MongoDB ────────────────────────────────────────────────────
echo -e "${YELLOW}[1/4] Starting MongoDB...${NC}"
mkdir -p "$ROOT/data"
mongod --dbpath "$ROOT/data" --port 27017 --fork \
    --logpath "$ROOT/data/mongod.log" 2>/dev/null \
    || echo "  (mongod may already be running)"
echo -e "${GREEN}      MongoDB  → localhost:27017${NC}"

# ── 2. FastAPI ────────────────────────────────────────────────────
echo -e "${YELLOW}[2/4] Starting FastAPI backend...${NC}"
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000 --reload &
FASTAPI_PID=$!
sleep 2
echo -e "${GREEN}      FastAPI  → http://127.0.0.1:8000${NC}"
echo -e "${GREEN}      API Docs → http://127.0.0.1:8000/docs${NC}"

# ── 3. Express proxy ──────────────────────────────────────────────
echo -e "${YELLOW}[3/4] Starting Express API proxy...${NC}"
(cd "$ROOT/backend" && node api/server.js) &
EXPRESS_PID=$!
sleep 1
echo -e "${GREEN}      Express  → http://localhost:8787${NC}"

# ── 4. Vite frontend ──────────────────────────────────────────────
echo -e "${YELLOW}[4/4] Starting Vite frontend...${NC}"
npm run dev &
VITE_PID=$!
sleep 2
echo -e "${GREEN}      Frontend → http://localhost:5173${NC}"

echo ""
echo -e "${CYAN}================================================${NC}"
echo -e "${CYAN}   All services started!${NC}"
echo ""
echo -e "   Open: ${GREEN}http://localhost:5173${NC}"
echo -e "${CYAN}================================================${NC}"
echo ""
echo "PIDs: FastAPI=$FASTAPI_PID  Express=$EXPRESS_PID  Vite=$VITE_PID"
echo "To stop all:  kill $FASTAPI_PID $EXPRESS_PID $VITE_PID"
echo ""

# Keep script alive — Ctrl+C stops everything
wait
