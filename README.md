# CleanDispatch

A white-label cleaning services platform connecting clients and professional cleaners in Florida (Apollo Beach, Hillsborough County, Manatee County).

**📚 Full Launch Strategy:** See [LAUNCH_STRATEGY.md](./LAUNCH_STRATEGY.md) for detailed 30-day plan to get first clients & cleaners.

**📖 Cleaner Onboarding:** View `/cleaner/onboarding` for best practices guide.

**❓ How It Works:** View `/how-it-works` for client/cleaner overview.

## How It Works

### Client Flow
1. Visit `/client/quote`
2. Enter property details (sqft, bedrooms, bathrooms)
3. Select cleaning type (standard, deep, move-in, move-out)
4. Add optional services (fridge, oven, blinds, laundry)
5. Get instant quote
6. Pick date/time from available slots
7. Pay online via Stripe
8. Job assigned to available cleaner

### Cleaner Flow
1. Sign up at `/cleaner/signup`
2. Complete onboarding: personal info, **2 professional references**, availability, photos, bank details
3. Background check approval (24-48 hours)
4. View incoming jobs on `/cleaner/dashboard`
5. Accept/decline jobs (2-3 min window)
6. Get automated weekly payouts ($20/hr + $8/job)

### Admin Flow
- `/admin/dashboard` - Overview of revenue, jobs, cleaners, clients
- Monitor performance
- Approve/manage cleaners
- View all transactions

## Pricing

**Quote Formula:**
- Base: $50
- Sqft: ($sqft / 500) × $20
- Bedrooms: $bedrooms × $15
- Bathrooms: $bathrooms × $10
- Service multiplier: standard (1x), deep (1.5x), move-in/out (1.75x)
- Add-ons: fridge ($50), oven ($40), blinds ($30), laundry ($45)

**Cleaner Payout:**
- $20/hour (based on estimated hours)
- $8/job gas fee
- You keep the difference (typically 40-50% margin)

## Tech Stack

- **Frontend:** Next.js 15 + React + TypeScript + Tailwind CSS
- **Backend:** Next.js API Routes
- **Database:** PostgreSQL + Prisma ORM
- **Payments:** Stripe (collect from clients, Stripe Connect payouts to cleaners)
- **Email:** Microsoft Graph (Office 365)
- **SMS:** Quo API
- **Authentication:** TODO (implement after MVP)

## Project Structure

```
app/
├── page.tsx                         # Landing page
├── client/
│   └── quote/page.tsx              # Client booking flow
├── cleaner/
│   ├── signup/page.tsx             # Cleaner onboarding (with references)
│   └── dashboard/page.tsx          # Cleaner job management
├── admin/
│   └── dashboard/page.tsx          # Admin overview
└── api/
    ├── jobs/
    │   ├── create/route.ts         # Create job from client quote
    │   ├── assign/route.ts         # Auto-assign to cleaner
    │   ├── respond/route.ts        # Cleaner accepts/declines
    │   └── complete/route.ts       # Job completion (triggers payment hold if overrun)
    ├── payments/
    │   ├── create-intent/route.ts  # Stripe payment
    │   └── approve-hold/route.ts   # Client approves/denies additional charges
    ├── cleaners/
    │   └── signup/route.ts         # Cleaner registration
    └── webhooks/
        └── stripe/route.ts         # Payment webhooks

lib/
├── quoteCalculator.ts              # Quote logic
└── notifications.ts                # Email (Microsoft Graph) + SMS (Quo)

prisma/
└── schema.prisma                   # Database models
```

## Database Models

- **Client** - Customer accounts
- **Cleaner** - Service provider accounts
- **CleanerReference** - Professional references for vetting (2 required per cleaner)
- **Job** - Cleaning bookings
- **JobAssignment** - Auto-assigned cleaners to jobs (with on-hold flag)
- **Availability** - Cleaner weekly schedule
- **Payment** - Stripe transactions
- **PaymentHold** - Auto-hold when job runs over estimated time (awaiting client approval)
- **CleanerPayout** - Weekly earnings payouts
- **Review** - Job ratings/feedback
- **BeforeAfterPhoto** - Job photos

## Automation Built-In

- ✅ Instant quote generation
- ✅ Auto-assign jobs to cleaners based on availability
- ✅ **Cleaner vetting via professional references**
- ✅ **Auto-hold payments if job runs over estimated time**
- ✅ **Send approval request to client (email + SMS)**
- ✅ Stripe webhook handling (payment confirmation)
- ✅ Email + SMS notifications (Microsoft Graph + Quo)
- ✅ Weekly automatic payouts
- ✅ Job status tracking
- ✅ Rating/review system

## Next Steps (Immediate Priority)

### Phase 2: Connect Database & Core Logic (Week 1)
1. **Set up PostgreSQL** and update `DATABASE_URL` in `.env.local`
2. **Run Prisma migrations:** `npx prisma migrate dev --name init`
3. **Wire up database calls** in all API routes (uncomment Prisma code)
4. **Test flows end-to-end:** signup → quote → payment → job assignment

### Phase 3: Authentication (Week 2)
1. Add Clerk or NextAuth for client/cleaner login
2. Protect routes: `/client/*`, `/cleaner/*`, `/admin/*`
3. Add "My Account" pages

### Phase 4: Notifications (Week 2)
1. Set up Microsoft Graph OAuth (Office 365) for email
2. Test email sending via `lib/notifications.ts`
3. Set up Quo API for SMS
4. Test SMS sending
5. Add notification preferences (client/cleaner settings)

### Phase 5: Photo Uploads & Job Completion (Week 3)
1. Add file upload to S3 or Cloudinary
2. Build before/after photo capture in cleaner app
3. Implement `/cleaner/job/[id]/complete` page
4. Wire up job completion workflow (triggers payment hold check)

### Phase 6: Payments & Payouts (Week 3)
1. Test Stripe payment flow end-to-end
2. Set up Stripe Connect for cleaner automatic payouts
3. Implement payment hold approval UI for clients
4. Build payout dashboard (admin)

### Phase 7: Background Checks (Week 4)
1. Integrate with Checkr or similar (API call on cleaner signup)
2. Store check status in DB
3. Notify cleaner when approved/rejected

### Phase 8: Maps & Geolocation (Week 4)
1. Add Google Maps API for distance calculations
2. Improve job assignment logic to prefer nearest cleaner
3. Show service areas on landing page

### Phase 9: Admin Features (Week 5)
1. Build admin approval for new cleaners
2. Add dispute resolution dashboard
3. Build referral tracking (optional)

### Phase 10: Launch Prep (Week 5-6)
1. Load test (simulate 100+ concurrent users)
2. Security audit
3. Setup monitoring & alerts
4. Create support docs

## How This Stays Hands-Off

- **For clients:** They self-serve (quote → book → pay). Zero manual work.
- **For cleaners:** Auto-assigned from availability. System sends notifications.
- **For you:** 
  - Approve new cleaners 1x (background check auto-triggered)
  - Resolve disputes only (payment holds, ratings disputes)
  - Monitor dashboard weekly (optional)
  - All payments/payouts run on schedule automatically

## Key Files to Watch

- `lib/quoteCalculator.ts` - Adjust pricing formulas here
- `lib/notifications.ts` - Customize email/SMS templates
- `app/api/jobs/assign/route.ts` - Customize assignment logic
- `prisma/schema.prisma` - Extend for new features
