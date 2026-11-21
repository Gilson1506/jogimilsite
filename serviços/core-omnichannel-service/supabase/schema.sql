-- ============================================================================
-- JOGIMIL - Tecnologias, Lda.
-- Schema Completo PostgreSQL / Supabase (Portal + Admin + Omnicanal + CRM)
-- Execute este script no SQL Editor do seu projeto Supabase.
-- ============================================================================

create extension if not exists "pgcrypto";

-- Função auxiliar para atualizar updated_at automaticamente
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- 1. FORMULÁRIOS DO PORTAL (Submissões)
-- ============================================================================
create table if not exists public.form_submissions (
  id text primary key,
  form_type text not null default 'contacto',
  form_title text not null default 'Formulário do Portal',
  client_name text,
  client_email text,
  client_phone text,
  source text,
  status text not null default 'RECEIVED',
  correlation_id text,
  data jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_form_submissions_created_at on public.form_submissions (created_at desc);
create index if not exists idx_form_submissions_form_type on public.form_submissions (form_type);
create index if not exists idx_form_submissions_email on public.form_submissions (client_email);

drop trigger if exists trg_form_submissions_updated on public.form_submissions;
create trigger trg_form_submissions_updated
before update on public.form_submissions
for each row execute function public.set_updated_at();

-- ============================================================================
-- 2. MONITORAMENTO DE VISITAS DO PORTAL (Analytics)
-- ============================================================================
create table if not exists public.portal_visits (
  id text primary key,
  page text not null default 'inicio',
  route_id text,
  path text not null default '#/inicio',
  title text,
  visitor_id text not null,
  session_id text not null,
  device text not null default 'Desktop',
  source text not null default 'Direto',
  referrer text,
  screen text,
  language text default 'pt-AO',
  ip_hash text,
  visited_at timestamptz not null default now()
);

create index if not exists idx_portal_visits_visited_at on public.portal_visits (visited_at desc);
create index if not exists idx_portal_visits_visitor_id on public.portal_visits (visitor_id);
create index if not exists idx_portal_visits_session_id on public.portal_visits (session_id);
create index if not exists idx_portal_visits_page on public.portal_visits (page);

-- ============================================================================
-- 3. CRM · CONTACTOS & LEADS + HISTÓRICO DE INTERAÇÕES
-- ============================================================================
create table if not exists public.contacts (
  id text primary key,
  name text not null,
  email text default '',
  phone text default '',
  company text default '',
  role text default '',
  stage text not null default 'novo',
  status text not null default 'novo',
  interaction_status text not null default 'sem_contacto',
  priority text not null default 'media',
  tags text[] not null default '{}',
  owner text default '',
  notes text default '',
  next_follow_up date,
  source text not null default 'Painel Admin',
  last_interaction_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_contacts_email on public.contacts (lower(email));
create index if not exists idx_contacts_phone on public.contacts (phone);
create index if not exists idx_contacts_stage on public.contacts (stage);
create index if not exists idx_contacts_interaction_status on public.contacts (interaction_status);
create index if not exists idx_contacts_created_at on public.contacts (created_at desc);

drop trigger if exists trg_contacts_updated on public.contacts;
create trigger trg_contacts_updated
before update on public.contacts
for each row execute function public.set_updated_at();

create table if not exists public.contact_interactions (
  id text primary key,
  contact_id text not null references public.contacts(id) on delete cascade,
  channel text not null default 'whatsapp',
  direction text not null default 'outbound',
  type text default 'nota',
  outcome text default '',
  content text not null,
  author text default 'Equipa JOGIMIL',
  created_at timestamptz not null default now()
);

create index if not exists idx_contact_interactions_contact on public.contact_interactions (contact_id, created_at asc);

-- ============================================================================
-- 4. CENTRAL DE ATENDIMENTO (Suporte Omnicanal)
-- ============================================================================
create table if not exists public.support_tickets (
  id text primary key,
  client_name text not null,
  client_contact text default '',
  client_email text default '',
  channel text not null default 'whatsapp',
  subject text not null default 'Atendimento JOGIMIL',
  status text not null default 'aberto',
  priority text not null default 'normal',
  submission_id text references public.form_submissions(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_status on public.support_tickets (status);
create index if not exists idx_support_tickets_updated_at on public.support_tickets (updated_at desc);

drop trigger if exists trg_support_tickets_updated on public.support_tickets;
create trigger trg_support_tickets_updated
before update on public.support_tickets
for each row execute function public.set_updated_at();

create table if not exists public.support_messages (
  id text primary key,
  ticket_id text not null references public.support_tickets(id) on delete cascade,
  sender text not null default 'agent',
  channel text not null default 'whatsapp',
  subject text,
  content text not null default '',
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_support_messages_ticket on public.support_messages (ticket_id, created_at asc);

-- ============================================================================
-- 5. DISPAROS EM MASSA (WhatsApp, Email, SMS)
-- ============================================================================
create table if not exists public.broadcasts (
  id text primary key,
  title text not null,
  channels text[] not null default '{}',
  audience text default 'Todos',
  total_recipients integer not null default 0,
  sent_count integer not null default 0,
  delivered_count integer not null default 0,
  failed_count integer not null default 0,
  subject text default '',
  message text not null,
  status text not null default 'completed',
  created_at timestamptz not null default now()
);

create index if not exists idx_broadcasts_created_at on public.broadcasts (created_at desc);

-- ============================================================================
-- 6. CONTEÚDO DO WEBSITE (Notícias, Equipa, Portfólio)
-- ============================================================================
create table if not exists public.news_posts (
  slug text primary key,
  title text not null,
  category text default 'Tecnologia',
  date text,
  excerpt text default '',
  content text default '',
  image text default '',
  author text default 'Equipa JOGIMIL',
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_news_posts_created_at on public.news_posts (created_at desc);

drop trigger if exists trg_news_posts_updated on public.news_posts;
create trigger trg_news_posts_updated
before update on public.news_posts
for each row execute function public.set_updated_at();

create table if not exists public.team_members (
  id text primary key,
  name text not null,
  role text not null,
  department text default 'Engenharia',
  bio text default '',
  photo text default '',
  email text default '',
  linkedin text default '',
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.portfolio_items (
  slug text primary key,
  title text not null,
  client text default '',
  category text default 'Software',
  description text default '',
  image text default '',
  metrics text default '',
  tags text[] not null default '{}',
  link text default '',
  created_at timestamptz not null default now()
);

-- ============================================================================
-- 7. LEMBRETES & DEFINIÇÕES DO SISTEMA
-- ============================================================================
create table if not exists public.reminders (
  id text primary key,
  title text not null,
  description text default '',
  due_date timestamptz,
  notify_phone text default '',
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists public.system_settings (
  id text primary key default 'default',
  config jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

insert into public.system_settings (id, config)
values ('default', '{}'::jsonb)
on conflict (id) do nothing;

-- ============================================================================
-- 8. ROW LEVEL SECURITY (RLS)
-- O backend usa SUPABASE_SERVICE_ROLE_KEY (ignora RLS com segurança no servidor).
-- Conteúdo editorial público (notícias, equipa, portfólio) pode ser lido publicamente.
-- ============================================================================
alter table public.form_submissions enable row level security;
alter table public.portal_visits enable row level security;
alter table public.contacts enable row level security;
alter table public.contact_interactions enable row level security;
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;
alter table public.broadcasts enable row level security;
alter table public.news_posts enable row level security;
alter table public.team_members enable row level security;
alter table public.portfolio_items enable row level security;
alter table public.reminders enable row level security;
alter table public.system_settings enable row level security;

drop policy if exists "Public read news_posts" on public.news_posts;
create policy "Public read news_posts" on public.news_posts
  for select using (published = true);

drop policy if exists "Public read team_members" on public.team_members;
create policy "Public read team_members" on public.team_members
  for select using (true);

drop policy if exists "Public read portfolio_items" on public.portfolio_items;
create policy "Public read portfolio_items" on public.portfolio_items
  for select using (true);


-- ============================================================================
-- 9. CALENDÁRIO CORPORATIVO, TAREFAS & PROCESSOS, E ARQUIVOS DIGITAIS
-- ============================================================================
create table if not exists public.calendar_events (
  id text primary key,
  title text not null,
  description text default '',
  type text not null default 'reuniao',
  status text not null default 'agendado',
  priority text not null default 'media',
  start_at timestamptz not null,
  end_at timestamptz,
  all_day boolean not null default false,
  location text default '',
  contact_id text references public.contacts(id) on delete set null,
  contact_name text default '',
  task_id text,
  owner text default 'Equipa JOGIMIL',
  source text not null default 'admin',
  caldav_uid text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_calendar_events_start_at on public.calendar_events (start_at asc);
create index if not exists idx_calendar_events_task_id on public.calendar_events (task_id);

drop trigger if exists trg_calendar_events_updated on public.calendar_events;
create trigger trg_calendar_events_updated
before update on public.calendar_events
for each row execute function public.set_updated_at();

create table if not exists public.tasks_processes (
  id text primary key,
  code text not null default 'PROC-001',
  title text not null,
  description text default '',
  category text not null default 'operacao',
  stage text not null default 'todo',
  priority text not null default 'media',
  assignee text default '',
  contact_id text references public.contacts(id) on delete set null,
  contact_name text default '',
  due_date timestamptz,
  calendar_event_id text,
  sync_to_calendar boolean not null default true,
  checklist jsonb not null default '[]'::jsonb,
  tags text[] not null default '{}',
  progress integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_tasks_processes_stage on public.tasks_processes (stage);
create index if not exists idx_tasks_processes_due_date on public.tasks_processes (due_date asc);

drop trigger if exists trg_tasks_processes_updated on public.tasks_processes;
create trigger trg_tasks_processes_updated
before update on public.tasks_processes
for each row execute function public.set_updated_at();

create table if not exists public.digital_files (
  id text primary key,
  name text not null,
  file_name text not null,
  category text not null default 'geral',
  file_type text not null default 'pdf',
  mime_type text not null default 'application/octet-stream',
  size integer not null default 0,
  description text default '',
  tags text[] not null default '{}',
  storage_path text default '',
  public_url text default '',
  data_url text default '',
  uploaded_by text default 'Equipa JOGIMIL',
  send_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_digital_files_type on public.digital_files (file_type);
create index if not exists idx_digital_files_category on public.digital_files (category);
create index if not exists idx_digital_files_created_at on public.digital_files (created_at desc);

drop trigger if exists trg_digital_files_updated on public.digital_files;
create trigger trg_digital_files_updated
before update on public.digital_files
for each row execute function public.set_updated_at();

alter table public.calendar_events enable row level security;
alter table public.tasks_processes enable row level security;
alter table public.digital_files enable row level security;
