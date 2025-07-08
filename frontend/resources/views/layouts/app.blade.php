<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    
    <title>{{ config('app.name', 'Hitmanki Cases') }} - @yield('title', 'Открывай кейсы и выигрывай потрясающие предметы!')</title>
    <meta name="description" content="@yield('description', config('app.description', 'Платформа для открытия кейсов с алгоритмом Provably Fair на hitmanki.store'))">
    
    <!-- Favicon -->
    <link rel="icon" type="image/x-icon" href="{{ asset('favicon.ico') }}">
    
    <!-- Fonts -->
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700&display=swap" rel="stylesheet" />
    
    <!-- Styles -->
    @vite(['resources/css/app.css', 'resources/js/app.js'])
    @stack('styles')
    
    <!-- WebSocket Configuration -->
    <script>
        window.BackendConfig = {
            apiUrl: 'https://api.hitmanki.store',
            wsUrl: 'wss://api.hitmanki.store',
            steamAuthUrl: '{{ route('auth.steam') }}',
            isAuthenticated: {{ auth()->check() ? 'true' : 'false' }},
            @auth
            user: {
                id: {{ auth()->id() }},
                username: '{{ auth()->user()->username }}',
                avatar: '{{ auth()->user()->avatar }}',
                balance: {{ auth()->user()->balance }},
                token: '{{ auth()->user()->backend_token }}'
            }
            @endauth
        };
    </script>
