# TNSF E-Journal Platform (starter implementation)

Separate public website + admin/editor dashboard + API. Built with React/Vite, Express, MongoDB Atlas, JWT authentication, and an originality-screening endpoint.

> **Government-project caution:** This is a production-minded starter, not a security certification or a completed government procurement deliverable. Before public deployment, commission security testing, accessibility testing, backup/restore drills, privacy/legal review, and review the hosting/data-residency requirements. Do not use any screening score as the sole basis for rejecting an article.

## Repository layout

```text
tnsf-ejournal-platform/
├── public-site/       # Public journal website
├── admin-dashboard/   # Separate protected dashboard
├── backend/           # REST API, authentication, journal data, screening
├── docker-compose.yml
└── .env.example
```

## Prerequisites
- Node.js 20 LTS or newer
- npm
- MongoDB Atlas account (or local MongoDB)
- Optional: Docker

## 1. Configure environment
Copy `.env.example` to `backend/.env` and fill in:
- `MONGODB_URI`
- `JWT_SECRET` (generate a long random secret)
- `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`
- `PUBLIC_SITE_URL`, `ADMIN_SITE_URL`
- `UPLOAD_DIR` (defaults to `backend/uploads`)

Never commit `.env`. Use a secrets manager in production.

## 2. Install dependencies
Open a terminal in the repository root:

```bash
cd backend && npm install
cd ../public-site && npm install
cd ../admin-dashboard && npm install
```

## 3. Seed the first administrator
From `backend/`:

```bash
npm run seed:admin
```

This creates the administrator only if the email does not already exist. Use a unique password and rotate it after first login. The seed script reads `backend/.env`.

## 4. Run locally (three terminals)
Terminal 1:
```bash
cd backend
npm run dev
```
API health: http://localhost:8000/api/health

Terminal 2:
```bash
cd public-site
npm run dev
```
Public website: http://localhost:5173

Terminal 3:
```bash
cd admin-dashboard
npm run dev
```
Admin dashboard: http://localhost:5174

Vite proxies `/api` to `http://localhost:8000` for local development.

## 5. First use
1. Sign in to the admin dashboard with the seeded admin account.
2. Create a journal issue.
3. Create an article and attach its metadata. This starter stores article metadata; PDF upload UI/storage is intentionally a follow-on integration.
4. Publish the article when editorial approval is complete.
5. Open the public website and browse the article.
6. Use **Originality screening** from the dashboard to submit article text. It compares the text against published articles in this journal's own database.

## 6. Originality / copied-content screening
The API endpoint `POST /api/screening/check`:
- normalizes text and compares word-shingle overlap against published articles stored in this journal database;
- returns matched internal article IDs/titles and similarity estimates;
- includes a transparent heuristic writing-style indicator, which is **not a reliable AI-writing detector**;
- never labels an article definitively as plagiarized or AI-generated.

This does not check the entire internet, subscription databases, Turnitin/iThenticate, Crossref Similarity Check, or other publisher corpora. For broader similarity screening, obtain an authorized service/API and confirm licensing, privacy, and data-processing terms. AI-text detectors can produce false positives and false negatives, especially for multilingual writing and edited text. Human editorial review is required.
## 7. Production deployment
Deploy the three applications separately:
- `backend/` as a Node web service; set its environment variables in the hosting dashboard.
- `public-site/` as a static site with build command `npm run build`, output `dist`.
- `admin-dashboard/` as a separate static site with build command `npm run build`, output `dist`.

Set `VITE_API_BASE` to the API base URL for both frontends, e.g. `https://api.example.gov.in/api`. Configure CORS using exact production origins. Configure HTTPS, domain/DNS, storage, backups, monitoring, and a security review before launch. For static hosting, configure SPA fallback to `index.html`.

### Deployment checklist
- [ ] Production secrets are unique, strong, and not committed.
- [ ] Restrict CORS to known origins.
- [ ] Use managed/private object storage for manuscripts/PDFs; do not expose unpublished manuscripts publicly.
- [ ] Configure database least-privilege credentials, network access restrictions, and backups.
- [ ] Add email verification, password reset, MFA for privileged accounts, and account lockout before launch.
- [ ] Add audit-log retention policy and security monitoring.
- [ ] Review data protection, accessibility, government hosting, and procurement requirements.
- [ ] Run dependency, penetration, and restore tests.
- [ ] Use an approved plagiarism provider if external corpus coverage is required.
- [ ] Obtain editorial approval for every publication.

## API overview
- `GET /api/health`
- `GET /api/articles`
- `GET /api/articles/:slug`
- `GET /api/issues`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `GET /api/admin/articles` (authenticated)
- `POST /api/admin/articles` (editor/admin)
- `PATCH /api/admin/articles/:id` (editor/admin)
- `DELETE /api/admin/articles/:id` (admin)
- `POST /api/admin/issues` (editor/admin)
- `POST /api/screening/check` (editor/admin)

## Important limitations
- This starter is not an official TNSF product and is not affiliated with a government department.
- Sample content is clearly marked as demo content; replace it with authorized, verified material.
- Production article submission/reviewer assignment, PDF object storage, email notifications, password reset/MFA, and external plagiarism-provider integration still need implementation and acceptance testing.
