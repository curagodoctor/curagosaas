> ## ⚠️ DIRECTION UPDATE (2026-07-27) — PRD v1.0 supersedes parts of this file
> The founder issued **Practice OS PRD v1.0**, which is now the governing product direction where it conflicts with this design spec. On these points, **follow the PRD, not the sections below**:
> - **Vocabulary:** the product uses **"Mission"** (PRD §2). Ignore §7's "never use Mission" rule.
> - **Gamification is IN:** XP points, streaks, execution/consistency/learning/**Performance Score**, badges, and confetti/celebrations are wanted (PRD §10, §13). This overrides the §5/§9 "Visibility Score replaces XP / do-not-reintroduce" rules. (Current code still uses `VisibilityScore`; migrating to the PRD's Performance Score model is pending — see below.)
> - **AI assistant is IN for MVP:** per-mission assistant, 10 credits/day (PRD §8). Overrides §10's "deferred". ✅ Built.
> - **Leaderboard** remains deferred/post-MVP (PRD §22) — this still agrees with §5.
>
> **Shipped:** day-30 fix; Razorpay purchase + gate (`Doctor.practiceOsActive`); AI assistant (OpenAI, `AiCreditLedger`, 10/day); GCS lecture-video upload+streaming (signed URLs); Google sign-in (dedicated OAuth client). **Plus the full remaining PRD:** Performance Score engine (`PerformanceScore` — execution/consistency/learning/overall, streak, missed/delayed, on-time scoring, +2 login, +2 AI) wired into complete/skip/login/AI; evidence upload + reflection in the Focus session; KPI entry (`KpiEntry`) + recharts graphs; celebrations (confetti/badges/appreciation + `Achievement` for mission/week/framework/streak); dashboard widgets (Performance, streak, AI credits, next-up); notification cron (`/api/cron/practice-os-reminders`, 2pm); Journey Timeline (`JourneyTimeline` + `/app/practice-os/journey`); admin Analytics + per-doctor Progress (Command Center tabs); monthly Report (`/app/practice-os/report`, print-to-PDF).
>
> **Note:** Performance Score was added *alongside* Visibility Score (both shown), not as a replacement — decide later if VS should be retired. **Remaining polish:** vocabulary copy pass (some doctor UI still says "Day" vs PRD's "Mission"); real PDF export (reports currently use browser print); "on-time" = completed within 24h of unlock (pragmatic definition for the sequence-paced model).

# PracticeOS — Design & Product Specification

**Status:** All 16 product screens designed, plus the three marketing pages. Content and pricing pending founder decision.
**Purpose of this file:** Everything needed to build PracticeOS correctly, including the reasoning behind decisions that are not obvious from looking at the screens. Claude Code reads this every session.

> Build order note (current): Razorpay/payment is pipelined LAST — build everything else first. Leaderboard and the AI assistant are deferred (see below).

---

## 1. What this product is

A 30-day guided programme that takes a doctor from invisible to findable online.

One task per day, roughly 30–45 minutes. Each day has a short lecture (3–5 min), a concrete task, and sub-steps. Some tasks are performed **inside the CuraGo website builder**; others are performed on Google, Instagram, or WhatsApp.

**The differentiator:** the homework is executed inside our own platform and produces a real asset. This is not a course. It is not a checklist. It is a course whose output is a working digital presence. Any design decision that weakens the connection between "task completed" and "asset exists" is the wrong decision.

### Who it is for
Doctors building an independent private practice in India, weighted toward tier 2 and tier 3 cities. Residents starting out, established-but-invisible practitioners, and doctors burned by a marketing agency. Credential-driven, time-poor, professionally sceptical. Comfortable with scores and rankings, but hostile to anything childish or gamified.

### The product family
| Product | Price | Notes |
|---|---|---|
| Zero to Practice (ebook) | ₹499 | Live. ~40 sold. |
| Masterclass (video) | ₹999 | Live. ~6 sold. |
| Bundle | ₹1,199 | Live. Ads built, not yet run. |
| **PracticeOS** | ₹5,000–10,000 TBD | This product. Launching ~2 months. |
| PracticeOS renewal | ~₹999/mo TBD | Weekly tasks + quarterly modules + monthly live session. |
| CuraGo SaaS — free tier | ₹0 | Website builder, booking, patient-facing site. |
| CuraGo SaaS — Pro | TBD | **Not** bundled with PracticeOS. |

PracticeOS and the SaaS are separate products, likely separate codebases, but **share one login**. A doctor has one CuraGo account.

---

## 2. Design system

### Colour — two brand colours, each with an assigned job
```css
--green:  #096B17;  /* IDENTITY — brand, completion, things finished */
--orange: #F26A1B;  /* ACTION — anything the user should do next */
```
**The rule: if it is orange, it is something you do.** Never use orange decoratively. Never use green on a primary button. Aim for **one orange element per screen.**

Green: logo, completed days, checkboxes, score meters, positive deltas, completion tick.
Orange: the primary button, the current-day marker, the "shortened task" chip.

```css
--paper:      #F7F9F5;  /* page background — warm white, not clinical */
--card:       #FFFFFF;
--ink:        #101A13;
--muted:      #5E6B5F;
--rule:       #DDE4D9;
--rule-soft:  #EDF1EB;
--orange-soft: rgba(242,106,27,.08);
```
Warm paper + green reads as a professional business tool, not a hospital.

### Typography
```css
--sans:  "Instrument Sans";   /* all interface text */
--serif: "Instrument Serif";  /* NUMERALS ONLY — Visibility Score, counts, timer, milestones */
--mono:  "DM Mono";           /* eyebrows, labels, chips, tabular data */
```
Numbers are the emotional content of the product, so they get the one expressive typeface; everything else stays quiet. Never set body/headings in the serif. Do NOT substitute Inter / Space Grotesk / JetBrains Mono — that is the default AI-dashboard look this product must avoid.

**Scale:** headline `clamp(30px,3.4vw,46px)`/600/−0.027em (cap ~15ch); section 20–21px/600; body 16.5px/1.6 (cap ~52ch); UI 15px; secondary 13.5–14.5px; mono label 10–11px uppercase +0.11em; big serif numeral 29–96px/−0.03em.

### Spacing / radii / layout
Radii: 5px checkboxes, 8–9px buttons/inputs, 11–12px panels, 14px app shell. Section rhythm 26–40px; page padding 44–64px desktop. Meters 5–7px tall, fully rounded. Hairline (`--rule-soft`) inside components; solid (`--rule`) between them.

### Breakpoints (desktop primary)
```
< 840px    phone     single column, stacked
840–1200   tablet    main + context rail; 30-day track in header
> 1200px   desktop   day spine + main + context rail
```
The 30-day horizontal track appears **only** at tablet width; the vertical spine replaces it above. Never both.

### Accessibility
44px min target (buttons 48px); visible `:focus-visible` (orange on light, ink on orange); never colour alone; respect `prefers-reduced-motion`.

---

## 3. Signature components
- **The 30-day spine** — persistent identity element. Desktop: vertical list of all 30 days grouped by week with real titles. Tablet: 30 marks in header (7/13/20px future/done/current). Treatment-chart grammar: green behind, one orange mark = you, hairlines ahead. Replaces XP.
- **The context rail** — right column, passive info only, never actionable: Visibility Score (number + 5 component bars + one line), Completed ("11 days of 30"), This week (4 dots + pace), Your cohort ("Ahead of 62% of the 24 doctors who started in July").
- **The task card** — eyebrow (week+theme) → headline (the task, plainly) → purpose (patient terms) → chips (time, steps, points) → one orange primary button + secondary text link.

---

## 4. The screens (16)
Setting up: CV upload · Confirm credentials · Intent questions · Ready.
Every day: Day view · Focus session · Day complete · Locked day.
Progress: Visibility Score · Leaderboard · Your record.
Setbacks: Coming back · Milestone (7/14/21).
After 30 days: Day 30 · Weekly view · Month in review.

**Day 0 setup** (post-payment, ~5 min; Day 1 doesn't open until done): CV upload → extract qualifications/specialty/registration/procedures/languages, pre-filling 6 writing days (services 4, quals 9, about 10, Google desc 13, IG bio 18, reception script 26); paste/skip offered. Confirm (extraction only, never invention; below-threshold fields flagged not filled; each field states its use; store raw file + extracted fields separately with a delete control — DPDP applies). Intent (§6 questions). Ready (full curriculum shown, one day open, "you can't work ahead"). Credential import does **not** move the Visibility Score.

**Day view** — spine, task, rail. The one decision: "start focus session."
**Focus session** — everything collapses (no nav/rail/spine); timer + sub-steps + one button; **timer counts into overtime, never penalise long**; identical at every width.
**Coming back** (return after ≥4 days) — spine identical to a normal day (no red/gap/"missed"); lead with what exists ("You've finished 11 days" + built assets); "everything you built is still working"; **re-entry task shortened to ~15 min/2 steps**; "change my pace" offered. Never show missed-day count; never offer catch-up doubling.
**Day complete** — tick → score movement (`47→51`, component named) → estimated vs actual (flat) → tomorrow's task revealed → **"When tomorrow?"** (4 windows: Morning 6–12, Afternoon 12–5, Evening 5–9, Night 9–12, or exact time). After ~5 days collapses to "Same time as usual?" + one button. "Add to my calendar" = **`.ics` download, NOT Google OAuth for v1**. State volume: "We'll send one WhatsApp message tomorrow evening. Nothing else."
**Milestone (7/14/21)** — a report, not a celebration; days completed, score movement, assets, time; + founder 2-min unscripted voice note; offer leave-booking.
**Day 30** — ledger of work done, never promised results (tasks, hours, pages, photos, review requests, posts — all guaranteed true). Current metrics separate, framed as a starting baseline ("patients find you over months"). Renewal sits below, on a distinct surface. **Anti-hostage clause**: "Everything above stays yours… keep running whether you continue or not." (Remove the paragraph if it won't be true — never soften.)
**Locked day** — tomorrow shown in full, button disabled, countdown running; give the reason (Google verification/reviews take real days; "five in one evening builds a checklist, not a practice"); in the spine the locked day is `--paper`, **never orange**.
**After day 30 (renewal)** — hierarchy flips: numbers lead, one weekly task below; 30-day spine → month track; two columns; "do it Thursday instead" first-class; quarterly modules underneath (topics as doctor problems); **monthly review on the 1st, PDF**, ending with his day-0 answer quoted back + a real number. Honest variant when numbers don't move. Never surface Pro upsell and renewal on the same screen.

---

## 5. Visibility Score (0–100) — replaces XP entirely
| Component | Points |
|---|---|
| Google Business Profile | 25 |
| Reviews | 20 |
| Website | 20 |
| Systems (booking, WhatsApp, reminders) | 20 |
| Social presence | 15 |
Weights are a proposal and encode a strategy (local search matters most, social least) — founder confirms.

**Rules:** never decreases (fall behind → flat, not lost); every task maps to a named component and shows its point value on the card (`+4 Google Business Profile`); the score screen is a **diagnostic not a trophy** (names what's missing, its worth, and which day closes it; end with "following the programme closes them in order"); weight verifiable components (our own data) above self-report — GBP API for reviews is worth it; 100 reachable but hard; degrade gracefully for established doctors starting ~60.

**Leaderboard — DO NOT SHIP AT LAUNCH.** Enable only at 20+ active members/cohort. Rank on Visibility Score, never time spent, never outcomes. Anonymous (specialty + tier). Cohort-scoped, time-bound. Never show low absolute rank ("47 of 52"); use neighbourhood/percentile bands. Opt-in.

---

## 6. Product rules
- **Sequence-paced unlocking**, not calendar-locked: next day opens 24h after the previous is completed. Miss six days → finish on day 36, never "behind". This makes the coming-back screen honest. *(Open: clock starts at purchase or first task? Any dormancy expiry? Recommend no.)*
- **Days completed, not streaks** — monotonic, can never be destroyed; secondary is a weekly target ("3 of 4 this week"). Never reset to zero.
- **The record** (formerly "evidence") — his logbook, not a submission; no approval/pending/grading; skipping allowed, day still completes; all 30 entries become the day-30 artefact. Label **"Your record"**, never "evidence".
- **Task sizing 30–45 min** (not 60) — optimise for completion events; overtime stopwatch handles the motivated.
- **Onboarding questions** (at signup, ideally before payment): (1) Why building your own practice? (2) What have you tried that didn't work? (3) What would be different in six months? (4) When do you have thirty free minutes?

---

## 7. Copy principles (STRICT)
Plain, confident, adult — clinical authority register.
**Use:** Today's task · Focus session · Day 4 of 30 · Your record · Your progress · Start focus session.
**Never use:** Mission · Deck · Chamber · Engine · Booting · Rank · XP · Level up · Streak broken · Deploy · Execution score.
Task titles state the action ("Add three clinic photos to your Google profile"). Purpose lines give a reason in patient terms. Buttons say what happens ("Set it — evening tomorrow"). Never congratulate excessively (no confetti/exclamation/"Amazing work!"). Never shame — send him his own numbers instead.

---

## 8. Accountability mechanics (by impact)
1. Schedule tomorrow at completion. 2. Two-minute door ("Just do step one"). 3. Estimated vs actual. 4. Tomorrow revealed tonight. 5. Book leave in advance. 6. Human rescue after ~7 days dark (real WhatsApp). 7. Founder weekly voice note. 8. Milestones as reports. 9. Cohorts with fixed start dates. 10. Motivation anchor shown at week 3.
**Rejected:** badges/achievement icons · accountability pods · anything punitive · shame notifications · additional metrics · public sharing (NMC).

---

## 9. Do not reintroduce (regressions)
XP / execution·consistency·learning scores; leaderboard by hours; hardcoded fake peers/percentiles; streak-on-login; "HIPAA COMPLIANT" (US law, irrelevant in India — DPDP 2023 + NMC apply); "System Status: Active"; sci-fi vocabulary; founder name hardcoded as logged-in user; placeholder video URLs.

---

## 10. AI assistant — if built (deferred)
Cost (recurring per-user vs one-time payment) and liability (NMC compliance advice) are unresolved. If built: constrain to drafting/formatting only; keep all compliance guidance in reviewed static content. Same caution for a Meta ads module — get a legal read before it ships as paid content.

---

## 11. Technical notes
- **One login** across CuraGo SaaS and PracticeOS; ebook/masterclass buyers get an account at purchase.
- Persistence **per-user** (no global db.json).
- Prototype `Mission`/`Reflection`/`KPI` types are a sound starting contract, but **rename `Mission` → `Day` or `Task`** to match the copy rules.
- Never use `localStorage`/`sessionStorage` in Claude artifacts.
- Reference HTML files are plain HTML/CSS/JS — port the `:root` token block first.

---

## 12. Open decisions
**Founder:** PracticeOS price (a range, not a price); renewal amount + Pro excluded; cohort size + founding rate; refund window (1–2 wk); Visibility Score weights; quarterly topics; whether front-end spend credits toward PracticeOS.
**Product:** unlock clock start (purchase vs first task); dormancy expiry (recommend no); free pre-purchase Visibility Score assessment as lead magnet?
**Blocking launch:** Razorpay (no automated payment yet); automated PDF/masterclass delivery; days 1–14 written+recorded (15–30 can drip during the first fortnight).

---

## 13. Pricing note
n=40 ebooks / ~6 masterclasses over four weeks is a distribution signal, not a pricing signal. Leave ₹499/₹999/₹1,199 as is; run the bundle ads; reassess at 200–300 buyers.

---

## 14. Marketing site
**Positioning: founder-led front, company-backed infrastructure.** Education products carry the founder's authority (face, specialty, the practice he built); the SaaS carries the company name. The live site currently has no name/face/credential — the single largest miss for a credential-driven audience.

**Homepage.** Hero leads with the patient's behaviour, not the product ("Your patients are searching. They're finding someone else."). Founder card in the hero (not an About page). Two purchasable cards — the **₹1,199 bundle as default, ₹499 book as alternative**; the standalone masterclass appears only as struck-through value inside the bundle. **PracticeOS on a dark green surface with real dashboard screenshots and a waitlist.** Free builder as the hero's secondary CTA ("or build a free site first") and its own band lower down.

**Zero to Practice page.** Sticky buy card, six-part contents, "this is for you / isn't for you", founder section, and a **"What this won't do"** block pointing non-actors toward PracticeOS.

**PracticeOS page.** Long-form, five real screenshots in alternating rows. Three arguments: *knowing isn't doing* (justifies price gap), *you cannot fall behind* (pre-empts the biggest objection), *six things that exist in the world* (assets, not a certificate). Founding-cohort pricing + waitlist.

**Placeholders to replace before launch:** founder name + photograph (×3); founder's own words; real chapter titles/summaries; three homepage testimonials (ship empty rather than invent); PracticeOS pricing.

**Copy constraints:** No superlatives, comparative claims, or guarantees anywhere. NMC conduct rules restrict how doctors may advertise; a rule-breaking page undermines the product's credibility claim. Every compliance-adjacent FAQ says plainly the material is about being *findable*, not advertising.
