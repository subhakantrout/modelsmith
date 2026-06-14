# Contributing to ModelSmith

## Setup

```bash
# Backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"

# Frontend
cd frontend && npm install
```

## Development

```bash
# Start both servers
make dev

# Or individually:
make backend-dev   # uvicorn on :8765
make frontend-dev  # vite on :5173
```

## Testing

```bash
make test       # all 143+ backend tests
make test-cov   # with coverage report
```

## Code Style

- **Backend**: Python 3.10+, type hints required, follow existing patterns
- **Frontend**: TypeScript strict mode, Zustand for state, Tailwind v4 for styling
- **Logging**: Use named loggers (`logging.getLogger("modelsmith.module_name")`)
- **Errors**: Raise `HTTPException` in API routes, standard exceptions in core

## Project Structure

```
backend/
  api/     — FastAPI route modules
  core/    — Business logic (no FastAPI dependency)
  tests/   — pytest unit tests
frontend/
  src/
    components/  — React components
    stores/      — Zustand state stores
    lib/         — Utilities (api client, keyboard shortcuts)
    types/       — TypeScript interfaces
```

## Pull Request Checklist

- [ ] Tests pass (`make test`)
- [ ] Frontend builds (`make build`)
- [ ] TypeScript compiles with zero errors
- [ ] No `any` types in new code where avoidable
- [ ] CHANGELOG updated if applicable
