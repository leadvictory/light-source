-- Create order-related tables with proper structure

-- Orders table
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE NOT NULL,
  purchase_order_number VARCHAR(50),
  user_id UUID NOT NULL,
  company_id UUID NOT NULL,
  building_id UUID,
  floor_id UUID,
  status order_status DEFAULT 'PENDING',
  
  -- Contact information
  contact_name VARCHAR(255),
  contact_email VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_fax VARCHAR(20),
  
  -- Shipping information
  shipping_type VARCHAR(100),
  shipping_address_1 VARCHAR(255),
  shipping_address_2 VARCHAR(255),
  shipping_city VARCHAR(100),
  shipping_state VARCHAR(50),
  shipping_zip VARCHAR(20),
  
  -- Billing information
  billing_type VARCHAR(50),
  sales_tax_rate DECIMAL(5,4) DEFAULT 0.085,
  
  -- Additional fields
  ge_confirmation VARCHAR(100),
  special_instructions TEXT,
  comments TEXT,
  shipping_details TEXT,
  
  -- Totals
  subtotal DECIMAL(12,2) DEFAULT 0,
  tax_amount DECIMAL(12,2) DEFAULT 0,
  total_amount DECIMAL(12,2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE,
  FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL,
  FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL
);

-- Order items table
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  product_id UUID NOT NULL,
  tenant VARCHAR(255),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
