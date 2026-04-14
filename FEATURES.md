# TechQuest — Features, Data Flow & AI Architecture

## Overview

TechQuest is a 6-screen gamified learning app. Every screen maps to a specific feature: quests, community, competition, news, AI chat, and scam protection.

---

## Screens & Features

### 1. 🏠 Quest Map (HomeScreen)

**What it does:**
- Displays all 6 AI tool quests as scrollable cards
- Shows a live XP progress bar and level name (Beginner → Explorer → Trailblazer → Pioneer → Legend)
- Each quest card has 3 states: Locked (gray), Active (pulsing gold border), Completed (mint checkmark)
- Quests unlock sequentially — completing one unlocks the next

**Data source:** `quests` table (Supabase) + `quest_progress` table merged by `buildQuestList()`

**How XP works:**
```
Level 1 "Beginner"    :   0 – 299 XP
Level 2 "Explorer"    : 300 – 699 XP
Level 3 "Trailblazer" : 700 – 1,199 XP
Level 4 "Pioneer"     : 1,200 – 1,999 XP
Level 5 "Legend"      : 2,000+ XP
```

---

### 2. 📋 Quest Detail (QuestDetailScreen)

**What it does:**
- Walks the user through 3 mission steps for each AI tool
- Steps are sequential and locked until the previous is done
- **Watch step** → opens YouTube search in browser, auto-marks done
- **Try step** → user pastes what the AI said back, then marks done
- **Share step** → user writes what they made, automatically posts to Showcase
- On completion: animated CompletionModal shows XP counter (counts up from 0) and optional level-up banner

**Data tracked:**
- Each step completion writes to `quest_progress` (columns: `watch_done`, `try_done`, `share_done`, `completed`, `completed_at`)
- On all 3 done: `completed = true`, XP added to user row via `updateUserXP()`

**AI role:** FAB button (bottom-right 🤖) navigates to the AI Guide for help mid-quest

---

### 3. 🌟 Showcase (ShowcaseScreen)

**What it does:**
- Community feed of what everyone has made using AI tools
- Filter by tool: All / ChatGPT / Claude / Google Lens
- Heart button likes/unlikes posts with live count
- FAB (+) opens a share modal to post directly from any screen
- New posts from other users appear instantly via Supabase Realtime

**Data source:** `showcase_posts` table (SELECT, sorted by `created_at` DESC, limit 50)
**Likes tracked:** `post_likes` table (user_id + post_id composite PK); like count stored in `showcase_posts.likes`
**Who can post:** Any registered user via the Share modal or after completing the Share step in a quest

---

### 4. 🏆 Leaderboard (LeaderboardScreen)

**What it does:**
- Shows top 20 users sorted by XP (highest first)
- Podium for top 3 (gold/silver/bronze borders)
- Current user row is highlighted in gold and labeled "(You)"
- Updates live as other users complete quests (Supabase Realtime subscription on `users` table)

**Data source:** `users` table (SELECT id, name, xp, level ORDER BY xp DESC LIMIT 20)
**Current user detection:** `lbUser.id === context.user.id` (Supabase UUID comparison)

---

### 5. 📰 News (NewsScreen)

**What it does:**
- Displays tech news articles written for seniors in plain English
- Each article has a "Why this matters to you" highlighted callout
- Pull-to-refresh generates a brand new article using AI and saves it to the database
- Shows shimmer skeleton cards while loading

**Data source:**
- On mount: loads from `news_articles` table (most recent 20)
- If table is empty: shows 4 hardcoded seed articles
- On pull-to-refresh: calls Groq AI → gets article → saves to `news_articles` → prepends to list

**AI role (Groq `llama-3.1-8b-instant`):**  
Generates one news article on each pull-to-refresh. Prompted to write in 3 simple sentences with one personal "why it matters" sentence. Output is JSON-parsed; on failure a hardcoded fallback is used.

---

### 6. 🤖 AI Guide (GuideScreen)

**What it does:**
- Full chat interface with the app's AI assistant
- Maintains multi-turn conversation history (each message builds on the previous)
- Suggestion chips shown on first open (e.g. "What is ChatGPT?", "Which tool helps me translate?")
- If AI mentions a quest tool name, an inline mini-card appears with a "Start Quest →" button
- 🔊 button reads the last AI reply aloud using expo-speech

**Data source:** No database — conversation is held in-memory (not persisted across sessions)

