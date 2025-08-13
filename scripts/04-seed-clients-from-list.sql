-- Insert clients from the provided list
INSERT INTO clients (name, visible) VALUES
('Ethan Conrad', true),
('GraphTek', true),
('Paramount Group', true),
('Boxer Property', true),
('LaSalle', true),
('Safeguard IT', true),
('Lime Energy', true),
('Brookfield', true),
('Mimiscate', true),
('RCE', true),
('Millennium', true),
('Normandy', true),
('Safeway', true),
('Urchin', true),
('Ritz-Carlton Marriott', true),
('Ritz-Carlton', true),
('Omni Hotels', true),
('CBRE', true),
('Morgans', true),
('Lithonia Products', true),
('Harsch', true),
('Habitat', true),
('Glenborough', true),
('Four Seasons', true),
('EMCOR', true),
('Colonial Properties', true),
('ACME Display', true),
('John Buck', true),
('New York Palace', true),
('Ritz Project', true),
('Dorchester', true),
('Hines', true),
('Morgan Jones', true),
('Able', true);

-- Create default user accounts for each client (they can change passwords later)
INSERT INTO users (email, password_hash, role, client_id, first_name, last_name)
SELECT 
    LOWER(REPLACE(REPLACE(c.name, ' ', ''), '-', '')) || '@company.com',
    '$2b$10$dummy_hash_for_now', -- They'll need to set real passwords
    'client',
    c.id,
    SPLIT_PART(c.name, ' ', 1),
    CASE 
        WHEN ARRAY_LENGTH(STRING_TO_ARRAY(c.name, ' '), 1) > 1 
        THEN SPLIT_PART(c.name, ' ', -1)
        ELSE 'Admin'
    END
FROM clients c
WHERE c.name IN (
    'Ethan Conrad', 'GraphTek', 'Paramount Group', 'Boxer Property', 'LaSalle',
    'Safeguard IT', 'Lime Energy', 'Brookfield', 'Mimiscate', 'RCE',
    'Millennium', 'Normandy', 'Safeway', 'Urchin', 'Ritz-Carlton Marriott',
    'Ritz-Carlton', 'Omni Hotels', 'CBRE', 'Morgans', 'Lithonia Products',
    'Harsch', 'Habitat', 'Glenborough', 'Four Seasons', 'EMCOR',
    'Colonial Properties', 'ACME Display', 'John Buck', 'New York Palace',
    'Ritz Project', 'Dorchester', 'Hines', 'Morgan Jones', 'Able'
);

-- Add some sample offices for a few clients
INSERT INTO client_offices (client_id, name, address, city, state, contact_name, contact_email, contact_phone)
SELECT 
    c.id,
    c.name || ' - Main Office',
    '123 Business Ave',
    'New York',
    'NY',
    'Facilities Manager',
    LOWER(REPLACE(REPLACE(c.name, ' ', ''), '-', '')) || '@company.com',
    '555-0100'
FROM clients c
WHERE c.name IN ('Paramount Group', 'CBRE', 'Four Seasons', 'Ritz-Carlton', 'Brookfield')
LIMIT 5;
