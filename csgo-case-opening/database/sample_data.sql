-- Sample data for CS:GO Case Opening Website

-- Sample cases
INSERT INTO cases (name, image_url, price, description) VALUES
('Chroma Case', 'https://steamcommunity-a.akamaihd.net/economy/image/6TMcQ7eX6E0NVFOthivjiMWBi3W_8z7vJfg6Xyw_2gTpgOKIvSKJ8_gwYvfVDLQe9kRHRO5ynWJzlHKNzXKPXKQ=', 2.50, 'Кейс с хромированными скинами'),
('Danger Zone Case', 'https://steamcommunity-a.akamaihd.net/economy/image/6TMcQ7eX6E0NVFOthivjiMWBi3W_8z7vJfg6Xyw_2gTpgOKIvSKJ8_gwYvfVDLQe9kRHRO5ynWJzlHKNzXKPXKQ=', 3.00, 'Кейс зоны опасности'),
('Prisma Case', 'https://steamcommunity-a.akamaihd.net/economy/image/6TMcQ7eX6E0NVFOthivjiMWBi3W_8z7vJfg6Xyw_2gTpgOKIvSKJ8_gwYvfVDLQe9kRHRO5ynWJzlHKNzXKPXKQ=', 4.00, 'Призматический кейс'),
('Clutch Case', 'https://steamcommunity-a.akamaihd.net/economy/image/6TMcQ7eX6E0NVFOthivjiMWBi3W_8z7vJfg6Xyw_2gTpgOKIvSKJ8_gwYvfVDLQe9kRHRO5ynWJzlHKNzXKPXKQ=', 2.75, 'Кейс сцепления'),
('Glove Case', 'https://steamcommunity-a.akamaihd.net/economy/image/6TMcQ7eX6E0NVFOthivjiMWBi3W_8z7vJfg6Xyw_2gTpgOKIvSKJ8_gwYvfVDLQe9kRHRO5ynWJzlHKNzXKPXKQ=', 5.00, 'Кейс с перчатками');

