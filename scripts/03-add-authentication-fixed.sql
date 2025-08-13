-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create users table for authentication
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'client', -- 'owner' or 'client'
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE, -- NULL for owner
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add offices/tenants table for client locations
CREATE TABLE IF NOT EXISTS client_offices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_client_id ON users(client_id);
CREATE INDEX IF NOT EXISTS idx_client_offices_client_id ON client_offices(client_id);

-- Insert Randy as the owner (delete first if exists)
DELETE FROM users WHERE email = 'randy@lightsource.com';
INSERT INTO users (email, password_hash, role, first_name, last_name, client_id) VALUES
('randy@lightsource.com', 'demo123', 'owner', 'Randy', 'Owner', NULL);

-- Also create a test client user for Paramount
DELETE FROM users WHERE email = 'paramount@company.com';
INSERT INTO users (email, password_hash, role, first_name, last_name, client_id) 
SELECT 'paramount@company.com', 'demo123', 'client', 'Steve', 'Jackson', c.id
FROM clients c WHERE c.name ILIKE '%paramount%' LIMIT 1;
