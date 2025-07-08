# 📋 Пошаговая установка Hitmanki.store

## 📖 Содержание
1. [Требования к серверу](#требования-к-серверу)
2. [Подготовка сервера](#подготовка-сервера)
3. [Настройка DNS](#настройка-dns)
4. [Получение Steam API ключа](#получение-steam-api-ключа)
5. [Установка проекта](#установка-проекта)
6. [Конфигурация](#конфигурация)
7. [Развертывание](#развертывание)
8. [Первоначальная настройка](#первоначальная-настройка)
9. [Тестирование](#тестирование)
10. [Устранение неполадок](#устранение-неполадок)

---

## 🖥️ Требования к серверу

### Минимальные требования:
- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: 2 ядра (рекомендуется 4)
- **RAM**: 4 GB (рекомендуется 8 GB)
- **Диск**: 20 GB SSD (рекомендуется 50 GB)
- **Сеть**: 100 Mbps

### Рекомендуемые требования для продакшена:
- **CPU**: 4-8 ядер
- **RAM**: 8-16 GB
- **Диск**: 100 GB SSD
- **Сеть**: 1 Gbps

---

## 🛠️ Подготовка сервера

### Шаг 1: Обновление системы
```bash
# Подключитесь к серверу по SSH
ssh root@ваш_сервер_ip

# Обновите систему
sudo apt update && sudo apt upgrade -y

# Установите необходимые утилиты
sudo apt install -y curl wget git nano htop unzip
```

### Шаг 2: Создание пользователя (если работаете под root)
```bash
# Создайте нового пользователя
adduser hitmanki

# Добавьте в группу sudo
usermod -aG sudo hitmanki

# Переключитесь на нового пользователя
su - hitmanki
```

### Шаг 3: Установка Docker
```bash
# Скачайте и установите Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Установите Docker Compose
sudo apt install -y docker-compose-plugin

# Перезайдите в систему для применения групп
exit
# Подключитесь снова
ssh hitmanki@ваш_сервер_ip
```

### Шаг 4: Проверка установки Docker
```bash
# Проверьте версию Docker
docker --version
docker-compose --version

# Проверьте, что Docker работает
docker run hello-world
```

---

## 🌐 Настройка DNS

### У вашего DNS провайдера создайте записи:

| Тип   | Имя                  | Значение        | TTL  |
|-------|---------------------|-----------------|------|
| A     | hitmanki.store      | IP_ВАШЕГО_СЕРВЕРА | 300  |
| CNAME | admin.hitmanki.store| hitmanki.store  | 300  |
| CNAME | api.hitmanki.store  | hitmanki.store  | 300  |

### Проверка DNS:
```bash
# Проверьте, что DNS записи работают
nslookup hitmanki.store
nslookup admin.hitmanki.store
nslookup api.hitmanki.store

# Или используйте dig
dig hitmanki.store
```

⚠️ **Важно**: Дождитесь распространения DNS записей (может занять до 24 часов, обычно 10-30 минут).

---

## 🔑 Получение Steam API ключа

### Шаг 1: Авторизация в Steam
1. Перейдите на https://steamcommunity.com/dev/apikey
2. Войдите в свой Steam аккаунт
3. Заполните поле "Domain Name": `hitmanki.store`
4. Согласитесь с условиями
5. Скопируйте полученный API ключ

⚠️ **Важно**: Сохраните API ключ в надежном месте - он понадобится при конфигурации.

---

## 📥 Установка проекта

### Шаг 1: Клонирование репозитория
```bash
# Перейдите в домашнюю директорию
cd ~

# Клонируйте проект (замените на ваш репозиторий)
git clone https://github.com/ваш-пользователь/hitmanki-cases.git

# Перейдите в папку проекта
cd hitmanki-cases

# Проверьте структуру проекта
ls -la
```

### Шаг 2: Проверка файлов
```bash
# Убедитесь, что все основные папки присутствуют
ls -la
# Должны быть: backend/ frontend/ admin/ docker/ README.md

# Проверьте Docker файлы
ls -la docker/
# Должны быть: docker-compose.yml docker-compose.production.yml nginx.conf deploy-hitmanki.sh .env.production
```

---

## ⚙️ Конфигурация

### Шаг 1: Настройка переменных окружения
```bash
# Перейдите в папку docker
cd docker

# Скопируйте шаблон конфигурации
cp .env.production .env

# Откройте файл для редактирования
nano .env
```

### Шаг 2: Редактирование .env файла

**Обязательно измените следующие параметры:**

```bash
# Steam API (ОБЯЗАТЕЛЬНО!)
STEAM_API_KEY=ваш_steam_api_ключ_здесь

# Пароли баз данных (ОБЯЗАТЕЛЬНО!)
MONGO_ROOT_PASSWORD=создайте_сложный_пароль_для_mongo
MYSQL_PASSWORD=создайте_сложный_пароль_для_mysql

# JWT секрет (ОБЯЗАТЕЛЬНО!)
JWT_SECRET=создайте_длинный_случайный_ключ_минимум_32_символа

# Provably Fair секрет (ОБЯЗАТЕЛЬНО!)
SERVER_SEED_SECRET=создайте_другой_случайный_ключ_для_честности

# Email настройки (РЕКОМЕНДУЕТСЯ)
MAIL_HOST=smtp.yandex.ru
MAIL_USERNAME=noreply@hitmanki.store
MAIL_PASSWORD=ваш_пароль_от_почты

# Платежи (ОПЦИОНАЛЬНО)
STRIPE_PUBLIC_KEY=pk_live_ваш_публичный_ключ
STRIPE_SECRET_KEY=sk_live_ваш_секретный_ключ
```

### Шаг 3: Исправление Laravel файлов
```bash
# Перейдите в корень проекта
cd ~/hitmanki-cases

# Исправьте недостающие Laravel файлы
chmod +x fix-laravel-files.sh
./fix-laravel-files.sh
```

### Шаг 4: Генерация Laravel ключей
```bash
# Перейдите в папку frontend
cd frontend

# Сгенерируйте ключ приложения (запишите его)
php artisan key:generate --show

# Перейдите в папку admin
cd ../admin

# Сгенерируйте ключ для админки (запишите его)
php artisan key:generate --show

# Вернитесь в docker папку
cd ../docker

# Добавьте сгенерированные ключи в .env файл
nano .env
```

Добавьте в .env:
```bash
APP_KEY=base64:сгенерированный_ключ_frontend
ADMIN_APP_KEY=base64:сгенерированный_ключ_admin
```

### Шаг 5: Создание необходимых папок
```bash
# Создайте папки для SSL сертификатов и логов
mkdir -p ssl logs

# Установите права доступа
chmod 755 ssl logs
```

---

## 🚀 Развертывание

### Шаг 1: Запуск автоматического развертывания
```bash
# Убедитесь, что вы в папке docker
cd ~/hitmanki-cases/docker

# Сделайте скрипт исполняемым
chmod +x deploy-hitmanki.sh

# Запустите развертывание
./deploy-hitmanki.sh
```

### Шаг 2: Мониторинг процесса установки
Скрипт автоматически выполнит:
1. ✅ Проверку всех зависимостей
2. ✅ Валидацию переменных окружения
3. ✅ Получение SSL сертификатов
4. ✅ Сборку Docker образов
5. ✅ Запуск всех сервисов
6. ✅ Выполнение миграций БД
7. ✅ Оптимизацию Laravel
8. ✅ Тестирование доступности

### Шаг 3: Ожидание завершения
Процесс может занять 10-15 минут. В случае ошибок скрипт остановится и покажет детали.

---

## 🎯 Первоначальная настройка

### Шаг 1: Проверка статуса сервисов
```bash
# Проверьте статус всех контейнеров
docker-compose -f docker-compose.production.yml ps

# Все сервисы должны быть в статусе "Up"
```

### Шаг 2: Создание администратора

#### Способ 1: Через базу данных
```bash
# Подключитесь к MongoDB
docker-compose -f docker-compose.production.yml exec mongodb mongo -u admin -p

# В MongoDB консоли выполните:
use hitmanki_cases
db.users.updateOne(
  {steamId: "ваш_steam_id"}, 
  {$set: {role: "admin"}}
)
```

#### Способ 2: Через админ панель
1. Зайдите на https://admin.hitmanki.store
2. Авторизуйтесь через Steam
3. В MongoDB измените роль пользователя на "admin"

### Шаг 3: Настройка первого кейса
1. Зайдите в админ панель: https://admin.hitmanki.store
2. Перейдите в раздел "Кейсы"
3. Создайте новый кейс
4. Добавьте предметы с шансами выпадения
5. Убедитесь, что сумма шансов = 100%

---

## 🧪 Тестирование

### Шаг 1: Проверка доступности сайтов
```bash
# Проверьте основной сайт
curl -I https://hitmanki.store

# Проверьте админ панель
curl -I https://admin.hitmanki.store

# Проверьте API
curl https://api.hitmanki.store/api/health
```

### Шаг 2: Проверка логов
```bash
# Посмотрите логи всех сервисов
docker-compose -f docker-compose.production.yml logs --tail=50

# Или конкретного сервиса
docker-compose -f docker-compose.production.yml logs backend
```

### Шаг 3: Функциональное тестирование
1. **Frontend**: Зайдите на https://hitmanki.store
2. **Авторизация**: Попробуйте войти через Steam
3. **Кейсы**: Убедитесь, что кейсы отображаются
4. **Открытие**: Попробуйте открыть кейс (если есть баланс)
5. **WebSocket**: Проверьте, что лента обновляется в реальном времени

---

## ❗ Устранение неполадок

### Проблема: Сервис не запускается
```bash
# Посмотрите детальные логи
docker-compose -f docker-compose.production.yml logs имя_сервиса

# Проверьте конфигурацию
docker-compose -f docker-compose.production.yml config

# Перезапустите проблемный сервис
docker-compose -f docker-compose.production.yml restart имя_сервиса
```

### Проблема: SSL сертификаты не получаются
```bash
# Убедитесь, что DNS записи работают
nslookup hitmanki.store

# Остановите nginx
docker-compose -f docker-compose.production.yml stop nginx

# Попробуйте получить сертификаты вручную
sudo certbot certonly --standalone -d hitmanki.store -d admin.hitmanki.store -d api.hitmanki.store

# Скопируйте сертификаты
sudo cp /etc/letsencrypt/live/hitmanki.store/fullchain.pem ssl/hitmanki.store.crt
sudo cp /etc/letsencrypt/live/hitmanki.store/privkey.pem ssl/hitmanki.store.key
sudo chown $USER:$USER ssl/hitmanki.store.*

# Запустите nginx
docker-compose -f docker-compose.production.yml start nginx
```

### Проблема: База данных недоступна
```bash
# Проверьте статус MongoDB
docker-compose -f docker-compose.production.yml exec mongodb mongo --eval "db.adminCommand('ismaster')"

# Проверьте статус MySQL
docker-compose -f docker-compose.production.yml exec mysql mysql -u root -p -e "SELECT 1"

# Перезапустите базы данных
docker-compose -f docker-compose.production.yml restart mongodb mysql
```

### Проблема: Steam авторизация не работает
1. Проверьте, что `STEAM_API_KEY` правильно указан в `.env`
2. Убедитесь, что в Steam API настройках указан домен `hitmanki.store`
3. Проверьте логи backend сервиса

### Проблема: WebSocket не работает
```bash
# Проверьте, что порты открыты
netstat -tlnp | grep :443

# Проверьте Nginx конфигурацию
docker-compose -f docker-compose.production.yml exec nginx nginx -t

# Перезапустите nginx
docker-compose -f docker-compose.production.yml restart nginx
```

---

## 📊 Мониторинг после установки

### Команды для мониторинга:
```bash
# Статус всех сервисов
docker-compose -f docker-compose.production.yml ps

# Использование ресурсов
docker stats

# Места на диске
df -h
docker system df

# Логи в реальном времени
docker-compose -f docker-compose.production.yml logs -f
```

### Автоматические задачи:
- SSL сертификаты обновляются автоматически
- Логи ротируются ежедневно
- Бэкапы можно настроить через cron

---

## ✅ Финальная проверка

После завершения установки у вас должно быть:

- ✅ **https://hitmanki.store** - работающий основной сайт
- ✅ **https://admin.hitmanki.store** - админ панель
- ✅ **https://api.hitmanki.store** - API backend
- ✅ **SSL сертификаты** установлены и работают
- ✅ **Steam авторизация** настроена
- ✅ **MongoDB + Redis + MySQL** работают
- ✅ **WebSocket** для реального времени
- ✅ **Админ пользователь** создан
- ✅ **Первый кейс** настроен

---

## 🎉 Поздравляем!

**Hitmanki.store** успешно установлен и готов к работе!

### Следующие шаги:
1. Настройте платежную систему (Stripe/PayPal)
2. Добавьте больше кейсов и предметов
3. Настройте email уведомления
4. Настройте аналитику (Google Analytics/Yandex Metrica)
5. Настройте регулярные бэкапы

### Полезные ссылки:
- 📖 [Полная документация](README.md)
- 🚀 [Краткое руководство по развертыванию](DEPLOYMENT.md)
- 🔧 [Управление сервисами](#мониторинг-после-установки)

**Удачи с вашим проектом!** 🚀