-- Run once in Supabase SQL Editor before using Gallery.
create table if not exists public.gallery_photos (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 100),
  description text not null default '' check (char_length(description) <= 500),
  event_date date,
  storage_path text not null unique,
  created_at timestamptz not null default now()
);
alter table public.gallery_photos enable row level security;
create policy "Approved eboard can view gallery" on public.gallery_photos
for select to authenticated using (
  exists (select 1 from public.club_finances where id = 1)
);
create policy "Approved eboard can add gallery" on public.gallery_photos
for insert to authenticated with check (
  exists (select 1 from public.club_finances where id = 1)
);
create policy "Approved eboard can remove gallery" on public.gallery_photos
for delete to authenticated using (
  exists (select 1 from public.club_finances where id = 1)
);
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('math-club-gallery','math-club-gallery',true,8388608,
array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
create policy "Approved eboard upload gallery photos" on storage.objects
for insert to authenticated with check (
  bucket_id = 'math-club-gallery'
  and exists (select 1 from public.club_finances where id = 1)
);
create policy "Approved eboard remove gallery photos" on storage.objects
for delete to authenticated using (
  bucket_id = 'math-club-gallery'
  and exists (select 1 from public.club_finances where id = 1)
);
-- Note: gallery photos are stored in a PUBLIC bucket; their direct URLs
-- are viewable by anyone who has the link, although the Gallery UI requires login.
