-- Phase 2: Database schema (Supabase / PostgreSQL)
-- Run in Supabase SQL editor when connecting backend

create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique not null,
  created_at timestamptz default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete cascade,
  state text not null,
  county text not null,
  status text not null default 'draft',
  has_children boolean not null default false,
  is_contested boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists interview_answers (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  question_key text not null,
  answer jsonb not null,
  unique(case_id, question_key)
);

create table if not exists forms (
  id uuid primary key default gen_random_uuid(),
  state text not null,
  county text,
  form_code text not null,
  form_name text not null,
  pdf_url text,
  version text,
  active boolean default true
);

create table if not exists form_requirements (
  id uuid primary key default gen_random_uuid(),
  county text,
  rule_json jsonb not null,
  required_form_codes text[] not null
);

create table if not exists generated_documents (
  id uuid primary key default gen_random_uuid(),
  case_id uuid references cases(id) on delete cascade,
  form_code text not null,
  pdf_path text not null,
  generated_at timestamptz default now()
);

create table if not exists county_procedures (
  id uuid primary key default gen_random_uuid(),
  county text not null,
  step_number int not null,
  title text not null,
  description text not null,
  url text
);

create index if not exists idx_cases_user_id on cases(user_id);
create index if not exists idx_interview_answers_case_id on interview_answers(case_id);
create index if not exists idx_generated_documents_case_id on generated_documents(case_id);
