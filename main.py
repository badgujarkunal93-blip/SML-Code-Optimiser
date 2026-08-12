from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routes import optimize, history

app = FastAPI(
    title="speed-optimizer-backend",
    description="FastAPI service for SML Code Optimiser",
    version="0.1.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(optimize.router)
app.include_router(history.router)


@app.get("/", tags=["Health"])
async def root():
    return {"status": "ok", "message": "Optima AI Backend API is running"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok"}

