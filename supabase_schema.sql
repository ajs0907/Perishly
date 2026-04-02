-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create households table
create table public.households (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  code text not null unique,
  created_by uuid references auth.users default auth.uid() not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create household_members table
create table public.household_members (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(household_id, user_id)
);

-- Create items table
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  household_id uuid references public.households on delete cascade not null,
  name text not null,
  owner_id uuid references auth.users on delete cascade not null,
  category text,
  expires_in integer not null default 5,
  status text not null default 'private',
  bounty integer,
  emoji text,
  cost numeric(10, 2) default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Set up Row Level Security (RLS)
alter table public.households enable row level security;
alter table public.household_members enable row level security;
alter table public.items enable row level security;

-- Policies for households
create policy "Users can view their own households" on public.households
  for select using (
    auth.uid() = created_by OR
    exists (
      select 1 from public.household_members
      where household_members.household_id = households.id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Users can insert households" on public.households
  for insert with check (auth.uid() is not null);

-- Policies for household_members
create policy "Users can view their own memberships" on public.household_members
  for select using (auth.uid() = user_id);

create policy "Users can insert household members" on public.household_members
  for insert with check (auth.uid() is not null);

-- Policies for items
create policy "Users can view items in their households" on public.items
  for select using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = items.household_id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Users can insert items in their households" on public.items
  for insert with check (
    exists (
      select 1 from public.household_members
      where household_members.household_id = items.household_id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Users can update items in their households" on public.items
  for update using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = items.household_id
      and household_members.user_id = auth.uid()
    )
  );

create policy "Users can delete items in their households" on public.items
  for delete using (
    exists (
      select 1 from public.household_members
      where household_members.household_id = items.household_id
      and household_members.user_id = auth.uid()
    )
  );
