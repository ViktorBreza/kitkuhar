import logging
import sys
from logging.handlers import TimedRotatingFileHandler
import os
import json
import time
from pathlib import Path
from typing import Dict, Any, Optional
from datetime import datetime

# Create logs directory
LOG_DIR = Path("logs")
LOG_DIR.mkdir(exist_ok=True)

def setup_logger(name: str = __name__, level: str = "INFO") -> logging.Logger:
    """
    Sets up logger with required levels and formatting
    """
    logger = logging.getLogger(name)
    
    # If logger is already configured, return it
    if logger.handlers:
        return logger
    
    log_level = getattr(logging, level.upper(), logging.INFO)
    logger.setLevel(log_level)
    
    # Log format
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # File handler with rotation (daily) - only if we can write to logs
    try:
        file_handler = TimedRotatingFileHandler(
            LOG_DIR / "app.log",
            when="midnight",
            interval=1,
            backupCount=7,  # Keep logs for 7 days
            encoding="utf-8"
        )
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
        
        # Separate file for errors
        error_handler = TimedRotatingFileHandler(
            LOG_DIR / "error.log",
            when="midnight",
            interval=1,
            backupCount=30,  # Keep errors longer
            encoding="utf-8"
        )
        error_handler.setLevel(logging.ERROR)
        error_handler.setFormatter(formatter)
        logger.addHandler(error_handler)
    except PermissionError:
        # If we can't write to logs directory, just use console logging
        logger.warning("Cannot write to logs directory, using console logging only")
    
    return logger

# Main application logger
app_logger = setup_logger("recipe_app")

def log_request(method: str, url: str, user_id: int = None):
    """Logs HTTP requests"""
    user_info = f"user_id={user_id}" if user_id else "anonymous"
    app_logger.info(f"Request: {method} {url} ({user_info})")

def log_error(error: Exception, context: str = ""):
    """Logs errors with context"""
    app_logger.error(f"Error in {context}: {str(error)}", exc_info=True)

def log_auth_event(event: str, user_id: int = None, username: str = None):
    """Logs authentication events"""
    user_info = f"user_id={user_id}, username={username}" if user_id and username else "unknown user"
    app_logger.info(f"Auth event: {event} ({user_info})")

def log_database_event(operation: str, table: str, record_id: int = None):
    """Logs database operations"""
    record_info = f"id={record_id}" if record_id else "bulk operation"
    app_logger.info(f"Database {operation}: {table} ({record_info})")

class StructuredLogger:
    """Structured logging for better observability"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    def log_structured(self, level: str, event: str, **kwargs):
        """Log structured data as JSON"""
        log_data = {
            "timestamp": datetime.utcnow().isoformat(),
            "event": event,
            **kwargs
        }
        
        log_level = getattr(logging, level.upper(), logging.INFO)
        self.logger.log(log_level, json.dumps(log_data))
    
    def log_request(self, method: str, path: str, status_code: int, 
                   duration_ms: float, user_id: Optional[int] = None):
        """Log HTTP request with structured data"""
        self.log_structured(
            "INFO",
            "http_request",
            method=method,
            path=path,
            status_code=status_code,
            duration_ms=duration_ms,
            user_id=user_id
        )
    
    def log_error(self, error: Exception, context: str, **extra):
        """Log error with structured data"""
        self.log_structured(
            "ERROR",
            "application_error",
            error_type=error.__class__.__name__,
            error_message=str(error),
            context=context,
            **extra
        )
    
    def log_security_event(self, event_type: str, user_id: Optional[int], 
                          ip_address: Optional[str] = None, **extra):
        """Log security-related events"""
        self.log_structured(
            "WARNING",
            "security_event",
            event_type=event_type,
            user_id=user_id,
            ip_address=ip_address,
            **extra
        )

# Structured logger instance
structured_logger = StructuredLogger(app_logger)

class PerformanceMonitor:
    """Monitor application performance"""
    
    def __init__(self):
        self.request_times = []
        self.slow_queries = []
    
    def record_request_time(self, duration_ms: float):
        """Record request duration"""
        self.request_times.append(duration_ms)
        
        # Keep only last 1000 requests
        if len(self.request_times) > 1000:
            self.request_times = self.request_times[-1000:]
    
    def record_slow_query(self, query: str, duration_ms: float):
        """Record slow database queries"""
        if duration_ms > 1000:  # Queries slower than 1 second
            self.slow_queries.append({
                "query": query[:200],  # Truncate long queries
                "duration_ms": duration_ms,
                "timestamp": datetime.utcnow().isoformat()
            })
            
            app_logger.warning(f"Slow query detected: {duration_ms}ms - {query[:100]}...")
    
    def get_stats(self) -> Dict[str, Any]:
        """Get performance statistics"""
        if not self.request_times:
            return {"request_count": 0}
        
        avg_time = sum(self.request_times) / len(self.request_times)
        max_time = max(self.request_times)
        slow_requests = len([t for t in self.request_times if t > 1000])
        
        return {
            "request_count": len(self.request_times),
            "avg_response_time_ms": avg_time,
            "max_response_time_ms": max_time,
            "slow_requests": slow_requests,
            "slow_query_count": len(self.slow_queries)
        }

# Global performance monitor
performance_monitor = PerformanceMonitor()