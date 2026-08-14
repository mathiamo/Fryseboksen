alter table public.freezer_items
  add column if not exists use_by_date date;

comment on column public.freezer_items.use_by_date is
  'Optional exact expiration date. When set, it overrides the relative use_within_days date in the app.';
