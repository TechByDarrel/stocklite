# StockLite v2.0 Roadmap — Premium Launch Plan

**Target launch:** December 2026 (Play Store)
**Current status:** v1.0 live via BetaDrop (beta testing), Play Store `.aab` built and ready pending Play Console verification

---

## Immediate fix (before Play Store submission)

### Dark mode incomplete coverage
**Problem:** `stock-ui.tsx`'s shared components (Screen, ProductRow, buttons, etc.) correctly react to the dark mode toggle via `useTheme()` + `makeStyles(colors)`. However, individual screen files (login, signup, add-product, edit-product, add-expense, edit-expense, add-debt, edit-debt, profile, edit-profile, index, products, sales, expenses, debts, profit, more, record-sale, sale-detail) each have their own local `StyleSheet.create` blocks referencing the static light-only `colors` export — these don't update when dark mode is toggled, causing some text/backgrounds to stay light and become illegible.

**Fix approach:** Convert every screen file to call `useTheme()` and build/reference styles dynamically, following the same pattern already proven in `stock-ui.tsx`. Must be done file-by-file with `tsc --noEmit` verification after each file to avoid truncation errors (a prior incident caused 129 cascading syntax errors from a partial edit).

**Status:** Bulk prompt handed to ChatGPT (VS Code) for execution — pending completion and verification.

---

## v2.0 Feature Set — Premium Tier

### Pricing model
- **Free tier:** forever free — full CRUD (products, sales, expenses, debts), dashboard, basic reports, single device, capped at ~50 products
- **Premium tier:** 7-day free trial, then paid subscription (price TBD — see cost modeling below)

### Premium Feature 1: Cloud Sync & Backup
- Push-sync to Firestore already built and proven working (Sept 2026 session)
- **Still needed:**
  - Pull-sync (bring remote changes down to a second device)
  - Conflict resolution (last-write-wins based on `updatedAt` — simplest honest approach for a single-owner business app)
  - Testing rigor equal to or exceeding the mobile QA pass done for v1.0, since data-loss bugs here are more damaging than UI bugs

### Premium Feature 2: Multi-Device Access
- Depends on Feature 1 (pull-sync) being solid
- Consider a lightweight read-only web dashboard (reuses existing Firebase project) as a simpler alternative/addition to a second native app

### Premium Feature 3: Smart Insights (local, no AI API cost)
Genuinely useful, computed from the user's own data using simple statistics — no ongoing API cost:
- **Smart reorder suggestions** — sales velocity per product vs. current stock (e.g., "sells ~3/day, 5 left, reorder within 2 days")
- **Expense anomaly detection** — flag categories spending unusually above their own historical average
- **Debt risk flagging** — highlight customers with a pattern of late payments

### Premium Feature 4: AI Business Q&A (stretch goal — real ongoing cost)
- Natural-language chat interface: "How much profit did I make last week?" answered from the user's real data
- Requires a real LLM API (Claude, GPT, etc.) — genuine per-query cost
- **Action item:** research actual API pricing at expected query volume before committing this to the paid tier; ship only if margins work

### Premium Feature 5: Advanced Reports
- Weekly/monthly PDF exports
- Profit trends over time
- Best/worst-selling product breakdowns

### Premium Feature 6: Unlimited Records
- Free tier capped (~50 products); premium removes the cap

### Premium Feature 7: Shareable Digital Receipts
- WhatsApp-shareable receipts for customers — ties directly into how Nigerian traders actually communicate with customers

### Premium Feature 8: Priority Support
- Dedicated WhatsApp/email support channel for paying users

---

## Payment & Subscription Integration

### Provider: Paystack
- Best fit for Nigerian consumers/businesses — strong local card/bank support
- Historical rate: ~1.5% per successful local card transaction (confirm current rate before integrating — check Paystack's live pricing page closer to build time)

### Technical flow
1. On signup: set `trialStartedAt` timestamp, `subscriptionStatus: 'trial'`
2. On each app launch: check if 7 days have passed since `trialStartedAt`; if so and still `'trial'`, show paywall for premium features
3. Paystack payment flow (redirect or in-app webview) on upgrade
4. Paystack webhook → backend updates `subscriptionStatus: 'active'` + renewal date
5. **Critical:** subscription status must be enforced server-side (Firestore security rules or backend-only writes) — a client-only check can be bypassed by editing local data

---

## Cost Categories to Research Before December

| Item | Notes |
|---|---|
| Google Play Console | $25 one-time (confirm current rate at submission time) |
| Firebase (Blaze plan, pay-as-you-go) | Needed once past free "Spark" tier limits — model against expected active user count |
| Paystack transaction fees | ~1.5% per transaction (confirm current rate) |
| AI API costs (if pursuing Feature 4) | Highly usage-dependent — model per-query cost × expected query volume before committing |

**Before finalizing a subscription price:** total the above against a target price point (e.g., "at ₦1,500/month, how many subscribers cover Firebase + Paystack fees with healthy margin?") rather than picking a number arbitrarily.

---

## Sequencing Recommendation

1. Finish dark mode fix (immediate)
2. Submit v1.0 to Play Store once Play Console account (mother's, pending age-restriction workaround) clears verification
3. Gather real user feedback from BetaDrop + Play Store beta period
4. Build pull-sync + conflict resolution (hardest, riskiest piece — budget real testing time)
5. Build Smart Insights (Feature 3) — no AI cost, high value, do this before the real AI chat feature
6. Research and finalize Paystack integration + pricing model
7. Evaluate AI Q&A (Feature 4) only after cost modeling confirms it's economically sound
8. Target: December 2026 premium launch
