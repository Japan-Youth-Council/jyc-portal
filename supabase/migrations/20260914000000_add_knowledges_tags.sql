alter table public.knowledges
  add column if not exists tags text[] not null default '{}';
