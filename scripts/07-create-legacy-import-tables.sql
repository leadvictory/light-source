-- Create dedicated tables for legacy import processing
-- These tables will hold raw imported data before processing

-- Legacy clients staging table
CREATE TABLE IF NOT EXISTS legacy_clients_staging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_batch_id UUID,
    legacy_id TEXT,
    raw_data JSONB,
    name TEXT,
    company_name TEXT,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    zip TEXT,
    country TEXT,
    logo_url TEXT,
    offices INTEGER DEFAULT 1,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy products staging table
CREATE TABLE IF NOT EXISTS legacy_products_staging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_batch_id UUID,
    legacy_id TEXT,
    raw_data JSONB,
    sku TEXT,
    name TEXT,
    description TEXT,
    category TEXT,
    subcategory TEXT,
    type TEXT,
    brand TEXT,
    model TEXT,
    unit_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    unit_type TEXT,
    units_per_case INTEGER,
    case_price DECIMAL(10,2),
    weight DECIMAL(10,3),
    dimensions TEXT,
    image_url TEXT,
    specifications JSONB DEFAULT '{}'::jsonb,
    status TEXT DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy orders staging table
CREATE TABLE IF NOT EXISTS legacy_orders_staging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_batch_id UUID,
    legacy_id TEXT,
    legacy_client_id TEXT,
    raw_data JSONB,
    order_number TEXT,
    order_date DATE,
    customer_name TEXT,
    customer_email TEXT,
    customer_phone TEXT,
    billing_address TEXT,
    shipping_address TEXT,
    subtotal DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    shipping_amount DECIMAL(10,2),
    total_amount DECIMAL(10,2),
    payment_method TEXT,
    payment_status TEXT,
    order_status TEXT,
    notes TEXT,
    status TEXT DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Legacy order items staging table
