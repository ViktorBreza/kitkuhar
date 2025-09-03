# Кіт Кухар 🐱👨‍🍳

> Найкращі рецепти від нашого котика-кухаря! Сучасний веб-додаток для зберігання, пошуку та обміну кулінарними рецептами з повноцінною Docker-архітектурою та HTTPS підтримкою.

## 📋 Опис проекту

**Кіт Кухар** - це комплексна платформа для любителів кулінарії, яка дозволяє зберігати, організовувати та ділитися рецептами від нашого улюбленого котика-кухаря. Додаток поєднує в собі зручний каталог рецептів з розширеним функціоналом для приготування та персоналізації користувацького досвіду.

🌐 **Живий додаток**: https://kitkuhar.com  
🗄️ **База даних**: https://kitkuhar.com/db-admin/  
🚀 **Автоматичний деплой**: Налаштовано через GitHub Actions

## 🏗️ Архітектура проекту

### Production Setup (Docker + Cloudflare)
```
Cloudflare (HTTPS, CDN, DDoS Protection)
    ↓
Nginx Reverse Proxy (SSL Termination, Load Balancing)
    ↓
┌─────────────────────────────────────────────────┐
│  Docker Container Network                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Frontend   │  │   Backend   │  │ PostgreSQL  │  │
│  │  (React)    │  │  (FastAPI)  │  │  Database   │  │
│  │  Port: 3000 │  │  Port: 8000 │  │  Port: 5432 │  │
│  └─────────────┘  └─────────────┘  └─────────────┘  │
│                                    ┌─────────────┐  │
│                                    │   pgAdmin   │  │
│                                    │(DB Manager) │  │
│                                    │  Port: 5050 │  │
│                                    └─────────────┘  │
└─────────────────────────────────────────────────┘
```

## 🚀 Production Deployment

### Docker Compose Architecture
```bash
# Запуск всіх сервісів
sudo docker compose up -d

# Перевірка статусу
sudo docker compose ps

# Логи
sudo docker compose logs -f [service_name]
```

### Services Overview
- **nginx**: Reverse proxy з HTTPS підтримкою (ports: 80, 443)
- **frontend**: React додаток з оптимізованою збіркою  
- **backend**: FastAPI з PostgreSQL підключенням
- **database**: PostgreSQL 15 з автоматичним бекапом
- **pgadmin**: Web-інтерфейс для управління базою даних

### SSL/HTTPS Configuration
- **Let's Encrypt** сертифікати з автоматичним оновленням
- **Cloudflare** інтеграція для динамічних IP адрес
- **HTTP to HTTPS** редирект для безпеки
- **Security headers** та захист від XSS

### Database Management
- **PostgreSQL 15** з стабільною продуктивністю  
- **Автоматичний бекап** кожні 7 днів з ротацією
- **pgAdmin 4** для зручного управління через веб-інтерфейс
- **Persistent volumes** для збереження даних

## 🎯 Реалізований функціонал

### ✅ Управління рецептами:
- 📚 **Повний CRUD рецептів** - створення, перегляд, редагування, видалення
- 🏷️ **Система категорій** - організація рецептів за типами страв
- 🔖 **Система тегів** - гнучке маркування рецептів
- 📝 **Детальні покрокові інструкції** з можливістю додавання медіа
- 🧮 **Калькулятор порцій** - автоматичний перерахунок інгредієнтів
- 📷 **Завантаження медіа файлів** для кроків приготування

### ✅ Користувацька система:
- 👤 **Реєстрація та аутентифікація** користувачів
- 🔐 **JWT токени** для безпеки
- 👥 **Адміністративна панель** для управління користувачами
- 🔒 **Захищені маршрути** для авторизованих дій

### ✅ Інтерактивність:
- ⭐ **Система рейтингів** (1-5 зірок) для рецептів
- 💬 **Коментарі до рецептів** з можливістю редагування
- 📊 **Статистика рецептів** - середній рейтинг та кількість оцінок
- 👤 **Підтримка анонімних користувачів** для коментарів та рейтингів

