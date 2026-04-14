import asyncio
import logging

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import health, search, analyze, projects, auth, settings, comparison, snapshot
from api.routers import import_ as import_router

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """App lifespan: initialize pgvector on startup, backfill embeddings."""
    from api.db import engine
    from api.services.embedding import ensure_embeddings_table
    from api.services.embedding_worker import (
        set_pgvector_available,
        run_backfill_background,
    )

    # Try to initialize pgvector extension + embeddings table
    pgvector_ok = ensure_embeddings_table(engine)
    set_pgvector_available(pgvector_ok)

    if pgvector_ok:
        logger.info("pgvector ready — launching background embedding backfill")
        # Non-blocking: backfill runs in background, doesn't delay startup
        asyncio.create_task(run_backfill_background(engine))
    else:
        logger.warning(
            "pgvector not available — F18 hybrid search degraded to keyword-only. "
            "Switch docker-compose db image to pgvector/pgvector:pg16 and restart."
        )

    yield  # app runs here
    # Cleanup (none needed for now)


app = FastAPI(
    title="Prism Analyzer",
    description="AI analysis microservice for Prism knowledge management platform",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(search.router, prefix="/search", tags=["search"])
app.include_router(analyze.router, prefix="/api", tags=["analysis"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])
app.include_router(settings.router, prefix="/api/projects", tags=["settings"])
app.include_router(import_router.router, prefix="/api/import", tags=["import"])
app.include_router(comparison.router, prefix="/api/comparison", tags=["comparison"])
app.include_router(snapshot.router, prefix="/api/snapshot", tags=["snapshot"])

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
