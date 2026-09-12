# Commons — a social media platform

A full-stack social platform: user profiles, posts with optional media, a single
reverse-chronological feed, likes, threaded replies, and follows. Reading is
public; posting and interacting require an account.

**Live demo:** <https://social-media-platform-green-ve.vercel.app>
**Demo account:** `ada` / `commons123` — every seeded user shares that password.

---

## Screenshots

| The feed, signed out | Signed in, composing |
| -------------------- | -------------------- |
| ![The feed as an anonymous reader](docs/screenshots/01-feed-signed-out.png) | ![The feed with the composer open](docs/screenshots/03-feed-signed-in.png) |

| Replies open inline | A profile |
| ------------------- | --------- |
| ![Two threads expanded under their posts](docs/screenshots/04-replies.png) | ![Mira's profile with counts and posts](docs/screenshots/05-profile.png) |

| Sign in | Edit profile | Mobile |
| ------- | ------------ | ------ |
| ![The sign-in form with the demo account](docs/screenshots/02-sign-in.png) | ![The profile editor](docs/screenshots/06-edit-profile.png) | ![The feed at 390px wide](docs/screenshots/07-mobile-feed.png) |

## Contents

- [Stack](#stack)
- [Features](#features)
- [Entity schema](#entity-schema)
- [API reference](#api-reference)
- [Running it locally](#running-it-locally)
- [Deploying to Vercel](#deploying-to-vercel)
- [Sample dataset](#sample-dataset)
- [Project layout](#project-layout)
- [Design notes](#design-notes)

---

## Stack

| Layer      | Choice                                                        |
| ---------- | ------------------------------------------------------------- |
| Framework  | Next.js 15 (App Router, React 19, TypeScript)                 |
| Database   | PostgreSQL via Prisma 6                                        |
| Auth       | JWT (`jose`, HS256) in an httpOnly cookie; bcrypt password hashing |
| Validation | Zod, shared between routes                                     |
| Styling    | Tailwind CSS v4 with a custom token theme                      |
| Hosting    | Vercel (serverless) + Neon/Vercel Postgres                     |

## Features

- **Accounts** — register, sign in, sign out. Passwords are bcrypt-hashed
  (cost 10) and never leave the server. The session is a signed JWT in an
  httpOnly, `SameSite=Lax` cookie, `Secure` in production, expiring after 7 days.
- **Profiles** — public profile at `/u/:username` with avatar, display name,
  bio, join date, and post/follower/following counts. Owners edit their own at
  `/settings`.
- **Posts** — text up to 500 characters and/or a media URL (image or video). A
  post needs at least one of the two. Authors can delete their own posts.
- **Feed** — one shared timeline at `/`, strictly newest first, indexed on
  `createdAt DESC`. Readable signed out.
- **Likes** — one like per user per post, enforced by a unique constraint. The
  endpoints are idempotent, so a double-tap can't create duplicates. The UI
  updates optimistically and reconciles against the server's count.
- **Comments** — threaded replies under each post, loaded on demand.
- **Follows** — follow and unfollow other users from their profile.
- **Auth gating** — every mutating endpoint returns `401` without a valid
  session, and the UI routes signed-out users to `/login` instead of failing
  silently.

## Entity schema

Five tables. Source of truth: [`prisma/schema.prisma`](prisma/schema.prisma).

```
┌───────────────┐         ┌───────────────┐
│     User      │────1:N──│     Post      │
└───────────────┘         └───────────────┘
   │   │   │  │                │      │
   │   │   │  └──1:N───────────┘      │
   │   │   │      (likes)             │
   │   │   └─────1:N──────────────────┘
   │   │          (comments)
   │   └─────────M:N (self, via Follow)
   └─────────────────────────────────────
```

### `User`

| Field          | Type       | Notes                                    |
| -------------- | ---------- | ---------------------------------------- |
| `id`           | `String`   | PK, cuid                                 |
| `username`     | `String`   | **unique**, lowercase, 3–20 chars, indexed |
| `email`        | `String`   | **unique**, lowercase                    |
| `passwordHash` | `String`   | bcrypt, cost 10 — never returned by the API |
| `displayName`  | `String`   | 1–50 chars                               |
| `bio`          | `String?`  | up to 280 chars                          |
| `avatarUrl`    | `String?`  | falls back to a generated monogram       |
| `createdAt`    | `DateTime` | default `now()`                          |
| `updatedAt`    | `DateTime` | auto                                     |

Relations: `posts`, `likes`, `comments`, `following`, `followers`.

### `Post`

| Field       | Type         | Notes                                 |
| ----------- | ------------ | ------------------------------------- |
| `id`        | `String`     | PK, cuid                              |
| `content`   | `Text`       | up to 500 chars; may be empty if media present |
| `mediaUrl`  | `String?`    | absolute URL to an image or video     |
| `mediaType` | `MediaType?` | `IMAGE` \| `VIDEO`                    |
| `authorId`  | `String`     | FK → `User.id`, cascade delete        |
| `createdAt` | `DateTime`   | **indexed descending** — powers the feed |
| `updatedAt` | `DateTime`   | auto                                  |

### `Like`

| Field       | Type       | Notes                          |
| ----------- | ---------- | ------------------------------ |
| `id`        | `String`   | PK, cuid                       |
| `userId`    | `String`   | FK → `User.id`, cascade        |
| `postId`    | `String`   | FK → `Post.id`, cascade, indexed |
| `createdAt` | `DateTime` | default `now()`                |

`@@unique([userId, postId])` — a user can like a post at most once.

### `Comment`

| Field       | Type       | Notes                             |
| ----------- | ---------- | --------------------------------- |
| `id`        | `String`   | PK, cuid                          |
| `body`      | `Text`     | 1–300 chars                       |
| `userId`    | `String`   | FK → `User.id`, cascade           |
| `postId`    | `String`   | FK → `Post.id`, cascade           |
| `createdAt` | `DateTime` | `@@index([postId, createdAt])`    |

### `Follow`

| Field         | Type       | Notes                              |
| ------------- | ---------- | ---------------------------------- |
| `id`          | `String`   | PK, cuid                           |
| `followerId`  | `String`   | FK → `User.id`, cascade            |
| `followingId` | `String`   | FK → `User.id`, cascade, indexed   |
| `createdAt`   | `DateTime` | default `now()`                    |

`@@unique([followerId, followingId])` — one follow edge per pair.

## API reference

All endpoints accept and return JSON. Errors come back as
`{ "error": "message" }`, plus `{ "errors": { "field": "message" } }` for
validation failures (`422`).

Auth is a `session` cookie, set by register/login. Endpoints marked **auth**
return `401` without it.

### Authentication

| Method | Path                 | Auth | Body                                          | Returns |
| ------ | -------------------- | :--: | --------------------------------------------- | ------- |
| `POST` | `/api/auth/register` |  –   | `username`, `email`, `password`, `displayName` | `201 { user }`, sets cookie |
| `POST` | `/api/auth/login`    |  –   | `identifier` (username or email), `password`   | `200 { user }`, sets cookie |
| `POST` | `/api/auth/logout`   |  –   | –                                              | `200 { success }`, clears cookie |
| `GET`  | `/api/auth/me`       |  –   | –                                              | `200 { user }` or `{ user: null }` |

### Posts

| Method   | Path              | Auth | Body / Query                              | Returns |
| -------- | ----------------- | :--: | ----------------------------------------- | ------- |
| `GET`    | `/api/posts`      |  –   | `?limit` (≤50) `?cursor` `?author`        | `200 { posts[], nextCursor }` |
| `POST`   | `/api/posts`      |  ✔   | `content`, `mediaUrl?`, `mediaType?`      | `201 { post }` |
| `GET`    | `/api/posts/:id`  |  –   | –                                         | `200 { post, comments[] }` |
| `DELETE` | `/api/posts/:id`  |  ✔   | – (author only, else `403`)               | `200 { success }` |

Feed items are ordered `createdAt DESC`. When a session is present, each post
carries `likedByMe`.

### Likes

| Method   | Path                    | Auth | Returns |
| -------- | ----------------------- | :--: | ------- |
| `POST`   | `/api/posts/:id/like`   |  ✔   | `200 { liked: true, likeCount }` |
| `DELETE` | `/api/posts/:id/like`   |  ✔   | `200 { liked: false, likeCount }` |

Both are idempotent.

### Comments

| Method | Path                       | Auth | Body   | Returns |
| ------ | -------------------------- | :--: | ------ | ------- |
| `GET`  | `/api/posts/:id/comments`  |  –   | –      | `200 { comments[] }` (oldest first) |
| `POST` | `/api/posts/:id/comments`  |  ✔   | `body` | `201 { comment, commentCount }` |

### Users

| Method   | Path                            | Auth | Body                                 | Returns |
| -------- | ------------------------------- | :--: | ------------------------------------ | ------- |
| `GET`    | `/api/users/:username`          |  –   | –                                    | `200 { user, posts[] }` |
| `PATCH`  | `/api/users/me`                 |  ✔   | `displayName?`, `bio?`, `avatarUrl?` | `200 { user }` |
| `POST`   | `/api/users/:username/follow`   |  ✔   | –                                    | `200 { following: true, followerCount }` |
| `DELETE` | `/api/users/:username/follow`   |  ✔   | –                                    | `200 { following: false, followerCount }` |

### Example

```bash
# Sign in and keep the session cookie
curl -c jar.txt -X POST http://localhost:3000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"identifier":"ada","password":"commons123"}'

# Post
curl -b jar.txt -X POST http://localhost:3000/api/posts \
  -H 'Content-Type: application/json' \
  -d '{"content":"Hello from curl"}'

# Read the feed
curl http://localhost:3000/api/posts
```

## Running it locally

**Prerequisites:** Node 18.18+ and a PostgreSQL database. A free
[Neon](https://neon.tech) project works and takes about a minute to create.

```bash
git clone https://github.com/SNischayPrasad/social-media-platform.git
cd social-media-platform
npm install
```

Create `.env` from the template:

```bash
cp .env.example .env
```

Fill in both values:

```ini
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
JWT_SECRET="a-long-random-string"
```

Generate a secret with `openssl rand -base64 32`, or on Windows:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Max 256 }))
```

Create the tables and load the sample data:

```bash
npm run db:push
npm run db:seed
```

Start it:

```bash
npm run dev
```

Open <http://localhost:3000> and sign in as `ada` / `commons123`.

Other scripts: `npm run db:studio` opens Prisma Studio, `npm run build`
produces a production build.

### Smoke test

`scripts/smoke-test.mjs` exercises every endpoint against a running server —
auth gating, validation, idempotent likes, comment ordering, ownership checks,
and page rendering. With the dev server up and the database freshly seeded:

```bash
npm run smoke
```

It prints one line per assertion and exits non-zero on any failure.

## Deploying to Vercel

The project is linked to this repository, so every push to `main` redeploys
automatically. To stand up a fresh copy:

1. Import the repo at [vercel.com/new](https://vercel.com/new).
2. Add a Postgres database — **Storage → Create Database → Neon** sets
   `DATABASE_URL` for you. Set the variable prefix to `DATABASE` so the
   integration writes `DATABASE_URL` rather than `STORAGE_URL`. Any Postgres
   provider works.
3. Add `JWT_SECRET` under **Settings → Environment Variables** (all
   environments). Generate one with `openssl rand -base64 32`.
4. Deploy.

There is no manual migration step. The build runs
[`prisma/provision.mjs`](prisma/provision.mjs), which pushes the schema and —
only when the users table is empty — loads the sample dataset. Redeploys leave
visitor-written posts alone, and a build without `DATABASE_URL` skips
provisioning instead of failing. When the host offers a direct
`DATABASE_URL_UNPOOLED` alongside the pooled URL (Neon does), provisioning uses
it, since DDL and bulk writes need a connection that doesn't go through the
pooler.

`JWT_SECRET` is required at runtime — sign-in fails without it.

## Sample dataset

`prisma/seed.ts` creates a small but plausible square:

- **8 users** with bios and avatars
- **24 posts** spread across the past two weeks, 9 of them with media
- **18 comments** threaded under posts
- **~90 likes**, weighted so older posts have accumulated more
- **27 follow** relationships

Every account uses the password `commons123`. The seed clears the tables it
owns first, so it is safe to re-run. On a deploy host it runs automatically on
the first build only — see [Deploying to Vercel](#deploying-to-vercel).

## Project layout

```
prisma/
  schema.prisma        Five models: User, Post, Like, Comment, Follow
  seed.ts              Sample dataset
  provision.mjs        Build-time schema push + first-run seed
src/
  app/
    page.tsx           The feed
    login/ register/   Auth pages
    settings/          Edit your profile
    u/[username]/      Public profile
    api/               Route handlers (see API reference)
  components/          Feed, Composer, PostCard, Avatar, forms
  lib/
    auth.ts            JWT sessions, password hashing
    prisma.ts          Pooled Prisma client
    posts.ts           Shared feed queries and serialization
    validators.ts      Zod schemas
    api.ts             JSON response helpers
```

## Design notes

The interface is built around one idea: a single timeline in the order things
were said, with no ranking. A continuous vertical rule threads the avatars down
the feed so the timeline reads as one object rather than a stack of cards.

Colour is deliberately scarce — a deep aubergine ground, bone text, and a single
persimmon accent reserved for the act of responding: post, like, reply. Type
pairs Bricolage Grotesque for display with Instrument Sans for body and
JetBrains Mono for counts and timestamps, so numbers stay aligned as they change.

Accessibility floor: visible focus rings throughout, `aria-pressed` on the like
toggle, `aria-expanded` on replies, labelled form fields with error messages
wired via `aria-describedby`, and full `prefers-reduced-motion` support.

## License

MIT
