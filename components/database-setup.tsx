"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, XCircle, Database, AlertTriangle, Copy } from "lucide-react"
import { testSupabaseConnection, checkTablesExist } from "@/lib/supabase"

// Complete SQL Scripts with proper syntax and order
const SQL_SCRIPTS = [
  {
    name: "01-create-enums-and-base-tables.sql",
    description: "Creates enum types and base tables without foreign keys",
    sql: `-- Drop existing types if they exist
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS product_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Create enum types
CREATE TYPE user_role AS ENUM ('OWNER', 'SUPERCUSTOMER', 'CUSTOMER', 'TENANT');
CREATE TYPE product_status AS ENUM ('AVAILABLE', 'ASSIGNED', 'DISCONTINUED');
CREATE TYPE order_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED');

-- Create companies table first (no dependencies)
CREATE TABLE IF NOT EXISTS companies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    logo_url TEXT,
    type user_role NOT NULL CHECK (type IN ('SUPERCUSTOMER', 'CUSTOMER')),
    is_visible BOOLEAN DEFAULT true,
    admin_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table (will add foreign keys later)
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    phone VARCHAR(20),
    company_id UUID,
    building_id UUID,
    floor_id UUID,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create buildings table
CREATE TABLE IF NOT EXISTS buildings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    company_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create floors table
CREATE TABLE IF NOT EXISTS floors (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    floor_number INTEGER,
    building_id UUID NOT NULL,
    tenant_company_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create products table
CREATE TABLE IF NOT EXISTS products (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_number VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    manufacturer VARCHAR(255),
    category VARCHAR(100),
    sub_category VARCHAR(100),
    info_type VARCHAR(50),
    info_details TEXT,
    unit_type VARCHAR(20),
    unit_price DECIMAL(10,2),
    units_per_case INTEGER DEFAULT 1,
    status product_status DEFAULT 'AVAILABLE',
    tag VARCHAR(50),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create orders table
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
    notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create order_items table
CREATE TABLE IF NOT EXISTS order_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    order_id UUID NOT NULL,
    product_id UUID NOT NULL,
    tenant VARCHAR(255),
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(12,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_assignments table
CREATE TABLE IF NOT EXISTS product_assignments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_id UUID NOT NULL,
    assigned_to_company_id UUID,
    assigned_to_user_id UUID,
    assigned_by_user_id UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CHECK (assigned_to_company_id IS NOT NULL OR assigned_to_user_id IS NOT NULL)
);

-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create subcategories table
CREATE TABLE IF NOT EXISTS subcategories (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    category_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(category_id, name)
);`,
  },
  {
    name: "02-add-foreign-keys.sql",
    description: "Adds all foreign key constraints",
    sql: `-- Add foreign key constraints to users table
ALTER TABLE users 
ADD CONSTRAINT fk_users_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD CONSTRAINT fk_users_building 
FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE users 
ADD CONSTRAINT fk_users_floor 
FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL;

-- Add foreign key constraint to companies table
ALTER TABLE companies 
ADD CONSTRAINT fk_companies_admin_user 
FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL;

-- Add foreign key constraints to buildings table
ALTER TABLE buildings 
ADD CONSTRAINT fk_buildings_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

-- Add foreign key constraints to floors table
ALTER TABLE floors 
ADD CONSTRAINT fk_floors_building 
FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE CASCADE;

ALTER TABLE floors 
ADD CONSTRAINT fk_floors_tenant_company 
FOREIGN KEY (tenant_company_id) REFERENCES companies(id) ON DELETE SET NULL;

-- Add foreign key constraints to orders table
ALTER TABLE orders 
ADD CONSTRAINT fk_orders_user 
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_company 
FOREIGN KEY (company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_building 
FOREIGN KEY (building_id) REFERENCES buildings(id) ON DELETE SET NULL;

ALTER TABLE orders 
ADD CONSTRAINT fk_orders_floor 
FOREIGN KEY (floor_id) REFERENCES floors(id) ON DELETE SET NULL;

-- Add foreign key constraints to order_items table
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

-- Add foreign key constraints to product_assignments table
ALTER TABLE product_assignments 
ADD CONSTRAINT fk_product_assignments_product 
FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE;

ALTER TABLE product_assignments 
ADD CONSTRAINT fk_product_assignments_company 
FOREIGN KEY (assigned_to_company_id) REFERENCES companies(id) ON DELETE CASCADE;

ALTER TABLE product_assignments 
ADD CONSTRAINT fk_product_assignments_user 
FOREIGN KEY (assigned_to_user_id) REFERENCES users(id) ON DELETE CASCADE;

ALTER TABLE product_assignments 
ADD CONSTRAINT fk_product_assignments_assigned_by 
FOREIGN KEY (assigned_by_user_id) REFERENCES users(id) ON DELETE CASCADE;

-- Add foreign key constraints to subcategories table
ALTER TABLE subcategories 
ADD CONSTRAINT fk_subcategories_category 
FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;

-- Add subcategory_id to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS subcategory_id UUID;

ALTER TABLE products 
ADD CONSTRAINT fk_products_subcategory 
FOREIGN KEY (subcategory_id) REFERENCES subcategories(id) ON DELETE SET NULL;`,
  },
  {
    name: "03-create-indexes.sql",
    description: "Creates indexes for better performance",
    sql: `-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_company ON users(company_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_companies_type ON companies(type);
CREATE INDEX IF NOT EXISTS idx_companies_visible ON companies(is_visible);
CREATE INDEX IF NOT EXISTS idx_companies_admin ON companies(admin_user_id);

CREATE INDEX IF NOT EXISTS idx_buildings_company ON buildings(company_id);

CREATE INDEX IF NOT EXISTS idx_floors_building ON floors(building_id);
CREATE INDEX IF NOT EXISTS idx_floors_tenant ON floors(tenant_company_id);

CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_subcategory ON products(subcategory_id);
CREATE INDEX IF NOT EXISTS idx_products_item_number ON products(item_number);
CREATE INDEX IF NOT EXISTS idx_products_manufacturer ON products(manufacturer);

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at);
CREATE INDEX IF NOT EXISTS idx_orders_number ON orders(order_number);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);

CREATE INDEX IF NOT EXISTS idx_product_assignments_product ON product_assignments(product_id);
CREATE INDEX IF NOT EXISTS idx_product_assignments_company ON product_assignments(assigned_to_company_id);
CREATE INDEX IF NOT EXISTS idx_product_assignments_user ON product_assignments(assigned_to_user_id);
CREATE INDEX IF NOT EXISTS idx_product_assignments_assigned_by ON product_assignments(assigned_by_user_id);

CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);
CREATE INDEX IF NOT EXISTS idx_categories_active ON categories(is_active);
CREATE INDEX IF NOT EXISTS idx_categories_sort ON categories(sort_order);

CREATE INDEX IF NOT EXISTS idx_subcategories_category ON subcategories(category_id);
CREATE INDEX IF NOT EXISTS idx_subcategories_name ON subcategories(name);
CREATE INDEX IF NOT EXISTS idx_subcategories_active ON subcategories(is_active);
CREATE INDEX IF NOT EXISTS idx_subcategories_sort ON subcategories(sort_order);`,
  },
  {
    name: "04-seed-data.sql",
    description: "Adds sample users, companies, buildings, and products",
    sql: `-- Insert Randy (Owner) first
INSERT INTO users (id, email, name, role, phone) VALUES 
('550e8400-e29b-41d4-a716-446655440000', 'randy@lightsource.com', 'Randy', 'OWNER', '555-0100')
ON CONFLICT (id) DO NOTHING;

-- Insert Companies
INSERT INTO companies (id, name, type, is_visible) VALUES 
('550e8400-e29b-41d4-a716-446655440001', 'Paramount Group Inc', 'SUPERCUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440002', 'ABC Corporation', 'CUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440003', 'PixelNet', 'CUSTOMER', true),
('550e8400-e29b-41d4-a716-446655440004', 'Amazon Services', 'SUPERCUSTOMER', true)
ON CONFLICT (id) DO NOTHING;

-- Insert Buildings
INSERT INTO buildings (id, name, address, company_id) VALUES 
('550e8400-e29b-41d4-a716-446655440010', 'Empire State Building', '350 5th Ave, New York, NY', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440011', 'One Market Plaza', '1 Market St, San Francisco, CA', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440012', 'ABC Tower', '123 Business Ave, Los Angeles, CA', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440013', '50 Beale St', '50 Beale St, San Francisco, CA', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Insert Floors
INSERT INTO floors (id, name, floor_number, building_id) VALUES 
('550e8400-e29b-41d4-a716-446655440020', '7th Floor', 7, '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440021', '8th Floor', 8, '550e8400-e29b-41d4-a716-446655440011'),
('550e8400-e29b-41d4-a716-446655440022', '15th Floor', 15, '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440023', '16th Floor', 16, '550e8400-e29b-41d4-a716-446655440012'),
('550e8400-e29b-41d4-a716-446655440024', '42nd Floor', 42, '550e8400-e29b-41d4-a716-446655440010')
ON CONFLICT (id) DO NOTHING;

-- Insert Users (SuperCustomers, Customers, Tenants)
INSERT INTO users (id, email, name, role, phone, company_id) VALUES 
('550e8400-e29b-41d4-a716-446655440030', 'steve@paramount.com', 'Steve Jackson', 'SUPERCUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440001'),
('550e8400-e29b-41d4-a716-446655440031', 'admin@amazon.com', 'Admin Desk', 'SUPERCUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440004'),
('550e8400-e29b-41d4-a716-446655440032', 'steve@beale.com', 'Steve Jackson', 'CUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440002'),
('550e8400-e29b-41d4-a716-446655440033', 'suzy@pixelnet.com', 'Suzy', 'CUSTOMER', '818-555-9789', '550e8400-e29b-41d4-a716-446655440003'),
('550e8400-e29b-41d4-a716-446655440034', 'tenant@techstartup.com', 'Tech Startup Inc', 'TENANT', '555-0123', '550e8400-e29b-41d4-a716-446655440002')
ON CONFLICT (id) DO NOTHING;

-- Update companies with admin users
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440030' WHERE id = '550e8400-e29b-41d4-a716-446655440001';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440031' WHERE id = '550e8400-e29b-41d4-a716-446655440004';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440032' WHERE id = '550e8400-e29b-41d4-a716-446655440002';
UPDATE companies SET admin_user_id = '550e8400-e29b-41d4-a716-446655440033' WHERE id = '550e8400-e29b-41d4-a716-446655440003';

-- Insert Categories
INSERT INTO categories (id, name, description, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440100', 'Ballast', 'Electronic and magnetic ballasts for fluorescent lighting', 1),
('550e8400-e29b-41d4-a716-446655440101', 'LED', 'LED bulbs, fixtures, and drivers', 2),
('550e8400-e29b-41d4-a716-446655440102', 'Fixture', 'Light fixtures and housings', 3),
('550e8400-e29b-41d4-a716-446655440103', 'Switch', 'Light switches and controls', 4),
('550e8400-e29b-41d4-a716-446655440104', 'Electrical', 'Electrical components and timers', 5),
('550e8400-e29b-41d4-a716-446655440105', 'Controls', 'Lighting controls and dimmers', 6),
('550e8400-e29b-41d4-a716-446655440106', 'Bulbs', 'Various types of bulbs', 7)
ON CONFLICT (id) DO NOTHING;

-- Insert Subcategories
INSERT INTO subcategories (category_id, name, sort_order) VALUES 
('550e8400-e29b-41d4-a716-446655440104', 'Timers', 1),
('550e8400-e29b-41d4-a716-446655440106', 'Dimmers', 2),
('550e8400-e29b-41d4-a716-446655440102', 'Recessed', 3),
('550e8400-e29b-41d4-a716-446655440106', 'LED', 4)
ON CONFLICT (category_id, name) DO NOTHING;

-- Insert Products
INSERT INTO products (id, item_number, name, description, manufacturer, category, sub_category, info_type, info_details, unit_type, unit_price, units_per_case, tag) VALUES 
('550e8400-e29b-41d4-a716-446655440040', 'JHBL 24000LM GL WD MVOLT GZ10 50K 80CRI HC3P DWH', 'INTERMATIC Spring Wound Timer', 'INTERMATIC Spring Wound Timer, Timing Range 1 Hour', 'INTERMATIC', 'Electrical', 'Timers', 'Ballast', '2 x 2 parabolic', 'cases', 270.00, 24, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440041', 'DVF-103P-WH', 'Lutron Preset Dimmer', 'Lutron Preset Dimmer with Nightlight', 'Lutron', 'Controls', 'Dimmers', 'Dimmer', 'Single Pole or 3-Way', 'units', 897.00, 1, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440042', 'B94C', 'GE LED Recessed Downlight', 'Commercial Electric 6" LED Recessed Downlight', 'GE', 'Fixtures', 'Recessed', 'Fixture', '24 bulbs', 'units', 220.00, 1, 'RELAMP'),
('550e8400-e29b-41d4-a716-446655440043', 'B95D', 'GE LED Replacement Bulbs', 'Replacement LED bulbs', 'GE', 'Bulbs', 'LED', 'Bulbs', 'LED', 'cases', 99.00, 48, 'RELAMP')
ON CONFLICT (id) DO NOTHING;

-- Insert Orders
INSERT INTO orders (id, order_number, user_id, company_id, building_id, status, total_amount) VALUES 
('550e8400-e29b-41d4-a716-446655440050', 'ORD-2025-001', '550e8400-e29b-41d4-a716-446655440030', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440010', 'COMPLETED', 5400.00),
('550e8400-e29b-41d4-a716-446655440051', 'ORD-2025-002', '550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440012', 'PENDING', 1620.00)
ON CONFLICT (id) DO NOTHING;

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
('550e8400-e29b-41d4-a716-446655440043', '550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000');`,
  },
]