</head>
<body class="font-inter antialiased bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white min-h-screen">
    <div id="app">
        <!-- Navigation -->
        <nav class="bg-gray-800/90 backdrop-blur-sm border-b border-gray-700 sticky top-0 z-50">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div class="flex justify-between h-16">
                    <!-- Logo and Navigation Links -->
                    <div class="flex items-center">
                        <a href="{{ route('home') }}" class="flex items-center space-x-2">
                            <div class="w-8 h-8 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg flex items-center justify-center">
                                <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"/>
                                </svg>
                            </div>
                            <span class="text-xl font-bold text-white">{{ config('app.name') }}</span>
                        </a>
                        
                        <!-- Navigation Links -->
                        <div class="hidden md:flex items-center space-x-8 ml-10">
                            <a href="{{ route('home') }}" class="nav-link {{ request()->routeIs('home') ? 'text-orange-500' : 'text-gray-300 hover:text-white' }} transition-colors">
                                Home
                            </a>
                            <a href="{{ route('cases') }}" class="nav-link {{ request()->routeIs('cases*') ? 'text-orange-500' : 'text-gray-300 hover:text-white' }} transition-colors">
                                Cases
                            </a>
                            <a href="{{ route('leaderboard') }}" class="nav-link {{ request()->routeIs('leaderboard') ? 'text-orange-500' : 'text-gray-300 hover:text-white' }} transition-colors">
                                Leaderboard
                            </a>
                            <a href="{{ route('provably-fair') }}" class="nav-link {{ request()->routeIs('provably-fair') ? 'text-orange-500' : 'text-gray-300 hover:text-white' }} transition-colors">
                                Provably Fair
                            </a>
                        </div>
                    </div>
                    
                    <!-- Right Side Navigation -->
                    <div class="flex items-center space-x-4">
                        <!-- Balance Display (for authenticated users) -->
                        @auth
                            <div class="hidden sm:flex items-center space-x-2 bg-gray-700/50 px-3 py-1 rounded-lg">
                                <svg class="w-4 h-4 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                                </svg>
                                <span class="text-sm font-medium text-green-400">${{ number_format(auth()->user()->balance, 2) }}</span>
                            </div>
                        @endauth
                        
                        <!-- User Menu -->
                        @auth
                            <div class="relative" x-data="{ open: false }">
                                <button @click="open = !open" class="flex items-center space-x-2 bg-gray-700/50 hover:bg-gray-700 px-3 py-2 rounded-lg transition-colors">
                                    <img src="{{ auth()->user()->avatar }}" alt="{{ auth()->user()->username }}" class="w-6 h-6 rounded-full">
                                    <span class="hidden sm:block text-sm font-medium">{{ auth()->user()->username }}</span>
                                    <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                        <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                                    </svg>
                                </button>
                                
                                <div x-show="open" @click.away="open = false" x-transition class="absolute right-0 mt-2 w-48 bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-50">
                                    <div class="py-1">
                                        <a href="{{ route('profile.index') }}" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Profile</a>
                                        <a href="{{ route('profile.history') }}" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">History</a>
                                        <a href="{{ route('profile.settings') }}" class="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white">Settings</a>
                                        <hr class="border-gray-700 my-1">
                                        <form action="{{ route('auth.logout') }}" method="POST">
                                            @csrf
                                            <button type="submit" class="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700">Logout</button>
                                        </form>
                                    </div>
                                </div>
                            </div>
                        @else
                            <a href="{{ route('auth.login') }}" class="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 px-4 py-2 rounded-lg text-white font-medium transition-all transform hover:scale-105">
                                Login with Steam
                            </a>
                        @endauth
                        
                        <!-- Mobile Menu Button -->
                        <button class="md:hidden p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
                            </svg>
                        </button>
                    </div>
                </div>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="flex-1">
            @yield('content')
        </main>
        
        <!-- Live Drop Feed (Sidebar) -->
        <div id="live-feed" class="fixed right-4 top-20 w-80 max-h-96 bg-gray-800/95 backdrop-blur-sm rounded-lg border border-gray-700 shadow-xl overflow-hidden z-40 transform translate-x-full transition-transform" x-data="{ show: false }" :class="{ 'translate-x-0': show }">
            <div class="p-4 border-b border-gray-700">
                <div class="flex items-center justify-between">
                    <h3 class="font-semibold text-white">Live Drops</h3>
                    <button @click="show = !show" class="text-gray-400 hover:text-white">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                        </svg>
                    </button>
                </div>
            </div>
            <div id="live-drops-content" class="max-h-80 overflow-y-auto">
                <!-- Live drops will be populated here via WebSocket -->
            </div>
        </div>
        
        <!-- Live Feed Toggle Button -->
        <button id="live-feed-toggle" class="fixed right-4 bottom-4 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 p-3 rounded-full shadow-lg z-30 transition-all transform hover:scale-110" x-data @click="document.getElementById('live-feed').__x.$data.show = !document.getElementById('live-feed').__x.$data.show">
            <svg class="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z"/>
                <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z"/>
            </svg>
        </button>
        
        <!-- Footer -->
        <footer class="bg-gray-800/90 border-t border-gray-700 mt-16">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div class="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div>
                        <h3 class="text-lg font-semibold text-white mb-4">{{ config('app.name') }}</h3>
                        <p class="text-gray-400 text-sm">{{ config('app.description') }}</p>
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-white mb-4">Games</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="{{ route('cases') }}" class="hover:text-white">All Cases</a></li>
                            <li><a href="{{ route('provably-fair') }}" class="hover:text-white">Provably Fair</a></li>
                            <li><a href="{{ route('leaderboard') }}" class="hover:text-white">Leaderboard</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-white mb-4">Support</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="{{ route('support') }}" class="hover:text-white">Help Center</a></li>
                            <li><a href="mailto:{{ config('app.support_email') }}" class="hover:text-white">Contact Us</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 class="text-sm font-semibold text-white mb-4">Legal</h4>
                        <ul class="space-y-2 text-sm text-gray-400">
                            <li><a href="{{ route('terms') }}" class="hover:text-white">Terms of Service</a></li>
                            <li><a href="{{ route('privacy') }}" class="hover:text-white">Privacy Policy</a></li>
                        </ul>
                    </div>
                </div>
                <div class="border-t border-gray-700 mt-8 pt-8 text-center text-sm text-gray-400">
                    <p>&copy; {{ date('Y') }} {{ config('app.name') }}. All rights reserved.</p>
                </div>
            </div>
        </footer>
    </div>
    
    <!-- Alpine.js for interactive components -->
    <script src="https://unpkg.com/alpinejs@3.x.x/dist/cdn.min.js" defer></script>
    
    @stack('scripts')
</body>
</html>