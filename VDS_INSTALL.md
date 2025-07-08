# 🖥️ Установка Hitmanki.store на чистый VDS

Пошаговое руководство по развертыванию платформы для открытия кейсов на чистом VDS сервере.

## 📋 Содержание
1. [Требования к VDS](#требования-к-vds)
2. [Подключение к серверу](#подключение-к-серверу)
3. [Первоначальная настройка сервера](#первоначальная-настройка-сервера)
4. [Настройка безопасности](#настройка-безопасности)
5. [Установка Docker](#установка-docker)
6. [Настройка DNS](#настройка-dns)
7. [Получение Steam API ключа](#получение-steam-api-ключа)
8. [Установка проекта](#установка-проекта)
9. [Конфигурация и развертывание](#конфигурация-и-развертывание)
10. [Проверка и тестирование](#проверка-и-тестирование)

---

## 🖥️ Требования к VDS

### Минимальные характеристики:
- **ОС**: Ubuntu 20.04+ / Debian 11+ / CentOS 8+
- **CPU**: 2 ядра (рекомендуется 4)
- **RAM**: 4 GB (рекомендуется 8 GB)
- **Диск**: 20 GB SSD (рекомендуется 50 GB)
- **Канал**: 100 Mbps
- **IP**: Статический внешний IP адрес

### Рекомендуемые характеристики:
- **CPU**: 4-8 ядер
- **RAM**: 8-16 GB
- **Диск**: 100 GB SSD
- **Канал**: 1 Gbps

### Провайдеры VDS (примеры):
- **TimeWeb**: от 290₽/месяц
- **REG.RU**: от 250₽/месяц
- **Beget**: от 400₽/месяц
- **DigitalOcean**: от $6/месяц
- **Vultr**: от $6/месяц

---

## 🔐 Подключение к серверу

### Шаг 1: Получение данных доступа
После заказа VDS вы получите:
- **IP адрес сервера** (например: 192.168.1.100)
- **Логин**: обычно `root`
- **Пароль**: временный пароль

### Шаг 2: Первое подключение

#### Для Windows (используйте PuTTY):
1. Скачайте PuTTY с https://putty.org/
2. Запустите PuTTY
3. В поле "Host Name" введите IP сервера
4. Нажмите "Open"
5. Введите логин `root` и пароль

#### Для Linux/Mac (используйте Terminal):
```bash
# Подключитесь к серверу
ssh root@ВАШ_IP_АДРЕС

# Введите пароль при запросе
```

### Шаг 3: Проверка подключения
```bash
# Проверьте информацию о системе
uname -a
cat /etc/os-release

# Проверьте ресурсы сервера
free -h    # RAM
df -h      # Диск
nproc      # CPU ядра
```

---

## ⚙️ Первоначальная настройка сервера

### Шаг 1: Обновление системы
```bash
# Обновите списки пакетов
apt update

# Обновите систему
apt upgrade -y

# Установите необходимые утилиты
apt install -y curl wget git nano htop unzip software-properties-common apt-transport-https ca-certificates gnupg lsb-release
```

### Шаг 2: Настройка временной зоны
```bash
# Настройте временную зону (например, Москва)
timedatectl set-timezone Europe/Moscow

# Проверьте время
date
```

### Шаг 3: Настройка локали
```bash
# Настройка русской локали (опционально)
locale-gen ru_RU.UTF-8
update-locale LANG=ru_RU.UTF-8
```

### Шаг 4: Создание пользователя (безопасность)
```bash
# Создайте нового пользователя (вместо root)
adduser hitmanki

# Введите пароль и данные пользователя
# Пароль должен быть сложным!

# Добавьте пользователя в группу sudo
usermod -aG sudo hitmanki

# Проверьте создание пользователя
id hitmanki
```

---

## 🔒 Настройка безопасности

### Шаг 1: Настройка SSH ключей (рекомендуется)

#### На вашем локальном компьютере:
```bash
# Сгенерируйте SSH ключ (если у вас его нет)
ssh-keygen -t rsa -b 4096 -C "ваш_email@example.com"

# Скопируйте публичный ключ на сервер
ssh-copy-id hitmanki@ВАШ_IP_АДРЕС
```

#### На сервере:
```bash
# Переключитесь на нового пользователя
su - hitmanki

# Создайте директорию для SSH ключей
mkdir -p ~/.ssh
chmod 700 ~/.ssh

# Если ssh-copy-id не работает, добавьте ключ вручную:
nano ~/.ssh/authorized_keys
# Вставьте содержимое вашего файла ~/.ssh/id_rsa.pub

# Установите правильные права
chmod 600 ~/.ssh/authorized_keys
```

### Шаг 2: Настройка SSH демона
```bash
# Вернитесь под root
exit

# Отредактируйте конфигурацию SSH
nano /etc/ssh/sshd_config
```

Измените следующие строки:
```bash
# Отключите вход под root
PermitRootLogin no

# Отключите вход по паролю (если настроили ключи)
PasswordAuthentication no

# Смените порт SSH (опционально)
Port 2222

# Разрешите вход только определенному пользователю
AllowUsers hitmanki
```

```bash
# Перезапустите SSH службу
systemctl restart sshd

# ВАЖНО: Не закрывайте текущую сессию! 
# Откройте новый терминал и проверьте подключение
```

### Шаг 3: Настройка файрвола
```bash
# Установите UFW (если не установлен)
apt install -y ufw

# Настройте базовые правила
ufw default deny incoming
ufw default allow outgoing

# Разрешите SSH (измените порт если меняли)
ufw allow 22/tcp
# или ufw allow 2222/tcp если меняли порт

# Разрешите HTTP и HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Включите файрвол
ufw enable

# Проверьте статус
ufw status
```

### Шаг 4: Отключение неиспользуемых сервисов
```bash
# Проверьте активные сервисы
systemctl list-units --type=service --state=active

# Отключите ненужные сервисы (примеры)
systemctl disable apache2 2>/dev/null || true
systemctl disable mysql 2>/dev/null || true
systemctl disable postgresql 2>/dev/null || true

# Остановите ненужные сервисы
systemctl stop apache2 2>/dev/null || true
systemctl stop mysql 2>/dev/null || true
systemctl stop postgresql 2>/dev/null || true
```

---

## 🐳 Установка Docker

### Шаг 1: Переключение на рабочего пользователя
```bash
# Переключитесь на пользователя hitmanki
su - hitmanki
```

### Шаг 2: Установка Docker
```bash
# Скачайте и запустите официальный скрипт установки Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sh get-docker.sh

# Добавьте пользователя в группу docker
sudo usermod -aG docker $USER

# Проверьте версию Docker
docker --version
```

### Шаг 3: Установка Docker Compose
```bash
# Установите Docker Compose
sudo apt install -y docker-compose-plugin

# Альтернативный способ (если не работает выше):
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Проверьте версию
docker compose version
# или docker-compose --version
```

### Шаг 4: Настройка Docker для автозапуска
```bash
# Включите автозапуск Docker
sudo systemctl enable docker

# Запустите Docker
sudo systemctl start docker

# Проверьте статус
sudo systemctl status docker
```

### Шаг 5: Тест Docker
```bash
# Перезайдите для применения группы docker
exit
ssh hitmanki@ВАШ_IP_АДРЕС

# Протестируйте Docker
docker run hello-world

# Если тест прошел успешно, Docker готов к работе
```

---

## 🌐 Настройка DNS

### Шаг 1: Получение статического IP
```bash
# Узнайте внешний IP вашего сервера
curl ifconfig.me
# или
wget -qO- ifconfig.me
```

### Шаг 2: Настройка DNS записей

Зайдите в панель управления вашего домена (где покупали hitmanki.store) и создайте следующие записи:

| Тип   | Имя                  | Значение              | TTL  |
|-------|---------------------|-----------------------|------|
| A     | hitmanki.store      | ВАШ_IP_АДРЕС_СЕРВЕРА | 300  |
| CNAME | admin.hitmanki.store| hitmanki.store        | 300  |
| CNAME | api.hitmanki.store  | hitmanki.store        | 300  |

### Шаг 3: Проверка DNS
```bash
# Установите утилиты для проверки DNS
sudo apt install -y dnsutils

# Проверьте DNS записи (может занять до 30 минут)
nslookup hitmanki.store
nslookup admin.hitmanki.store
nslookup api.hitmanki.store

# Альтернативная проверка
dig hitmanki.store
dig admin.hitmanki.store
dig api.hitmanki.store
```

⚠️ **Важно**: DNS записи могут обновляться от 10 минут до 24 часов. Дождитесь их распространения перед продолжением.

---

## 🔑 Получение Steam API ключа

### Шаг 1: Создание Steam API ключа
1. Откройте браузер и перейдите на https://steamcommunity.com/dev/apikey
2. Войдите в свой Steam аккаунт
3. В поле "Domain Name" введите: `hitmanki.store`
4. Прочтите и согласитесь с условиями Steam Web API
5. Нажмите "Register"
6. Скопируйте полученный API ключ

⚠️ **Важно**: Сохраните API ключ в надежном месте. Он понадобится при конфигурации.

---

## 📥 Установка проекта

### Шаг 1: Клонирование репозитория
```bash
# Убедитесь, что вы под пользователем hitmanki
whoami

# Перейдите в домашнюю директорию
cd ~

# Клонируйте проект (замените на ваш репозиторий)
git clone https://github.com/ваш-пользователь/hitmanki-cases.git

# Если репозиторий приватный, настройте SSH ключи или используйте токен
# git clone https://username:token@github.com/ваш-пользователь/hitmanki-cases.git

# Перейдите в папку проекта
cd hitmanki-cases

# Проверьте структуру
ls -la
```

### Шаг 2: Проверка файлов проекта
```bash
# Убедитесь, что все папки на месте
ls -la
# Должны быть: backend/ frontend/ admin/ docker/ README.md

# Проверьте Docker файлы
ls -la docker/
# Должны быть: docker-compose.production.yml nginx.conf deploy-hitmanki.sh .env.production

# Сделайте скрипты исполняемыми
chmod +x docker/*.sh fix-laravel-files.sh

# Исправьте недостающие Laravel файлы
./fix-laravel-files.sh
```

---

## ⚙️ Конфигурация и развертывание

### Шаг 1: Настройка переменных окружения
```bash
# Перейдите в папку docker
cd ~/hitmanki-cases/docker

# Скопируйте шаблон конфигурации
cp .env.production .env

# Сгенерируйте безопасные секреты
./generate-secrets.sh

# Отредактируйте конфигурацию
nano .env
```

### Шаг 2: Основные настройки в .env файле

**Обязательно измените:**
```bash
# Steam API ключ (ОБЯЗАТЕЛЬНО!)
STEAM_API_KEY=ваш_полученный_steam_api_ключ

# Домены (должны быть правильными)
DOMAIN=hitmanki.store
FRONTEND_URL=https://hitmanki.store
ADMIN_URL=https://admin.hitmanki.store
BACKEND_URL=https://api.hitmanki.store

# Сгенерированные секреты (автоматически заполнятся скриптом)
MONGO_ROOT_PASSWORD=сгенерированный_пароль
MYSQL_PASSWORD=сгенерированный_пароль
JWT_SECRET=сгенерированный_секрет
SERVER_SEED_SECRET=сгенерированный_секрет
APP_KEY=base64:сгенерированный_ключ
ADMIN_APP_KEY=base64:сгенерированный_ключ
```

### Шаг 3: Проверка конфигурации
```bash
# Запустите проверку конфигурации
./check-config.sh

# Исправьте все найденные ошибки перед продолжением
```

### Шаг 4: Создание необходимых директорий
```bash
# Создайте папки для SSL и логов
mkdir -p ssl logs
chmod 755 ssl logs

# Проверьте свободное место на диске
df -h
```

### Шаг 5: Развертывание проекта
```bash
# Запустите автоматическое развертывание
./deploy-hitmanki.sh

# Процесс займет 10-15 минут
# Скрипт автоматически:
# 1. Проверит зависимости
# 2. Получит SSL сертификаты
# 3. Соберет Docker образы
# 4. Запустит все сервисы
# 5. Выполнит миграции БД
# 6. Протестирует доступность
```

---

## ✅ Проверка и тестирование

### Шаг 1: Проверка статуса сервисов
```bash
# Проверьте статус всех контейнеров
docker-compose -f docker-compose.production.yml ps

# Все сервисы должны быть в статусе "Up"
```

### Шаг 2: Проверка логов
```bash
# Посмотрите логи всех сервисов
docker-compose -f docker-compose.production.yml logs --tail=50

# Или конкретного сервиса
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
docker-compose -f docker-compose.production.yml logs nginx
```

### Шаг 3: Проверка доступности сайтов
```bash
# Проверьте HTTP ответы
curl -I https://hitmanki.store
curl -I https://admin.hitmanki.store  
curl https://api.hitmanki.store/api/health

# Все должны возвращать HTTP 200 или 302
```

### Шаг 4: Проверка SSL сертификатов
```bash
# Проверьте SSL сертификат
openssl s_client -connect hitmanki.store:443 -servername hitmanki.store </dev/null

# Сертификат должен быть валидным
```

### Шаг 5: Функциональное тестирование

1. **Основной сайт**: https://hitmanki.store
   - Откройте в браузере
   - Проверьте загрузку страницы
   - Убедитесь, что нет ошибок в консоли браузера

2. **Админ панель**: https://admin.hitmanki.store
   - Откройте в браузере
   - Попробуйте авторизоваться через Steam

3. **API**: https://api.hitmanki.store/api/health
   - Должен возвращать JSON с информацией о статусе

---

## 🎯 Первоначальная настройка

### Шаг 1: Создание администратора
```bash
# Авторизуйтесь через Steam на сайте
# Затем в MongoDB добавьте роль администратора:

# Подключитесь к MongoDB
docker-compose -f docker-compose.production.yml exec mongodb mongo -u admin -p

# В MongoDB консоли:
use hitmanki_cases
db.users.updateOne(
  {steamId: "ваш_steam_id"}, 
  {$set: {role: "admin"}}
)
exit
```

### Шаг 2: Добавление первого кейса
1. Зайдите в админ панель: https://admin.hitmanki.store
2. Авторизуйтесь через Steam
3. Перейдите в раздел "Кейсы"
4. Создайте новый кейс с предметами

### Шаг 3: Настройка мониторинга
```bash
# Создайте простой скрипт мониторинга
nano ~/monitor.sh
```

Содержимое скрипта:
```bash
#!/bin/bash
cd ~/hitmanki-cases/docker
echo "=== Статус сервисов ==="
docker-compose -f docker-compose.production.yml ps
echo "=== Использование ресурсов ==="
docker stats --no-stream
echo "=== Место на диске ==="
df -h
```

```bash
# Сделайте скрипт исполняемым
chmod +x ~/monitor.sh

# Запустите мониторинг
~/monitor.sh
```

---

## 🛠️ Управление сервером

### Полезные команды:

```bash
# Перезапуск всех сервисов
cd ~/hitmanki-cases/docker
docker-compose -f docker-compose.production.yml restart

# Остановка сервисов
docker-compose -f docker-compose.production.yml stop

# Запуск сервисов
docker-compose -f docker-compose.production.yml start

# Обновление проекта
git pull origin main
docker-compose -f docker-compose.production.yml build --no-cache
docker-compose -f docker-compose.production.yml up -d

# Просмотр логов в реальном времени
docker-compose -f docker-compose.production.yml logs -f

# Очистка неиспользуемых Docker объектов
docker system prune -a
```

### Автоматическое обновление SSL:
```bash
# Добавьте задачу в cron для автообновления SSL
sudo crontab -e

# Добавьте строку (обновление каждый день в 2:00):
0 2 * * * /usr/bin/certbot renew --quiet && cd /home/hitmanki/hitmanki-cases/docker && docker-compose -f docker-compose.production.yml restart nginx
```

---

## 🆘 Устранение неполадок

### Проблема: Сервис не запускается
```bash
# Детальные логи
docker-compose -f docker-compose.production.yml logs имя_сервиса

# Проверка конфигурации
docker-compose -f docker-compose.production.yml config

# Пересборка образа
docker-compose -f docker-compose.production.yml build --no-cache имя_сервиса
```

### Проблема: DNS не работает
```bash
# Проверьте DNS
nslookup hitmanki.store 8.8.8.8

# Очистите DNS кеш
sudo systemctl flush-dns 2>/dev/null || sudo /etc/init.d/networking restart
```

### Проблема: SSL не работает
```bash
# Остановите nginx
docker-compose -f docker-compose.production.yml stop nginx

# Получите сертификаты вручную
sudo certbot certonly --standalone -d hitmanki.store -d admin.hitmanki.store -d api.hitmanki.store

# Скопируйте сертификаты
sudo cp /etc/letsencrypt/live/hitmanki.store/fullchain.pem ssl/hitmanki.store.crt
sudo cp /etc/letsencrypt/live/hitmanki.store/privkey.pem ssl/hitmanki.store.key
sudo chown hitmanki:hitmanki ssl/hitmanki.store.*

# Запустите nginx
docker-compose -f docker-compose.production.yml start nginx
```

### Проблема: Нет места на диске
```bash
# Очистите Docker
docker system prune -a -f

# Очистите логи
sudo journalctl --vacuum-time=7d

# Очистите пакеты
sudo apt autoremove -y
sudo apt autoclean
```

---

## 🎉 Поздравляем!

**Hitmanki.store успешно установлен на ваш VDS!**

### Итоговый результат:
- ✅ **https://hitmanki.store** - основной сайт работает
- ✅ **https://admin.hitmanki.store** - админ панель доступна
- ✅ **https://api.hitmanki.store** - API backend функционирует  
- ✅ **SSL сертификаты** установлены и автообновляются
- ✅ **Steam авторизация** настроена
- ✅ **Все базы данных** работают
- ✅ **WebSocket** для реального времени активен
- ✅ **Система безопасности** настроена
- ✅ **Файрвол** активен
- ✅ **Мониторинг** доступен

### Следующие шаги:
1. Создайте первые кейсы в админ панели
2. Настройте платежную систему
3. Добавьте Google Analytics
4. Настройте резервное копирование
5. Добавьте мониторинг сервера

### Полезные файлы:
- **Мониторинг**: `~/monitor.sh`
- **Логи**: `~/hitmanki-cases/docker/logs/`
- **Конфигурация**: `~/hitmanki-cases/docker/.env`
- **Управление**: `~/hitmanki-cases/docker/`

**Ваша платформа готова к работе! 🚀**