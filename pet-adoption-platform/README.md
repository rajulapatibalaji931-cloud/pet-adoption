# PawBridge — Pet Adoption & Care Platform (MERN Stack)

A full-stack **Pet Adoption & Care Platform** built with **MongoDB, Express.js, React (Vite), and Node.js**. It connects verified animal shelters (NGOs) and identity-verified adopters through a transparent pet adoption workflow and automated post-adoption care reminders.

---

## Key Features

- **Role-Based Access Control (RBAC)**: Adopter, NGO / Animal Shelter, and Admin roles with JWT authentication and protected routes.
- **Pet Management & Medical Transparency**: NGOs publish pet profiles with multiple images, veterinary info, medical history, and vaccination certificates (enforced before publishing).
- **Scalable Pet Discovery & Search**: Indexed MongoDB queries, multi-facet filtering (species, breed, min/max age, gender, location, vaccination status, availability), sorting, pagination, and TTL response caching.
- **Adopter Identity Verification**: Submits identity details and address proof to an authorized KYC verification provider (`mock` adapter strictly restricted to `NODE_ENV=development`; external provider required for production). Raw government ID numbers are never persisted in MongoDB.
- **Concurrency-Safe Adoption Workflow**: MongoDB partial unique index prevents duplicate active applications per adopter per pet (while allowing resubmission of cancelled requests), and atomic conditional updates prevent concurrent adoption conflicts.
- **Automated Post-Adoption Care & Reminders**: Finalized adoptions automatically generate care schedules (daily feeding, exercise, vet checkup, grooming, deworming, vaccination boosters). A `node-cron` background job dispatches email and in-app notifications with deduplication keys.
- **Admin Control Center**: NGO verification queue, user suspension, reported listing moderation, Recharts analytics, and security audit logs.

---

## Project Structure

```
pet-adoption-platform/
├── client/                 # React + Vite + Tailwind CSS v4 frontend
├── server/                 # Node.js + Express + Mongoose REST API
├── .env.example            # Environment variable reference
├── .gitignore
├── package.json            # Root convenience scripts
└── README.md
```

---

## Prerequisites

- **Node.js** v18+ (tested on Node v26)
- **MongoDB** running locally (`mongodb://localhost:27017`) or MongoDB Atlas connection URI

---

## Installation & Setup

1. **Install dependencies** (from `pet-adoption-platform/`):
   ```bash
   npm run install:all
   ```

2. **Configure environment variables**:
   - Copy `.env.example` to `server/.env` and update `MONGODB_URI`, `JWT_SECRET`, and external service keys.
   - Set `VITE_API_URL=http://localhost:5000/api` in `client/.env`.

3. **Seed sample data** (creates Admin, Verified/Pending NGOs, Verified/Unverified Adopters, 8 pets, medical records, adoption requests, care schedules, and notifications):
   ```bash
   npm run seed
   ```

4. **Run backend & frontend in development**:
   - Terminal 1 (Backend API on `http://localhost:5000`):
     ```bash
     npm run dev:server
     ```
   - Terminal 2 (Frontend Vite on `http://localhost:5173`):
     ```bash
     npm run dev:client
     ```

---

## Demo Accounts (Password: `Password123!`)

| Role | Name | Email | Status |
| --- | --- | --- | --- |
| **Admin** | Balaji | `balaji@gmail.com` | Active |
| **NGO** | Chandu | `chandu@gmail.com` | Verified |
| **Adopter** | *(Self-registered)* | Register via `/register` | Complete KYC in Dashboard |

---

## External Services Requiring API Keys / Provider Approval

| Service | Purpose | Dev Fallback | Production Env Vars |
| --- | --- | --- | --- |
| **Cloudinary** | Pet image & medical PDF storage | Local `server/uploads/` | `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` |
| **Nodemailer SMTP** | Email notifications & password resets | JSON preview logger | `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM` |
| **Authorized ID Verification Provider** | Adopter KYC (e.g., Persona, Stripe Identity, Onfido) | `ID_VERIFICATION_PROVIDER=mock` (dev only) | `ID_VERIFICATION_PROVIDER=external`, `ID_VERIFICATION_API_URL`, `ID_VERIFICATION_API_KEY`, `ID_VERIFICATION_WEBHOOK_SECRET` |
| **Firebase Cloud Messaging (Optional)** | Web/mobile push notifications | Skipped gracefully | `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` |

