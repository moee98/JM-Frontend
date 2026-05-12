# Job Manager Frontend

A full-stack business management dashboard for managing jobs, customers, vehicles, invoicing, and expenses. Built for internal use at a service-based business and self-hosted on a local Windows server.

**Backend repo:** [JobManager-API](https://github.com/moee98/JobManager-API)

## Features

- **Job management** — create, assign, track, and complete work orders with status updates
- **Customer & vehicle records** — store customer details, linked vehicles, and vehicle inspection history
- **Invoicing** — generate itemised invoices with VAT calculation and send directly to customers by email
- **Expense tracking** — log business expenses with category management and reporting
- **Payments** — record split and multiple payment methods per job
- **Integrations** — connect to third-party platforms (eBay, Square)
- **Notifications** — in-app notification feed for key business events
- **Authentication** — JWT-based login with refresh tokens and role-based access control
- **Dark / light theme** — full theme toggle support

## Tech Stack

| Area | Technology |
|------|-----------|
| Framework | React 18, TypeScript |
| Build tool | Vite |
| Routing | React Router v6 |
| State management | Zustand |
| HTTP client | Axios |
| Styling | Tailwind CSS |
| Charts | ApexCharts |
| Containerisation | Docker, nginx |

## Getting Started

### Prerequisites

- Node.js 20+
- The [backend API](https://github.com/moee98/JobManager-API) running locally or via Docker

### Local development

```bash
npm install
npm run dev
```

The dev server starts on `http://localhost:5173` and proxies `/api/*` requests to the backend.

### Docker (recommended for deployment)

Copy the environment template and fill in your values:

```bash
cp .env.example .env
```

Then start all services (SQL Server + backend + frontend):

```bash
docker compose up -d
```

The dashboard is served at `http://localhost` (port 80).

See `.env.example` for all required environment variables.

## Environment Variables

| Variable | Description |
|----------|-------------|
| `BACKEND_PATH` | Absolute path to the backend project folder |
| `MSSQL_SA_PASSWORD` | SQL Server SA password |
| `JWT_KEY` | Secret key for signing JWT tokens |
| `SMTP_HOST` | SMTP server hostname |
| `SMTP_PORT` | SMTP server port |
| `SMTP_USER` | SMTP username / email address |
| `SMTP_PASS` | SMTP password or app password |
| `SMTP_FROM` | Sender display name |

## Project Structure

```
src/
├── components/     # Shared UI components
├── hooks/          # Custom React hooks
├── pages/          # Route-level page components
│   ├── Jobs/       # Job management pages
│   ├── Expenses/   # Expense tracking pages
│   └── Integrations/ # Third-party integration pages
├── services/       # Axios API service modules
├── store/          # Zustand auth store
└── types/          # TypeScript type definitions
```

## Deployment

The project is designed for self-hosted deployment on a Windows mini PC using Docker Compose. nginx acts as a reverse proxy, routing `/api/*` to the ASP.NET Core backend and serving the React SPA for all other routes.

An alternative `public/web.config` is included for IIS-based deployments.

