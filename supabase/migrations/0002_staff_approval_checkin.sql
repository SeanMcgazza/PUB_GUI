-- ============================================================================
-- 0002_staff_approval_checkin.sql
-- ============================================================================
-- Optional staff-approved check-in (audit §D1 "Staff-approved check-in").
--
-- When a pub turns this on, scanning the QR no longer immediately unlocks
-- ordering: a check-in request is created and staff must Approve it on the
-- dashboard before the customer can order (and therefore before they pay —
-- so a rejected table is never charged). Default OFF, so pubs that don't want
-- the extra step are unaffected.
--
-- Idempotent. Run after 0001. Run in the Supabase SQL editor.
-- ============================================================================

begin;

-- Opt-in toggle.
alter table public.pubs
  add column if not exists require_checkin_approval boolean not null default false;

-- Check-in requests + their approval state.
create table if not exists public.table_checkins (
  id         uuid primary key default gen_random_uuid(),
  pub_id     uuid not null references public.pubs(id) on delete cascade,
  table_id   uuid not null references public.tables(id) on delete cascade,
  status     text not null default 'pending'
             check (status in ('pending', 'approved', 'rejected', 'expired')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists idx_table_checkins_pub_status
  on public.table_checkins(pub_id, status);

alter table public.table_checkins enable row level security;

-- Owners see + manage (approve/reject) their own pub's check-ins. No public
-- policy — customers reach status only through get_checkin_status() below.
drop policy if exists "Owners manage own checkins" on public.table_checkins;
create policy "Owners manage own checkins" on public.table_checkins
  for all using (
    pub_id in (select id from public.pubs where owner_id = auth.uid())
  );

-- Realtime so the dashboard sees new check-ins appear live.
alter table public.table_checkins replica identity full;
do $$ begin
  alter publication supabase_realtime add table public.table_checkins;
exception when duplicate_object then null; end $$;

-- ----------------------------------------------------------------------------
-- request_checkin(slug, qr_token) — called (anon) by /api/checkin.
--   * pub doesn't require approval  -> { requiresApproval: false, ... }
--   * pub requires approval         -> reuse a recent pending/approved row or
--                                      create one; return its id + status.
-- Wrong token => null (no enumeration), same as get_ordering_context.
-- ----------------------------------------------------------------------------
create or replace function public.request_checkin(p_slug text, p_qr_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_pub     public.pubs;
  v_table   public.tables;
  v_checkin public.table_checkins;
begin
  select * into v_pub from public.pubs where slug = p_slug;
  if not found then return null; end if;

  select * into v_table
    from public.tables
   where pub_id = v_pub.id and qr_token = p_qr_token;
  if not found then return null; end if;

  if not v_pub.require_checkin_approval then
    return jsonb_build_object(
      'requiresApproval', false,
      'pubId', v_pub.id,
      'tableId', v_table.id
    );
  end if;

  -- Reuse a recent, still-relevant request for this table; else create one.
  select * into v_checkin
    from public.table_checkins
   where table_id = v_table.id
     and status in ('pending', 'approved')
     and created_at > now() - interval '30 minutes'
   order by created_at desc
   limit 1;

  if not found then
    insert into public.table_checkins (pub_id, table_id)
      values (v_pub.id, v_table.id)
      returning * into v_checkin;
  end if;

  return jsonb_build_object(
    'requiresApproval', true,
    'pubId', v_pub.id,
    'tableId', v_table.id,
    'checkinId', v_checkin.id,
    'status', v_checkin.status
  );
end;
$$;
revoke all on function public.request_checkin(text, text) from public;
grant execute on function public.request_checkin(text, text) to anon, authenticated;

-- ----------------------------------------------------------------------------
-- get_checkin_status(checkin_id) — customer polls this until approved/rejected.
-- Returns just the status string (or null if the id is unknown).
-- ----------------------------------------------------------------------------
create or replace function public.get_checkin_status(p_checkin_id uuid)
returns text
language sql
security definer
set search_path = public, pg_temp
as $$
  select status from public.table_checkins where id = p_checkin_id
$$;
revoke all on function public.get_checkin_status(uuid) from public;
grant execute on function public.get_checkin_status(uuid) to anon, authenticated;

commit;
