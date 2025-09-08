#!/bin/bash
set -e

echo "Starting Recipe App Backend..."

# Function to wait for database
wait_for_db() {
    echo "Waiting for database connection..."
    local host="${DATABASE_HOST:-database}"
    local port="${DATABASE_PORT:-5432}"
    
    until nc -z "$host" "$port"; do
        echo "Database is unavailable - sleeping"
        sleep 2
    done
    
    echo "Database is up - continuing"
}

# Function to run database migrations
run_migrations() {
    echo "Running database migrations..."
    if command -v alembic >/dev/null 2>&1; then
        # Initialize alembic if not already done
        if [ ! -f "alembic/versions" ]; then
            echo "Initializing Alembic..."
            alembic revision --autogenerate -m "Initial migration"
        fi
        
        # Run migrations
        alembic upgrade head
        echo "Migrations completed"
    else
        echo "Alembic not found, skipping migrations"
    fi
}

# Function to create initial data
create_initial_data() {
    echo "Creating initial data..."
    python -c "
import sys
sys.path.append('/app')

try:
    from app.database import SessionLocal
    from app import models
    from app.auth import get_password_hash
    import os
    
    db = SessionLocal()
    
    # Create default categories if they don't exist
    default_categories = [
        'Закуски', 'Супи', 'Другі страви', 'Десерти', 'Напої', 'Салати'
    ]
    
    existing_categories = db.query(models.Category).all()
    existing_names = [c.name for c in existing_categories]
    
    for cat_name in default_categories:
        if cat_name not in existing_names:
            category = models.Category(name=cat_name)
            db.add(category)
    
    # Create admin user if specified in environment
    admin_email = os.getenv('ADMIN_EMAIL')
    admin_username = os.getenv('ADMIN_USERNAME')
    admin_password = os.getenv('ADMIN_PASSWORD')
    
    if admin_email and admin_username and admin_password:
        existing_admin = db.query(models.User).filter(
            models.User.email == admin_email
        ).first()
        
        if not existing_admin:
            admin_user = models.User(
                email=admin_email,
                username=admin_username,
                hashed_password=get_password_hash(admin_password),
                is_admin=True,
                is_active=True
            )
            db.add(admin_user)
            print(f'Created admin user: {admin_username}')
    
    db.commit()
    db.close()
    print('Initial data creation completed')
    
except Exception as e:
    print(f'Error creating initial data: {e}')
    # Don't fail the startup for this
"
}

# Main execution
main() {
    # Wait for database if DATABASE_URL is set
    if [ -n "$DATABASE_URL" ]; then
        wait_for_db
    fi
    
    # Run migrations (temporarily disabled due to Alembic revision conflicts)
    # run_migrations
    
    # Create initial data
    create_initial_data
    
    # Execute the provided command
    echo "Starting application with: $@"
    exec "$@"
}

# Call main function with all arguments
main "$@"