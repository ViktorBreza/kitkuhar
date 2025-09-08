from functools import lru_cache, wraps
from typing import List, Optional
import time
import threading
from sqlalchemy.orm import Session
from app import models

# Simple in-memory cache with TTL
class SimpleCache:
    def __init__(self):
        self._cache = {}
        self._cache_times = {}
        self._lock = threading.Lock()
    
    def get(self, key: str, ttl: int = 300) -> Optional[any]:
        """Get value from cache if not expired"""
        with self._lock:
            if key in self._cache:
                if time.time() - self._cache_times[key] < ttl:
                    return self._cache[key]
                else:
                    # Remove expired entry
                    del self._cache[key]
                    del self._cache_times[key]
            return None
    
    def set(self, key: str, value: any):
        """Set value in cache"""
        with self._lock:
            self._cache[key] = value
            self._cache_times[key] = time.time()
    
    def clear(self):
        """Clear all cache"""
        with self._lock:
            self._cache.clear()
            self._cache_times.clear()
    
    def delete(self, key: str):
        """Delete specific key from cache"""
        with self._lock:
            if key in self._cache:
                del self._cache[key]
                del self._cache_times[key]

# Global cache instance
cache = SimpleCache()

def cached_categories(db: Session) -> List[models.Category]:
    """Get cached categories"""
    categories = cache.get("categories", ttl=600)  # 10 minutes TTL
    if categories is None:
        categories = db.query(models.Category).all()
        cache.set("categories", categories)
    return categories

def cached_tags(db: Session) -> List[models.Tag]:
    """Get cached tags"""
    tags = cache.get("tags", ttl=600)  # 10 minutes TTL
    if tags is None:
        tags = db.query(models.Tag).all()
        cache.set("tags", tags)
    return tags

def invalidate_categories_cache():
    """Invalidate categories cache when modified"""
    cache.delete("categories")

def invalidate_tags_cache():
    """Invalidate tags cache when modified"""
    cache.delete("tags")

# LRU cache for frequently accessed recipes
@lru_cache(maxsize=100)
def cached_recipe_stats(recipe_id: int, cache_time: int) -> dict:
    """Cache recipe stats - cache_time is used as a cache key to expire entries"""
    # This will be populated by the actual function
    return {}