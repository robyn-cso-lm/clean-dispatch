# CleanDispatch — Handoff

## What this is
A white-label cleaning marketplace for Hillsborough County / Apollo Beach / Manatee County, FL.
Clients get instant quotes online and pay by card. Cleaners get auto-assigned jobs and weekly payouts.
Robyn manages everything from the admin dashboard.

---

## Live URL
https://clean-dispatch-production.up.railway.app

Key pages:
- `/client/quote` — client books a clean
- `/cleaner/signup` — cleaner applies
- `/cleaner/dashboard` — cleaner sees their jobs
- `/admin/dashboard` — Robyn's overview (NO AUTH YET — do not share publicly)
- `/how-it-works` — marketing page

---

## Infrastructure
| Thing | Where |
|---|---|
| Code | https://github.com/robyn-cso-lm/clean-dispatch |
| Hosting | Railway — clean-dispatch service |
| Database | Railway — PostgreSQL service (internal URL) |
| Payments | Stripe (live keys configured) |
| Email | Microsoft Graph / Azure (NOT YET configured) |
| SMS | Quo (NOT YET configured) |

---

## Environment variables (set in Railway → Variables)
All values are in `C:\Users\robyn\clean-dispatch\.env.local` (never commit this file).
Required keys: DATABASE_URL, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET,
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY, NEXT_PUBLIC_APP_URL

---

## What's fully working
- [x] Quote calculator (`/client/quote`) — pricing formula live
- [x] All 8 API routes wired to the database (no more stubs)
- [x] Cleaner signup saves to DB + sends welcome email (once Azure is configured)
- [x] Job creation, assignment, accept/decline flow
- [x] Stripe payment intents created and saved
- [x] Stripe webhook — on payment success, auto-assigns a cleaner
- [x] Payment hold / overage approval flow
- [x] Admin dashboard (static UI, reads from DB indirectly via API)
- [x] Database live on Railway with all tables migrated

---

## What's NOT done yet (next session priorities)

### 1. Branding (cosmetic — next session)
App looks plain/white. Needs logo, color scheme, typography.
Suggested: green + charcoal, clean sans-serif. Can use `/anthropic-skills:canvas-design` skill.

### 2. Admin auth (IMPORTANT — before sharing admin URL)
`/admin/dashboard` has zero password protection. Anyone with the URL can see it.
Quick fix: add Vercel/Railway password protection, or add NextAuth with a single admin email.

### 3. Email (Azure not configured)
`lib/graphMail.ts` is ready. Just needs Azure credentials added to Railway Variables:
```
AZURE_TENANT_ID
AZURE_CLIENT_ID
AZURE_CLIENT_SECRET
MAIL_FROM = robyn@canadiansurrogacyoptions.com
```

### 4. SMS (Quo not configured)
`lib/notifications.ts` is ready. Needs:
```
QUO_API_URL
QUO_API_KEY
QUO_FROM_NUMBER
```

### 5. Client account / login
Right now clients book without an account. They can't log back in to see their jobs.
Need: NextAuth or Clerk, protect `/client/*` and `/cleaner/*` routes.

### 6. Cleaner approval flow
New cleaners sign up with `backgroundCheckStatus = 'pending'`.
Admin needs a way to flip this to `'approved'` in the dashboard (currently has to be done directly in DB).
Quick fix: add an Approve button to `/admin/dashboard`.

### 7. Manual first cleaner
To test end-to-end: go into Railway → your Postgres service → Data tab,
find the Cleaner table, and set `backgroundCheckStatus = 'approved'` on a test cleaner.
Auto-assignment only picks up approved cleaners.

### 8. Custom domain (optional)
Options: `cleaning.camica.ca` or `cleandispatch.ca`
Railway → Settings → Networking → Custom Domain → add CNAME in DNS.

---

## Key files
```
lib/prisma.ts          — database client (Prisma 7 + pg adapter)
lib/graphMail.ts       — email via Microsoft Graph OAuth2
lib/notifications.ts   — email + SMS templates for all job events
lib/quoteCalculator.ts — pricing formula (edit this to change prices)
lib/recaptcha.ts       — reCAPTCHA verification (optional)

prisma/schema.prisma   — database schema (Clients, Cleaners, Jobs, Payments, etc.)
prisma/migrations/     — migration history

app/api/cleaners/signup/   — cleaner signup
app/api/jobs/create/       — create a job from quote
app/api/jobs/assign/       — find + assign cleaner to job
app/api/jobs/complete/     — mark job done, handle overages
app/api/jobs/respond/      — cleaner accepts or declines
app/api/payments/create-intent/  — Stripe payment intent
app/api/payments/approve-hold/   — client approves/declines overage charge
app/api/webhooks/stripe/         — payment success → auto-assign cleaner
```

---

## Pricing formula (to adjust)
In `lib/quoteCalculator.ts`:
- Base: $50
- Per 500 sqft: $20
- Per bedroom: $15
- Per bathroom: $10
- Service multiplier: standard 1×, deep clean 1.5×, move-in/out 1.75×
- Add-ons: fridge $50, oven $40, blinds $30, laundry $45
- Cleaner pay: $20/hr + $8/job gas fee

---

## To run locally
```bash
cd C:\Users\robyn\clean-dispatch
npm install
# .env.local already exists with credentials
npx prisma generate
npm run dev
```
Visit http://localhost:3000/client/quote
