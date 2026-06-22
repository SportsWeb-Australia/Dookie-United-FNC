-- Optional third club colour (some clubs have three brand colours).
-- Additive + safe. Run in the Supabase SQL Editor.
alter table public.clubs add column if not exists tertiary_colour text;

-- Example: set Dookie's tertiary to white (turquoise primary / black secondary / white tertiary)
-- update public.clubs set tertiary_colour = '#FFFFFF'
--  where id = '7a841f7f-c6ac-4181-aec2-e91c53103512';
