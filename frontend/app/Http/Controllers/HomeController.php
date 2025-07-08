<?php

namespace App\Http\Controllers;

use App\Services\BackendApiService;
use Illuminate\Http\Request;
use Illuminate\View\View;

class HomeController extends Controller
{
    protected BackendApiService $apiService;

    public function __construct(BackendApiService $apiService)
    {
        $this->apiService = $apiService;
    }

    /**
     * Display the home page.
     */
    public function index(): View
    {
        try {
            // Get popular cases for the homepage
            $popularCases = $this->apiService->getPopularCases(6);
            
            // Get recent drops for live feed
            $recentDrops = $this->apiService->getRecentDrops(10);
            
            // Get big wins
            $bigWins = $this->apiService->getBigWins(100, 5);

            return view('home', compact('popularCases', 'recentDrops', 'bigWins'));
        } catch (\Exception $e) {
            // Handle API errors gracefully
            return view('home', [
                'popularCases' => [],
                'recentDrops' => [],
                'bigWins' => [],
                'error' => 'Unable to load case data at the moment.'
            ]);
        }
    }

    /**
     * Display all cases page.
     */
    public function cases(): View
    {
        try {
            $cases = $this->apiService->getCases();
            
            return view('cases.index', compact('cases'));
        } catch (\Exception $e) {
            return view('cases.index', [
                'cases' => [],
                'error' => 'Unable to load cases at the moment.'
            ]);
        }
    }

    /**
     * Display leaderboard page.
     */
    public function leaderboard(Request $request): View
    {
        try {
            $type = $request->get('type', 'totalWon'); // totalWon, casesOpened, balance
            $limit = $request->get('limit', 50);
            
            $leaderboard = $this->apiService->getLeaderboard($type, $limit);
            
            return view('leaderboard', compact('leaderboard', 'type'));
        } catch (\Exception $e) {
            return view('leaderboard', [
                'leaderboard' => [],
                'type' => $type ?? 'totalWon',
                'error' => 'Unable to load leaderboard at the moment.'
            ]);
        }
    }

    /**
     * Display provably fair information page.
     */
    public function provablyFair(): View
    {
        return view('provably-fair');
    }

    /**
     * Display support/help page.
     */
    public function support(): View
    {
        return view('support');
    }

    /**
     * Display terms of service page.
     */
    public function terms(): View
    {
        return view('legal.terms');
    }

    /**
     * Display privacy policy page.
     */
    public function privacy(): View
    {
        return view('legal.privacy');
    }

    /**
     * Get live data for AJAX requests.
     */
    public function liveData(Request $request)
    {
        try {
            $type = $request->get('type');
            
            switch ($type) {
                case 'recent_drops':
                    $data = $this->apiService->getRecentDrops(20);
                    break;
                    
                case 'big_wins':
                    $data = $this->apiService->getBigWins(100, 10);
                    break;
                    
                case 'popular_cases':
                    $data = $this->apiService->getPopularCases(10);
                    break;
                    
                default:
                    $data = [];
            }
            
            return response()->json([
                'success' => true,
                'data' => $data
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
}