-- Insert sample clients from the provided list
INSERT INTO clients (name, visible) VALUES
('Ethan Conrad', true),
('GraphTek', true),
('Paramount Group', true),
('Boxer Property', true),
('LaSalle', true),
('Safeguard IT', true),
('Lime Energy', true),
('Brookfield', true),
('Mimiscate', true),
('RCE', true),
('Millennium', true),
('Normandy', true),
('Safeway', true),
('Urchin', true),
('Ritz-Carlton Marriott', true),
('Ritz-Carlton', true),
('Omni Hotels', true),
('CBRE', true),
('Morgans', true),
('Lithonia Products', true),
('Harsch', true),
('Habitat', true),
('Glenborough', true),
('Four Seasons', true),
('EMCOR', true),
('Colonial Properties', true),
('ACME Display', true),
('John Buck', true),
('New York Palace', true),
('Ritz Project', true),
('Dorchester', true),
('Hines', true),
('Morgan Jones', true),
('Able', true);

-- Insert Randy as the owner
INSERT INTO users (email, password_hash, role, first_name, last_name, client_id, is_active) 
VALUES ('randy@lightsource.com', 'demo123', 'owner', 'Randy', 'Owner', NULL, true);

-- Insert a test client user for Paramount
INSERT INTO users (email, password_hash, role, first_name, last_name, client_id, is_active)
SELECT 'paramount@company.com', 'demo123', 'client', 'Steve', 'Jackson', c.id, true
FROM clients c 
WHERE c.name = 'Paramount Group' 
LIMIT 1;

-- Insert sample products
INSERT INTO products (sku, name, description, category, subcategory, type, specifications, unit_price, unit_type, units_per_case, case_price, image_url, status) VALUES
('JHBL-24000LM-GL-WD-MVOLT-GZ10-50K-80CRI-HC3P-DWH', 'INTERMATIC Spring Wound Timer', 'INTERMATIC Spring Wound Timer, Timing Range 1 Hour, Contact Form SPST, Power Rating @ 125 VAC 1 HP, Power Rating @ 250 VAC 2 HP, Load Capacity @ 125 VAC 20/7 Amps, Load Capacity @ 250 VAC 10 Amps, Hold Feature No, 2 x 4 In', 'RELAMP', 'Timers', 'Ballast', '{"dimensions": "2 x 2 parabolic", "voltage": "125-250 VAC", "capacity": "20/7 Amps"}', 27.00, 'units', 24, 648.00, '/placeholder.svg?height=60&width=60&text=Ballast', 'available'),
('DVF-103P-WH', 'Lutron Preset Dimmer', 'Lutron Preset Dimmer with Nightlight for Fluorescent Dimming with Hi-Lume EcoSystem electronic ballasts Single Pole or 3-Way', 'RELAMP', 'Dimmers', 'Dimmer', '{"type": "Preset", "compatibility": "Hi-Lume EcoSystem", "mounting": "Single Pole or 3-Way"}', 897.00, 'units', 1, 897.00, '/placeholder.svg?height=60&width=60&text=Dimmer', 'assigned'),
('B94C', 'GE Commercial Electric 6" LED Recessed Downlight', 'Commercial Electric 6" LED Recessed Downlight', 'RELAMP', 'Fixtures', 'Fixture', '{"size": "6 inch", "type": "LED Recessed", "bulbs": 24}', 220.00, 'unit', 1, 220.00, '/placeholder.svg?height=60&width=60&text=Fixture', 'available'),
('B95D', 'GE Replacement LED Bulbs', 'Replacement LED bulbs', 'RELAMP', 'Bulbs', 'Bulbs', '{"type": "LED", "replacement": true}', 2.06, 'units', 48, 99.00, '/placeholder.svg?height=60&width=60&text=Bulbs', 'available'),
('TL-30W-ADJ', 'Track Light Fixture', 'Adjustable Track Light Fixture 30W', 'FIXTURES', 'Track Lights', 'Fixture', '{"wattage": "30W", "lumens": "3000lm", "adjustable": true}', 79.99, 'unit', 1, 79.99, '/placeholder.svg?height=60&width=60&text=Track+Light', 'available'),
('ES-LED-DUAL', 'Emergency Exit Sign', 'LED Emergency Exit Sign with Dual Heads', 'EMERGENCY', 'Exit Signs', 'Emergency', '{"wattage": "3W", "type": "Dual Head", "battery_backup": true}', 49.99, 'unit', 1, 49.99, '/placeholder.svg?height=60&width=60&text=Exit+Sign', 'available');

-- Assign some products to Paramount Group
INSERT INTO client_products (client_id, product_id)
SELECT c.id, p.id
FROM clients c, products p
WHERE c.name = 'Paramount Group' AND p.sku IN ('JHBL-24000LM-GL-WD-MVOLT-GZ10-50K-80CRI-HC3P-DWH', 'DVF-103P-WH', 'B94C');

-- Insert sample orders
INSERT INTO orders (order_number, client_id, ordered_by, ordered_by_email, status, total_amount, notes) 
SELECT 
    'ORD-PARAMOUNT-001',
    c.id,
    'Steve Jackson',
    'steve@paramountgroup.com',
    'pending',
    1500.00,
    'Initial order for Paramount Group'
FROM clients c WHERE c.name = 'Paramount Group';
