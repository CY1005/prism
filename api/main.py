from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import health, search, analyze, projects

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

if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="127.0.0.1", port=8001)
