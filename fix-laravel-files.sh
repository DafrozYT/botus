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

# Function to create bootstrap/app.php (Laravel 10 style)
create_bootstrap_app() {
    local app_dir=$1
    local bootstrap_dir="$app_dir/bootstrap"
    local bootstrap_file="$bootstrap_dir/app.php"
    
    mkdir -p "$bootstrap_dir"
    
    if [ ! -f "$bootstrap_file" ]; then
        cat > "$bootstrap_file" << 'EOF'
<?php

/*
|--------------------------------------------------------------------------
| Create The Application
|--------------------------------------------------------------------------
|
| The first thing we will do is create a new Laravel application instance
| which serves as the "glue" for all the components of Laravel, and is
| the IoC container for the system binding all of the various parts.
|
*/

$app = new Illuminate\Foundation\Application(
    $_ENV['APP_BASE_PATH'] ?? dirname(__DIR__)
);

/*
|--------------------------------------------------------------------------
| Bind Important Interfaces
|--------------------------------------------------------------------------
|
| Next, we need to bind some important interfaces into the container so
| we will be able to resolve them when needed. The kernels serve the
| incoming requests to this application from both the web and CLI.
|
*/

$app->singleton(
    Illuminate\Contracts\Http\Kernel::class,
    App\Http\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

/*
|--------------------------------------------------------------------------
| Return The Application
|--------------------------------------------------------------------------
|
| This script returns the application instance. The instance is given to
| the calling script so we can separate the building of the instances
| from the actual running of the application and sending responses.
|
*/

return $app;
EOF
        print_created "$bootstrap_file"
    else
        print_exists "$bootstrap_file"
    fi
}

# Function to create Laravel kernel classes
create_laravel_kernels() {
    local app_dir=$1
    
    # Create HTTP Kernel
    if [ ! -f "$app_dir/app/Http/Kernel.php" ]; then
        mkdir -p "$app_dir/app/Http"
        cat > "$app_dir/app/Http/Kernel.php" << 'EOF'
<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;

class Kernel extends HttpKernel
{
    /**
     * The application's global HTTP middleware stack.
     *
     * @var array<int, class-string|string>
     */
    protected $middleware = [
        \App\Http\Middleware\TrustProxies::class,
        \Illuminate\Http\Middleware\HandleCors::class,
        \App\Http\Middleware\PreventRequestsDuringMaintenance::class,
        \Illuminate\Foundation\Http\Middleware\ValidatePostSize::class,
        \App\Http\Middleware\TrimStrings::class,
        \Illuminate\Foundation\Http\Middleware\ConvertEmptyStringsToNull::class,
    ];

    /**
     * The application's route middleware groups.
     *
     * @var array<string, array<int, class-string|string>>
     */
    protected $middlewareGroups = [
        'web' => [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],

        'api' => [
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    /**
     * The application's middleware aliases.
     *
     * @var array<string, class-string|string>
     */
    protected $middlewareAliases = [
        'auth' => \App\Http\Middleware\Authenticate::class,
        'auth.basic' => \Illuminate\Auth\Middleware\AuthenticateWithBasicAuth::class,
        'auth.session' => \Illuminate\Session\Middleware\AuthenticateSession::class,
        'cache.headers' => \Illuminate\Http\Middleware\SetCacheHeaders::class,
        'can' => \Illuminate\Auth\Middleware\Authorize::class,
        'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        'password.confirm' => \Illuminate\Auth\Middleware\RequirePassword::class,
        'precognitive' => \Illuminate\Foundation\Http\Middleware\HandlePrecognitiveRequests::class,
        'signed' => \App\Http\Middleware\ValidateSignature::class,
        'throttle' => \Illuminate\Routing\Middleware\ThrottleRequests::class,
        'verified' => \Illuminate\Auth\Middleware\EnsureEmailIsVerified::class,
    ];
}
EOF
        print_created "$app_dir/app/Http/Kernel.php"
    else
        print_exists "$app_dir/app/Http/Kernel.php"
    fi
    
    # Create Console Kernel
    if [ ! -f "$app_dir/app/Console/Kernel.php" ]; then
        mkdir -p "$app_dir/app/Console"
        cat > "$app_dir/app/Console/Kernel.php" << 'EOF'
<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // $schedule->command('inspire')->hourly();
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}
EOF
        print_created "$app_dir/app/Console/Kernel.php"
    else
        print_exists "$app_dir/app/Console/Kernel.php"
    fi
    
    # Create Exception Handler
    if [ ! -f "$app_dir/app/Exceptions/Handler.php" ]; then
        mkdir -p "$app_dir/app/Exceptions"
        cat > "$app_dir/app/Exceptions/Handler.php" << 'EOF'
<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }
}
EOF
        print_created "$app_dir/app/Exceptions/Handler.php"
    else
        print_exists "$app_dir/app/Exceptions/Handler.php"
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
    
    # Create kernel classes
    create_laravel_kernels "$app_dir"
    
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