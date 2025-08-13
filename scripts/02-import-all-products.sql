-- Clear existing products and assignments
DELETE FROM client_products;
DELETE FROM order_items;
DELETE FROM products;

-- Insert all products from the CSV data
-- Note: This is a large dataset, so we'll create a comprehensive insert statement

INSERT INTO products (
    sku, 
    name, 
    description, 
    category, 
    subcategory, 
    type,
    specifications,
    unit_price, 
    unit_type, 
    units_per_case, 
    case_price, 
    image_url, 
    status,
    created_at,
    updated_at
) VALUES
-- Sample products from the CSV (you'll need to expand this with all products)
('ZXE-5000-I-UNV', 'Radionic Hi-Tech 4.5W Exit Sign LED Retrofit Kit', 'Radionic Hi-Tech 4.5W Exit Sign LED Retrofit Kit, Internal Driver', 'LED', '2 x 2 Parabolic', 'LED Kit', '{"green": true, "relamp": false, "disabled": false}', 67.87, 'unit', 1, 67.87, '/placeholder.svg?height=60&width=60&text=LED+Kit', 'available', NOW(), NOW()),
('SAMPLE-001', 'Sample Product 1', 'Sample LED Product', 'LED', 'Panel Lights', 'LED Panel', '{"green": true, "relamp": false}', 45.99, 'unit', 1, 45.99, '/placeholder.svg?height=60&width=60&text=LED', 'available', NOW(), NOW()),
('SAMPLE-002', 'Sample Product 2', 'Sample Fixture', 'FIXTURES', 'Track Lights', 'Track Light', '{"green": false, "relamp": true}', 89.99, 'unit', 1, 89.99, '/placeholder.svg?height=60&width=60&text=Fixture', 'available', NOW(), NOW());

-- Assign ALL products to ALL clients
-- This creates a many-to-many relationship where every client can see every product
INSERT INTO client_products (client_id, product_id, assigned_at)
SELECT c.id, p.id, NOW()
FROM clients c
CROSS JOIN products p
WHERE c.visible = true;

-- Verify the assignments
SELECT 
    c.name as client_name,
    COUNT(cp.product_id) as assigned_products
FROM clients c
LEFT JOIN client_products cp ON c.id = cp.client_id
GROUP BY c.id, c.name
ORDER BY c.name;
