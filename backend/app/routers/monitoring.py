from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth import get_current_admin_user
from app.logger import performance_monitor, app_logger
from app.cache import cache
from app import models
from typing import Dict, Any
import psutil
import os

router = APIRouter(prefix="/api/monitoring", tags=["monitoring"])

@router.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Comprehensive health check endpoint"""
    import time
    start_time = time.time()
    
    health_status = {
        "status": "healthy",
        "service": "Кіт Кухар API",
        "version": "2.0.0",
        "timestamp": time.time(),
        "checks": {}
    }
    
    # Database connectivity check
    try:
        db.execute("SELECT 1")
        health_status["checks"]["database"] = "healthy"
    except Exception as e:
        health_status["checks"]["database"] = f"unhealthy: {str(e)}"
        health_status["status"] = "unhealthy"
    
    # Cache connectivity check (if Redis is configured)
    try:
        cache_keys = len(cache._cache) if hasattr(cache, '_cache') else 0
        health_status["checks"]["cache"] = f"healthy (entries: {cache_keys})"
    except Exception as e:
        health_status["checks"]["cache"] = f"warning: {str(e)}"
    
    # Performance metrics
    perf_stats = performance_monitor.get_stats()
    if perf_stats.get("request_count", 0) > 0:
        health_status["checks"]["performance"] = {
            "avg_response_time": f"{perf_stats.get('avg_response_time_ms', 0):.2f}ms",
            "slow_requests": perf_stats.get("slow_requests", 0)
        }
    
    # Response time for this health check
    health_status["response_time_ms"] = f"{(time.time() - start_time) * 1000:.2f}"
    
    return health_status

@router.get("/metrics", dependencies=[Depends(get_current_admin_user)])
async def get_metrics(db: Session = Depends(get_db)) -> Dict[str, Any]:
    """Get application metrics (admin only)"""
    try:
        # Performance metrics
        performance_stats = performance_monitor.get_stats()
        
        # Database metrics
        recipe_count = db.query(models.Recipe).count()
        user_count = db.query(models.User).count()
        category_count = db.query(models.Category).count()
        tag_count = db.query(models.Tag).count()
        rating_count = db.query(models.Rating).count()
        comment_count = db.query(models.Comment).count()
        
        # System metrics
        system_metrics = {
            "cpu_percent": psutil.cpu_percent(interval=1),
            "memory_percent": psutil.virtual_memory().percent,
            "disk_percent": psutil.disk_usage("/").percent if os.name != 'nt' else psutil.disk_usage("C:").percent,
        }
        
        return {
            "performance": performance_stats,
            "database": {
                "recipes": recipe_count,
                "users": user_count,
                "categories": category_count,
                "tags": tag_count,
                "ratings": rating_count,
                "comments": comment_count
            },
            "system": system_metrics
        }
        
    except Exception as e:
        app_logger.error(f"Error getting metrics: {e}")
        raise HTTPException(status_code=500, detail="Error retrieving metrics")

@router.get("/cache/stats", dependencies=[Depends(get_current_admin_user)])
async def get_cache_stats():
    """Get cache statistics (admin only)"""
    return {
        "cache_entries": len(cache._cache),
        "cache_keys": list(cache._cache.keys())
    }

@router.post("/cache/clear", dependencies=[Depends(get_current_admin_user)])
async def clear_cache():
    """Clear application cache (admin only)"""
    cache.clear()
    app_logger.info("Application cache cleared by admin")
    return {"message": "Cache cleared successfully"}

@router.get("/logs/recent", dependencies=[Depends(get_current_admin_user)])
async def get_recent_logs():
    """Get recent log entries (admin only)"""
    try:
        log_file_path = "logs/app.log"
        if os.path.exists(log_file_path):
            with open(log_file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
                # Return last 50 log lines
                recent_lines = lines[-50:] if len(lines) > 50 else lines
                return {
                    "log_lines": [line.strip() for line in recent_lines],
                    "total_lines": len(lines)
                }
        else:
            return {
                "log_lines": [],
                "total_lines": 0,
                "message": "Log file not found"
            }
    except Exception as e:
        app_logger.error(f"Error reading logs: {e}")
        raise HTTPException(status_code=500, detail="Error reading log file")

@router.get("/performance/slow-queries", dependencies=[Depends(get_current_admin_user)])
async def get_slow_queries():
    """Get slow query information (admin only)"""
    return {
        "slow_queries": performance_monitor.slow_queries[-20:],  # Last 20 slow queries
        "total_slow_queries": len(performance_monitor.slow_queries)
    }