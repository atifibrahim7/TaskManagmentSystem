create table tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text not null,
  deadline timestamp with time zone not null,
  priority text not null check (priority in ('Low', 'Medium', 'High')),
  status text not null default 'Pending' check (status in ('Pending', 'In Progress', 'Completed')),
  user_id uuid not null references auth.users(id),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Add RLS (Row Level Security) policies
alter table tasks enable row level security;

-- Create policy for selecting tasks
create policy "Users can view their own tasks"
  on tasks for select
  using (auth.uid() = user_id);

-- Create policy for inserting tasks
create policy "Users can create their own tasks"
  on tasks for insert
  with check (auth.uid() = user_id);

-- Create policy for updating tasks
create policy "Users can update their own tasks"
  on tasks for update
  using (auth.uid() = user_id);

-- Create policy for deleting tasks
create policy "Users can delete their own tasks"
  on tasks for delete
  using (auth.uid() = user_id);