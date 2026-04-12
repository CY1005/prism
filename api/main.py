from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import health, search, analyze, projects, auth, settings, comparison
from api.routers import import_ as import_router

app = FastAPI(
    title="Prism Analyzer",
    description="AI analysis microservice for Prism knowledge management platform",
    version="0.1.0",
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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
