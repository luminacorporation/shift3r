-- Waitlist signups for the Shift3r landing page.
--
-- Privacy-first design: anonymous clients can NOT read or write the table
-- directly. They only call join_waitlist(email), a security definer function
-- that inserts the row and returns the signup's position in one transaction.
-- This keeps the email list unreadable to scrapers.

create table if not exists public.waitlist (
  id bigint generated always as identity primary key,
  email text not null unique check (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  created_at timestamptz not null default now()
);

alter table public.waitlist enable row level security;

-- Inserts the email (deduping) and returns { id, position }.
create or replace function public.join_waitlist(p_email text)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_email text := lower(trim(p_email));
  v_id bigint;
  v_position bigint;
begin
  if v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'invalid_email';
  end if;

  insert into public.waitlist (email)
  values (v_email)
  on conflict (email) do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.waitlist where email = v_email;
  end if;

  select count(*) into v_position from public.waitlist where id <= v_id;

  return json_build_object('id', v_id, 'position', v_position);
end;
$$;

-- Public signup counter for the landing page (no emails exposed).
create or replace function public.waitlist_count()
returns bigint
language sql
security definer
set search_path = public
as $$
  select count(*) from public.waitlist;
$$;

-- Only the functions may touch the table as anon; direct REST access is gone.
revoke all on table public.waitlist from anon, authenticated;
grant execute on function public.join_waitlist(text) to anon, authenticated;
grant execute on function public.waitlist_count() to anon, authenticated;
