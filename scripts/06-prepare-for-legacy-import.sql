-- Prepare database for legacy import
-- Add legacy_id columns for mapping imported data
ALTER TABLE clients ADD COLUMN IF NOT EXISTS legacy_id TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS legacy_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS legacy_id TEXT;

-- Create indexes for better performance during import
CREATE INDEX IF NOT EXISTS idx_clients_legacy_id ON clients(legacy_id);
CREATE INDEX IF NOT EXISTS idx_products_legacy_id ON products(legacy_id);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_orders_legacy_id ON orders(legacy_id);
CREATE INDEX IF NOT EXISTS idx_client_products_lookup ON client_products(client_id, product_id);

-- Create import logs table
CREATE TABLE IF NOT EXISTS import_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    records_processed INTEGER DEFAULT 0,
    records_successful INTEGER DEFAULT 0,
    records_failed INTEGER DEFAULT 0,
    error_details TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Function to get current data counts
CREATE OR REPLACE FUNCTION get_current_data_counts()
RETURNS TABLE(
    clients_count BIGINT,
    products_count BIGINT,
    orders_count BIGINT,
    assignments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM clients) as clients_count,
        (SELECT COUNT(*) FROM products) as products_count,
        (SELECT COUNT(*) FROM orders) as orders_count,
        (SELECT COUNT(*) FROM client_products) as assignments_count;
END;
$$ LANGUAGE plpgsql;

-- Function to backup existing data
CREATE OR REPLACE FUNCTION backup_existing_data()
RETURNS TEXT AS $$
DECLARE
    backup_id TEXT;
    result_text TEXT;
BEGIN
    backup_id := 'backup_' || to_char(NOW(), 'YYYY_MM_DD_HH24_MI_SS');
    
    -- Backup existing data
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM clients', 'clients_' || backup_id);
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM products', 'products_' || backup_id);
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM orders', 'orders_' || backup_id);
    EXECUTE format('CREATE TABLE %I AS SELECT * FROM client_products', 'client_products_' || backup_id);
    
    result_text := 'Backup created with ID: ' || backup_id;
    
    -- Log the backup
    INSERT INTO import_logs (import_type, status, records_processed)
    VALUES ('backup', 'completed', 0);
    
    RETURN result_text;
END;
$$ LANGUAGE plpgsql;

-- Function to clear existing data
CREATE OR REPLACE FUNCTION clear_existing_data()
RETURNS TABLE(
    cleared_clients BIGINT,
    cleared_products BIGINT,
    cleared_orders BIGINT,
    cleared_assignments BIGINT
) AS $$
DECLARE
    client_count BIGINT;
    product_count BIGINT;
    order_count BIGINT;
    assignment_count BIGINT;
BEGIN
    -- Get counts before clearing
    SELECT COUNT(*) INTO client_count FROM clients;
    SELECT COUNT(*) INTO product_count FROM products;
    SELECT COUNT(*) INTO order_count FROM orders;
    SELECT COUNT(*) INTO assignment_count FROM client_products;
    
    -- Clear data in correct order (respecting foreign keys)
    DELETE FROM client_products;
    DELETE FROM order_items;
    DELETE FROM orders;
    DELETE FROM products;
    DELETE FROM clients;
    
    RETURN QUERY SELECT client_count, product_count, order_count, assignment_count;
END;
$$ LANGUAGE plpgsql;

-- Function to handle duplicate SKUs
CREATE OR REPLACE FUNCTION handle_duplicate_sku(original_sku TEXT)
RETURNS TEXT AS $$
DECLARE
    counter INTEGER := 1;
    new_sku TEXT;
BEGIN
    new_sku := original_sku;
    
    WHILE EXISTS (SELECT 1 FROM products WHERE sku = new_sku) LOOP
        new_sku := original_sku || '_' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_sku;
END;
$$ LANGUAGE plpgsql;

-- Create temporary staging tables for validation
CREATE TABLE IF NOT EXISTS staging_products (
    legacy_id TEXT,
    sku TEXT,
    name TEXT,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    type TEXT,
    unit_price DECIMAL(10,2),
    unit_type TEXT,
    units_per_case INTEGER,
    case_price DECIMAL(10,2),
    image_url TEXT,
    status TEXT,
    specifications JSONB DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS staging_clients (
    legacy_id TEXT,
    name TEXT,
    logo_url TEXT,
    offices INTEGER DEFAULT 1,
    visible BOOLEAN DEFAULT true
);

-- Grant necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;

-- Enable RLS on import_logs
ALTER TABLE import_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policy for import_logs
CREATE POLICY "Allow all operations on import_logs" ON import_logs
    FOR ALL USING (true);

-- Test the function
SELECT * FROM get_current_data_counts();
