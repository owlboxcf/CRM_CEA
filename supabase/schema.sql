-- ============================================================
-- CRM Corpo e Ação / Owl Box — schema completo para Supabase
-- Execute este arquivo inteiro no SQL Editor do seu projeto Supabase
-- (Painel do Supabase → SQL Editor → New query → cole tudo → Run)
-- ============================================================

create extension if not exists pgcrypto;

-- ------------------------------------------------------------
-- 1. PERFIS (liga cada login do Supabase Auth a um nome e papel)
-- ------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text not null,
  perfil text not null check (perfil in ('Vendedor', 'Gestor')),
  created_at timestamptz not null default now()
);

alter table public.perfis enable row level security;

create policy "perfis: qualquer logado pode ver todos"
  on public.perfis for select
  to authenticated
  using (true);

-- Cria automaticamente uma linha em perfis quando um novo usuário é
-- criado no Supabase Auth. Ao criar o usuário no painel, preencha o
-- campo "User Metadata" com algo como:
--   {"nome": "Bruna Souza", "perfil": "Vendedor"}
-- (veja o passo a passo no README.md)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, perfil)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome', new.email),
    coalesce(new.raw_user_meta_data->>'perfil', 'Vendedor')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Função auxiliar usada nas políticas de segurança abaixo
create or replace function public.is_gestor()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and perfil = 'Gestor'
  );
$$;

-- ------------------------------------------------------------
-- 2. PLANOS (regras de negócio: pontos e comissão por plano)
-- ------------------------------------------------------------
create table public.planos (
  id smallserial primary key,
  nome text not null unique,
  modalidade text not null,
  forma text not null,
  pontos numeric not null,
  comissao_base numeric not null
);

alter table public.planos enable row level security;

create policy "planos: qualquer logado pode ver"
  on public.planos for select
  to authenticated
  using (true);

insert into public.planos (nome, modalidade, forma, pontos, comissao_base) values
  ('BodyGym CC 12x', 'Musculação', 'Cartão 12x', 1, 30),
  ('BodyGym Recorrência', 'Musculação', 'Recorrência', 0.5, 15),
  ('BodyGym Boleto', 'Musculação', 'Boleto', 0.2, 5),
  ('BodyCross CC 12x', 'CrossFit', 'Cartão 12x', 1, 50),
  ('BodyCross Recorrência', 'CrossFit', 'Recorrência', 0.5, 25),
  ('BodyCross Boleto', 'CrossFit', 'Boleto', 0.2, 5);

-- ------------------------------------------------------------
-- 3. LEADS
-- ------------------------------------------------------------
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  contato text,
  canal text,
  turno text,
  status text not null default 'Novo',
  id_vendedor uuid not null references public.perfis(id),
  data_entrada timestamptz not null default now()
);

alter table public.leads enable row level security;

create policy "leads: ver os próprios ou todos se gestor"
  on public.leads for select
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

create policy "leads: criar para si ou, se gestor, para qualquer vendedor"
  on public.leads for insert
  to authenticated
  with check (is_gestor() or id_vendedor = auth.uid());

create policy "leads: atualizar os próprios ou todos se gestor"
  on public.leads for update
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

create policy "leads: excluir os próprios ou todos se gestor"
  on public.leads for delete
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

-- ------------------------------------------------------------
-- 4. ATIVIDADES (histórico de contato com o lead)
-- ------------------------------------------------------------
create table public.atividades (
  id uuid primary key default gen_random_uuid(),
  id_lead uuid not null references public.leads(id) on delete cascade,
  id_vendedor uuid not null references public.perfis(id),
  data timestamptz not null default now(),
  canal text,
  resultado text,
  proxima_acao text
);

alter table public.atividades enable row level security;

create policy "atividades: ver as próprias ou todas se gestor"
  on public.atividades for select
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

create policy "atividades: criar as próprias ou, se gestor, quaisquer"
  on public.atividades for insert
  to authenticated
  with check (is_gestor() or id_vendedor = auth.uid());

create policy "atividades: excluir as próprias ou todas se gestor"
  on public.atividades for delete
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

-- ------------------------------------------------------------
-- 5. VENDAS
-- pontos / comissao_vendedor / comissao_professor são calculados
-- pelo app no momento da venda e gravados aqui (não recalculados
-- depois), pra manter o histórico de comissão estável mesmo que as
-- regras em "planos" mudem no futuro.
-- ------------------------------------------------------------
create table public.vendas (
  id uuid primary key default gen_random_uuid(),
  id_lead uuid references public.leads(id) on delete set null,
  id_vendedor uuid not null references public.perfis(id),
  professor text,
  plano text not null references public.planos(nome),
  tipo_transacao text not null check (tipo_transacao in ('Nova', 'Renovação', 'Reativação')),
  turno text,
  valor_total numeric not null default 0,
  receita_recebida numeric not null default 0,
  venda_completa text not null default 'Completa' check (venda_completa in ('Completa', 'Incompleta')),
  pontos numeric not null default 0,
  comissao_vendedor numeric not null default 0,
  comissao_professor numeric not null default 0,
  data timestamptz not null default now()
);

