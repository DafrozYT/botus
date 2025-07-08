#!/bin/bash

# Fix Missing Laravel Files Script
# Этот скрипт проверяет и создает недостающие файлы Laravel

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔧 Исправление недостающих файлов Laravel...${NC}"
echo

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_created() {
    echo -e "${YELLOW}📝 Создан: $1${NC}"
}

print_exists() {
    echo -e "${GREEN}✅ Существует: $1${NC}"
}

# Function to create artisan file
create_artisan() {
    local app_dir=$1
    local artisan_file="$app_dir/artisan"
    
    if [ ! -f "$artisan_file" ]; then
        cat > "$artisan_file" << 'EOF'
#!/usr/bin/env php
<?php

define('LARAVEL_START', microtime(true));

/*
|--------------------------------------------------------------------------
| Register The Auto Loader
|--------------------------------------------------------------------------
|
| Composer provides a convenient, automatically generated class loader
| for our application. We just need to utilize it! We'll require it
| into the script here so that we do not have to worry about the
| loading of any our classes "manually". Feels great to relax.
|
*/

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

/*
|--------------------------------------------------------------------------
| Run The Artisan Application
|--------------------------------------------------------------------------
|
| When we run the console application, the current CLI command will be
| executed in this console and the response sent back to a terminal
| or another output device for the developers. Here goes nothing!
|
*/

$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);

$status = $kernel->handle(
    $input = new Symfony\Component\Console\Input\ArgvInput,
    new Symfony\Component\Console\Output\ConsoleOutput
);

/*
|--------------------------------------------------------------------------
| Shutdown The Application
|--------------------------------------------------------------------------
|
| Once Artisan has finished running, we will fire off the shutdown events
| so that any final work may be done by the application before we shut
| down the process. This is the last thing to happen to the request.
|
*/

$kernel->terminate($input, $status);

exit($status);
EOF
        chmod +x "$artisan_file"
        print_created "$artisan_file"
    else
        print_exists "$artisan_file"
    fi
}

# Function to create bootstrap/app.php
create_bootstrap_app() {
    local app_dir=$1
    local bootstrap_dir="$app_dir/bootstrap"
    local bootstrap_file="$bootstrap_dir/app.php"
    
    mkdir -p "$bootstrap_dir"
    
    if [ ! -f "$bootstrap_file" ]; then
        cat > "$bootstrap_file" << 'EOF'
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
        ]);

        //
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
EOF
        print_created "$bootstrap_file"
    else
        print_exists "$bootstrap_file"
    fi
}

# Function to create basic Laravel files
create_laravel_basics() {
    local app_dir=$1
    local app_name=$2
    
    echo -e "\n${BLUE}📁 Проверка $app_name ($app_dir)...${NC}"
    
    # Create artisan
    create_artisan "$app_dir"
    
    # Create bootstrap/app.php
    create_bootstrap_app "$app_dir"
    
    # Create routes directory and files if they don't exist
    mkdir -p "$app_dir/routes"
    
    # Create web.php if doesn't exist
    if [ ! -f "$app_dir/routes/web.php" ]; then
        cat > "$app_dir/routes/web.php" << 'EOF'
<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "web" middleware group. Make something great!
|
*/

Route::get('/', function () {
    return view('welcome');
});
EOF
        print_created "$app_dir/routes/web.php"
    else
        print_exists "$app_dir/routes/web.php"
    fi
    
    # Create api.php if doesn't exist
    if [ ! -f "$app_dir/routes/api.php" ]; then
        cat > "$app_dir/routes/api.php" << 'EOF'
<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});
EOF
        print_created "$app_dir/routes/api.php"
    else
        print_exists "$app_dir/routes/api.php"
    fi
    
    # Create console.php if doesn't exist
    if [ ! -f "$app_dir/routes/console.php" ]; then
        cat > "$app_dir/routes/console.php" << 'EOF'
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

/*
|--------------------------------------------------------------------------
| Console Routes
|--------------------------------------------------------------------------
|
| This file is where you may define all of your Closure based console
| commands. Each Closure is bound to a command instance allowing a
| simple approach to interacting with each command's IO methods.
|
*/

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');
EOF
        print_created "$app_dir/routes/console.php"
    else
        print_exists "$app_dir/routes/console.php"
    fi
    
    # Create .env.example if doesn't exist
    if [ ! -f "$app_dir/.env.example" ]; then
        cat > "$app_dir/.env.example" << 'EOF'
APP_NAME=Laravel
APP_ENV=local
APP_KEY=
APP_DEBUG=true
APP_URL=http://localhost

LOG_CHANNEL=stack

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=laravel
DB_USERNAME=root
DB_PASSWORD=

BROADCAST_DRIVER=log
CACHE_DRIVER=file
QUEUE_CONNECTION=sync
SESSION_DRIVER=file
SESSION_LIFETIME=120

REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

MAIL_MAILER=smtp
MAIL_HOST=mailhog
MAIL_PORT=1025
MAIL_USERNAME=null
MAIL_PASSWORD=null
MAIL_ENCRYPTION=null
MAIL_FROM_ADDRESS=null
MAIL_FROM_NAME="${APP_NAME}"
EOF
        print_created "$app_dir/.env.example"
    else
        print_exists "$app_dir/.env.example"
    fi
    
    print_success "$app_name файлы проверены"
}

# Check if running from project root
if [ ! -d "frontend" ] || [ ! -d "admin" ]; then
    echo -e "${RED}❌ Ошибка: Запустите скрипт из корневой папки проекта${NC}"
    echo "Текущая папка: $(pwd)"
    echo "Ожидаемая структура: frontend/, admin/, backend/"
    exit 1
fi

# Process frontend
create_laravel_basics "frontend" "Frontend"

# Process admin
create_laravel_basics "admin" "Admin"

echo -e "\n${GREEN}🎉 Все файлы Laravel проверены и созданы!${NC}"
echo
echo -e "${BLUE}📋 Следующие шаги:${NC}"
echo "1. Установите зависимости Composer:"
echo -e "${YELLOW}   cd frontend && composer install${NC}"
echo -e "${YELLOW}   cd admin && composer install${NC}"
echo
echo "2. Сгенерируйте ключи приложений:"
echo -e "${YELLOW}   cd frontend && php artisan key:generate${NC}"
echo -e "${YELLOW}   cd admin && php artisan key:generate${NC}"
echo
echo "3. Настройте .env файлы и выполните миграции"
echo -e "${YELLOW}   php artisan migrate${NC}"
echo
echo -e "${GREEN}✅ Laravel приложения готовы к работе!${NC}"