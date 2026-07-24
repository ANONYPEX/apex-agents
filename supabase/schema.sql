-- Esquema APEX: proyectos, agentes y logs de ejecución.
-- Pega este archivo completo en el SQL Editor de Supabase (Project > SQL Editor > New query).

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

create index if not exists agentes_proyecto_id_idx on agentes (proyecto_id);
create index if not exists logs_agente_id_idx on logs (agente_id);

-- RLS activado; sin políticas públicas. El backend usa la service role key,
-- que ignora RLS, así que estas tablas no quedan expuestas a clientes anónimos.
alter table proyectos enable row level security;
alter table agentes enable row level security;
alter table logs enable row level security;

-- Datos de ejemplo (opcional, borra este bloque si no lo quieres).
insert into proyectos (nombre, descripcion)
values ('APEX', 'Proyecto por defecto para agentes de Gmail')
on conflict do nothing;

insert into agentes (proyecto_id, nombre, busqueda, label, activo)
select id, 'Newsletters', 'unsubscribe', 'Newsletters', true
from proyectos
where nombre = 'APEX'
on conflict do nothing;
