import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
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

logger = logging.getLogger("modelsmith")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ModelSmith backend starting...")
    yield
    logger.info("ModelSmith backend shutting down...")


app = FastAPI(title="ModelSmith", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:8765"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
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
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8765, reload=True)