alter table public.vendas enable row level security;

create policy "vendas: ver as próprias ou todas se gestor"
  on public.vendas for select
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

create policy "vendas: criar as próprias ou, se gestor, quaisquer"
  on public.vendas for insert
  to authenticated
  with check (is_gestor() or id_vendedor = auth.uid());

-- Função que devolve só pontos e total de vendas por vendedor (sem
-- comissão), pra alimentar o Ranking sem expor o ganho de ninguém
-- pros colegas. Quem é Gestor calcula a comissão direto no app, já
-- que tem acesso total à tabela "vendas".
create or replace function public.ranking_vendedores()
returns table (id uuid, nome text, pontos numeric, total_vendas bigint)
language sql
security definer
set search_path = public
stable
as $$
  select p.id, p.nome,
         coalesce(sum(v.pontos), 0) as pontos,
         count(v.id) as total_vendas
  from public.perfis p
  left join public.vendas v on v.id_vendedor = p.id
  where p.perfil = 'Vendedor'
  group by p.id, p.nome
  order by pontos desc;
$$;

grant execute on function public.ranking_vendedores() to authenticated;

-- ------------------------------------------------------------
-- 6. PONTO (registro de entrada/saída)
-- ------------------------------------------------------------
create table public.ponto_registros (
  id uuid primary key default gen_random_uuid(),
  id_vendedor uuid not null references public.perfis(id),
  tipo text not null check (tipo in ('Entrada', 'Saída')),
  data_hora timestamptz not null default now()
);

alter table public.ponto_registros enable row level security;

create policy "ponto: ver os próprios ou todos se gestor"
  on public.ponto_registros for select
  to authenticated
  using (is_gestor() or id_vendedor = auth.uid());

create policy "ponto: cada um só registra o próprio"
  on public.ponto_registros for insert
  to authenticated
  with check (id_vendedor = auth.uid());

-- ------------------------------------------------------------
-- 7. OPÇÕES CONFIGURÁVEIS (listas editáveis pelo Gestor: canais
-- de captação, canais de contato, resultados de atividade).
-- São só sugestões para os formulários — os campos canal/resultado
-- em leads/atividades continuam texto livre, sem FK pra aqui.
-- ------------------------------------------------------------
create table public.opcoes_configuraveis (
  id uuid primary key default gen_random_uuid(),
  tipo text not null check (tipo in ('canal_captacao', 'canal_contato', 'resultado')),
  valor text not null,
  ordem int not null default 0,
  created_at timestamptz not null default now(),
  unique (tipo, valor)
);

alter table public.opcoes_configuraveis enable row level security;

create policy "opcoes: qualquer logado pode ver"
  on public.opcoes_configuraveis for select
  to authenticated
  using (true);

create policy "opcoes: só gestor cria"
  on public.opcoes_configuraveis for insert
  to authenticated
  with check (is_gestor());

create policy "opcoes: só gestor atualiza"
  on public.opcoes_configuraveis for update
  to authenticated
  using (is_gestor());

create policy "opcoes: só gestor exclui"
  on public.opcoes_configuraveis for delete
  to authenticated
  using (is_gestor());

insert into public.opcoes_configuraveis (tipo, valor, ordem) values
  ('canal_captacao', 'Instagram', 1),
  ('canal_captacao', 'WhatsApp', 2),
  ('canal_captacao', 'Ligação', 3),
  ('canal_captacao', 'Folheto', 4),
  ('canal_captacao', 'Campanha', 5),
  ('canal_captacao', 'Indicação', 6),
  ('canal_contato', 'Ligação', 1),
  ('canal_contato', 'WhatsApp', 2),
  ('canal_contato', 'Visita presencial', 3),
  ('canal_contato', 'Instagram', 4),
  ('resultado', 'Sem Resposta', 1),
  ('resultado', 'Conversou', 2),
  ('resultado', 'Interessado', 3),
  ('resultado', 'Agendou Visita', 4),
  ('resultado', 'Visitou', 5),
  ('resultado', 'Não Tem Interesse', 6);

-- ============================================================
-- Fim do schema. Depois de rodar isso, crie os 4 usuários em
-- Authentication → Users (veja o passo a passo no README.md).
-- ============================================================
