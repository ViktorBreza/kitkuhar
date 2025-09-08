from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import RedirectResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.exception_handlers import http_exception_handler
from starlette.exceptions import HTTPException as StarletteHTTPException
from app.database import Base, engine
from app.routers import recipes, categories, tags, media, auth, ratings, comments, monitoring
from app.logger import app_logger, log_request, structured_logger, performance_monitor
from app.exceptions import (
    APIException, 
    api_exception_handler, 
    http_exception_handler_custom,
    general_exception_handler
)
import time
import os

app = FastAPI(title="Recipe App API")

# Exception handlers
app.add_exception_handler(APIException, api_exception_handler)
app.add_exception_handler(HTTPException, http_exception_handler_custom)
app.add_exception_handler(Exception, general_exception_handler)

# Database tables are now managed by Alembic migrations
# Use: alembic upgrade head to create/update tables

# Enhanced middleware for request logging and monitoring
@app.middleware("http")
async def enhanced_logging_middleware(request: Request, call_next):
    start_time = time.time()
    
    # Get client IP
    client_ip = request.client.host if request.client else "unknown"
    
    # Get user ID from auth (if available)
    user_id = None
    try:
        auth_header = request.headers.get("authorization")
        if auth_header and auth_header.startswith("Bearer "):
            from app.auth import verify_token
            token = auth_header.split(" ")[1]
            token_data = verify_token(token)
            if token_data:
                user_id = token_data.username  # We'd need to resolve this to user_id
    except:
        pass
    
    response = await call_next(request)
    
    # Calculate execution time
    process_time = time.time() - start_time
    process_time_ms = process_time * 1000
    
    # Record performance metrics
    performance_monitor.record_request_time(process_time_ms)
    
    # Structured logging
    structured_logger.log_request(
        method=request.method,
        path=str(request.url.path),
        status_code=response.status_code,
        duration_ms=process_time_ms,
        user_id=user_id
    )
    
    # Log slow requests
    if process_time > 1.0:
        app_logger.warning(f"Slow request: {request.method} {request.url} took {process_time:.2f}s")
    
    # Add performance headers
    response.headers["X-Response-Time"] = f"{process_time_ms:.2f}ms"
    
    return response

# CORS Middleware - Secure configuration
# Get allowed origins from environment variable or use safe defaults
ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "").split(",") if os.getenv("ALLOWED_ORIGINS") else []

# Production and development origins
production_origins = [
    "https://kitkuhar.com",
    "https://www.kitkuhar.com"
]

development_origins = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3333",
    "http://127.0.0.1:3333", 
    "http://localhost:8080",
    "http://127.0.0.1:8080",
    "http://localhost",
    "http://127.0.0.1",
    "https://kitkuhar.com",
    "https://www.kitkuhar.com",
]

# Determine which origins to use based on environment
environment = os.getenv("ENVIRONMENT", "development")
if environment == "production":
    # In production, allow both production URLs and development for testing
    origins = production_origins + development_origins + ALLOWED_ORIGINS
else:
    origins = development_origins + production_origins + ALLOWED_ORIGINS

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,  # Use specific origins instead of wildcard
    allow_credentials=True,  # Allow credentials for secure authentication
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "Accept"],
    expose_headers=["*"],
)

# Root endpoint -> redirect to docs
@app.get("/", include_in_schema=False)
def root():
    return RedirectResponse(url="/docs")

# Simple health check endpoint (for load balancers)
@app.get("/health", include_in_schema=False)
def health():
    return {
        "status": "healthy",
        "service": "Кіт Кухар API",
        "message": "Кіт Кухар is healthy! 🐱👨‍🍳"
    }

# Routers (IMPORTANT: routers must be BEFORE StaticFiles!)
app.include_router(auth.router)
app.include_router(recipes.router)
app.include_router(categories.router)
app.include_router(tags.router) 
app.include_router(media.router)
app.include_router(ratings.router)
app.include_router(comments.router)
app.include_router(monitoring.router)

# Static files for media - using /static to avoid conflict with /media routes
app.mount("/static", StaticFiles(directory="media"), name="media")

# Log application startup
app_logger.info("Recipe App API started successfully")