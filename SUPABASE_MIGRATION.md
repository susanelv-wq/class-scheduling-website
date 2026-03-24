# Supabase Migration Guide

This project now supports running the app directly against Supabase (no Express backend required for core flows).

## 1) Configure environment

Create `class-scheduling-website/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

## 2) Create DB schema + RLS

1. Open Supabase Dashboard -> SQL Editor.
2. Run `supabase/schema.sql`.

This creates:
- `users`
- `classes`
- `bookings`
- `payments`
- role/status enums
- RLS policies

## 3) Auth settings

In Supabase Dashboard -> Authentication -> Providers -> Email:
- Disable "Confirm email" for local/dev if you want instant signup/login behavior.

## 4) Role bootstrapping

After a user signs up, a row is inserted into `public.users` with default `STUDENT` role.

To make a teacher/admin:
- Update `public.users.role` in Supabase Table Editor.

## 5) Start frontend only

From `class-scheduling-website`:

```bash
npm run dev
```

You can keep `Back-end/` as a legacy folder, but frontend calls now use Supabase directly through `lib/api.ts`.

## 6) Important limitations

- Admin "Create User" from browser is intentionally blocked for security.
- Use Supabase Auth dashboard to invite/create users.
- Deleting a user from UI removes profile row only, not `auth.users`.
