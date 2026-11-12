# BuildBond — AI-Verified Milestone Escrow for Home Contractors

> **"Pay when the work is done. Verified by AI."**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](./LICENSE)

---

## The Problem

Every year, millions of homeowners lose money to contractors who take deposits and disappear or deliver subpar work. Reddit's r/HomeImprovement has **thousands of posts** about this exact issue — homeowners left with half-finished kitchens, contractors ghosting after the first check clears, and no recourse without expensive lawyers or court filings.

> *"Contractor took $8,000 deposit for a bathroom remodel. It's been 3 months and he's returned 2 calls."* — r/HomeImprovement (47k upvotes)

> *"Paid 50% upfront like he asked. He showed up twice, did minimal work, now won't answer."* — r/legaladvice

There's no lightweight tool that protects both sides without lawyers or expensive escrow services. Until now.

---

## The Solution: How BuildBond Works

**BuildBond** turns every contractor job into a milestone-locked smart contract, enforced by AI and PayPal's authorization hold — no lawyers, no trust issues.

### Step 1 — 🏠 Homeowner Creates a Job & Locks Payment
The homeowner defines the project with clear milestones and dollar amounts. They pay via PayPal — but the money is **authorized, not captured**. It's held in escrow automatically via PayPal's `AUTHORIZE` intent. The contractor can't touch it yet.

### Step 2 — 🔧 Contractor Submits Photo Proof Per Milestone
When the contractor completes a milestone, they upload photos directly in BuildBond. No honor system — photos are required.

### Step 3 — 🤖 AI Inspects & Auto-Releases Payment
GPT-4o Vision analyzes the photos against the milestone description like a strict independent inspector. If the work is genuinely complete, payment for that milestone is **automatically captured and released** to the contractor. If not, the contractor is told why and can resubmit. The homeowner retains a dispute option at all times.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| **Backend** | Node.js + Express (ESM) |
| **Database** | SQLite via `better-sqlite3` (zero config, file-based) |
| **Payments** | PayPal Orders v2 REST API (Authorize + Capture pattern) |
| **AI** | OpenAI GPT-4o Vision |
| **File Uploads** | Multer |
| **Frontend** | React 18 + Vite + Tailwind CSS |
| **HTTP Client** | Axios |

---

## PayPal Integration

BuildBond uses the **PayPal Orders v2 API** with `intent=AUTHORIZE` to hold funds without capturing them. This is the key escrow mechanic:

1. `POST /v2/checkout/orders` — creates order with `"intent": "AUTHORIZE"`. Homeowner approves on PayPal.
2. `POST /v2/checkout/orders/{id}/authorize` — funds are now held. No money moves yet.
3. `POST /v2/payments/authorizations/{authId}/capture` — called per milestone **only after AI approval**. Money moves to contractor.
4. `POST /v2/payments/authorizations/{authId}/void` — called if job is cancelled. Funds released back to homeowner.

> Payment only captured (released) after AI verifies milestone completion photos.

---

## AI Integration

BuildBond uses **GPT-4o Vision** to analyze contractor-submitted photos:

- Photo is encoded as base64 and sent to the `gpt-4o` model
- System prompt frames the AI as a strict independent construction inspector
- Returns: `approved` (boolean), `confidence` (0–1), `reasoning` (plain English explanation)
- Falls back to a mock inspector in development (no API key required to test)

---

## Setup

### Prerequisites
- Node.js 18+
- PayPal Developer sandbox account (free at developer.paypal.com)
- OpenAI API key (optional — mock mode works without it)

### Backend
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your PayPal sandbox credentials and OpenAI key
npm run dev
# Server starts at http://localhost:3001
```

### Frontend
```bash
cd frontend
npm install
npm run dev
# App opens at http://localhost:5173
```

### Seed Demo Data
```bash
cd backend
node src/seed.js
# Creates 2 demo jobs with milestones
```

---

## API Endpoints

### Jobs
| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/jobs` | List all jobs |
| `POST` | `/api/jobs` | Create a new job |
| `GET` | `/api/jobs/:id` | Get job + milestones |

### Payments
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/jobs/:id/initiate-payment` | Create PayPal order, get approve URL |
| `GET` | `/api/jobs/:id/payment-callback` | Handle PayPal return, authorize funds |
| `POST` | `/api/jobs/:id/void-payment` | Cancel job, void authorization |

### Milestones
| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/milestones/:id/submit` | Contractor uploads photo, triggers AI check |
| `POST` | `/api/milestones/:id/dispute` | Homeowner disputes an AI-approved milestone |

---

## Screenshots / Demo

> 📸 *Demo video and screenshots coming soon.*

**Live demo flow:**
1. Run seed: `node src/seed.js`
2. Open http://localhost:5173
3. Click "Kitchen Renovation" → Lock Payment → (use PayPal sandbox)
4. Switch to Contractor View → Upload a photo → Watch AI inspect
5. See payment auto-release on approval

---

## Project Structure

```
buildbond/
├── backend/
│   ├── src/
│   │   ├── index.js        # Express app entry
│   │   ├── db.js           # SQLite setup & schema
│   │   ├── paypal.js       # PayPal Orders v2 helpers
│   │   ├── ai.js           # GPT-4o vision verifier
│   │   ├── routes/
│   │   │   ├── jobs.js     # Job CRUD + payment routes
│   │   │   └── milestones.js  # Milestone submit + dispute
│   │   └── seed.js         # Demo data seeder
│   ├── uploads/            # Contractor photo uploads
│   ├── .env.example
│   └── package.json
└── frontend/
    ├── src/
    │   ├── App.jsx
    │   ├── api.js
    │   └── pages/
    │       ├── HomePage.jsx
    │       ├── CreateJobPage.jsx
    │       ├── JobDetailPage.jsx
    │       └── ContractorView.jsx
    ├── index.html
    └── package.json
```

---

## Why This Wins

- **Real problem**: Billions lost annually to contractor fraud in the US alone
- **Novel mechanic**: PayPal's `AUTHORIZE` intent used as escrow — no third-party escrow service needed
- **AI as the judge**: Removes subjectivity and disputes between parties
- **Zero friction**: No wallet, no crypto, no lawyers — just PayPal (which everyone has)
- **Open source**: MIT licensed, hackathon-ready

---

## License

[MIT](./LICENSE) © 2026 AJ
