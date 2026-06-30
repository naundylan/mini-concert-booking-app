ALTER TABLE public.users ADD COLUMN reset_password_token_hash VARCHAR(255);
ALTER TABLE public.users ADD COLUMN reset_password_token_expired_at TIMESTAMP(6) WITH TIME ZONE;
