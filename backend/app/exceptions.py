from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from app.logger import app_logger
import traceback


class APIException(Exception):
    """Custom API Exception class"""
    def __init__(self, status_code: int, detail: str, headers: dict = None):
        self.status_code = status_code
        self.detail = detail
        self.headers = headers


async def api_exception_handler(request: Request, exc: APIException):
    """Handle custom API exceptions"""
    app_logger.error(f"API Exception: {exc.detail} - Status: {exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail},
        headers=exc.headers
    )


async def http_exception_handler_custom(request: Request, exc: HTTPException):
    """Handle HTTP exceptions with logging"""
    app_logger.error(f"HTTP Exception: {exc.detail} - Status: {exc.status_code}")
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.detail}
    )


async def general_exception_handler(request: Request, exc: Exception):
    """Handle all other exceptions"""
    app_logger.error(f"Unexpected error: {str(exc)}\n{traceback.format_exc()}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error"}
    )