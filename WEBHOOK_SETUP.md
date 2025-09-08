# Webhook Deployment Setup

Цей файл містить інструкції для налаштування webhook деплою замість SSH.

## 1. Налаштування на Raspberry Pi

### Крок 1: Завантажити файли
```bash
cd /home/baktorz/kitkuhar
git pull origin main
```

### Крок 2: Згенерувати webhook secret
```bash
# Генерування випадкового секрету
export WEBHOOK_SECRET=$(openssl rand -hex 32)
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" >> ~/.bashrc
echo "Your webhook secret: $WEBHOOK_SECRET"
```

### Крок 3: Запустити webhook сервіс
```bash
chmod +x webhook-service.sh
WEBHOOK_SECRET=$WEBHOOK_SECRET ./webhook-service.sh
```

### Крок 4: Додати до Cloudflare tunnel
Оновіть конфігурацію тунеля (`/etc/cloudflared/config.yml`):
```yaml
tunnel: your-tunnel-id
credentials-file: /etc/cloudflared/your-tunnel-id.json

ingress:
  - hostname: kitkuhar.com
    service: http://localhost:80
  - hostname: www.kitkuhar.com
    service: http://localhost:80
  - hostname: webhook.kitkuhar.com
    service: http://localhost:9000
  - hostname: ssh.kitkuhar.com
    service: ssh://localhost:22
  - service: http_status:404
```

Перезапустіть тунель:
```bash
sudo systemctl restart cloudflared
```

## 2. Налаштування GitHub Secrets

У налаштуваннях репозиторія GitHub додайте secret:
- `WEBHOOK_SECRET`: Той самий секрет, що згенерували на Pi

## 3. Перевірка роботи

### Локальна перевірка на Pi:
```bash
# Перевірка статусу сервісу
sudo systemctl status kitkuhar-webhook

# Перевірка логів
sudo journalctl -u kitkuhar-webhook -f

# Тест health check
curl http://localhost:9000/health
```

### Зовнішня перевірка:
```bash
# Health check через Cloudflare
curl https://webhook.kitkuhar.com/health

# Статус контейнерів
curl https://webhook.kitkuhar.com/status
```

## 4. Безпека

- Webhook використовує HMAC-SHA256 підпис для аутентифікації
- Сервіс приймає тільки пуші в `main` branch  
- Таймаут команд: 5 хвилин
- Логування всіх запитів

## 5. Troubleshooting

### Якщо webhook не працює:
```bash
# Перевірити порт
sudo netstat -tlpn | grep :9000

# Перезапустити сервіс  
sudo systemctl restart kitkuhar-webhook

# Перевірити логи
sudo journalctl -u kitkuhar-webhook --since "1 hour ago"
```

### Якщо деплой не працює:
```bash
# Перевірити Docker
docker-compose ps
docker-compose logs

# Перевірити права доступу
ls -la /home/baktorz/kitkuhar
```