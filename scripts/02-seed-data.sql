-- Insert Randy (Owner)
INSERT INTO users (id, email, name, role, phone) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'randy@lightsource.com', 'Randy', 'OWNER', '555-0100');

-- Insert Companies
INSERT INTO companies (id, name, type, is_visible) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Paramount Group Inc', 'SUPERCUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440002', 'ABC Corporation', 'CUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440003', 'PixelNet', 'CUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440004', 'Amazon Services', 'SUPERCUSTOMER', true);

-- Insert Buildings
INSERT INTO buildings (id, name, address, company_id) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'Empire State Building', '350 5th Ave, New York, NY', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440011', 'One Market Plaza', '1 Market St, San Francisco, CA', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', 'ABC Tower', '123 Business Ave, Los Angeles, CA', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440013', '50 Beale St', '50 Beale St, San Francisco, CA', '550e8400-e29b-41d4-a716-446655440002');

-- Insert Floors
INSERT INTO floors (id, name, floor_number, building_id) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '7th Floor', 7, '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', '8th Floor', 8, '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440022', '15th Floor', 15, '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440023', '16th Floor', 16, '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440024', '42nd Floor', 42, '550e8400-e29b-41d4-a716-446655440010');

-- Insert Users (SuperCustomers, Customers, Tenants)
INSERT INTO users (id, email, name, role, phone, company_id) VALUES 
('550e8400-e29b-41d4-a716-446655440030', 'steve@paramount.com', 'Steve Jackson', 'SUPERCUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440031', 'admin@amazon.com', 'Admin Desk', 'SUPERCUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440032', 'steve@beale.com', 'Steve Jackson', 'CUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440033', 'suzy@pixelnet.com', 'Suzy', 'CUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440034', 'tenant@techstartup.com', 'Tech Startup Inc', 'TENANT', '555-0123', '550e8400-e29b-41d4-a716-446655440002');

-- Update companies with admin users
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440030' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440031' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440032' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440033' WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Insert Products
INSERT INTO products (id, item_number, name, description, manufacturer, category, sub_category, info_type, info_details, unit_type, unit_price, units_per_case, tag) VALUES 
('550e8400-e29b-41d4-a716-446655440040', 'JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH', 'INTERMATIC Spring Wound Timer', 'INTERMATIC Spring Wound Timer, Timing Range 1 Hour, Contact Form SPST, Power Rating @ 125 VAC 1 HP, Power Rating @ 250 VAC 2 HP, Load Capacity @ 125 VAC 20/7 Amps, Load Capacity @ 250 VAC 10 Amps, Load Capacity @ 277 VAC 10 Amps, Hold Feature No, 2 x 4 In', 'INTERMATIC', 'Electrical', 'Timers', 'Ballast', '2 x 2 parabolic', 'cases', 270.00, 24, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440041', 'DVF-103P-WH', 'Lutron Preset Dimmer', 'Lutron Preset Dimmer with Nightlight for Fluorescent Dimming with Hi-Lume ECC-10 electronic ballasts Single Pole or 3-Way', 'Lutron', 'Controls', 'Dimmers', 'Dimmer', 'Single Pole or 3-Way', 'units', 897.00, 1, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440042', 'B94C', 'GE LED Recessed Downlight', 'Commercial Electric 6" LED Recessed Downlight', 'GE', 'Fixtures', 'Recessed', 'Fixture', '24 bulbs', 'units', 220.00, 1, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440043', 'B95D', 'GE LED Replacement Bulbs', 'Replacement LED bulbs', 'GE', 'Bulbs', 'LED', 'Bulbs', 'LED', 'cases', 99.00, 48, 'RELAMP');

-- Insert Orders
INSERT INTO orders (id, order_number, user_id, company_id, building_id, status, total_amount) VALUES 
('550e8400-e29b-41d4-a716-446655440050', 'ORD-2025-001', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'COMPLETED', 5400.00),
('550e8400-e29b-41d4-a716-446655440051', 'ORD-2025-002', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'PENDING', 1620.00);

-- Insert Order Items
INSERT INTO order_items (order_id, product_id, quantity, unit_price, total_price) VALUES 
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440040', 2, 270.00, 540.00),
('550e8400-e29b-41d4-a716-446655440050', '550e8400-e29b-41d4-a716-446655440041', 1, 897.00, 897.00),
('550e8400-e29b-41d4-a716-446655440051', '550e8400-e29b-41d4-a716-446655440042', 6, 220.00, 1320.00);

-- Insert Product Assignments
INSERT INTO product_assignments (product_id, assigned_to_company_id, assigned_by_user_id) VALUES 
('550e8400-e29b-41d4-a716-446655440040', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440041', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440042', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000'),
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000');
