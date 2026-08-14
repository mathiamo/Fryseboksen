alter table public.freezer_items
add column if not exists comment text
check (comment is null or char_length(comment) <= 500);

drop policy if exists "Users update their own freezer items" on public.freezer_items;
create policy "Users update their own freezer items"
on public.freezer_items
for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