### ✅ Production готовність:
- 🐳 **Docker контейнеризація** з multi-stage збірками
- 🔒 **HTTPS через Let's Encrypt** з автоматичним оновленням
- 🌐 **Cloudflare інтеграція** для CDN та DDoS захисту
- 📊 **Database управління** через pgAdmin веб-інтерфейс
- 📱 **Мобільна оптимізація** з адаптивним дизайном
- 🔄 **Автоматичний бекап** бази даних
- 📝 **Структуроване логування** з ротацією

## 🏗️ Технічний стек

### Backend:
- **FastAPI** - швидкий веб-фреймворк з автоматичною документацією
- **SQLAlchemy** - ORM для роботи з PostgreSQL
- **PostgreSQL 15** - надійна реляційна база даних
- **JWT** - безпечна аутентифікація
- **Uvicorn** - ASGI сервер для продуктивності
- **Pydantic** - валідація даних та схеми

### Frontend:
- **React** (TypeScript) - типізований фреймворк для UI
- **Bootstrap 5** - сучасний адаптивний CSS фреймворк
- **Axios** - HTTP клієнт для API запитів
- **React Router** - маршрутизація для SPA
- **Context API** - управління глобальним станом

### Infrastructure:
- **Docker Compose** - контейнеризація та оркестрація
- **Nginx** - reverse proxy та load balancer
- **Let's Encrypt** - безкоштовні SSL сертифікати
- **Cloudflare** - CDN, DDoS захист, DNS
- **pgAdmin 4** - веб-інтерфейс для PostgreSQL

## 🚀 Local Development

### Вимоги
- Docker & Docker Compose
- Git

### Швидкий старт
```bash
# Клонування репозиторію
git clone <repository-url>
cd kitkuhar

# Запуск всіх сервісів
sudo docker compose up -d

# Перевірка статусу
sudo docker compose ps
```

### Доступ до сервісів
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API документація**: http://localhost:8000/docs
- **pgAdmin**: http://localhost:5050
- **PostgreSQL**: localhost:5432 (тільки для локального розробництва)

### Environment Configuration
Створіть `.env` файл з необхідними змінними:
```env
# Database
DATABASE_URL=postgresql:/

# Backend Security  
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Frontend
REACT_APP_API_URL=/api

# Production
ENVIRONMENT=production
```

## 🗄️ Database Management

### Backup System
```bash
# Ручний бекап
./database/backup.sh

# Автоматичний бекап (налаштовано збереження останніх 7 бекапів)
# Файли зберігаються в: database/backups/
```
## 📁 Структура проекту

```
kitkuhar/
├── docker-compose.yml          # Docker сервіси та мережа
├── .env                       # Environment змінні
├── nginx/
│   └── nginx.conf            # Nginx конфігурація з HTTPS
├── backend/                  # FastAPI backend
│   ├── Dockerfile           # Multi-stage Docker збірка
│   ├── app/
│   │   ├── main.py         # Головний файл застосунку  
│   │   ├── models.py       # SQLAlchemy моделі БД
│   │   ├── schemas.py      # Pydantic схеми
│   │   ├── database.py     # PostgreSQL підключення
│   │   ├── crud.py         # CRUD операції
│   │   ├── auth.py         # JWT аутентифікація
│   │   └── routers/        # API маршрути
│   └── requirements.txt    # Python залежності
├── frontend/               # React frontend
│   ├── Dockerfile         # Multi-stage збірка з Nginx
│   ├── src/
│   │   ├── components/    # React компоненти
│   │   ├── pages/         # Сторінки додатку  
│   │   ├── contexts/      # React Context
│   │   ├── types/         # TypeScript типи
│   │   └── config/        # API конфігурація
│   ├── package.json       # Node.js залежності
│   └── nginx.conf         # Frontend Nginx конфіг
├── database/
│   ├── init.sql          # Ініціалізація PostgreSQL
│   ├── backup.sh         # Скрипт автобекапу
│   └── backups/          # Директорія бекапів
└── README.md             # Документація
```

## 🔌 API Endpoints

### 📝 Рецепти
- `GET /recipes/` - Список всіх рецептів
- `POST /recipes/` - Створити новий рецепт  
- `GET /recipes/{id}` - Отримати рецепт за ID
- `PUT /recipes/{id}` - Оновити рецепт
- `DELETE /recipes/{id}` - Видалити рецепт