---

## REST API Endpoints

### Authentication (`/api/auth`)
- `POST /api/auth/register` — Register Adopter or NGO
- `POST /api/auth/login` — Authenticate and issue JWT
- `POST /api/auth/logout` — Log out and write audit log
- `POST /api/auth/forgot-password` — Request reset token
- `POST /api/auth/reset-password` — Reset password with token
- `GET /api/auth/me` — Get current authenticated user & NGO profile

### Pets (`/api/pets`)
- `GET /api/pets` & `GET /api/pets/search` — Paginated, filtered, sorted pet search
- `GET /api/pets/:id` — Pet details + NGO + medical records
- `POST /api/pets` — Create pet (Verified NGO only; medical & vaccination info required)
- `PUT /api/pets/:id` — Update pet (Owner NGO / Admin)
- `DELETE /api/pets/:id` — Delete pet (Owner NGO / Admin)
- `GET /api/pets/:id/medical-records` & `POST /api/pets/:id/medical-records` — Manage medical logs & certificates
- `POST /api/pets/:id/report` — Report suspicious listing

### Verification (`/api/verification`)
- `POST /api/verification/submit` — Submit identity details & address proof
- `GET /api/verification/status` — Check current verification status
- `POST /api/verification/webhook` — Provider webhook callback (HMAC-SHA256 verified)

### Adoptions (`/api/adoptions`)
- `POST /api/adoptions` — Submit adoption request (Verified Adopter only)
- `GET /api/adoptions/my-requests` — Adopter's applications
- `GET /api/adoptions/ngo-requests` — NGO's incoming applications
- `GET /api/adoptions/pet/:petId` — Applications for a specific pet
- `PUT /api/adoptions/:id/status` — Update status (`Under Review`, `Approved`, `Rejected`, `Completed`)
- `POST /api/adoptions/:id/cancel` — Cancel pending request

### Pet Care (`/api/care`)
- `POST /api/care` — Create care reminder
- `GET /api/care/my-schedules` — Get schedules & adopted pets
- `PUT /api/care/:id` — Update schedule
- `DELETE /api/care/:id` — Delete schedule
- `POST /api/care/:id/complete` — Mark complete & advance recurring date

### Notifications (`/api/notifications`)
- `GET /api/notifications` — List notifications + unread count
- `PUT /api/notifications/:id/read` — Mark single read
- `PUT /api/notifications/read-all` — Mark all read

### Admin (`/api/admin`)
- `GET /api/admin/dashboard` — Platform metrics & chart aggregations
- `GET /api/admin/users` & `PUT /api/admin/users/:id/suspend` — User management
- `GET /api/admin/ngos` & `PUT /api/admin/verification/:id` — NGO & Adopter verification
- `GET /api/admin/reports` & `PUT /api/admin/reports/:id` — Reported listing moderation
- `GET /api/admin/audit-logs` — Security audit trail

---

## Production Deployment Guide

1. **Database**: Provision MongoDB Atlas (M10+ for high scale) and set `MONGODB_URI` with TLS enabled.
2. **Backend**: Deploy `server/` on Render, Railway, AWS ECS, or a containerized Node service behind HTTPS (Nginx/ALB). Set `NODE_ENV=production`, strong `JWT_SECRET`, Cloudinary keys, SMTP credentials, and `ID_VERIFICATION_PROVIDER=external`.
3. **Frontend**: Build static assets (`npm run build`) and deploy `client/dist/` to Vercel, Netlify, or CloudFront with `VITE_API_URL` pointing to your HTTPS API domain.
4. **Monitoring & Backups**: Enable automated daily MongoDB snapshots and monitor `/api/health`.
