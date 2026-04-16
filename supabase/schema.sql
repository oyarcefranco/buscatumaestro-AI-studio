-- Tabla principal de instaladores (cargada desde CSV)
create table installers (
  id           uuid primary key default gen_random_uuid(),
  nombres      text not null,
  apellidos    text not null,
  rut          text not null unique,
  region       text not null,
  comuna       text not null,
  tipo_trabajo text[] not null default '{}', -- ['electricidad','gas']
  telefono     text,
  bio          text,
  fotos_urls   text[] default '{}',
  is_premium   boolean not null default false,
  is_verified  boolean not null default false,
  claimed_by   uuid references auth.users(id),
  claim_status text not null default 'unclaimed', -- unclaimed | pending | approved | rejected
  avg_rating   numeric(3,2) default null,
  review_count int default 0,
  created_at   timestamptz default now(),
  updated_at   timestamptz default now()
);

-- Reseñas de clientes (URL pública /r/:installerId)
create table reviews (
  id            uuid primary key default gen_random_uuid(),
  installer_id  uuid not null references installers(id) on delete cascade,
  stars         int not null check (stars between 1 and 5),
  comentario    text,
  reviewer_name text,
  ip_hash       text,
  created_at    timestamptz default now()
);

-- Solicitudes de claim (para tracking y auditoría)
create table claim_requests (
  id           uuid primary key default gen_random_uuid(),
  installer_id uuid not null references installers(id),
  user_id      uuid not null references auth.users(id),
  carnet_url   text not null,
  status       text not null default 'pending', -- pending | approved | rejected
  created_at   timestamptz default now()
);

-- Índices para búsqueda del Wizard
create index on installers (region, comuna);
CREATE INDEX ON installers USING gin (tipo_trabajo);
create index on installers (is_premium desc, avg_rating desc nulls last);

-- installers: lectura pública, edición solo por dueño del perfil
alter table installers enable row level security;
create policy "lectura publica" on installers for select using (true);
create policy "edicion propia" on installers for update using (auth.uid() = claimed_by);

-- reviews: lectura pública, inserción pública, sin edición
alter table reviews enable row level security;
create policy "lectura publica" on reviews for select using (true);
create policy "insercion publica" on reviews for insert with check (true);

-- claim_requests: solo el dueño lee y crea
alter table claim_requests enable row level security;
create policy "solo propio" on claim_requests for select using (auth.uid() = user_id);
create policy "insercion autenticada" on claim_requests for insert with check (auth.uid() = user_id);

-- Trigger to update avg_rating and review_count in installers
create or replace function update_installer_rating()
returns trigger as $$
begin
  update installers
  set avg_rating = (
    select round(avg(stars)::numeric, 2)
    from reviews
    where installer_id = new.installer_id
  ),
  review_count = (
    select count(*)
    from reviews
    where installer_id = new.installer_id
  )
  where id = new.installer_id;

  return new;
end;
$$ language plpgsql;

create trigger on_review_inserted
after insert on reviews
for each row execute function update_installer_rating();

