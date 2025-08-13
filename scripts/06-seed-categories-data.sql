-- Insert main categories
INSERT INTO categories (id, name, description, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440100', 'Ballast', 'Electronic and magnetic ballasts for fluorescent lighting', 1),
('550e8400-e29b-41d4-a716-446655440101', 'Batteries', 'Emergency lighting and backup batteries', 2),
('550e8400-e29b-41d4-a716-446655440102', 'Cold Cathode', 'Cold cathode fluorescent lamps and accessories', 3),
('550e8400-e29b-41d4-a716-446655440103', 'Compact Fluorescent', 'CFL bulbs and related products', 4),
('550e8400-e29b-41d4-a716-446655440104', 'Fixture', 'Light fixtures and housings', 5),
('550e8400-e29b-41d4-a716-446655440105', 'Halogen', 'Halogen bulbs and fixtures', 6),
('550e8400-e29b-41d4-a716-446655440106', 'High Intensity Discharge', 'HID lamps and ballasts', 7),
('550e8400-e29b-41d4-a716-446655440107', 'Incandescent', 'Traditional incandescent bulbs', 8),
('550e8400-e29b-41d4-a716-446655440108', 'LED', 'LED bulbs, fixtures, and drivers', 9),
('550e8400-e29b-41d4-a716-446655440109', 'Lens', 'Lenses and diffusers for lighting', 10),
('550e8400-e29b-41d4-a716-446655440110', 'Linear Fluorescent', 'Linear fluorescent tubes and accessories', 11),
('550e8400-e29b-41d4-a716-446655440111', 'Miniature', 'Small specialty bulbs', 12),
('550e8400-e29b-41d4-a716-446655440112', 'Misc.', 'Miscellaneous lighting products', 13),
('550e8400-e29b-41d4-a716-446655440113', 'Re-lamp Item', 'Replacement and retrofit items', 14),
('550e8400-e29b-41d4-a716-446655440114', 'Recycling', 'Recycling and disposal products', 15),
('550e8400-e29b-41d4-a716-446655440115', 'Relamp', 'Relamping services and products', 16),
('550e8400-e29b-41d4-a716-446655440116', 'Safety Products', 'Safety and protective equipment', 17),
('550e8400-e29b-41d4-a716-446655440117', 'Sensor', 'Motion sensors and controls', 18),
('550e8400-e29b-41d4-a716-446655440118', 'Socket', 'Lamp sockets and holders', 19),
('550e8400-e29b-41d4-a716-446655440119', 'Switch', 'Light switches and controls', 20);

-- Insert Ballast subcategories
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440100', '2 x 2 Lensed', 1),
('550e8400-e29b-41d4-a716-446655440100', '2 x 2 Parabolic', 2),
('550e8400-e29b-41d4-a716-446655440100', '2 x 4 Lensed', 3),
('550e8400-e29b-41d4-a716-446655440100', '2 x 4 Parabolic', 4),
('550e8400-e29b-41d4-a716-446655440100', 'Fluorescent Clip', 5),
('550e8400-e29b-41d4-a716-446655440100', 'Products', 6),
('550e8400-e29b-41d4-a716-446655440100', 'Re-Lamp Pricing', 7),
('550e8400-e29b-41d4-a716-446655440100', 'T12', 8),
('550e8400-e29b-41d4-a716-446655440100', 'T12 UBENT', 9),
('550e8400-e29b-41d4-a716-446655440100', 'T5', 10),
('550e8400-e29b-41d4-a716-446655440100', 'T8', 11),
('550e8400-e29b-41d4-a716-446655440100', 'T8 UBENT', 12),
('550e8400-e29b-41d4-a716-446655440100', 'Wall Bracket', 13);

-- Insert some example subcategories for other categories
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
-- LED subcategories
('550e8400-e29b-41d4-a716-446655440108', 'A-Type', 1),
('550e8400-e29b-41d4-a716-446655440108', 'Candelabra', 2),
('550e8400-e29b-41d4-a716-446655440108', 'Downlight', 3),
('550e8400-e29b-41d4-a716-446655440108', 'Flood', 4),
('550e8400-e29b-41d4-a716-446655440108', 'Globe', 5),
('550e8400-e29b-41d4-a716-446655440108', 'PAR', 6),
('550e8400-e29b-41d4-a716-446655440108', 'Tube', 7),

-- Fixture subcategories
('550e8400-e29b-41d4-a716-446655440104', 'Ceiling Mount', 1),
('550e8400-e29b-41d4-a716-446655440104', 'Pendant', 2),
('550e8400-e29b-41d4-a716-446655440104', 'Recessed', 3),
('550e8400-e29b-41d4-a716-446655440104', 'Track', 4),
('550e8400-e29b-41d4-a716-446655440104', 'Under Cabinet', 5),
('550e8400-e29b-41d4-a716-446655440104', 'Wall Mount', 6),

-- Switch subcategories
('550e8400-e29b-41d4-a716-446655440119', 'Dimmer', 1),
('550e8400-e29b-41d4-a716-446655440119', 'Single Pole', 2),
('550e8400-e29b-41d4-a716-446655440119', '3-Way', 3),
('550e8400-e29b-41d4-a716-446655440119', '4-Way', 4),
('550e8400-e29b-41d4-a716-446655440119', 'Timer', 5);

-- Update existing products to use subcategories
-- Get subcategory IDs for updates
DO $$
DECLARE
    ballast_cat_id UUID;
    ballast_t8_subcat_id UUID;
    switch_cat_id UUID;
    dimmer_subcat_id UUID;
    fixture_cat_id UUID;
    recessed_subcat_id UUID;
    led_cat_id UUID;
    tube_subcat_id UUID;
BEGIN
    -- Get category IDs
    SELECT id INTO ballast_cat_id FROM categories WHERE name = 'Ballast';
    SELECT id INTO switch_cat_id FROM categories WHERE name = 'Switch';
    SELECT id INTO fixture_cat_id FROM categories WHERE name = 'Fixture';
    SELECT id INTO led_cat_id FROM categories WHERE name = 'LED';
    
    -- Get subcategory IDs
    SELECT id INTO ballast_t8_subcat_id FROM subcategories WHERE category_id = ballast_cat_id AND name = 'T8';
    SELECT id INTO dimmer_subcat_id FROM subcategories WHERE category_id = switch_cat_id AND name = 'Dimmer';
    SELECT id INTO recessed_subcat_id FROM subcategories WHERE category_id = fixture_cat_id AND name = 'Recessed';
    SELECT id INTO tube_subcat_id FROM subcategories WHERE category_id = led_cat_id AND name = 'Tube';
    
    -- Update existing products
    UPDATE products SET subcategory_id = ballast_t8_subcat_id WHERE item_number = 'JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH';
    UPDATE products SET subcategory_id = dimmer_subcat_id WHERE item_number = 'DVF-103P-WH';
    UPDATE products SET subcategory_id = recessed_subcat_id WHERE item_number = 'B94C';
    UPDATE products SET subcategory_id = tube_subcat_id WHERE item_number = 'B95D';
END $$;