**AI role (Groq `llama-3.1-8b-instant`):**  
System prompt instructs it to: answer in ≤4 plain sentences, suggest relevant quests when tools are mentioned, end with a follow-up question. The full `conversationHistory` array is sent on each message for context continuity.

---

### 7. 🛡️ Scam Detector (ScamDetectorScreen)

**What it does:**
- User pastes any suspicious SMS/email/message into a text box
- AI analyzes it and returns a color-coded verdict
- **RED "THIS IS A SCAM"** — with warning signs list and what to do
- **ORANGE "BE CAREFUL"** — suspicious but not definitive
- **GREEN "LOOKS SAFE"** — appears safe
- All checks are saved to history (expandable rows showing verdict + preview)

**Data tracked:** `scam_reports` table (user_id, input_text, verdict, explanation, risk_level, created_at)

**AI role (Groq `llama-3.3-70b-versatile` — more powerful model):**  
Returns structured JSON with: `verdict`, `risk_level`, `explanation`, `warning_signs[]`, `what_to_do`. Uses the 70B model specifically because safety decisions require higher accuracy than casual chat. On JSON parse failure, a "SUSPICIOUS / MEDIUM" fallback is returned so the app never crashes on an invalid response.

---

## Data Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                     Supabase (PostgreSQL)                    │
│                                                              │
│  users              quest_progress       showcase_posts      │
│  ─────────         ─────────────────    ─────────────────   │
│  id (UUID)         user_id (FK)         id (UUID)           │
│  name              quest_id (FK)        user_id (FK)        │
│  xp                watch_done           author_name         │
│  level             try_done             author_level        │
│  created_at        share_done           tool                │
│                    completed            text                │
│                    completed_at         likes               │
│                                         created_at          │
│                                                              │
│  post_likes         scam_reports         news_articles       │
│  ──────────        ────────────         ─────────────────   │
│  user_id (FK)      user_id (FK)         id (UUID)           │
│  post_id (FK)      input_text           category            │
│                    verdict              headline            │
│                    explanation          summary             │
│                    risk_level           why_it_matters      │
│                    created_at           read_time           │
│                                         created_at          │
└──────────────────────────────────────────────────────────────┘
```

### How data flows on app start

```
App launches
    ↓
Check AsyncStorage for 'user_id'
    ├── Found → getUserById() → set user state
    └── Not found → show Onboarding
                        ↓
                    createUser() → save user.id to AsyncStorage
    ↓
getAllQuests() + getUserQuestProgress()
    ↓
buildQuestList() — merges quests + progress into display-ready array
    ↓
getShowcasePosts() + getUserLikes() + getLeaderboard()
    ↓
subscribeToLeaderboard() + subscribeToShowcase() (Realtime)
```

---

## AI Services Overview

| Function | Model | Trigger | Output |
|---|---|---|---|
| `sendGuideMessage()` | llama-3.1-8b-instant | User sends a chat message | Plain English reply (≤4 sentences) |
| `generateNewsArticle()` | llama-3.1-8b-instant | Pull-to-refresh on News screen | JSON article → saved to `news_articles` |
| `getQuestRecommendation()` | llama-3.1-8b-instant | Available for programmatic use | 2-sentence next-quest recommendation |
| `analyzeScam()` | llama-3.3-70b-versatile | "Check This Message" button | JSON verdict → saved to `scam_reports` |

All AI calls use **Groq API** (free, fast, no geo-restrictions). Provider: `https://api.groq.com/openai/v1/chat/completions`.

---

## State Management

All global state lives in `context/AppContext.jsx`. It is initialized once on mount and updated optimistically on user actions:

| State | Source | Updates when |
|---|---|---|
| `user` | `users` table | XP gained, first login |
| `quests` | `quests` + `quest_progress` tables | Step completed |
| `showcasePosts` | `showcase_posts` table | Post added, realtime insert |
| `userLikes` | `post_likes` table | Heart toggled |
| `leaderboard` | `users` table | Realtime on any user update |
| `scamHistory` | `scam_reports` table | After each analysis |

### Optimistic updates
`addShowcasePost` and `toggleLike` update the UI immediately without waiting for the DB, then replace the temp entry with the real DB row once it's saved.

---

## Accessibility Design

- Minimum **18px** body text throughout (seniors need readable type)
- All buttons minimum **56px** height (large touch targets)
- No jargon anywhere — "AI" tools described in plain English
- No login/password — just a name
- Leaderboard is noted as optional ("turn off in Settings")
- Text-to-speech on AI Guide (🔊 button reads last reply aloud)
