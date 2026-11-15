alter table public.contact_targets
  add column if not exists furigana text,
  add column if not exists political_party text,
  add column if not exists relationship text;