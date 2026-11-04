-- Ya aplicada por separado en el proyecto PBK; conservar sólo como registro de cambios.
create table if not exists public.blackcat_ai_events (
 message_id text primary key,
 sender_digest text not null check (length(sender_digest)=64),
 status text not null default 'processing' check (status in ('processing','replied','human','ignored','error')),
 created_at timestamptz not null default now(),
 processed_at timestamptz
);
alter table public.blackcat_ai_events enable row level security;
revoke all on public.blackcat_ai_events from anon, authenticated;
create index if not exists blackcat_ai_events_created_at_idx on public.blackcat_ai_events(created_at desc);
create table if not exists public.blackcat_ai_handoffs (
 sender_digest text primary key check (length(sender_digest)=64),
 needs_human boolean not null default true,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
alter table public.blackcat_ai_handoffs enable row level security;
revoke all on public.blackcat_ai_handoffs from anon, authenticated;
