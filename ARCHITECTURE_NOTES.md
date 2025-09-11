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
- [ ] Portion calculator works correctly
- [ ] No CORS errors in browser console
- [ ] No deprecation warnings

### API Testing:
```bash
# Development Testing
# Test backend directly
curl http://localhost:8000/api/recipes/

# Test through Next.js proxy  
curl http://localhost:3000/api/recipes/

# Production Testing
# Test through nginx proxy
curl https://kitkuhar.com/api/recipes/

# Test health endpoint
curl https://kitkuhar.com/health
```

## 🚀 PRODUCTION DEPLOYMENT

### Production Architecture:
```
Internet → nginx → frontend (Next.js static) 
        └─────→ backend (FastAPI)

nginx routes:
- / → frontend container
- /api/* → backend container (preserves /api/ prefix)
- /static/* → media files volume
```

### CRITICAL Production Fix:
The nginx configuration was fixed to preserve `/api/` prefix:

**WRONG** (was breaking API):
```nginx
location /api/ {
    proxy_pass http://backend/;  # Strips /api/ prefix!
}
```

**CORRECT** (fixed):
```nginx
location /api/ {
    proxy_pass http://backend;   # Preserves /api/ prefix
}
```

### Production Deployment:
```bash
# Deploy to production
./deploy-production.sh

# Check logs
docker-compose logs nginx
docker-compose logs backend
docker-compose logs frontend

# Monitor health
curl https://kitkuhar.com/health
curl https://kitkuhar.com/api/recipes/
```

## 🖼️ MEDIA FILES AND IMAGE HANDLING

### Image Display and Modal System
**CRITICAL**: The image display system uses specific CSS properties and modal structure. DO NOT change these without understanding the full functionality.

#### Key CSS Properties for Images:
```css
/* CORRECT: Images scale properly without cropping */
style={{
  maxHeight: '150px' | '200px',     // Limit container height
  objectFit: 'contain',             // NEVER use 'cover' - it crops images!
  width: '100%',                    // Fill container width
  backgroundColor: '#f8f9fa',       // Gray background for transparency
  cursor: 'pointer'                 // Indicate clickable
}}
```

#### Modal Structure (NEVER BREAK THIS):
```javascript
// Required state in component
const [selectedImage, setSelectedImage] = useState<string | null>(null);

// Image click handler
onClick={() => setSelectedImage(media.url)}

// Modal JSX structure
{selectedImage && (
  <div 
    className="modal fade show d-block" 
    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
    onClick={() => setSelectedImage(null)}
  >
    <div className="modal-dialog modal-lg modal-dialog-centered">
      <div className="modal-content">
        <div className="modal-header">
          <h5 className="modal-title">Перегляд зображення</h5>
          <button 
            type="button" 
            className="btn-close" 
            onClick={() => setSelectedImage(null)}
          ></button>
        </div>
        <div className="modal-body text-center">
          <img 
            src={selectedImage} 
            alt="Збільшене зображення" 
            className="img-fluid"
            style={{ maxHeight: '70vh', objectFit: 'contain' }}
          />
        </div>
      </div>
    </div>
  </div>
)}
```

### Files with Image Modal Functionality:
1. **frontend/components/recipe/StepManager.tsx** - Recipe creation form (lines 213-226, 270-297)
2. **frontend/components/RecipeDetail.tsx** - Recipe display page (lines 161-174, 212-239)

### Static File Proxy Configuration:
**CRITICAL**: Both `/api/*` and `/static/*` requests must be proxied to backend.

```javascript
// frontend/next.config.js - DO NOT REMOVE /static/ proxy!
async rewrites() {
  return [
    {
      source: '/api/:path*',
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/:path*`,
    },
    {
      source: '/static/:path*',    // ESSENTIAL for media files
      destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/static/:path*`,
    },
  ]
},
```

### Image Processing Flow:
```
1. User uploads image in StepManager → API_ENDPOINTS.MEDIA_UPLOAD_MULTIPLE
2. Backend processes: resize to 800x600px, convert to JPEG (file_handler.py)
3. Backend saves to: /app/media/recipe_steps/{uuid}.jpg
4. Backend returns: {url: "/static/recipe_steps/{uuid}.jpg", type: "image"}
5. Frontend displays with objectFit: 'contain' (no cropping)
6. Frontend enables modal zoom on click
```

### 🚀 PRODUCTION CONFIGURATION - CRITICAL FOR NGINX

**ESSENTIAL**: Nginx must proxy BOTH `/api/*` AND `/static/*` requests to backend!

```nginx
# nginx/nginx.prod.conf - CRITICAL static files configuration (lines 109-184)
server {
    location /api/ {
        proxy_pass http://backend;   # Preserves /api/ prefix
        # + rate limiting, headers, timeouts...
    }
    
    location /static/ {
        # CRITICAL: Proxy to backend instead of serving from nginx directory
        # Recipe images are stored in backend container, not nginx!
        proxy_pass http://backend;   # Preserves /static/ prefix
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        # + caching headers, timeouts...
    }
    
    location / {
        proxy_pass http://frontend:80;
        # + headers, timeouts...
    }
}
```

**WARNING**: If nginx doesn't have `/static/` proxy rule, all recipe images will show 404 in production while working fine locally!

### ⚠️ CRITICAL: What NEVER to change:
- `objectFit: 'contain'` → Do not change to 'cover' (crops images)
- `/static/*` rewrite rule in Next.js → Images will 404 without this
- `/static/*` proxy rule in nginx → Production images will 404 without this
- Modal structure → Bootstrap modal classes and event handlers
- `maxHeight: '70vh'` in modal → Prevents full-screen modal
- Click handlers → `setSelectedImage(media.url)` and `setSelectedImage(null)`

### Testing Image Functionality:

#### Development Testing:
```bash
# Test static file serving locally
curl -I http://localhost:3002/static/recipe_steps/{filename}.jpg
curl -I http://localhost:8000/static/recipe_steps/{filename}.jpg

# Should return 200 OK with content-type: image/jpeg
# If 404 - check Next.js rewrites configuration
# If CORS error - check API proxy setup
```

#### Production Testing:
```bash
# CRITICAL: Test production image serving
curl -I https://kitkuhar.com/static/recipe_steps/{filename}.jpg

# Should return 200 OK with content-type: image/jpeg
# If 404 - check nginx configuration for /static/ proxy!
```

---
**Remember**: When in doubt, check this file first before making changes!