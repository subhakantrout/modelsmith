# Setup Guide

## Prerequisites
- Python 3.13
- Node.js (for frontend)
- NVIDIA GPU with driver 550+ (optional, for GPU acceleration)

## Backend Setup
```bash
cd modelsmith
python3 -m venv .venv
source .venv/bin/activate
pip install fastapi uvicorn transformers torch bitsandbytes accelerate mergekit peft safetensors huggingface_hub psutil httpx pydantic pytest
```

## Frontend Setup
```bash
cd modelsmith/frontend
npm install
```

## Running

### Backend (terminal 1)
```bash
cd modelsmith
source .venv/bin/activate
uvicorn backend.main:app --port 8765 --reload
```

### Frontend (terminal 2)
```bash
cd modelsmith/frontend
npm run dev
```

Open http://localhost:5173 in browser.

## GPU Acceleration

### Check current state
```bash
nvidia-smi
python3 -c "import torch; print(torch.cuda.is_available())"
```

### If CUDA mismatch
The NVIDIA driver must support the CUDA version PyTorch was compiled with:
```bash
# Check driver CUDA version
nvidia-smi | grep "CUDA Version"
# Check PyTorch CUDA version
python3 -c "import torch; print(torch.version.cuda)"
```

If there's a mismatch, either:
1. Download a newer driver from https://www.nvidia.com/Download/index.aspx
2. Or install a PyTorch version matching your driver: `pip install torch==2.5.1+cu124 --index-url https://download.pytorch.org/whl/cu124`

## Testing
```bash
cd modelsmith
source .venv/bin/activate
python3 -m pytest backend/tests/ -v
```

Expected: 143 passed, 1 warning (CUDA initialization).

## Project Structure
```
modelsmith/
  backend/     — Python FastAPI server
  frontend/    — React + Vite + TypeScript
  models/      — Downloaded models (gitignored)
  doc/         — Documentation
  docs/        — Superpowers skill files
  AGENTS.md    — AI assistant context
  README.md    — User-facing readme
```
