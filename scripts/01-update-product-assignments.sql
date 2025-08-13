-- Update the product_assignments table to include client-specific pricing
ALTER TABLE product_assignments 
ADD COLUMN client_unit_price DECIMAL(10,2),
ADD COLUMN client_case_price DECIMAL(12,2),
ADD COLUMN client_units_per_case INTEGER,
ADD COLUMN is_active BOOLEAN DEFAULT true;

-- Update products table to have base pricing
ALTER TABLE products 
RENAME COLUMN unit_price TO base_unit_price;
ALTER TABLE products 
RENAME COLUMN units_per_case TO base_units_per_case;

-- Add indexes for better performance
CREATE INDEX idx_product_assignments_active ON product_assignments(is_active);
CREATE INDEX idx_product_assignments_company_active ON product_assignments(assigned_to_company_id, is_active);
