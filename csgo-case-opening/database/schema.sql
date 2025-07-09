-- CS:GO Case Opening Website Database Schema
-- Created based on the provided architecture

-- Пользователи
CREATE TABLE users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    steam_id VARCHAR(64) UNIQUE NOT NULL,
    username VARCHAR(255) NOT NULL,
    balance DECIMAL(10,2) DEFAULT 0.00,
    avatar_url VARCHAR(255),
    is_admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Кейсы
CREATE TABLE cases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    price DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Предметы (скины)
CREATE TABLE items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    image_url VARCHAR(255),
    market_hash_name VARCHAR(255) UNIQUE,
    rarity VARCHAR(50),
    price DECIMAL(10,2) NOT NULL,
    exterior VARCHAR(50),
    weapon_type VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Связка кейс-предмет с шансом
CREATE TABLE case_items (
    id INT AUTO_INCREMENT PRIMARY KEY,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    drop_chance DECIMAL(5,2) NOT NULL, -- % шанс выпадения
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    UNIQUE KEY unique_case_item (case_id, item_id)
);

-- История открытий кейсов
CREATE TABLE openings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    case_id INT NOT NULL,
    item_id INT NOT NULL,
    price_won DECIMAL(10,2) NOT NULL,
    seed VARCHAR(255), -- для провабл фейр
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (case_id) REFERENCES cases(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_user_openings (user_id),
    INDEX idx_case_openings (case_id),
    INDEX idx_recent_openings (created_at)
);

-- Транзакции
CREATE TABLE transactions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    type ENUM('deposit', 'withdraw', 'bonus', 'case_opening', 'case_win') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    status ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
    description TEXT,
    reference_id VARCHAR(255), -- для связи с внешними системами
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_transactions (user_id),
    INDEX idx_transaction_type (type),
    INDEX idx_transaction_status (status)
);

-- Промокоды
CREATE TABLE promocodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    bonus_amount DECIMAL(10,2) NOT NULL,
    max_uses INT DEFAULT 1,
    current_uses INT DEFAULT 0,
    expires_at TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Использование промокодов
CREATE TABLE promocode_uses (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    promocode_id INT NOT NULL,
    used_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (promocode_id) REFERENCES promocodes(id) ON DELETE CASCADE,
    UNIQUE KEY unique_user_promocode (user_id, promocode_id)
);

-- Настройки сайта
CREATE TABLE site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Инвентарь пользователей
CREATE TABLE user_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    quantity INT DEFAULT 1,
    obtained_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_user_inventory (user_id)
);

-- Заявки на вывод
CREATE TABLE withdrawal_requests (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    item_id INT NOT NULL,
    steam_trade_url VARCHAR(500),
    status ENUM('pending', 'processing', 'completed', 'cancelled') DEFAULT 'pending',
    admin_note TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (item_id) REFERENCES items(id) ON DELETE CASCADE,
    INDEX idx_user_withdrawals (user_id),
    INDEX idx_withdrawal_status (status)
);

-- Индексы для оптимизации
CREATE INDEX idx_users_steam_id ON users(steam_id);
CREATE INDEX idx_cases_active ON cases(is_active);
CREATE INDEX idx_items_rarity ON items(rarity);
CREATE INDEX idx_items_price ON items(price);
CREATE INDEX idx_case_items_chance ON case_items(drop_chance);

-- Начальные настройки сайта
INSERT INTO site_settings (setting_key, setting_value, description) VALUES
('site_name', 'CS:GO Case Opening', 'Название сайта'),
('site_description', 'Открывайте кейсы CS:GO и получайте редкие скины!', 'Описание сайта'),
('deposit_commission', '0.05', 'Комиссия за пополнение (5%)'),
('withdrawal_commission', '0.10', 'Комиссия за вывод (10%)'),
('min_deposit', '10.00', 'Минимальная сумма пополнения'),
('min_withdrawal', '50.00', 'Минимальная сумма вывода'),
('maintenance_mode', 'false', 'Режим обслуживания'),
('market_api_key', '', 'API ключ для market.csgo.com'),
('steam_api_key', '', 'API ключ для Steam');