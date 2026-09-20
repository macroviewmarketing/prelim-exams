# Prelim Exams — Design Spec

Date: 2026-09-20

## Purpose

A study site for prelim exam drills, starting with one subject (BES 423 —
Engineering Economy: simple/compound interest, markup, etc.) and built to grow
to more subjects over time. Drills are Leitner-box spaced-repetition practice:
each topic is a procedurally generated problem (random parameters each time,
not a fixed question bank), and the user's mastery of each topic (box level,
seen count, correct count, streak) is tracked.

Users should be able to create an account so their progress is saved and
follows them across devices. Logged-out use still works, backed by
`localStorage` only.

## Architecture

- **Framework**: Next.js (App Router), TypeScript.
- **Deployment**: Vercel, connected to the GitHub repo for auto-deploy on
  push to `main`.
- **Auth + DB**: Supabase (Postgres + Auth).

### Subject registry

Each subject is a self-contained module under `lib/subjects/<slug>.ts`
exporting:

```ts
export const subject = {
  id: 'bes423',
  title: 'BES 423 — Engineering Economy',
  topics: [
    { id: 'si_findF', generate: () => ({ prompt, answer, ... }) },
    { id: 'si_findRate', generate: () => (...) },
    // ...
  ],
};
```

A central registry (`lib/subjects/index.ts`) imports and lists all subject
modules. Adding a new subject later means adding one file + one registry
entry — the app shell, drill UI, and progress system are subject-agnostic.

The existing BES 423 generator functions (already written as pure JS
functions producing `{id, prompt, answer, ...}`) are ported into
`lib/subjects/bes423.ts` largely as-is.

### Drill UI

A single shared `<Drill subject={subjectId} />` component (problem card,
answer input, check button, box/mastery bar) is reused across every subject
page (`/subjects/[slug]`). It owns the Leitner scheduling logic (weighted
pick based on box level, same algorithm as the current artifact) and calls
into the active subject's topic generators.

### Progress state

Client-side state shape (mirrors what the current artifact already keeps in
`localStorage`):

```ts
type TopicProgress = { box: number; seen: number; ok: number; streak: number };
type SubjectState = { topics: Record<string, TopicProgress>; stats: {...}; last: string | null };
```

- **Logged out**: state lives only in `localStorage`, keyed per subject.
  No login wall — the drill fully works without an account.
- **Logged in**: on load, fetch `topic_progress` rows for the subject from
  Supabase and merge into local state (server wins on conflict, since it's
  the cross-device source of truth); on every graded answer, optimistically
  update local state immediately, then upsert the single changed row to
  Supabase in the background.

## Data model (Supabase / Postgres)

```sql
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table topic_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  subject_id text not null,
  topic_id text not null,
  box int not null default 1,
  seen int not null default 0,
  correct int not null default 0,
  streak int not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, subject_id, topic_id)
);

alter table profiles enable row level security;
alter table topic_progress enable row level security;

create policy "own profile" on profiles
  for all using (auth.uid() = id) with check (auth.uid() = id);

create policy "own progress" on topic_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

A `profiles` row is created for each new user via a Postgres trigger on
`auth.users` insert (standard Supabase pattern).

## Auth

- Supabase Auth, email + password.
- `/login` and `/signup` pages using `@supabase/ssr` for session handling
  in Next.js (server + client components).
- No email verification gate for v1 (can be turned on later in the Supabase
  dashboard without code changes).

## Deployment

1. `gh repo create prelim-exams --public --source=. --remote=origin` from
   the local project, initial commit pushed to `main`.
2. Supabase project created (or an existing one selected), migration above
   applied.
3. `vercel link` + `vercel env add` for `NEXT_PUBLIC_SUPABASE_URL` and
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, then `vercel --prod` (or auto-deploy via
   the Vercel GitHub integration once the repo exists).

## Out of scope for v1

- Email verification / password reset flows (Supabase defaults are fine
  to leave as-is for now).
- Any subject beyond BES 423 (structure supports it, content doesn't exist
  yet).
- Social login (Google, etc.) — email/password only per current decision.
- Admin/content-authoring UI for adding topics — new topics are added by
  editing a subject module directly.
