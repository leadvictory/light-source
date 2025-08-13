-- Insert sample orders
INSERT INTO orders (
  id, order_number, purchase_order_number, user_id, company_id, building_id, 
  status, contact_name, contact_email, contact_phone, contact_fax,
  shipping_type, shipping_address_1, shipping_city, shipping_state, shipping_zip,
  billing_type, sales_tax_rate, special_instructions, 
  subtotal, tax_amount, total_amount
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440060',
  '508-0972-AR',
  '508-0972-AR',
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440010',
  'PROCESSING',
  'Adam',
  'Pblaz@paramount-group.com, ARakinichan@paramount-group.com',
  '415-780-1101',
  '415-636-0139',
  'Ground Shipment (3-5 days)',
  '50 Beale St, Attn SUITE 2400/ Engineering',
  'San Francisco',
  'CA',
  '94105',
  'Invoice',
  0.085,
  'CALL SUZY WHEN THE PRODUCTS SHIP',
  1083.00,
  92.06,
  1175.06
),
(
  '550e8400-e29b-41d4-a716-446655440061',
  '1234',
  '1234',
  '550e8400-e29b-41d4-a716-446655440030',
  '550e8400-e29b-41d4-a716-446655440001',
  '550e8400-e29b-41d4-a716-446655440011',
  'PENDING',
  'Suzzane',
  'Suzz@dot.com',
  '415-780-1101',
  NULL,
  'Ground Shipment (3-5 days)',
  '7thFloor- One Market Plaza',
  'San Francisco',
  'CA',
  '94105',
  'Invoice',
  0.085,
  NULL,
  2450.00,
  208.25,
  2658.25
);

-- Insert order items
INSERT INTO order_items (order_id, product_id, tenant, quantity, unit_price, total_price) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440060',
  '550e8400-e29b-41d4-a716-446655440043',
  'Common Areas (All)',
  100,
  10.83,
  1083.00
),
(
  '550e8400-e29b-41d4-a716-446655440061',
  '550e8400-e29b-41d4-a716-446655440040',
  '7th Floor',
  10,
  245.00,
  2450.00
);
