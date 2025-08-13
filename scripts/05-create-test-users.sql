-- Create Randy's account (delete first if exists)
DELETE FROM users WHERE email = 'randy@lightsource.com';

INSERT INTO users (email, password_hash, role, first_name, last_name, client_id, is_active) 
VALUES ('randy@lightsource.com', 'demo123', 'owner', 'Randy', 'Owner', NULL, true);

-- Create a test client user for Paramount (if Paramount exists)
DELETE FROM users WHERE email = 'paramount@company.com';

INSERT INTO users (email, password_hash, role, first_name, last_name, client_id, is_active)
SELECT 'paramount@company.com', 'demo123', 'client', 'Steve', 'Jackson', c.id, true
FROM clients c 
WHERE c.name ILIKE '%paramount%' 
LIMIT 1;

-- Verify the users were created
SELECT 
    u.email, 
    u.role, 
    u.first_name, 
    u.last_name, 
    c.name as client_name
FROM users u
LEFT JOIN clients c ON u.client_id = c.id
ORDER BY u.role, u.email;
