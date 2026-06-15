import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, JSONResponse
import os
from backend.api.system import router as system_router
from backend.api.models import router as models_router
from backend.api.analyze import router as analyze_router
from backend.api.abliterate import router as abliterate_router
from backend.api.export import router as export_router
from backend.api.chat import router as chat_router
from backend.api.pipeline import router as pipeline_router
from backend.api.merge import router as merge_router
from backend.api.lora import router as lora_router
from backend.api.compress import router as compress_router
from backend.api.project import router as project_router
from backend.api.advisor import router as advisor_router
from backend.api.ws import router as ws_router
from backend.api.activation_stream import router as activation_stream_router
from backend.api.advisor_ext import router as advisor_ext_router
from backend.api.provenance import router as provenance_router
from backend.api.pipeline_ext import router as pipeline_ext_router
from backend.api.marketplace import router as marketplace_router
from backend.api.ab_test import router as ab_test_router
from backend.api.node_group import router as node_group_router
from backend.core.security import get_api_key, validate_api_key

logger = logging.getLogger("modelsmith")

PUBLIC_PATHS = {"/api/health", "/api/session-key", "/docs", "/openapi.json"}


@asynccontextmanager
async def lifespan(app: FastAPI):
    api_key = get_api_key()
    logger.info(f"ModelSmith backend starting... (API key: {api_key[:8]}...)")
    yield
    logger.info("ModelSmith backend shutting down...")


app = FastAPI(title="ModelSmith", version="1.0.0", lifespan=lifespan)


@app.middleware("http")
async def api_key_middleware(request: Request, call_next):
    if request.method == "OPTIONS":
        return await call_next(request)

    path = request.url.path
    if path in PUBLIC_PATHS or path.startswith("/api/ws") or path.startswith("/assets"):
        return await call_next(request)

    key = request.headers.get("X-Api-Key", "")
    if not validate_api_key(key):
        return JSONResponse(
            status_code=401,
            content={"detail": "Missing or invalid API key. Set X-Api-Key header."},
        )

    return await call_next(request)


@app.get("/api/session-key")
async def session_key():
    return {"key": get_api_key()}


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8765"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "X-Api-Key", "X-HF-Token"],
)


app.include_router(system_router)
app.include_router(models_router)
app.include_router(analyze_router)
app.include_router(abliterate_router)
app.include_router(export_router)
app.include_router(chat_router)
app.include_router(pipeline_router)
app.include_router(merge_router)
app.include_router(lora_router)
app.include_router(compress_router)
app.include_router(project_router)
app.include_router(advisor_router)
app.include_router(ws_router)
app.include_router(activation_stream_router)
app.include_router(advisor_ext_router)
app.include_router(provenance_router)
app.include_router(pipeline_ext_router)
app.include_router(marketplace_router)
app.include_router(ab_test_router)
app.include_router(node_group_router)


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "1.0.0"}


# Mount frontend static files if they exist (for production deployment)
frontend_dist = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "frontend", "dist")
if os.path.isdir(frontend_dist):
    app.mount("/assets", StaticFiles(directory=os.path.join(frontend_dist, "assets")), name="assets")
    
    @app.get("/{catchall:path}")
    async def serve_frontend(catchall: str):
        # Serve index.html for unknown routes to support SPA routing
        if not catchall.startswith("api/"):
            return FileResponse(os.path.join(frontend_dist, "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="127.0.0.1", port=8765, reload=True)
