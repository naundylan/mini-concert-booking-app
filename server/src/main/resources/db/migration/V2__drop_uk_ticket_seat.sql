-- Migration to drop uk_ticket_seat constraint to allow cancelled/released seats to be rebooked.
ALTER TABLE public.tickets DROP CONSTRAINT IF EXISTS uk_ticket_seat;