### 🏷️ Категорії та теги
- `GET /categories/` - Список категорій
- `POST /categories/` - Створити категорію
- `GET /tags/` - Список тегів
- `POST /tags/` - Створити тег

### 👤 Аутентифікація
- `POST /auth/register` - Реєстрація користувача
- `POST /auth/login` - Вхід в систему
- `GET /auth/me` - Профіль користувача

### ⭐ Рейтинги та коментарі  
- `POST /ratings/` - Оцінити рецепт
- `GET /ratings/{recipe_id}/stats` - Статистика рейтингу
- `POST /comments/` - Додати коментар
- `GET /comments/{recipe_id}` - Коментарі до рецепту

### 📷 Медіа файли
- `POST /media/upload-step-file` - Завантажити файл
- `DELETE /media/delete-step-file/{filename}` - Видалити файл

**Повна документація API**: https://kitkuhar.com/docs

## 🔧 Administration Commands

### Docker Management
```bash
# Запуск сервісів
sudo docker compose up -d

# Зупинка сервісів  
sudo docker compose down

# Перезапуск конкретного сервісу
sudo docker compose restart [service_name]

# Перегляд логів
sudo docker compose logs -f [service_name]

# Оновлення образів
sudo docker compose pull
sudo docker compose up -d
```

### SSL Certificate Management  
```bash
# Оновлення сертифікатів
sudo certbot renew

# Перевірка статусу сертифікатів
sudo certbot certificates
```

### Database Operations
```bash
# Підключення до PostgreSQL
sudo docker exec -it kitkuhar-db psql -U kitkuhar_user -d kitkuhar

# Створення бекапу
./database/backup.sh

# Перевірка розміру БД
sudo du -sh /var/lib/docker/volumes/kitkuhar_postgres_data/_data/
```

## 🗺️ Дорожня карта

### ✅ Поточна версія (v2.0) - ЗАВЕРШЕНО
- ✅ **Docker архітектура** з багатокомпонентною системою
- ✅ **HTTPS підтримка** через Let's Encrypt + Cloudflare
- ✅ **PostgreSQL база даних** з pgAdmin управлінням  
- ✅ **Автоматичний бекап** з ротацією файлів
- ✅ **Production deployment** з reverse proxy
- ✅ **Мобільна оптимізація** з адаптивним UI
- ✅ **Безпека та моніторинг** з структурованим логуванням

### 🔮 Майбутні версії (v3.0+)
- 🔲 **Kubernetes deployment** для масштабування
- 🔲 **Redis кешування** для покращення продуктивності
- 🔲 **Full-text search** з Elasticsearch
- 🔲 **CDN для медіа файлів** з AWS S3/CloudFlare R2
- 🔲 **Мобільний додаток** (React Native)
- 🔲 **PWA підтримка** для офлайн роботи
- 🔲 **Метрики та аналітика** з Grafana/Prometheus

## 🔒 Security Features

- 🔐 **HTTPS Everywhere** з автоматичним редиректом
- 🛡️ **Security Headers** (CSP, HSTS, X-Frame-Options)  
- 🔑 **JWT Authentication** з secure cookies
- 🚫 **Rate Limiting** для API endpoints
- 🔒 **Database Security** без прямого доступу ззовні
- 🌐 **Cloudflare Protection** від DDoS атак

## 📊 Monitoring & Logs

### Application Logs
```bash
# Backend логи
sudo docker compose logs -f backend

# Frontend логи  
sudo docker compose logs -f frontend

# Nginx логи
sudo docker compose logs -f nginx

# Database логи
sudo docker compose logs -f database
```

### System Health
- **Health checks** для всіх сервісів
- **Automatic restart** при збоях
- **Database connection monitoring**
- **SSL certificate expiry tracking**

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Make changes and test locally with Docker
4. Commit changes (`git commit -m 'Add amazing feature'`)
5. Push to branch (`git push origin feature/amazing-feature`)
6. Create Pull Request

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

## 📞 Support

- 📧 **Issues**: Create GitHub issue for bug reports
- 🌐 **Live Demo**: https://kitkuhar.com

---

⭐ Якщо проект сподобався, не забудьте поставити зірочку на GitHub!

🐱👨‍🍳 **Смачних вам рецептів від Кота Кухаря!**
