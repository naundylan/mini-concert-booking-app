-- Drop the check constraint on email_status if it exists, to allow the UNSENT status
ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_email_status_check;
