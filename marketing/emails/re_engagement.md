# ChairTime Re-Engagement Email Sequence

## Overview
- **Trigger**: No login for 30+ days (paying customers)
- **Goal**: Bring inactive users back, reduce churn
- **Timing**: Day 30, Day 45, Day 60

---

## Email 1: Soft Check-In (Day 30 Inactive)

**Subject**: We miss you at ChairTime 👋

**Preview**: Is your booking link still working?

---

Hi {{first_name}},

I noticed you haven't logged into ChairTime in a while.

Just checking in - is everything okay with your salon?

**A few things that might have happened:**

1. **You're so busy you forgot** - Great problem to have! Your booking link is still working, clients can still book.

2. **Something's not working** - If ChairTime isn't meeting your needs, I genuinely want to know. Reply and tell me.

3. **You've moved to something else** - If you found a better solution, I'd love to hear about it.

4. **Taking a break** - Totally normal. ChairTime will be here when you're back.

**While you were away:**
- 🆕 New: Waitlist feature (fill cancellations automatically)
- 📊 New: Client insights dashboard
- 📱 Updated: Faster mobile app
- 💬 New: 2-way SMS with clients

👉 **[Log Back In →]**

No pressure - just wanted to make sure you're not missing out.

**Aoife**

P.S. Your booking link is still live. Clients can still book. Everything's as you left it.

---

## Email 2: Value Reminder (Day 45 Inactive)

**Subject**: Quick stats on your ChairTime account 📊

**Preview**: Bookings still coming in...

---

Hi {{first_name}},

I pulled up your ChairTime account:

**Your booking stats (last 30 days):**
- Bookings received: {{recent_bookings}}
- Reminders sent: {{reminders_sent}}
- Clients who rebooked: {{rebooked_count}}

{{#if recent_bookings > 0}}
Even without logging in, ChairTime is still working for you! But there are features you might be missing:
{{else}}
Your booking link might need some love. When did you last share it on social media?
{{/if}}

**Features you might not be using:**

📋 **Waitlist** - Cancellation = automatic text to next person
📈 **Client Insights** - See your VIPs and peak times
💳 **Deposits** - Reduce no-shows with card-on-file
📲 **Instagram Integration** - Book button on your profile

👉 **[Log In and Explore →]**

**Quick tip**: Put your booking link in your Instagram bio if you haven't already. Most salons see a 30% booking increase.

**Aoife**

---

## Email 3: Last Attempt + Feedback (Day 60 Inactive)

**Subject**: Should we part ways? (Honest question)

**Preview**: I'd rather know than wonder

---

Hi {{first_name}},

It's been 2 months since you've logged into ChairTime.

I could keep sending emails hoping you'll come back, but that's not fair to either of us. So I'm just going to ask:

**Are you done with ChairTime?**

**If yes:** No hard feelings. Businesses change. You can:
- Cancel in Settings → Subscription
- Or reply "CANCEL" and I'll sort it
- Export your client list as CSV if needed

**If no (just busy):** Welcome back! Here's what's new:
- Waitlist feature
- Client insights dashboard
- Faster mobile app
- Instagram booking integration

👉 **[Come Back to ChairTime →]**

**If something went wrong:** I really want to know. Hit reply and tell me:
- What frustrated you?
- What feature was missing?
- What would bring you back?

I read every response personally.

---

**One last thing:**

You're paying €29/month for a tool you're not using. That's €29 that could go toward supplies, marketing, or a nice lunch.

Either use it or lose it - but don't let it sit there.

Honestly yours,

**Aoife**
Founder, ChairTime

P.S. If you reply "PAUSE" I can freeze your account for 3 months. No charge, data saved, pick up where you left off when ready.

---

## Re-Engagement Tactics

### Personalisation Variables
- `{{first_name}}` - User's name
- `{{recent_bookings}}` - Bookings in last 30 days
- `{{reminders_sent}}` - Reminders sent automatically
- `{{rebooked_count}}` - Returning client bookings
- `{{last_login_date}}` - When they last used the app

### Segment-Specific Approaches

**High-value churning users (50+ bookings/month historically):**
- Personal call from founder
- Offer discount to retain
- Understand what changed

**Low-activity users (never fully adopted):**
- Offer setup assistance
- Send tutorial videos
- May not be right fit

**Seasonal users (wedding stylists, etc.):**
- Don't send re-engagement in off-season
- Time outreach for busy season start

### Win-Back Offers
- 50% off next month
- Free setup call
- Free migration from competitor
