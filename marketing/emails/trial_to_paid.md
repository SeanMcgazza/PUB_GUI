# ChairTime Trial to Paid Conversion Sequence

## Overview
- **Trigger**: Trial started (14-day trial)
- **Goal**: Convert free trial → paid subscription
- **Timing**: Day 10, Day 13, Day 14 (expiry)

---

## Email 1: Value Reminder (Day 10)

**Subject**: You've received {{booking_count}} bookings! 📅

**Preview**: Here's what happens when your trial ends...

---

Hi {{first_name}},

Quick update on your ChairTime trial:

**Your stats so far:**
- 📅 Bookings received: {{booking_count}}
- 👥 Clients added: {{client_count}}
- ⏱️ Hours saved on phone/text bookings: ~{{hours_saved}}
- 📬 Reminders sent automatically: {{reminder_count}}

{{#if booking_count > 0}}
You're getting real value from ChairTime. The question is: what happens when your trial ends in 4 days?
{{else}}
You haven't received a booking yet - have you shared your booking link? You still have 4 days to test it!
{{/if}}

**What you get with ChairTime Pro (€29/month):**
- ✅ Unlimited bookings and clients
- ✅ Automatic SMS/email reminders
- ✅ Online payments and deposits
- ✅ Waitlist management
- ✅ Client history and notes
- ✅ Team scheduling (unlimited staff)

**That's less than one haircut** for software that runs your entire booking operation.

👉 **[Upgrade to Pro - Keep Your Bookings →]**

All your clients, services, and settings stay exactly as they are. No disruption.

**Aoife**

P.S. Have questions? Reply to this email - happy to help.

---

## Email 2: Urgency + Social Proof (Day 13)

**Subject**: Tomorrow your trial ends - what you'll lose

**Preview**: Your booking link, your client list, your reminders...

---

Hi {{first_name}},

Your ChairTime trial ends **tomorrow**.

Here's exactly what happens:

**If you upgrade (€29/month):**
- ✅ Everything stays the same
- ✅ Booking link keeps working
- ✅ All clients and history preserved
- ✅ Reminders keep sending
- ✅ Cancel anytime, no contracts

**If you don't upgrade:**
- ❌ Booking link stops working
- ❌ No more automatic reminders
- ❌ Back to phone/text bookings
- ⚠️ Your data saved for 30 days (you can come back)

---

**What other salon owners are saying:**

> "€29/month is nothing. I was losing more than that to no-shows every week." - Emma, Dublin

> "My clients love booking online. I can't go back to the old way now." - Marcus, Manchester Barber

> "I tried the free booking tools. They're free for a reason. ChairTime actually works." - Niamh, Cork Nails

---

**The maths:**

- ChairTime Pro: €29/month = €0.97/day
- Average no-show cost: €50-100
- Reminders prevent just ONE no-show = pays for 2 months

👉 **[Upgrade Now - 30 Seconds →]**

See you on the other side,

**Aoife**

---

## Email 3: Final Call (Day 14 - Expiry Day)

**Subject**: Your ChairTime trial ends today ⏰

**Preview**: Last chance to keep your online booking running

---

Hi {{first_name}},

This is it - your trial ends today at midnight.

I'll keep this short:

{{#if booking_count > 0}}
You've received **{{booking_count}} bookings** through ChairTime.

That's **{{booking_count}}** phone calls you didn't have to take.
That's **{{booking_count}}** clients who booked at their convenience.
That's **{{booking_count}}** reasons to keep going.
{{/if}}

**Two options:**

**Option A: Upgrade (€29/month)**
→ Keep your booking link live
→ Keep all your clients and data
→ [Upgrade Now →]

**Option B: Let it expire**
→ Back to phone bookings
→ Back to manual reminders
→ Back to no-shows

---

**Still not sure?**

Let me remove the risk entirely:

🛡️ **30-Day Money Back Guarantee**

Try Pro for a month. If you don't think it's worth €29, email me and I'll refund you. No questions asked.

👉 **[Start Pro - Risk Free →]**

Whatever you decide, thanks for trying ChairTime. If you ever want to come back, your data will be here for 30 days.

**Aoife**
Founder, ChairTime

P.S. If budget is tight right now, reply and tell me. I'll sort something out. I want salons to succeed.

---

## Conversion Optimisation Notes

### Personalisation Variables
- `{{first_name}}` - User's first name
- `{{booking_count}}` - Bookings received during trial
- `{{client_count}}` - Clients added
- `{{hours_saved}}` - Calculated: booking_count × 5 minutes
- `{{reminder_count}}` - Reminders sent

### Segmentation
**High engagement (10+ bookings):** Emphasise keeping momentum
**Low engagement (1-5 bookings):** Offer setup call, check for blockers
**No engagement (0 bookings):** Ask what went wrong, offer extension

### Exit Survey (Non-converters)
- "Too expensive"
- "Missing features I need"
- "Too complicated to set up"
- "Using competitor"
- "Closing/changing business"
- "Other"
