# KITKUHAR PROJECT ARCHITECTURE - DEVELOPER NOTES
**CRITICAL: Read this before making ANY changes to avoid breaking the system**

## 🏗️ SYSTEM OVERVIEW
This is a recipe management system with structured cooking steps and media uploads.

### Tech Stack
- **Frontend**: Next.js 15 with TypeScript, React 19, Bootstrap 5
- **Backend**: FastAPI with SQLAlchemy, PostgreSQL, Redis
- **Deployment**: Docker Compose for development
- **Image Processing**: Pillow for automatic resizing (800x600, maintaining aspect ratio)

## 🔄 CRITICAL API FLOW (DO NOT BREAK THIS!)

### Development Request Flow:
```
1. Frontend (localhost:3000/3001) makes request to: /api/recipes/
2. Next.js rewrite rule catches it and forwards to: http://localhost:8000/api/recipes/
3. Backend receives request and processes it
4. Backend returns data through the proxy back to frontend
```

### Key Configuration Points:
1. **frontend/config/apiClient.ts**: `baseURL = ''` (MUST be empty for proxy)
2. **frontend/next.config.js**: Rewrite `/api/:path*` → `backend/api/:path*`
3. **backend/app/main.py**: CORS allows localhost:3000, 3001, etc.

### ⚠️ COMMON MISTAKES TO AVOID:
- Setting apiClient baseURL to backend URL (causes CORS)
- Removing `/api/` from Next.js rewrite destination
- Not including trailing slashes where needed
- Forgetting to restart backend after schema changes

## 📁 PROJECT STRUCTURE

### Frontend Structure:
```
frontend/
├── config/
│   ├── api.ts           # API endpoints (all start with /api/)
│   ├── apiClient.ts     # HTTP client (baseURL = '')
│   └── ...
├── components/
│   ├── RecipeList.tsx   # Main recipe display
│   ├── StepManager.tsx  # Structured step editing
│   └── ...
├── pages/
│   ├── recipes/[id].tsx # Dynamic recipe pages
│   └── ...
├── next.config.js       # API rewrites configuration
└── package.json         # With cross-env for Windows
```

### Backend Structure:
```
backend/
├── app/
│   ├── main.py          # FastAPI app with CORS
│   ├── schemas.py       # Structured recipe schemas
│   ├── file_handler.py  # Image resizing logic
│   ├── routers/         # API endpoints
│   └── ...
├── requirements.txt     # Includes Pillow for images
└── Dockerfile
```

## 🗃️ DATA MODELS

### Recipe Structure (IMPORTANT):
```python
# Backend Schema (Pydantic)
class CookingStep(BaseModel):
    id: str = Field(default_factory=lambda: f"step-{uuid4().hex[:8]}")
    stepNumber: int
    description: str
    media: List[MediaFile] = []

class RecipeBase(BaseModel):
    title: str
    description: Optional[str]
    ingredients: List[Ingredient]
    steps: List[CookingStep]  # STRUCTURED STEPS - not plain text!
    servings: int
    category_id: int
    tags: List[Tag] = []
```

### Media File Handling:
- Images automatically resized to 800x600 maintaining aspect ratio
- Supports both images and videos in recipe steps
- Files stored in backend/media directory
- Served via static file mount at /static/

## 🚀 DEVELOPMENT SETUP

### Required Services:
```bash
# Start all services
docker-compose -f docker-compose.dev.yml up -d

# Services that run:
- PostgreSQL (port 5432)
- Redis (port 6379)  
- Backend FastAPI (port 8000)

# Frontend runs separately:
cd frontend && npm run dev  # Usually port 3000, may use 3001
```

### Important Environment Variables:
- `NEXT_PUBLIC_API_BASE_URL`: Should be empty for dev (proxy) or backend URL for prod
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `SECRET_KEY`: JWT signing key

## 🔧 DEBUGGING COMMON ISSUES

### CORS Errors:
1. Check apiClient.ts baseURL (should be empty)
2. Verify Next.js rewrite includes /api/ in destination
3. Ensure backend CORS includes frontend port

### 404 on Individual Recipes:
1. Verify Next.js rewrite handles dynamic routes
2. Check API_ENDPOINTS has correct paths
3. Ensure backend route exists and has trailing slash

### Image Upload Issues:
1. Verify Pillow is installed in backend
2. Check media directory exists and is writable
3. Ensure file size limits are appropriate

### Build Issues:
1. Backend: Restart container after schema changes
2. Frontend: Clear .next cache if needed
3. Database: Run Alembic migrations if schema changed

## 📝 KEY FILES TO NEVER BREAK

### Frontend:
- `config/api.ts` - API endpoint definitions
- `config/apiClient.ts` - HTTP client configuration  
- `next.config.js` - API proxy rewrites

### Backend:
- `app/main.py` - CORS and routing setup
- `app/schemas.py` - Data models
- `app/file_handler.py` - Image processing

### Docker:
- `docker-compose.dev.yml` - Development services

## 🔄 ADDING NEW FEATURES

### New API Endpoint:
1. Add route to backend router
2. Add endpoint to frontend API_ENDPOINTS
3. Update apiClient if needed
4. Test through proxy

### New Recipe Fields:
1. Update backend schema
2. Create Alembic migration
3. Update frontend types
4. Restart backend container

### New Media Types:
1. Update file_handler.py
2. Test upload through media endpoints
3. Update frontend upload component

## 🧪 TESTING

### Manual Testing Checklist:
- [ ] Recipe list loads (GET /api/recipes/)
- [ ] Individual recipe loads (GET /api/recipes/:id)
- [ ] Recipe creation with steps works
- [ ] Image upload and resizing works
- [ ] No CORS errors in browser console
- [ ] No deprecation warnings

### API Testing:
```bash
# Test backend directly
curl http://localhost:8000/api/recipes/

# Test through frontend proxy  
curl http://localhost:3000/api/recipes/
```

---
**Remember**: When in doubt, check this file first before making changes!