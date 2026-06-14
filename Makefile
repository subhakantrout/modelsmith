.PHONY: dev test test-cov build frontend-dev backend-dev lint clean

BACKEND_PID = .backend.pid

dev:
	@echo "Starting backend..."
	uvicorn backend.main:app --port 8765 --reload &
	echo $$! > $(BACKEND_PID)
	@echo "Starting frontend..."
	cd frontend && npm run dev &
	@echo "Backend: http://localhost:8765"
	@echo "Frontend: http://localhost:5173"
	@echo "API Docs: http://localhost:8765/docs"

backend-dev:
	uvicorn backend.main:app --port 8765 --reload

frontend-dev:
	cd frontend && npm run dev

test:
	. .venv/bin/activate && python -m pytest backend/tests/ -v

test-cov:
	. .venv/bin/activate && python -m pytest backend/tests/ --cov=backend --cov-report=term

build:
	cd frontend && npm run build

lint:
	cd frontend && npm run lint

clean:
	rm -rf frontend/dist
	rm -rf .pytest_cache
	rm -rf __pycache__
	find . -type d -name __pycache__ -exec rm -rf {} + 2>/dev/null || true

stop:
	@if [ -f $(BACKEND_PID) ]; then \
		kill `cat $(BACKEND_PID)` 2>/dev/null || true; \
		rm -f $(BACKEND_PID); \
	fi
