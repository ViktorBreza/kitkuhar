# API Configuration Documentation

## ВАЖЛИВО: НЕ ЗМІНЮВАТИ БЕЗ РОЗУМІННЯ!

### Як працює API конфігурація:

1. **Frontend config (config/api.ts):**
   - `API_BASE_URL = ''` (порожня стрічка!)
   - Всі ендпоінти: `/api/recipes`, `/api/categories`, etc.

2. **Next.js rewrite (next.config.js):**
   - `source: '/api/:path*'`
   - `destination: 'http://localhost:8000/api/:path*'`
   - Переписує `/api/recipes` → `localhost:8000/api/recipes`

3. **Backend router prefix:**
   - recipes.py: `prefix="/api/recipes"`
   - categories.py: `prefix="/api/categories"`
   - Очікує `/api/recipes`, `/api/categories`

### ПРАВИЛЬНА КОНФІГУРАЦІЯ:

**config/api.ts:**
```typescript
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export const API_ENDPOINTS = {
  RECIPES: `/api/recipes`,
  CATEGORIES: `/api/categories`,
  // ... інші з повним шляхом /api/...
};
```

**next.config.js:**
```javascript
destination: `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}/api/:path*`
```

### ТИПОВІ ПОМИЛКИ:

1. **Подвоєння /api/api/:**
   - Причина: API_BASE_URL="/api" + ендпоінти з `/api/`
   - Рішення: API_BASE_URL=""

2. **404 для індивідуальних ресурсів:**
   - Причина: destination без `/api`
   - Рішення: destination повинен включати `/api/:path*`

3. **404 для списків:**
   - Причина: неправильний rewrite або конфлікт префіксів
   - Рішення: перевірити що всі частини збігаються

### ТЕСТУВАННЯ:

Після кожної зміни перевіряти:
```bash
curl http://localhost:3000/api/recipes      # Список рецептів
curl http://localhost:3000/api/recipes/2    # Окремий рецепт
curl http://localhost:3000/api/categories   # Категорії
curl http://localhost:3000/api/tags         # Теги
```

### ПОТОЧНИЙ СТАН:
- ✅ Individual recipes: /api/recipes/{id} працює (2 рецепти)
- ✅ Recipes list: /api/recipes працює (2 рецепти)
- ✅ Categories: /api/categories працює (10 категорій)
- ✅ Tags: /api/tags працює (29 тегів)

### ПРОБЛЕМА БУЛА ВИРІШЕНА:
Проблема була в тому, що `apiClient.ts` використовував baseURL='/api' за замовчуванням, 
в той час як `api.ts` мав API_BASE_URL=''. Це призводило до подвоєння префіксів.

### ОСТАТОЧНА РОБОЧА КОНФІГУРАЦІЯ:
- config/api.ts: API_BASE_URL = ''
- config/apiClient.ts: constructor baseURL = ''  
- next.config.js: destination включає /api/:path*
- Всі ендпоінти мають повний шлях /api/recipes, /api/categories, тощо