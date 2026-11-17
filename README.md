# FightLab — Street Fighter 6 Training Hub

FightLab is a full-stack Street Fighter 6 training companion. Visitors can browse fighters, guides, frame data, and patch notes. Registered users can manage training sessions, calendar dates, and player progress.

## Technology
- Frontend: React, Vite, React Router, Lucide icons
- Backend: Node.js, Express 5, JWT, bcryptjs, Mongoose
- Database: MongoDB
- Architecture: React UI → Express routes/middleware/controllers → Mongoose models → MongoDB

## Running the project
Requires Node.js 22+, npm and MongoDB. Install dependencies in the project root and `server/` with `npm install`. Configure `MONGO_URI` and `JWT_SECRET` in a local `server/.env` (see `.env.example`). Run `npm run dev` separately in `server/` and the project root. Default local URLs: API `http://localhost:5000`, website `http://localhost:5173`.

## Available features
- Fighter database, search, character details, guides, frame data, and patch news
- Registration, login, JWT-protected account actions, and profile
- Authenticated training planner: create, list, edit, reschedule, complete/cancel, and delete sessions
- Calendar and progress/profile views

## API overview
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET/POST /api/training-plans`
- `GET/PATCH/DELETE /api/training-plans/:id`
- `GET /api/health`
Other route modules are in `server/routes/`.

## Tests
From `server/`, run `npm test`. On November 17, 2026, the recorded local run completed **28 passing test entries, 0 failures, 0 skipped**. Coverage includes schema validation, JWT middleware, and Express HTTP route behavior with mocked persistence. This is **not** a live MongoDB integration test or browser end-to-end test. See [testing report](docs/testing/TEST_REPORT.md) and [test screenshot](docs/testing/automated-test-results.png).

## Capstone evidence
- [Architecture documentation](docs/architecture/ARCHITECTURE.md)
- [Project planning and milestones](docs/planning/MILESTONES.md)
- [Testing report and evidence](docs/testing/TEST_REPORT.md)
- [Figma design evidence](docs/figma/README.md), including [desktop screen overview](docs/figma/figma-design-overview.png) and [prototype connections](docs/figma/figma-prototype-connections.png)

**Figma design:** https://www.figma.com/design/ApKdHEsPQ4DtBRoaUq24B5/FightLab?node-id=7-3213

The Figma prototype includes seven connected desktop screens and training planner interaction states. Navigation was manually confirmed working. The Figma link may require access permission; screenshots are provided in the repository. The final project report and presentation are submitted separately.


## Repository
https://github.com/Henrog94/Street-Fighter-Training-Hub
