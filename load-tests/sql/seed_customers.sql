-- Seed 1,000 customer users for k6 load testing
DO $$
DECLARE
    i INT;
    user_id UUID;
BEGIN
    FOR i IN 1..1000 LOOP
        user_id := gen_random_uuid();
        -- Ensure user does not already exist
        IF NOT EXISTS (SELECT 1 FROM users WHERE username = 'customer_load_' || i) THEN
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
                'customer_load_' || i,
                '$2a$10$iKJvaQScNWybtZ3MmF1Qc.Nt/G64Ga3jg/5H.MnnVYNJ0Uzko.dmy', -- BCrypt hash of 'change-me'
                'CUSTOMER',
                'ACTIVE',
                'LOCAL',
                'Load Customer ' || i,
                'customer_load_' || i || '@example.com',
                '0909' || LPAD(i::text, 6, '0'),
                true,
                NOW(),
                NOW()
            );
        END IF;
    END LOOP;
END $$;

-- Seed 2,000 available seats for the active load test event (dynamically queried)
DO $$
DECLARE
    r INT;
    c INT;
    seat_count INT := 0;
    target_event_id UUID;
    target_ticket_class_id UUID;
BEGIN
    -- Automatically reactivate the first event in the database to ONSALE for testing
    UPDATE events 
    SET status = 'ONSALE', 
        start_time = NOW() - INTERVAL '1 hour', 
        end_time = NOW() + INTERVAL '24 hours'
    WHERE id IN (SELECT id FROM events LIMIT 1);

    -- Query the first active event (status = ONSALE)
    SELECT id INTO target_event_id FROM events WHERE status = 'ONSALE' LIMIT 1;
    
    -- Query the first ticket class of that event
    SELECT id INTO target_ticket_class_id FROM ticket_classes WHERE event_id = target_event_id LIMIT 1;

    -- If no ONSALE event exists, throw an error
    IF target_event_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy sự kiện nào có trạng thái ONSALE trong cơ sở dữ liệu. Hãy tạo sự kiện trước.';
    END IF;

    IF target_ticket_class_id IS NULL THEN
        RAISE EXCEPTION 'Không tìm thấy phân hạng vé (ticket class) nào cho sự kiện ONSALE. Hãy cấu hình phân hạng vé trước.';
    END IF;

    -- Seed a 50x40 grid (Rows 10 to 59, Columns 1 to 40)
    FOR r IN 10..59 LOOP
        FOR c IN 1..40 LOOP
            -- Avoid uk_seat_event_position collisions by checking position
            IF NOT EXISTS (SELECT 1 FROM seats WHERE event_id = target_event_id AND grid_row = r AND grid_column = c) THEN
                INSERT INTO seats (
                    id, 
                    event_id, 
                    grid_row, 
                    grid_column, 
                    label, 
                    status, 
                    ticket_class_id, 
                    version, 
                    created_at, 
                    updated_at
                )
                VALUES (
                    gen_random_uuid(),
                    target_event_id,
                    r,
                    c,
                    'Row ' || r || ' Seat ' || c,
                    'AVAILABLE',
                    target_ticket_class_id,
                    0,
                    NOW(),
                    NOW()
                );
                seat_count := seat_count + 1;
            END IF;
        END LOOP;
    END LOOP;
END $$;
