-- Create homepage_topics table for dynamic Explore Topics section
create table homepage_topics (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  slug text not null,
  icon text,
  description text,
  sort_order int default 0,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table homepage_topics enable row level security;

-- Create access policies
create policy "Homepage topics are viewable by everyone" on homepage_topics 
  for select using (true);

create policy "Admins can manage homepage topics" on homepage_topics 
  for all using (
    exists (
      select 1 from profiles 
      where id = auth.uid() 
      and role = 'admin'
    )
  );

-- Add sample data (optional templates)
insert into homepage_topics (label, slug, icon, description, sort_order)
values 
  ('Pranavaha Srotas', 'pranavaha-srotas', '💨', 'Respiratory channels', 1),
  ('Rasavaha Srotas', 'rasavaha-srotas', '💧', 'Nutritive channels', 2),
  ('Vata Dosha', 'vata-dosha', '🌬️', 'Kinetic force', 3),
  ('Pitta Dosha', 'pitta-dosha', '🔥', 'Metabolic force', 4),
  ('Kapha Dosha', 'kapha-dosha', '🌊', 'Structural force', 5),
  ('Ashwagandha', 'ashwagandha', '🌿', 'King of herbs', 6);
