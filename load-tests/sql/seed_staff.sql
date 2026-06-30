-- Seed 1,000 staff users for k6 load testing
DO $$
DECLARE
    i INT;
    user_id UUID;
BEGIN
    FOR i IN 1..1000 LOOP
        user_id := gen_random_uuid();
        -- Ensure user does not already exist
        IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'staff_load_' || i) THEN
            INSERT INTO users (
                id, 
                username, 
                password_hash, 
                role, 
                status, 
                auth_provider, 
                full_name, 
                email, 
                phone, 
                online_verified, 
                created_at, 
                updated_at
            )
            VALUES (
                user_id,
                'staff_load_' || i,
                '$2a$10$iKJvaQScNWybtZ3MmF1Qc.Nt/G64Ga3jg/5H.MnnVYNJ0Uzko.dmy', -- BCrypt hash of 'change-me'
                'STAFF',
                'ACTIVE',
                'LOCAL',
                'Load Staff ' || i,
                'staff_load_' || i || '@example.com',
                '0808' || LPAD(i::text, 6, '0'),
                true,
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;
