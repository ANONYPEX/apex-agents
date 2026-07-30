-- Esquema APEX: proyectos, agentes, logs y tokens de OAuth.
-- Este archivo es documentación del esquema; ya está aplicado en Supabase.

create extension if not exists "pgcrypto";

create table if not exists proyectos (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  descripcion text,
  created_at timestamptz not null default now()
);

create table if not exists agentes (
  id uuid primary key default gen_random_uuid(),
  proyecto_id uuid not null references proyectos (id) on delete cascade,
  nombre text not null,
  busqueda text not null,
  label text not null,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists logs (
  id uuid primary key default gen_random_uuid(),
  agente_id uuid not null references agentes (id) on delete cascade,
  "timestamp" timestamptz not null default now(),
  status text not null check (status in ('success', 'error')),
  detalles jsonb
);

create table if not exists oauth_tokens (
  id uuid primary key default gen_random_uuid(),
  provider text not null,
  account text not null default 'default',
  access_token text,
  refresh_token text,
  scope text,
  token_type text,
  expiry_date bigint,
  updated_at timestamptz not null default now(),
  unique (provider, account)
);

create index if not exists agentes_proyecto_id_idx on agentes (proyecto_id);
create index if not exists logs_agente_id_idx on logs (agente_id);

alter table proyectos enable row level security;
alter table agentes enable row level security;
alter table logs enable row level security;
alter table oauth_tokens enable row level security;
