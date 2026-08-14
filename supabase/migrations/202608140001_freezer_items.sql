create extension if not exists pgcrypto;

create table if not exists public.freezer_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  frozen_on date not null,
  use_within_days integer not null default 90 check (use_within_days between 1 and 3650),
  quantity integer not null default 1 check (quantity between 1 and 99),
  category text not null default 'Other',
  image_path text,
  created_at timestamptz not null default now()
);

alter table public.freezer_items enable row level security;
create policy "Users read their own freezer items" on public.freezer_items for select to authenticated using ((select auth.uid()) = user_id);
create policy "Users add their own freezer items" on public.freezer_items for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "Users delete their own freezer items" on public.freezer_items for delete to authenticated using ((select auth.uid()) = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('freezer-images', 'freezer-images', false, 8000000, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

create policy "Users read their own freezer images" on storage.objects for select to authenticated using (bucket_id = 'freezer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users add their own freezer images" on storage.objects for insert to authenticated with check (bucket_id = 'freezer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "Users delete their own freezer images" on storage.objects for delete to authenticated using (bucket_id = 'freezer-images' and (storage.foldername(name))[1] = (select auth.uid())::text);
