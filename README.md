# Shift3r — Waitlist Landing Page

Single-page marketing site for **Shift3r**, the mobile game where you scan
real cars with your phone to collect, battle, and trade them with friends.

Built with React + Vite + Tailwind v4. Plain, fast, and bold: dark carbon
background, nitro-orange accents, and a pure-SVG "car being scanned" hero —
no stock photos.

## Run it

```bash
cd "Shift3r landing"
npm install
npm run dev        # → http://localhost:5174
```

Production build:

```bash
npm run build
npm run preview
```

## How signups work

The form calls a Supabase **RPC function** (`join_waitlist`) using the public
anon key. The function inserts the email into the `waitlist` table and returns
the user's position number — all server-side, so the email list is never
readable by anonymous clients.

### One-time Supabase setup

1. Open your Supabase dashboard → SQL Editor → New query.
2. Run the contents of `migration_waitlist.sql` (also kept in the Shift3r
   project at `supabase/migrations/00002_waitlist.sql`).
3. Copy `.env.example` → `.env` and fill in your project URL + anon key.

## Stack

- React 19, Vite 7, Tailwind CSS v4
- `@supabase/supabase-js` (anon-key client, RPC only)
