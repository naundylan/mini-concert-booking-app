-- Add layout info columns to events table
ALTER TABLE events ADD COLUMN layout_id UUID;
ALTER TABLE events ADD COLUMN layout_template_type VARCHAR(50);
ALTER TABLE events ADD COLUMN layout_decorations jsonb;
