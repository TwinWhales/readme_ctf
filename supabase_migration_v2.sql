-- 1. Create Role Enum and Add to Profiles
-- Note: If you already ran the previous version with only ('user', 'admin'), 
-- you might need to drop the type first or alter it.
-- DROP TYPE IF EXISTS user_role CASCADE;
create type user_role as enum ('user', 'manager', 'admin');
alter table profiles add column role user_role default 'user';

-- 2. Create Categories Table
create table categories (
  id uuid default gen_random_uuid() primary key,
  name text not null unique,
  icon text default 'Box', -- Lucide icon name string
  created_at timestamptz default now()
);

-- 3. Enable RLS
alter table categories enable row level security;

-- 4. RLS Policies

-- Categories: Everyone can view
create policy "Categories are viewable by everyone" 
  on categories for select 
  using (true);

-- Categories: Admins and Managers can insert
create policy "Admins and Managers can insert categories" 
  on categories for insert 
  with check (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Categories: Admins and Managers can update (e.g. fix typos)
create policy "Admins and Managers can update categories" 
  on categories for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role in ('admin', 'manager')
    )
  );

-- Profiles: Admins can update roles (and other profile fields)
-- Assuming profiles table already exists and RLS is enabled.
create policy "Admins can update profiles" 
  on profiles for update
  using (
    exists (
      select 1 from profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- 5. Insert Default Categories
insert into categories (name, icon) values
  ('Web', 'Globe'),
  ('Pwnable', 'Terminal'),
  ('Reversing', 'Cpu'),
  ('Crypto', 'Lock'),
  ('Misc', 'Box'),
  ('Forensics', 'Search');
