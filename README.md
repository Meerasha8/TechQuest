# TechQuest 🚀

> **A gamified AI learning app for senior citizens aged 60–85**
> Built for GenLink (501c3 nonprofit, Austin TX) · Deployed at senior centers in Cedar Park, TX

---

## What Is TechQuest?

TechQuest teaches seniors how to use modern AI tools — ChatGPT, Google Lens, Google Maps, Google Translate, Gemini, and Claude — through short, guided quests. Each quest has three steps (Watch, Try, Share), earns XP, and unlocks the next tool. The experience is gamified, community-driven, and designed to be accessible and jargon-free.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (Expo SDK 54) |
| Navigation | React Navigation v7 (Stack + Bottom Tabs) |
| Database | Supabase (PostgreSQL + Realtime) |
| AI | Groq API (`llama-3.1-8b-instant`, `llama-3.3-70b-versatile`) |
| Fonts | Nunito, Source Sans 3, Space Mono (Google Fonts via Expo) |
| Styling | React Native StyleSheet (Warm Retro-Futurism theme) |

---

## Prerequisites

- Node.js 18+
- Expo Go app on your phone (iOS or Android)
- A free [Groq API key](https://console.groq.com)
- A free [Supabase](https://supabase.com) project

---

## Setup

### 1. Clone & Install

```bash
cd GenLinkHacks/TechQuest
npm install
```

### 2. Add Your API Keys

**`services/groqService.js`** — replace the placeholder:
```js
const GROQ_API_KEY = 'gsk_your_key_here';
```

**`services/supabaseService.js`** — replace the placeholders:
```js
const SUPABASE_URL = 'https://your-project.supabase.co';
const SUPABASE_ANON_KEY = 'your-anon-key';
```

### 3. Set Up Supabase Tables

Create the following tables in your Supabase project (SQL Editor → New Query):

```sql
-- Users
create table users (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  xp integer default 0,
  level text default 'Beginner',
  created_at timestamptz default now()
);

-- Quests (seed these manually or via CSV)
create table quests (
  id text primary key,
  name text not null,
  subtitle text,
  icon text,
  icon_bg text,
  xp integer default 100,
  estimated_time text,
  order_index integer
);

-- Quest Progress
create table quest_progress (
  user_id uuid references users(id),
  quest_id text references quests(id),
  watch_done boolean default false,
  try_done boolean default false,
  share_done boolean default false,
  completed boolean default false,
  completed_at timestamptz,
  primary key (user_id, quest_id)
);

-- Showcase Posts
create table showcase_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  author_name text,
  author_level text,
  tool text,
  text text,
  likes integer default 0,
  created_at timestamptz default now()
);

-- Post Likes
create table post_likes (
  user_id uuid references users(id),
  post_id uuid references showcase_posts(id),
  primary key (user_id, post_id)
);

-- Leaderboard (reads from users table)

-- Scam Reports
create table scam_reports (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id),
  input_text text,
  verdict text,
  explanation text,
  risk_level text,
  created_at timestamptz default now()
);

-- News Articles
create table news_articles (
  id uuid primary key default gen_random_uuid(),
  category text,
  headline text,
  summary text,
  why_it_matters text,
  read_time text,
  created_at timestamptz default now()
);
```

Enable **public RLS policies** on all tables (or disable RLS for hackathon use):
```sql
-- Quick disable for hackathon (re-enable + add policies for production)
alter table users disable row level security;
alter table quests disable row level security;
alter table quest_progress disable row level security;
alter table showcase_posts disable row level security;
alter table post_likes disable row level security;
alter table scam_reports disable row level security;
alter table news_articles disable row level security;
```

Seed the `quests` table:
```sql
insert into quests (id, name, subtitle, icon, icon_bg, xp, estimated_time, order_index) values
  ('claude',           'Claude AI',         'AI Writing & Thinking',       '🤖', '#7B5EA7', 200, '~12 min', 1),
  ('chatgpt',          'ChatGPT',           'AI Writing Assistant',        '💬', '#10A37F', 150, '~10 min', 2),
  ('google-lens',      'Google Lens',       'See the World Differently',   '🔍', '#4285F4', 120, '~8 min',  3),
  ('google-translate', 'Google Translate',  'Break Language Barriers',     '🌐', '#34A853', 130, '~9 min',  4),
  ('google-maps',      'Google Maps',       'Never Get Lost Again',        '🗺️', '#EA4335', 110, '~7 min',  5),
  ('gemini',           'Gemini',            'Google''s AI Assistant',      '✨', '#8E6CF3', 175, '~11 min', 6);
```

### 4. Enable Realtime

In Supabase Dashboard → Database → Replication → enable realtime for `users` and `showcase_posts` tables.

### 5. Run

```bash
npx expo start
```

Scan the QR code with Expo Go.

---

## Project Structure

```
TechQuest/
├── App.js                          Root navigator + font loading
├── constants/theme.js              Colors, fonts, spacing, radius
├── context/AppContext.jsx          Global state (Supabase-backed)
├── data/quests.js                  Local fallback quest data
├── services/
│   ├── supabaseService.js          All database functions + realtime
│   ├── groqService.js              AI functions (guide, news, scam)
│   └── claudeService.js           Re-export shim (legacy compat)
├── components/
│   ├── QuestCard.jsx               Quest list card (3 states)
│   ├── CompletionModal.jsx         XP celebration overlay
│   └── TypingIndicator.jsx         AI typing animation (3 dots)
└── screens/
    ├── OnboardingScreen.jsx        Name entry (first launch only)
    ├── HomeScreen.jsx              Quest map + XP bar
    ├── QuestDetailScreen.jsx       Step-by-step mission flow
    ├── ShowcaseScreen.jsx          Community feed + likes
    ├── LeaderboardScreen.jsx       XP rankings (realtime)
    ├── NewsScreen.jsx              AI-generated tech news
    ├── GuideScreen.jsx             AI chat assistant
    └── ScamDetectorScreen.jsx      Message scam checker
```

---

## License

Built with ❤️ for GenLink and the senior community of Cedar Park, TX.
