# 📲 NFC Tap & QR Review Card Platform

A modern, high-performance web platform built with **React**, **Vite**, and **Supabase** designed for smart NFC review cards and bulk QR codes.

When customers tap their smartphone on an NFC card or scan a QR code placed at a shop counter, they are instantly redirected to a sleek, customized mobile landing page presenting options to rate on **Google Reviews**, follow on **Instagram**, review on **Facebook**, contact on **WhatsApp**, or visit custom links.

---

## 🚀 Key Features

1. **Admin Control Center**:
   - Manage multiple shops/merchants with custom brand colors, logos, and taglines.
   - Configure review platforms: **Google Reviews**, **Instagram**, **Facebook**, **WhatsApp**, **TripAdvisor**, **Zomato**, or **Custom Links**.
   - Activate/deactivate shops on the fly.
   - Instant Demo Mode works out-of-the-box even before Supabase is connected!

2. **Bulk QR Code Generator**:
   - Select multiple shops at once.
   - Choose print-ready resolutions (128px up to 400px).
   - Generate all QR codes simultaneously.
   - Export individually as PNG or download all bundled in a single **ZIP file**.

3. **High-Converting Customer Landing Page (`/r/:shopId`)**:
   - Optimized for mobile screens with glowing ambient backgrounds and haptic-style button ripple effects.
   - Shows the merchant's logo, brand colors, and active social/review options.
   - Direct 1-tap deep links to Google Review submission, Instagram profile, WhatsApp chats, etc.

4. **Real-time Tap & Click Analytics**:
   - Tracks total card taps (visits) and per-platform clicks.
   - Calculates conversion rates to measure which platforms customers use most.

---

## 🛠️ Tech Stack

- **Frontend**: React 19, React Router v7, Vanilla CSS design system.
- **Backend / Database**: Supabase PostgreSQL + Row Level Security (RLS) + Auth.
- **Fallback**: Built-in LocalStorage fallback with pre-seeded demo shops.
- **QR & Export**: `qrcode.react`, `jszip`, `file-saver`.

---

## ⚡ Quick Start

### 1. Install & Run Dev Server
```bash
npm install
npm run dev
```
Open **[http://localhost:5173/admin/login](http://localhost:5173/admin/login)** in your browser.

- To try immediately without database configuration: Click **⚡ Instant Demo Admin Access**.

---

## 🗄️ Supabase Cloud Setup

To persist your shops and analytics in the Supabase cloud:

### 1. Configure `.env.local`
Edit [.env.local](file:///c:/Users/ASUS/Desktop/NFC-TAP/.env.local):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 2. Run Database SQL Schema
In your **Supabase Dashboard > SQL Editor**, paste and run:

```sql
-- 1. Shops Table
create table if not exists shops (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  tagline text,
  logo text,
  cover_color text default '#6c63ff',
  active boolean default true,
  created_at timestamptz default now()
);

-- 2. Platforms Table
create table if not exists platforms (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references shops(id) on delete cascade,
  type text not null,
  url text not null,
  sort_order int default 0
);

-- 3. Analytics Table
create table if not exists analytics (
  id uuid default gen_random_uuid() primary key,
  shop_id uuid references shops(id) on delete cascade,
  event_type text not null, -- 'tap' or 'click'
  platform text,
  created_at timestamptz default now()
);

-- 4. Enable Row Level Security (RLS)
alter table shops enable row level security;
alter table platforms enable row level security;
alter table analytics enable row level security;

-- 5. Policies
create policy "Public read shops" on shops for select using (active = true);
create policy "Public read platforms" on platforms for select using (true);
create policy "Public insert analytics" on analytics for insert with check (true);
create policy "Auth full access shops" on shops for all using (auth.role() = 'authenticated');
create policy "Auth full access platforms" on platforms for all using (auth.role() = 'authenticated');
create policy "Auth read analytics" on analytics for select using (auth.role() = 'authenticated');
```

---

## 🏷️ How to Program NFC Cards

1. Install **NFC Tools** app on your phone (available for iOS and Android) or use a USB NFC writer (e.g. ACR122U).
2. Open **NFC Tools** > tap **Write** > tap **Add a record** > select **URL / URI**.
3. Enter the public shop URL (e.g., `https://your-domain.com/r/bella-coffee-cafe`).
4. Tap **Write** and hold your NFC card (NTAG213 / NTAG215 / NTAG216) near the phone until confirmed.
5. That's it! Any customer tapping the card with their phone will instantly open the review page.
