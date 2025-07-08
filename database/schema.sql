-- CS:GO Case Opening Website Database Schema

-- Пользователи
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    balance DECIMAL(10,2) DEFAULT 0.00,
    total_deposited DECIMAL(10,2) DEFAULT 0.00,
    total_withdrawn DECIMAL(10,2) DEFAULT 0.00,
    total_won DECIMAL(10,2) DEFAULT 0.00,
    is_admin BOOLEAN DEFAULT false,
    is_banned BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    last_login TIMESTAMP NULL,
    
    INDEX idx_steam_id (steam_id),
    INDEX idx_username (username),
    INDEX idx_created_at (created_at)
);

-- Кейсы
CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_active (is_active),
    INDEX idx_price (price),
    INDEX idx_sort_order (sort_order)
);

-- Предметы (скины)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    market_hash_name VARCHAR(255) UNIQUE NOT NULL,
    rarity VARCHAR(50) NOT NULL,
    rarity_color VARCHAR(7) DEFAULT '#B0C3D9', -- hex color
    price DECIMAL(10,2) NOT NULL,
    wear VARCHAR(50) DEFAULT 'Factory New',
    type VARCHAR(100) NOT NULL, -- knife, rifle, pistol etc
    is_active BOOLEAN DEFAULT true,
    last_price_update TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    INDEX idx_market_hash_name (market_hash_name),
    INDEX idx_rarity (rarity),
    INDEX idx_price (price),
    INDEX idx_type (type),
    INDEX idx_active (is_active)
);

-- Связка кейс-предмет с шансом
CREATE TABLE case_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    drop_chance DECIMAL(8,5) NOT NULL, -- точность до 0.00001%
    min_price DECIMAL(10,2) DEFAULT 0.00,
    max_price DECIMAL(10,2) DEFAULT 999999.99,
    is_rare BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_case_item (case_id, item_id),
    INDEX idx_case_id (case_id),
    INDEX idx_item_id (item_id),
    INDEX idx_drop_chance (drop_chance)
);

-- История открытий
CREATE TABLE openings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    case_price DECIMAL(10,2) NOT NULL,
    item_price DECIMAL(10,2) NOT NULL,
    profit DECIMAL(10,2) GENERATED ALWAYS AS (item_price - case_price) STORED,
    seed VARCHAR(64) NOT NULL, -- для честности
    roll_number DECIMAL(10,5) NOT NULL, -- результат рандома
    is_rare_drop BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (item_id) REFERENCES items(id),
    INDEX idx_user_id (user_id),
    INDEX idx_case_id (case_id),
    INDEX idx_item_id (item_id),
    INDEX idx_created_at (created_at),
    INDEX idx_profit (profit),
    INDEX idx_rare_drop (is_rare_drop)
);

-- Транзакции
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdraw', 'bonus', 'case_purchase', 'case_refund') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    balance_before DECIMAL(10,2) NOT NULL,
    balance_after DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed', 'cancelled') DEFAULT 'pending',
    payment_method VARCHAR(100) NULL,
    payment_id VARCHAR(255) NULL,
    admin_id INT NULL,
    notes TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP NULL,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_user_id (user_id),
    INDEX idx_type (type),
    INDEX idx_status (status),
    INDEX idx_created_at (created_at),
    INDEX idx_payment_id (payment_id)
);

-- Промокоды
CREATE TABLE promocodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    type ENUM('balance', 'percentage', 'free_case') NOT NULL,
    value DECIMAL(10,2) NOT NULL,
    max_uses INT DEFAULT 0, -- 0 = unlimited
    current_uses INT DEFAULT 0,
    valid_from TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    valid_until TIMESTAMP NULL,
    is_active BOOLEAN DEFAULT true,
    created_by INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (created_by) REFERENCES users(id),
    INDEX idx_code (code),
    INDEX idx_active (is_active),
    INDEX idx_valid_until (valid_until)
);

-- Использование промокодов
CREATE TABLE promocode_uses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    promocode_id INT NOT NULL,
    user_id INT NOT NULL,
    amount_received DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (promocode_id) REFERENCES promocodes(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_promocode (user_id, promocode_id),
    INDEX idx_promocode_id (promocode_id),
    INDEX idx_user_id (user_id)
);

-- Настройки сайта
CREATE TABLE site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT NOT NULL,
    setting_type ENUM('string', 'number', 'boolean', 'json') DEFAULT 'string',
    description TEXT NULL,
    updated_by INT NULL,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL,
    INDEX idx_key (setting_key)
);

-- Инвентарь пользователей (выигранные предметы)
CREATE TABLE user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    opening_id INT NOT NULL,
    is_withdrawn BOOLEAN DEFAULT false,
    withdrawn_at TIMESTAMP NULL,
    withdraw_method VARCHAR(100) NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id),
    FOREIGN KEY (opening_id) REFERENCES openings(id),
    INDEX idx_user_id (user_id),
    INDEX idx_item_id (item_id),
    INDEX idx_withdrawn (is_withdrawn)
);

-- Аудит действий админов
CREATE TABLE admin_audit (
    id INT AUTO_INCREMENT PRIMARY KEY,
    admin_id INT NOT NULL,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(50) NOT NULL,
    record_id INT NULL,
    old_values JSON NULL,
    new_values JSON NULL,
    ip_address VARCHAR(45) NULL,
    user_agent TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_admin_id (admin_id),
    INDEX idx_action (action),
    INDEX idx_table_name (table_name),
    INDEX idx_created_at (created_at)
);

-- Вставка базовых настроек
INSERT INTO site_settings (setting_key, setting_value, setting_type, description) VALUES
('site_name', 'CS:GO Case Opening', 'string', 'Название сайта'),
('site_commission', '10.00', 'number', 'Комиссия сайта в процентах'),
('min_deposit', '1.00', 'number', 'Минимальная сумма пополнения'),
('min_withdraw', '5.00', 'number', 'Минимальная сумма вывода'),
('steam_api_key', '', 'string', 'API ключ Steam'),
('market_csgo_api_key', '', 'string', 'API ключ market.csgo.com'),
('maintenance_mode', 'false', 'boolean', 'Режим технических работ'),
('welcome_bonus', '5.00', 'number', 'Приветственный бонус для новых пользователей'),
('referral_bonus', '10.00', 'number', 'Процент реферального бонуса');

-- Создание первого админа (обновить steam_id на реальный)
INSERT INTO users (steam_id, username, is_admin) VALUES ('76561198000000000', 'Admin', true);