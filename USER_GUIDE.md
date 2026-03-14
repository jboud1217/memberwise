# MemberWise User Guide

MemberWise is an all-in-one membership management platform for civic associations, nonprofits, churches, HOAs, professional groups, and more. This guide walks you through every feature.

---

## Table of Contents

1. [Getting Started](#getting-started)
2. [Dashboard](#dashboard)
3. [Members](#members)
4. [Contacts](#contacts)
5. [Membership Tiers](#membership-tiers)
6. [Billing & Payments](#billing--payments)
7. [Email Campaigns](#email-campaigns)
8. [Analytics](#analytics)
9. [Member Portal](#member-portal)
10. [Public Website](#public-website)
11. [Settings](#settings)

---

## Getting Started

### Creating Your Organization

Visit `/register` to begin the 4-step setup wizard:

1. **Name your organization** — Enter your organization's name. A subdomain is auto-generated as you type (e.g., `north-buckhead.memberwise.com`). You can customize the subdomain.
2. **Choose your domain** — Use the free MemberWise subdomain or connect a custom domain (Pro feature). Custom domains require adding a DNS CNAME record pointing to `proxy.memberwise.com`.
3. **Your account** — Enter your full name and work email.
4. **Set a password** — Create a password meeting the strength requirements (8+ characters, uppercase letter, number, special character). A live strength indicator shows your progress.

After registration you're automatically signed in and taken to onboarding.

### Onboarding

The 5-step onboarding wizard tailors MemberWise to your needs:

1. **About your organization** — Select your organization type (Civic Association, Nonprofit, Church, Sports League, HOA, Professional Association, Alumni Group, or Other), estimate your member count, and pick your priority features.
2. **Data migration** — Tell us where your data lives. MemberWise supports direct import from MemberClicks, Wild Apricot, GrowthZone, YourMembership, or any Excel/CSV spreadsheet. You can also start fresh.
3. **Theme** — Browse visual themes with live previews. Recommended themes are highlighted based on your organization type.
4. **Layout** — Choose a page layout template for your portal and public site.
5. **Review** — Confirm your choices and get a personalized list of next steps with quick links to import members, set up tiers, or connect Stripe.

---

## Dashboard

The dashboard (`/dashboard`) is your home base. It greets you by name and time of day and surfaces everything you need at a glance.

### Stats at a Glance

Four cards across the top show:

| Card | What it shows | Click to... |
|------|--------------|-------------|
| Total Members | All members in your database | View members list |
| Active Members | Count and percentage of active members | Filter members to active |
| Lapsed Members | Members past their renewal date | Filter members to lapsed |
| Revenue YTD | Total payments received this year | View billing page |

### Get Started Checklist

If you haven't completed initial setup, a 5-step checklist appears:

1. Set up membership tiers
2. Import your members
3. Connect Stripe
4. Send your first email
5. Set up your public site

Each step links directly to the relevant page. Completed steps are checked off automatically.

### Quick Actions

- **Add Member** — Jump straight to the new member form
- **Send Email** — Start a new email campaign

### Quick Links

A grid of shortcuts to: Import CSV, Analytics, Site Builder, and Team Management.

### Recent Activity

A live feed of everything happening in your organization — new members, payments, imports, email sends, team invitations, and more. Each item links to the relevant record.

---

## Members

### Viewing Members

The members page (`/members`) shows a paginated table of all members (20 per page).

**Columns:** Display Name, Email, Status, Tier, Joined Date

**Filter and sort by:**
- Name search
- Status (Active, Lapsed, Suspended, Prospect)
- Membership tier
- Click any column header to sort ascending/descending

### Adding a Member

Click **Add Member** to create a single member record. Fields include:

- **Display name** (required) — The member's name as shown throughout the app
- **Organization name** — Company or household name
- **Status** — Active, Lapsed, Suspended, or Prospect
- **Tier** — Select from your membership tiers
- **Address** — Street, city, state, zip, country
- **Member number** — Custom identifier
- **Dates** — Join date, renewal date, expiration date
- **Notes** — Free-text notes
- **Communication preferences** — Do not email / Do not mail checkboxes

### Importing Members

Click **Import CSV** to open the import wizard:

**Step 1: Upload your file**
Upload a CSV, Excel (.xlsx/.xls), or OpenDocument (.ods) file. MemberWise auto-detects the source platform (MemberClicks, Wild Apricot, GrowthZone, YourMembership, or generic spreadsheet) and selects the correct sheet for multi-sheet files.

**Step 2: Map columns**
An interactive mapper shows sample data from your file alongside MemberWise fields. Columns are auto-mapped when possible. You can manually map any column to:
- Standard fields (name, email, phone, address, status, tier, dues info, join date)
- Custom fields

A live preview shows how many households, contacts, prospects, and tiers will be created.

**Step 3: Review results**
See counts of records imported, members created, tiers created, and any errors. Errors include specific row numbers so you can fix and re-import.

### Bulk Actions

Select multiple members from the table to perform bulk operations like status changes or exports.

### Exporting Members

Click **Export** to download your member data as a CSV file.

### Member Detail Page

Click any member to view their full profile:

- **Header** — Avatar, name, status badge, tier, member number, communication opt-outs
- **Summary cards** — Contact count, payment count, total paid, join date
- **Details** — Organization, address, dates, notes
- **Contacts** — All linked contacts with email and phone, primary contact badge
- **Payment history** — Every payment with date, amount, method, status, and description
- **Activity timeline** — Chronological log of all changes and events for this member

Click **Edit** to update any member information.

---

## Contacts

Contacts (`/contacts`) are the individual people linked to your member records. A single member (like a household or company) can have multiple contacts.

### Viewing Contacts

The contacts table shows: Name, Email, Phone, Linked Member, and Role (primary badge).

Search contacts by name using the search bar.

### Adding a Contact

Click **Add Contact** to open a dialog:
- First name, last name, email, phone
- Link to an existing member (optional)
- Mark as primary contact

### Exporting Contacts

Click **Export Contacts** to download a CSV of all contact records.

---

## Membership Tiers

Tiers (`/tiers`) define your membership levels and pricing.

### Creating a Tier

Click **Add Tier** and fill in:
- **Name** (required) — e.g., "Individual", "Family", "Corporate"
- **Description** — What's included in this tier
- **Price** — Dollar amount
- **Billing interval** — Monthly, Quarterly, Semi-Annual, Annual, Two Year, Lifetime, or One Time

### Managing Tiers

Each tier card shows its name, description, price, interval, member count, and status. You can toggle tiers active/inactive or delete them.

---

## Billing & Payments

### Overview

The billing page (`/billing`) shows:

| Card | Description |
|------|-------------|
| Total Revenue | Sum of all completed payments |
| Payments | Total number of transactions |
| Average Payment | Mean payment amount |
| Top Method | Most-used payment method |

Below the cards is a paginated table of recent payments showing member name (linked to their profile), amount, method, status, description, and date.

### Recording a Payment

Click **Record Payment** to log a manual payment:
- Select the member
- Enter the amount, payment method, and description
- Payment is immediately reflected in analytics and the member's payment history

### Connecting Stripe

Go to **Settings > Billing** to connect your Stripe account for online payment processing. Once connected, members can pay dues directly through the portal.

---

## Email Campaigns

### Viewing Campaigns

The email page (`/email`) lists all campaigns with their subject, status (Draft, Sending, Sent, Scheduled, Failed), recipient count, sent count, opened count, and date.

### Creating a Campaign

Click **New Campaign** (`/email/new`) to compose:

- **Subject line** — The email subject your members will see
- **Body** — Rich text area for your email content
- **Recipients** — Filter who receives the email:
  - By member status (All, Active only, Lapsed only, Prospects only)
  - By membership tier

**Actions:**
- **Send** — Sends the campaign immediately
- **Save as Draft** — Saves for later editing and sending

---

## Analytics

The analytics page (`/analytics`) provides a visual overview of your organization's health.

### Member Statistics

Cards showing total members, active members (with percentage), lapsed members, prospect members, and total contacts. Each card links to the relevant filtered view.

### Members by Status

A breakdown of your membership with individual progress bars for each status (Active, Lapsed, Suspended, Prospect) plus a stacked bar summary.

### Revenue Overview

- **This Year** — Year-to-date revenue total
- **Year-over-year change** — Percentage with trending indicator
- **Monthly chart** — 12-bar chart showing revenue by month with the current month highlighted

### Payments by Method

A grid showing each payment method, total collected, and number of payments.

---

## Member Portal

The portal is the member-facing side of MemberWise — where your members log in to manage their membership.

### Portal Home (`/portal`)

Members see a greeting with your organization name and quick-link cards to:
- **Member Directory** — Browse other members
- **Dues & Payments** — View their payment history and membership status
- **My Profile** — Update their contact info

### Member Directory (`/portal/directory`)

A searchable list of active members. Members can search by name or organization. Each card shows the member's display name, organization, primary email, and city/state.

Admins can enable or disable the directory from settings. When disabled, members see an explanation message.

### My Profile (`/portal/profile`)

Members can update:
- **Contact info** — First name, last name, email, phone
- **Address** — Street, city, state, zip
- **Communication preferences** — Opt in/out of email newsletters and printed mailings

### Dues & Payments (`/portal/dues`)

Members see:
- **Current membership** — Status badge, tier name, price and interval, expiration date, next renewal date
- **Payment history** — Table of all their payments with date, amount, method, status, and description

---

## Public Website

MemberWise generates a public website for your organization, accessible via your subdomain or custom domain.

### Default Pages

- **Home** — Your organization's landing page
- **About** — Organization information
- **Contact** — Contact details or form
- **Events** — Event listings

### Customization

Use the **Site Builder** (`/settings/template`) to customize your public site:
- Change themes and color schemes
- Choose layout templates
- Add or rearrange pages
- Preview changes in real time with a live preview URL

---

## Settings

### Team Management (`/settings/team`)

Manage who has access to your MemberWise admin dashboard.

**Roles:**
| Role | Access |
|------|--------|
| Owner | Full access, billing, can delete organization |
| Admin | Full access to all features |
| Staff | Dashboard access for day-to-day operations |

View current team members and their roles. See pending invitations with email, assigned role, and expiration date.

### Template & Site Builder (`/settings/template`)

Customize your portal and public website appearance. Choose templates, adjust layouts, and preview changes live.

### Theme (`/settings/theme`)

Select and customize your visual theme — colors, fonts, and styling applied across your portal and public site.

### Domain (`/settings/domain`)

Configure a custom domain for your organization:
1. Enter your desired domain (e.g., `members.yourorg.com`)
2. Add a CNAME DNS record pointing to `proxy.memberwise.com`
3. MemberWise verifies the record and activates your domain

### Custom Fields (`/settings/custom-fields`)

Create organization-specific data fields that appear on member and contact records.

**Supported field types:** Text, Number, Date, Yes/No, Single Select, Multi Select, URL, Email, Phone

For select fields, you define the list of options. Fields can be marked as required and toggled active/inactive.

### Billing (`/settings/billing`)

- Connect or manage your Stripe account
- View your MemberWise subscription status

---

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Enter | Advance to the next step in wizards |

---

## Need Help?

If you run into issues or have feature requests, contact your organization administrator or reach out to MemberWise support.