CREATE TABLE IF NOT EXISTS legacy_order_items_staging (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    import_batch_id UUID,
    legacy_order_id TEXT,
    legacy_product_id TEXT,
    raw_data JSONB,
    product_sku TEXT,
    product_name TEXT,
    quantity INTEGER,
    unit_price DECIMAL(10,2),
    line_total DECIMAL(10,2),
    discount_amount DECIMAL(10,2),
    tax_amount DECIMAL(10,2),
    notes TEXT,
    status TEXT DEFAULT 'pending',
    processed BOOLEAN DEFAULT FALSE,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Import batches table to track import sessions
CREATE TABLE IF NOT EXISTS import_batches (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    batch_name TEXT,
    import_type TEXT NOT NULL,
    file_name TEXT,
    file_size BIGINT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    successful_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending',
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    error_summary TEXT[],
    import_settings JSONB DEFAULT '{}'::jsonb,
    created_by TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_legacy_clients_staging_batch ON legacy_clients_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_legacy_clients_staging_legacy_id ON legacy_clients_staging(legacy_id);
CREATE INDEX IF NOT EXISTS idx_legacy_clients_staging_status ON legacy_clients_staging(status);

CREATE INDEX IF NOT EXISTS idx_legacy_products_staging_batch ON legacy_products_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_legacy_products_staging_legacy_id ON legacy_products_staging(legacy_id);
CREATE INDEX IF NOT EXISTS idx_legacy_products_staging_sku ON legacy_products_staging(sku);
CREATE INDEX IF NOT EXISTS idx_legacy_products_staging_status ON legacy_products_staging(status);

CREATE INDEX IF NOT EXISTS idx_legacy_orders_staging_batch ON legacy_orders_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_legacy_orders_staging_legacy_id ON legacy_orders_staging(legacy_id);
CREATE INDEX IF NOT EXISTS idx_legacy_orders_staging_client ON legacy_orders_staging(legacy_client_id);
CREATE INDEX IF NOT EXISTS idx_legacy_orders_staging_status ON legacy_orders_staging(status);

CREATE INDEX IF NOT EXISTS idx_legacy_order_items_staging_batch ON legacy_order_items_staging(import_batch_id);
CREATE INDEX IF NOT EXISTS idx_legacy_order_items_staging_order ON legacy_order_items_staging(legacy_order_id);
CREATE INDEX IF NOT EXISTS idx_legacy_order_items_staging_product ON legacy_order_items_staging(legacy_product_id);

-- Function to create a new import batch
CREATE OR REPLACE FUNCTION create_import_batch(
    p_batch_name TEXT,
    p_import_type TEXT,
    p_file_name TEXT DEFAULT NULL,
    p_file_size BIGINT DEFAULT NULL,
    p_created_by TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    batch_id UUID;
BEGIN
    INSERT INTO import_batches (batch_name, import_type, file_name, file_size, created_by)
    VALUES (p_batch_name, p_import_type, p_file_name, p_file_size, p_created_by)
    RETURNING id INTO batch_id;
    
    RETURN batch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update batch progress
CREATE OR REPLACE FUNCTION update_batch_progress(
    p_batch_id UUID,
    p_total_records INTEGER DEFAULT NULL,
    p_processed_records INTEGER DEFAULT NULL,
    p_successful_records INTEGER DEFAULT NULL,
    p_failed_records INTEGER DEFAULT NULL,
    p_status TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    UPDATE import_batches 
    SET 
        total_records = COALESCE(p_total_records, total_records),
        processed_records = COALESCE(p_processed_records, processed_records),
        successful_records = COALESCE(p_successful_records, successful_records),
        failed_records = COALESCE(p_failed_records, failed_records),
        status = COALESCE(p_status, status),
        completed_at = CASE WHEN p_status IN ('completed', 'failed') THEN NOW() ELSE completed_at END
    WHERE id = p_batch_id;
END;
$$ LANGUAGE plpgsql;

-- Function to process staged clients into main table
CREATE OR REPLACE FUNCTION process_staged_clients(p_batch_id UUID)
RETURNS TABLE(
    processed_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    rec RECORD;
    success_cnt INTEGER := 0;
    error_cnt INTEGER := 0;
    error_list TEXT[] := ARRAY[]::TEXT[];
    total_cnt INTEGER := 0;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_cnt FROM legacy_clients_staging WHERE import_batch_id = p_batch_id AND NOT processed;
    
    -- Process each staged client
    FOR rec IN 
        SELECT * FROM legacy_clients_staging 
        WHERE import_batch_id = p_batch_id AND NOT processed
    LOOP
        BEGIN
            -- Insert into main clients table
            INSERT INTO clients (name, logo_url, offices, visible, legacy_id)
            VALUES (
                COALESCE(rec.name, rec.company_name, 'Unknown Client'),
                rec.logo_url,
                COALESCE(rec.offices, 1),
                true,
                rec.legacy_id
            );
            
            -- Mark as processed
            UPDATE legacy_clients_staging 
            SET processed = true, status = 'success'
            WHERE id = rec.id;
            
            success_cnt := success_cnt + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed with error
            UPDATE legacy_clients_staging 
            SET processed = true, status = 'error', error_message = SQLERRM
            WHERE id = rec.id;
            
            error_cnt := error_cnt + 1;
            error_list := array_append(error_list, 'Client ' || rec.legacy_id || ': ' || SQLERRM);
        END;
    END LOOP;
    
    RETURN QUERY SELECT total_cnt, success_cnt, error_cnt, error_list;
END;
$$ LANGUAGE plpgsql;

-- Function to process staged products into main table
CREATE OR REPLACE FUNCTION process_staged_products(p_batch_id UUID)
RETURNS TABLE(
    processed_count INTEGER,
    success_count INTEGER,
    error_count INTEGER,
    errors TEXT[]
) AS $$
DECLARE
    rec RECORD;
    success_cnt INTEGER := 0;
    error_cnt INTEGER := 0;
    error_list TEXT[] := ARRAY[]::TEXT[];
    total_cnt INTEGER := 0;
    final_sku TEXT;
BEGIN
    -- Get total count
    SELECT COUNT(*) INTO total_cnt FROM legacy_products_staging WHERE import_batch_id = p_batch_id AND NOT processed;
    
    -- Process each staged product
    FOR rec IN 
        SELECT * FROM legacy_products_staging 
        WHERE import_batch_id = p_batch_id AND NOT processed
    LOOP
        BEGIN
            -- Handle duplicate SKUs
            final_sku := rec.sku;
            WHILE EXISTS (SELECT 1 FROM products WHERE sku = final_sku) LOOP
                final_sku := rec.sku || '_' || extract(epoch from now())::integer;
            END LOOP;
            
            -- Insert into main products table
            INSERT INTO products (
                sku, name, description, category, subcategory, type,
                unit_price, unit_type, units_per_case, case_price,
                image_url, status, specifications, legacy_id
            )
            VALUES (
                final_sku,
                COALESCE(rec.name, 'Unknown Product'),
                rec.description,
                COALESCE(rec.category, 'GENERAL'),
                COALESCE(rec.subcategory, 'GENERAL'),
                COALESCE(rec.type, 'GENERAL'),
                COALESCE(rec.unit_price, 0),
                COALESCE(rec.unit_type, 'unit'),
                COALESCE(rec.units_per_case, 1),
                COALESCE(rec.case_price, rec.unit_price * rec.units_per_case, 0),
                COALESCE(rec.image_url, '/placeholder.svg?height=60&width=60&text=Product'),
                'available',
                COALESCE(rec.specifications, '{}'::jsonb),
                rec.legacy_id
            );
            
            -- Mark as processed
            UPDATE legacy_products_staging 
            SET processed = true, status = 'success'
            WHERE id = rec.id;
            
            success_cnt := success_cnt + 1;
            
        EXCEPTION WHEN OTHERS THEN
            -- Mark as failed with error
            UPDATE legacy_products_staging 
            SET processed = true, status = 'error', error_message = SQLERRM
            WHERE id = rec.id;
            
            error_cnt := error_cnt + 1;
            error_list := array_append(error_list, 'Product ' || rec.sku || ': ' || SQLERRM);
        END;
    END LOOP;
    
    RETURN QUERY SELECT total_cnt, success_cnt, error_cnt, error_list;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS on all staging tables
ALTER TABLE legacy_clients_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_products_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_orders_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE legacy_order_items_staging ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (allow all for now, can be restricted later)
CREATE POLICY "Allow all operations on legacy_clients_staging" ON legacy_clients_staging FOR ALL USING (true);
CREATE POLICY "Allow all operations on legacy_products_staging" ON legacy_products_staging FOR ALL USING (true);
CREATE POLICY "Allow all operations on legacy_orders_staging" ON legacy_orders_staging FOR ALL USING (true);
CREATE POLICY "Allow all operations on legacy_order_items_staging" ON legacy_order_items_staging FOR ALL USING (true);
CREATE POLICY "Allow all operations on import_batches" ON import_batches FOR ALL USING (true);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO postgres;