-- Sample items
INSERT INTO items (name, image_url, market_hash_name, rarity, price, exterior, weapon_type) VALUES
-- Chroma Case items
('AK-47 | Vulcan', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'AK-47 | Vulcan (Factory New)', 'Classified', 45.00, 'Factory New', 'Rifle'),
('AWP | Man-o\'-war', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'AWP | Man-o\'-war (Factory New)', 'Classified', 25.00, 'Factory New', 'Sniper Rifle'),
('M4A4 | 龍王 (Dragon King)', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'M4A4 | 龍王 (Dragon King) (Factory New)', 'Restricted', 12.00, 'Factory New', 'Rifle'),
('Galil AR | Eco', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Galil AR | Eco (Factory New)', 'Restricted', 8.00, 'Factory New', 'Rifle'),
('FAMAS | Djinn', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'FAMAS | Djinn (Factory New)', 'Restricted', 6.00, 'Factory New', 'Rifle'),
('Desert Eagle | Naga', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Desert Eagle | Naga (Factory New)', 'Mil-Spec', 3.00, 'Factory New', 'Pistol'),
('Glock-18 | Bunsen Burner', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Glock-18 | Bunsen Burner (Factory New)', 'Mil-Spec', 2.50, 'Factory New', 'Pistol'),
('Sawed-Off | Serenity', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Sawed-Off | Serenity (Factory New)', 'Mil-Spec', 1.50, 'Factory New', 'Shotgun'),
('MP9 | Deadly Poison', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'MP9 | Deadly Poison (Factory New)', 'Mil-Spec', 1.00, 'Factory New', 'SMG'),
('Dual Berettas | Urban Shock', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Dual Berettas | Urban Shock (Factory New)', 'Consumer', 0.50, 'Factory New', 'Pistol'),

-- Danger Zone Case items
('AK-47 | Asiimov', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'AK-47 | Asiimov (Factory New)', 'Covert', 120.00, 'Factory New', 'Rifle'),
('AWP | Neo-Noir', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'AWP | Neo-Noir (Factory New)', 'Covert', 80.00, 'Factory New', 'Sniper Rifle'),
('Desert Eagle | Mecha Industries', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Desert Eagle | Mecha Industries (Factory New)', 'Classified', 35.00, 'Factory New', 'Pistol'),
('USP-S | Flashback', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'USP-S | Flashback (Factory New)', 'Classified', 28.00, 'Factory New', 'Pistol'),
('Glock-18 | Moonrise', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Glock-18 | Moonrise (Factory New)', 'Restricted', 15.00, 'Factory New', 'Pistol'),
('M4A4 | Tooth Fairy', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'M4A4 | Tooth Fairy (Factory New)', 'Restricted', 10.00, 'Factory New', 'Rifle'),
('P250 | Nevermore', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'P250 | Nevermore (Factory New)', 'Restricted', 8.00, 'Factory New', 'Pistol'),
('XM1014 | Oxide Blaze', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'XM1014 | Oxide Blaze (Factory New)', 'Mil-Spec', 4.00, 'Factory New', 'Shotgun'),
('MAC-10 | Disc Jockey', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'MAC-10 | Disc Jockey (Factory New)', 'Mil-Spec', 2.00, 'Factory New', 'SMG'),
('Tec-9 | Fubar', 'https://steamcommunity-a.akamaihd.net/economy/image/item.png', 'Tec-9 | Fubar (Factory New)', 'Consumer', 0.75, 'Factory New', 'Pistol');

-- Case items relationships with drop chances
-- Chroma Case (id: 1)
INSERT INTO case_items (case_id, item_id, drop_chance) VALUES
(1, 1, 0.64),  -- AK-47 Vulcan (Classified)
(1, 2, 0.64),  -- AWP Man-o'-war (Classified)
(1, 3, 3.20),  -- M4A4 Dragon King (Restricted)
(1, 4, 3.20),  -- Galil AR Eco (Restricted)
(1, 5, 3.20),  -- FAMAS Djinn (Restricted)
(1, 6, 15.98), -- Desert Eagle Naga (Mil-Spec)
(1, 7, 15.98), -- Glock-18 Bunsen Burner (Mil-Spec)
(1, 8, 15.98), -- Sawed-Off Serenity (Mil-Spec)
(1, 9, 15.98), -- MP9 Deadly Poison (Mil-Spec)
(1, 10, 25.40); -- Dual Berettas Urban Shock (Consumer)

-- Danger Zone Case (id: 2)
INSERT INTO case_items (case_id, item_id, drop_chance) VALUES
(2, 11, 0.26), -- AK-47 Asiimov (Covert)
(2, 12, 0.26), -- AWP Neo-Noir (Covert)
(2, 13, 0.64), -- Desert Eagle Mecha Industries (Classified)
(2, 14, 0.64), -- USP-S Flashback (Classified)
(2, 15, 3.20), -- Glock-18 Moonrise (Restricted)
(2, 16, 3.20), -- M4A4 Tooth Fairy (Restricted)
(2, 17, 3.20), -- P250 Nevermore (Restricted)
(2, 18, 15.98), -- XM1014 Oxide Blaze (Mil-Spec)
(2, 19, 15.98), -- MAC-10 Disc Jockey (Mil-Spec)
(2, 20, 56.64); -- Tec-9 Fubar (Consumer)

-- Sample promocodes
INSERT INTO promocodes (code, bonus_amount, max_uses, expires_at) VALUES
('WELCOME10', 10.00, 100, DATE_ADD(NOW(), INTERVAL 30 DAY)),
('BONUS25', 25.00, 50, DATE_ADD(NOW(), INTERVAL 7 DAY)),
('MEGA100', 100.00, 10, DATE_ADD(NOW(), INTERVAL 3 DAY)),
('DAILY5', 5.00, 1000, DATE_ADD(NOW(), INTERVAL 1 DAY));

-- Sample admin user (requires Steam authentication first)
-- This will be populated after Steam auth implementation