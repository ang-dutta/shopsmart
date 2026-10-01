-- Run once in the Supabase dashboard: SQL Editor > New query > paste > Run.
create table if not exists public.cart_items (
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  product_id text not null,
  qty int not null default 1 check (qty between 1 and 20),
  updated_at timestamptz not null default now(),
  primary key (user_id, product_id)
);
alter table public.cart_items enable row level security;
drop policy if exists "own cart" on public.cart_items;
create policy "own cart" on public.cart_items for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
