<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'steam_id',
        'username',
        'email',
        'avatar',
        'profile_url',
        'backend_token',
        'backend_user_id',
        'balance',
        'total_deposited',
        'total_withdrawn',
        'cases_opened',
        'total_won',
        'last_login_at',
        'settings',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var array<int, string>
     */
    protected $hidden = [
        'backend_token',
        'remember_token',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
        'last_login_at' => 'datetime',
        'settings' => 'array',
        'balance' => 'decimal:2',
        'total_deposited' => 'decimal:2',
        'total_withdrawn' => 'decimal:2',
        'total_won' => 'decimal:2',
        'cases_opened' => 'integer',
    ];

    /**
     * Get the user's formatted balance.
     */
    public function getFormattedBalanceAttribute(): string
    {
        return '$' . number_format($this->balance, 2);
    }

    /**
     * Get the user's profit/loss.
     */
    public function getProfitAttribute(): float
    {
        return $this->total_won - $this->total_deposited;
    }

    /**
     * Get the user's formatted profit/loss.
     */
    public function getFormattedProfitAttribute(): string
    {
        $profit = $this->profit;
        $sign = $profit >= 0 ? '+' : '';
        return $sign . '$' . number_format($profit, 2);
    }

    /**
     * Check if user has sufficient balance.
     */
    public function hasSufficientBalance(float $amount): bool
    {
        return $this->balance >= $amount;
    }

    /**
     * Get user's win rate percentage.
     */
    public function getWinRateAttribute(): float
    {
        if ($this->cases_opened == 0) {
            return 0;
        }
        
        return ($this->total_won / ($this->cases_opened * $this->getAverageCasePrice())) * 100;
    }

    /**
     * Get average case price (estimated).
     */
    private function getAverageCasePrice(): float
    {
        // This would ideally be calculated from actual case opening history
        return 10.0; // Default average case price
    }

    /**
     * Sync user data from backend.
     */
    public function syncFromBackend(array $backendData): void
    {
        $this->update([
            'username' => $backendData['username'] ?? $this->username,
            'avatar' => $backendData['avatar'] ?? $this->avatar,
            'balance' => $backendData['balance'] ?? $this->balance,
            'total_deposited' => $backendData['totalDeposited'] ?? $this->total_deposited,
            'total_withdrawn' => $backendData['totalWithdrawn'] ?? $this->total_withdrawn,
            'cases_opened' => $backendData['casesOpened'] ?? $this->cases_opened,
            'total_won' => $backendData['totalWon'] ?? $this->total_won,
            'settings' => $backendData['settings'] ?? $this->settings,
        ]);
    }

    /**
     * Get default user settings.
     */
    public static function getDefaultSettings(): array
    {
        return [
            'notifications' => true,
            'language' => 'en',
            'currency' => 'USD',
            'animation_speed' => 'normal',
            'sound_enabled' => true,
            'auto_open' => false,
        ];
    }

    /**
     * Boot the model.
     */
    protected static function booted()
    {
        static::creating(function ($user) {
            if (empty($user->settings)) {
                $user->settings = self::getDefaultSettings();
            }
        });
    }
}