export default function DatabaseSetup() {
  const [connectionStatus, setConnectionStatus] = useState<"idle" | "testing" | "connected" | "error">("idle")
  const [connectionError, setConnectionError] = useState<string>("")
  const [tableStatus, setTableStatus] = useState<Array<{ table: string; exists: boolean }>>([])
  const [copiedScript, setCopiedScript] = useState<string>("")

  const handleTestConnection = async () => {
    setConnectionStatus("testing")
    const result = await testSupabaseConnection()

    if (result.success) {
      setConnectionStatus("connected")
      setConnectionError("")
    } else {
      setConnectionStatus("error")
      setConnectionError(result.error || "Unknown error")
    }
  }

  const handleCheckTables = async () => {
    const results = await checkTablesExist()
    setTableStatus(results)
  }

  const handleCopyScript = async (scriptName: string, sql: string) => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopiedScript(scriptName)
      setTimeout(() => setCopiedScript(""), 2000)
    } catch (error) {
      console.error("Failed to copy:", error)
    }
  }

  const expectedTables = [
    "users",
    "companies",
    "buildings",
    "floors",
    "products",
    "orders",
    "order_items",
    "product_assignments",
    "categories",
    "subcategories",
  ]

  const allTablesExist = expectedTables.every((table) => tableStatus.find((t) => t.table === table)?.exists)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Setup
          </CardTitle>
          <CardDescription>Set up your Supabase database with all required tables and sample data</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Connection Test */}
          <div className="flex items-center gap-4">
            <Button
              onClick={handleTestConnection}
              disabled={connectionStatus === "testing"}
              variant={connectionStatus === "connected" ? "default" : "outline"}
            >
              {connectionStatus === "testing" ? "Testing..." : "Test Connection"}
            </Button>

            {connectionStatus === "connected" && (
              <Badge variant="default" className="bg-green-500">
                <CheckCircle className="h-3 w-3 mr-1" />
                Connected
              </Badge>
            )}

            {connectionStatus === "error" && (
              <Badge variant="destructive">
                <XCircle className="h-3 w-3 mr-1" />
                Error
              </Badge>
            )}
          </div>

          {connectionError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{connectionError}</p>
              {connectionError.includes("does not exist") && (
                <p className="text-sm text-red-600 mt-2">
                  ↳ This is expected! Run the SQL scripts below to create the tables.
                </p>
              )}
            </div>
          )}

          {/* Table Status Check */}
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <Button onClick={handleCheckTables} variant="outline">
                Check Tables
              </Button>

              {tableStatus.length > 0 && allTablesExist && (
                <Badge variant="default" className="bg-green-500">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  All Tables Ready
                </Badge>
              )}
            </div>

            {tableStatus.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
                {expectedTables.map((tableName) => {
                  const tableInfo = tableStatus.find((t) => t.table === tableName)
                  const exists = tableInfo?.exists || false

                  return (
                    <Badge
                      key={tableName}
                      variant={exists ? "default" : "secondary"}
                      className={exists ? "bg-green-500" : "bg-red-400 text-white"}
                    >
                      {tableName} {exists ? "✓" : "✗"}
                    </Badge>
                  )
                })}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* SQL Scripts */}
      <Card>
        <CardHeader>
          <CardTitle>Database Scripts</CardTitle>
          <CardDescription>Run these scripts in your Supabase SQL Editor in order</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <p className="text-sm text-yellow-800 font-medium">Manual Setup Required</p>
            </div>
            <p className="text-sm text-yellow-700 mt-1">
              Copy and paste each SQL script into your Supabase Dashboard → SQL Editor → New Query
            </p>
          </div>

          {SQL_SCRIPTS.map((script, index) => (
            <div key={script.name} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="font-medium">
                    {index + 1}. {script.name}
                  </h3>
                  <p className="text-sm text-gray-600">{script.description}</p>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCopyScript(script.name, script.sql)}
                    className="flex items-center gap-1"
                  >
                    <Copy className="h-3 w-3" />
                    {copiedScript === script.name ? "Copied!" : "Copy SQL"}
                  </Button>
                </div>
              </div>

              <details className="mt-2">
                <summary className="text-sm text-gray-500 cursor-pointer hover:text-gray-700">
                  View SQL ({script.sql.length} characters)
                </summary>
                <pre className="mt-2 p-3 bg-gray-50 rounded text-xs overflow-x-auto max-h-60 whitespace-pre-wrap">
                  {script.sql}
                </pre>
              </details>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Setup Instructions</CardTitle>
        </CardHeader>
        <CardContent>
          <ol className="list-decimal list-inside space-y-2 text-sm">
            <li>Click "Test Connection" above to verify Supabase is connected</li>
            <li>
              Go to your{" "}
              <a
                href="https://supabase.com/dashboard"
                target="_blank"
                className="text-blue-600 hover:underline"
                rel="noreferrer"
              >
                Supabase Dashboard
              </a>
            </li>
            <li>Navigate to SQL Editor → New Query</li>
            <li>Copy and paste each SQL script above in order (1-4)</li>
            <li>Run each script by clicking the "Run" button</li>
            <li>Come back here and click "Check Tables" to verify setup</li>
            <li>Once all tables show ✓, your database is ready!</li>
          </ol>

          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-800">
              <strong>Expected Tables:</strong> {expectedTables.join(", ")}
            </p>
            <p className="text-sm text-blue-700 mt-1">
              All tables must show ✓ for the database to be fully functional.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
