# Multi-stage build for optimization
FROM python:3.11-slim as builder

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

# Set working directory
WORKDIR /app

# Install system dependencies for building
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    curl \
    build-essential \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Copy requirements first for better caching
COPY backend/requirements.txt .
COPY backend/requirements-test.txt .

# Upgrade pip and install Python dependencies
# Use test requirements for faster builds in CI/testing
ARG BUILD_ENV=production
RUN pip install --upgrade pip && \
    if [ "$BUILD_ENV" = "test" ]; then \
        pip install --no-cache-dir --user -r requirements-test.txt; \
    else \
        pip install --no-cache-dir --user -r requirements.txt; \
    fi

# Production stage
FROM python:3.11-slim

# Set environment variables for Python
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PYTHONPATH=/app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    libpq5 \
    curl \
    netcat-traditional \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get clean

# Create non-root user for security
RUN groupadd -r kitkuhar && useradd -r -g kitkuhar -m kitkuhar

# Set working directory
WORKDIR /app

# Copy Python packages from builder
COPY --from=builder /root/.local /home/kitkuhar/.local

# Create necessary directories
RUN mkdir -p media logs alembic/versions && \
    chown -R kitkuhar:kitkuhar /app

# Copy application code
COPY backend/ ./

# Fix permissions
RUN chown -R kitkuhar:kitkuhar /app

# Switch to non-root user
USER kitkuhar

# Add local packages to PATH
ENV PATH=/home/kitkuhar/.local/bin:$PATH

# Expose port
EXPOSE 8000

# Health check with improved logic
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD curl -f http://localhost:8000/monitoring/health || exit 1

# Create entrypoint script for better startup
COPY --chown=kitkuhar:kitkuhar backend/docker-entrypoint.sh /app/
RUN chmod +x /app/docker-entrypoint.sh

# Use entrypoint for better initialization
ENTRYPOINT ["/app/docker-entrypoint.sh"]

# Default command - can be overridden
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--worker-class", "uvicorn.workers.UvicornWorker"]