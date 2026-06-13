import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
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

logger = logging.getLogger("modelsmith")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("ModelSmith backend starting...")
    yield
    logger.info("ModelSmith backend shutting down...")


app = FastAPI(title="ModelSmith", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
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


@app.get("/api/health")
async def health():
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.main:app", host="0.0.0.0", port=8765, reload=True)
