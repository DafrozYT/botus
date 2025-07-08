<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\CaseController;
use App\Http\Controllers\HomeController;
use App\Http\Controllers\ProfileController;
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

// Public routes
Route::get('/', [HomeController::class, 'index'])->name('home');
Route::get('/cases', [HomeController::class, 'cases'])->name('cases');
Route::get('/leaderboard', [HomeController::class, 'leaderboard'])->name('leaderboard');
Route::get('/provably-fair', [HomeController::class, 'provablyFair'])->name('provably-fair');
Route::get('/support', [HomeController::class, 'support'])->name('support');
Route::get('/terms', [HomeController::class, 'terms'])->name('terms');
Route::get('/privacy', [HomeController::class, 'privacy'])->name('privacy');

// AJAX routes
Route::get('/api/live-data', [HomeController::class, 'liveData'])->name('live-data');

// Authentication routes
Route::prefix('auth')->name('auth.')->group(function () {
    Route::get('/login', [AuthController::class, 'showLogin'])->name('login');
    Route::get('/steam', [AuthController::class, 'steamAuth'])->name('steam');
    Route::get('/callback', [AuthController::class, 'callback'])->name('callback');
    Route::post('/logout', [AuthController::class, 'logout'])->name('logout');
});

// Case routes
Route::prefix('cases')->name('cases.')->group(function () {
    Route::get('/{caseId}', [CaseController::class, 'show'])->name('show');
    Route::get('/{caseId}/history', [CaseController::class, 'history'])->name('history');
    Route::get('/category/{category}', [CaseController::class, 'category'])->name('category');
    
    // Protected case routes
    Route::middleware('auth')->group(function () {
        Route::post('/{caseId}/open', [CaseController::class, 'open'])->name('open');
        Route::get('/drops/{dropId}/verify', [CaseController::class, 'verify'])->name('verify');
    });
});

// Protected routes
Route::middleware('auth')->group(function () {
    
    // Profile routes
    Route::prefix('profile')->name('profile.')->group(function () {
        Route::get('/', [ProfileController::class, 'index'])->name('index');
        Route::get('/settings', [ProfileController::class, 'settings'])->name('settings');
        Route::put('/settings', [ProfileController::class, 'updateSettings'])->name('update-settings');
        Route::get('/history', [ProfileController::class, 'history'])->name('history');
        Route::get('/statistics', [ProfileController::class, 'statistics'])->name('statistics');
        Route::post('/deposit', [ProfileController::class, 'deposit'])->name('deposit');
        Route::post('/withdraw', [ProfileController::class, 'withdraw'])->name('withdraw');
    });
    
    // Dashboard
    Route::get('/dashboard', [ProfileController::class, 'dashboard'])->name('dashboard');
});

// Fallback for SPA-like behavior
Route::fallback(function () {
    return view('app');
});