# IlmConnect Admin & Teacher Portal

> **Stack:** Next.js 15.5 · React 19 · Tailwind CSS v4 · TypeScript · lucide-react

The administrative web portal for the **Zoq / IlmConnect** Islamic Education Platform.  
Serves two personas from a single app via a role toggle in the topbar:

| Role | Persona | Key Work |
|------|---------|----------|
| **Admin Desk** | Director of Academics / Platform Ops | Teacher credential verification, platform oversight |
| **Teacher Portal** | Verified Sheikh / Ustadh | 1-on-1 request management, Madrassa class creation, Q&A answering |

---

## Design Language

| Token | Value | Usage |
|-------|-------|-------|
| Primary Emerald | `#064E3B` | Sidebar, CTAs, active nav |
| Gold Accent | `#D97706` | Badges, Islamic callouts |
| Warm Sand BG | `#FAF9F5` | Page background |
| Stone Text | `#1C1917` | Body copy |

---

## Pages

| Route | File | Description |
|-------|------|-------------|
| `/` | `app/page.tsx` | Dashboard — 4 KPI metric cards + live queues |
| `/verification` | `app/verification/page.tsx` | Teacher Credential Dossier Review — inspect Ijazahs, approve/reject |
| `/classes` | `app/classes/page.tsx` | Madrassa Class Manager — 20-seat atomic circles, rosters, Google Meet sessions |
| `/requests` | `app/requests/page.tsx` | 1-on-1 Mentorship Request Desk — accept with schedule/Meet link, or decline |
| `/qa` | `app/qa/page.tsx` | Islamic Fatwa & Q&A Board — submit referenced scholarly answers |

---

## Project Structure

```
admin/
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout (Sidebar + AuthProvider)
│   │   ├── globals.css         # Tailwind v4 theme tokens
│   │   ├── page.tsx            # Dashboard Overview
│   │   ├── verification/       # Admin Teacher Verification Desk
│   │   ├── classes/            # Madrassa Class Manager
│   │   ├── requests/           # Teacher 1-on-1 Request Desk
│   │   └── qa/                 # Scholar Q&A Response Center
│   ├── components/
│   │   ├── Sidebar.tsx         # Sticky left-nav with IlmConnect branding
│   │   └── Header.tsx          # Topbar with role switcher & API status badge
│   ├── context/
│   │   └── AuthContext.tsx     # Role state (Admin / Teacher persona)
│   └── lib/
│       ├── api.ts              # Typed API client → Go Chi backend :8080
│       ├── types.ts            # Domain types (mirrors backend/domain/models.go)
│       └── mockData.ts         # Rich Ghanaian Islamic mock data for offline use
└── package.json
```

---

## Running Locally

```bash
# From the zoq/ root:
cd admin
npm install
npm run dev        # → http://localhost:3000
```

**Backend:** The admin portal talks to the Go Chi REST API at `http://localhost:8080`.  
If the backend is **not running**, the portal automatically falls back to rich local mock data — all flows are interactive (approve, schedule, answer) and update in-memory state.

The API status indicator in the topbar shows:
- 🟢 **Go Chi API :8080 Live** — backend connected
- 🟡 **Local Mock Active** — offline mode

---

## Platform Rules Enforced in UI

1. **Atomic 20-Seat Cap** — Class creation locks capacity at 20; the UI shows a locked banner in the create modal.
2. **Single Sheikh Rule** — Accepting a 1-on-1 request shows a confirmation message that the system registers an exclusive subject lock on that learner-teacher pair.
3. **Anonymous Q&A** — Questions marked anonymous display `Anonymous Inquirer` with an `EyeOff` icon; the teacher answers without seeing the student's identity.

---

## Production Build

```bash
npm run build      # Next.js 15 webpack build (Turbopack disabled for stability)
npm run start      # Serve the production build
```

**Last verified build output:**

```
Route (app)                     Size    First Load JS
┌ ○ /                          3.15 kB    116 kB
├ ○ /classes                   6.81 kB    114 kB
├ ○ /qa                        5.85 kB    113 kB
├ ○ /requests                  5.65 kB    113 kB
└ ○ /verification              6.25 kB    114 kB
```

---

## Connections to Other Services

| Service | Location | Purpose |
|---------|----------|---------|
| `backend&db/` | `localhost:8080` | Go Chi REST API + PostgreSQL |
| `mobile/` | Expo :8081 | Learner-facing React Native app |
| Uploaded credentials | `backend&db/uploads/` | Served at `/uploads/*` for credential review |
