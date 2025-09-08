import os
import time
from typing import Dict, Optional
from fastapi import Request, HTTPException
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import redis
from app.logger import structured_logger

# Try to connect to Redis, fall back to in-memory storage
try:
    redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
    redis_client = redis.from_url(redis_url)
    redis_client.ping()  # Test connection
    
    def redis_key_func(request: Request):
        """Use Redis for rate limiting storage"""
        return get_remote_address(request)
    
    # Create limiter with Redis backend
    limiter = Limiter(key_func=redis_key_func, storage_uri=redis_url)
    
except (redis.RedisError, ConnectionError):
    # Fall back to in-memory storage for development
    
    class InMemoryStorage:
        """Simple in-memory rate limit storage"""
        def __init__(self):
            self.storage: Dict[str, Dict[str, float]] = {}
        
        def get(self, key: str, window: int) -> int:
            """Get current request count for key in window"""
            now = time.time()
            if key not in self.storage:
                self.storage[key] = {}
            
            # Clean up old entries
            self.storage[key] = {
                k: v for k, v in self.storage[key].items() 
                if now - float(k) < window
            }
            
            return len(self.storage[key])
        
        def set(self, key: str, value: int, window: int):
            """Set request count for key"""
            now = time.time()
            if key not in self.storage:
                self.storage[key] = {}
            
            self.storage[key][str(now)] = now
    
    memory_storage = InMemoryStorage()
    
    def memory_key_func(request: Request):
        """Use in-memory storage for rate limiting"""
        return get_remote_address(request)
    
    # Create limiter with in-memory backend
    limiter = Limiter(key_func=memory_key_func)

def get_client_ip(request: Request) -> str:
    """Get client IP address"""
    forwarded_for = request.headers.get("X-Forwarded-For")
    if forwarded_for:
        return forwarded_for.split(",")[0].strip()
    
    real_ip = request.headers.get("X-Real-IP")
    if real_ip:
        return real_ip
    
    return get_remote_address(request)

def rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    """Custom rate limit exceeded handler with logging"""
    client_ip = get_client_ip(request)
    
    structured_logger.log_security_event(
        event_type="rate_limit_exceeded",
        user_id=None,
        ip_address=client_ip,
        path=str(request.url.path),
        method=request.method
    )
    
    response = HTTPException(
        status_code=429,
        detail={
            "error": "Rate limit exceeded",
            "message": f"Too many requests. Limit: {exc.detail}",
            "retry_after": str(exc.retry_after) if hasattr(exc, 'retry_after') else "60"
        }
    )
    return response

# Rate limiting rules
RATE_LIMITS = {
    "auth": "10/minute",      # Authentication endpoints
    "create": "30/minute",    # Create operations
    "general": "100/minute",  # General API endpoints
    "admin": "200/minute"     # Admin operations
}