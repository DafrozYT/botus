<?php

namespace App\Services;

use Illuminate\Http\Client\Response;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class BackendApiService
{
    protected string $baseUrl;
    protected int $timeout;

    public function __construct()
    {
        $this->baseUrl = config('services.backend.api_url', 'http://localhost:3000/api');
        $this->timeout = config('services.backend.timeout', 30);
    }

    /**
     * Make authenticated request to backend API.
     */
    protected function makeRequest(string $method, string $endpoint, array $data = [], string $token = null): array
    {
        try {
            $headers = [
                'Content-Type' => 'application/json',
                'Accept' => 'application/json',
            ];

            if ($token) {
                $headers['Authorization'] = 'Bearer ' . $token;
            }

            $response = Http::timeout($this->timeout)
                ->withHeaders($headers)
                ->$method($this->baseUrl . $endpoint, $data);

            if (!$response->successful()) {
                Log::error('Backend API Error', [
                    'endpoint' => $endpoint,
                    'status' => $response->status(),
                    'response' => $response->body()
                ]);

                throw new \Exception('Backend API request failed: ' . $response->status());
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error('Backend API Exception', [
                'endpoint' => $endpoint,
                'error' => $e->getMessage()
            ]);
            throw $e;
        }
    }

    /**
     * Get all active cases.
     */
    public function getCases(): array
    {
        $cacheKey = 'backend_cases';
        
        return Cache::remember($cacheKey, 300, function () {
            $response = $this->makeRequest('GET', '/cases');
            return $response['data'] ?? [];
        });
    }

    /**
     * Get case by ID.
     */
    public function getCase(string $caseId): array
    {
        $response = $this->makeRequest('GET', "/cases/{$caseId}");
        return $response['data'] ?? [];
    }

    /**
     * Get popular cases.
     */
    public function getPopularCases(int $limit = 10): array
    {
        $cacheKey = "backend_popular_cases_{$limit}";
        
        return Cache::remember($cacheKey, 300, function () use ($limit) {
            $response = $this->makeRequest('GET', "/cases/popular?limit={$limit}");
            return $response['data'] ?? [];
        });
    }

    /**
     * Get cases by category.
     */
    public function getCasesByCategory(string $category): array
    {
        $response = $this->makeRequest('GET', "/cases/category/{$category}");
        return $response['data'] ?? [];
    }

    /**
     * Open a case.
     */
    public function openCase(string $caseId, string $token, string $clientSeed = null): array
    {
        $data = ['caseId' => $caseId];
        if ($clientSeed) {
            $data['clientSeed'] = $clientSeed;
        }

        $response = $this->makeRequest('POST', '/cases/open', $data, $token);
        return $response;
    }

    /**
     * Get user's case opening history.
     */
    public function getUserHistory(string $token, int $limit = 50, int $skip = 0): array
    {
        $response = $this->makeRequest('GET', "/cases/user/history?limit={$limit}&skip={$skip}", [], $token);
        return $response['data'] ?? [];
    }

    /**
     * Get case drop history.
     */
    public function getCaseHistory(string $caseId, int $limit = 100): array
    {
        $response = $this->makeRequest('GET', "/cases/{$caseId}/history?limit={$limit}");
        return $response['data'] ?? [];
    }

    /**
     * Get recent drops.
     */
    public function getRecentDrops(int $limit = 20): array
    {
        $cacheKey = "backend_recent_drops_{$limit}";
        
        return Cache::remember($cacheKey, 60, function () use ($limit) {
            $response = $this->makeRequest('GET', "/cases/recent-drops?limit={$limit}");
            return $response['data'] ?? [];
        });
    }

    /**
     * Get big wins.
     */
    public function getBigWins(float $minProfit = 100, int $limit = 10): array
    {
        $cacheKey = "backend_big_wins_{$minProfit}_{$limit}";
        
        return Cache::remember($cacheKey, 300, function () use ($minProfit, $limit) {
            $response = $this->makeRequest('GET', "/cases/big-wins?minProfit={$minProfit}&limit={$limit}");
            return $response['data'] ?? [];
        });
    }

    /**
     * Get user statistics.
     */
    public function getUserStats(string $token): array
    {
        $response = $this->makeRequest('GET', '/cases/user/stats', [], $token);
        return $response['data'] ?? [];
    }

    /**
     * Get case statistics.
     */
    public function getCaseStats(string $caseId): array
    {
        $response = $this->makeRequest('GET', "/cases/{$caseId}/stats");
        return $response['data'] ?? [];
    }

    /**
     * Verify a drop.
     */
    public function verifyDrop(string $dropId): array
    {
        $response = $this->makeRequest('GET', "/cases/drops/{$dropId}/verify");
        return $response['data'] ?? [];
    }

    /**
     * Get user leaderboard.
     */
    public function getLeaderboard(string $type = 'totalWon', int $limit = 50): array
    {
        $cacheKey = "backend_leaderboard_{$type}_{$limit}";
        
        return Cache::remember($cacheKey, 300, function () use ($type, $limit) {
            $response = $this->makeRequest('GET', "/users/leaderboard?type={$type}&limit={$limit}");
            return $response['data'] ?? [];
        });
    }

    /**
     * Get user profile.
     */
    public function getUserProfile(string $token): array
    {
        $response = $this->makeRequest('GET', '/auth/me', [], $token);
        return $response['data'] ?? [];
    }

    /**
     * Update user settings.
     */
    public function updateUserSettings(string $token, array $settings): array
    {
        $response = $this->makeRequest('PUT', '/auth/settings', $settings, $token);
        return $response['data'] ?? [];
    }

    /**
     * Add deposit.
     */
    public function addDeposit(string $token, float $amount): array
    {
        $response = $this->makeRequest('POST', '/users/deposit', ['amount' => $amount], $token);
        return $response['data'] ?? [];
    }

    /**
     * Request withdrawal.
     */
    public function requestWithdrawal(string $token, float $amount): array
    {
        $response = $this->makeRequest('POST', '/users/withdraw', ['amount' => $amount], $token);
        return $response['data'] ?? [];
    }

    /**
     * Get Steam authentication URL.
     */
    public function getSteamAuthUrl(): string
    {
        $response = $this->makeRequest('GET', '/auth/steam');
        return $response['authUrl'] ?? '';
    }

    /**
     * Refresh user token.
     */
    public function refreshToken(string $token): array
    {
        $response = $this->makeRequest('POST', '/auth/refresh', [], $token);
        return $response['data'] ?? [];
    }

    /**
     * Check backend health.
     */
    public function checkHealth(): bool
    {
        try {
            $response = $this->makeRequest('GET', '/health');
            return isset($response['status']) && $response['status'] === 'OK';
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Get admin statistics (admin only).
     */
    public function getAdminStats(string $token, string $startDate = null, string $endDate = null): array
    {
        $query = '';
        if ($startDate) $query .= "startDate={$startDate}&";
        if ($endDate) $query .= "endDate={$endDate}&";
        
        $endpoint = '/cases/admin/stats' . ($query ? '?' . rtrim($query, '&') : '');
        $response = $this->makeRequest('GET', $endpoint, [], $token);
        return $response['data'] ?? [];
    }
}