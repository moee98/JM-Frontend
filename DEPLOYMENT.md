# Deployment Runbook — Fresh PC Setup

This runbook covers standing up the full stack (frontend + backend + SQL Server, all via
Docker) on a new PC, with the dashboard reachable at `http://kazadashboard`.

The `kazadashboard` hostname is already wired up throughout the codebase:
- CORS policy in `Program.cs` (OrderManagementAPI) allows `http://kazadashboard` / `https://kazadashboard`
- `appsettings.Production.json` JWT `Issuer`/`Audience` are `http://kazadashboard`
- `appsettings.json` Square/eBay `RedirectUri` values point at `http://kazadashboard/api/integrations/...`
- The frontend calls the API via the relative path `/api`, so it works under any hostname automatically
- `nginx.conf` uses a catch-all `server_name _;`, so it accepts the `kazadashboard` hostname

The only thing missing on a fresh PC is a hosts-file entry for `kazadashboard`.

## 1. Prerequisites
- Docker Desktop (with WSL2 backend on Windows)
- Git

## 2. Clone repositories
- Clone `KazaDashboard` (frontend, this repo), e.g. to `C:\Users\<you>\source\repos\KazaDashboard`
- Clone `OrderManagementAPI` (backend), e.g. to `C:\Users\<you>\source\repos\OrderManagementAPI`
- Note the absolute path of the backend clone — it's needed for `BACKEND_PATH` below

## 3. Configure environment
Copy `.env.example` to `.env` in the KazaDashboard repo root and fill in:
- `BACKEND_PATH` — absolute path to the OrderManagementAPI clone from step 2
- `MSSQL_SA_PASSWORD` — strong SQL Server password (8+ chars, upper/lower/digit/special)
- `JWT_KEY` — random 32+ character secret (must stay the same across restarts, or
  existing sessions will be invalidated)
- `SMTP_*` — optional, only needed for "Send Invoice" emails

`.env` is gitignored — never commit it.

## 4. Point "kazadashboard" at this machine
Edit `C:\Windows\System32\drivers\etc\hosts` as Administrator and add:
```
127.0.0.1   kazadashboard
```
This makes `http://kazadashboard` resolve to the Docker host running the nginx
frontend container on port 80. No application config changes are needed — CORS, the
JWT issuer/audience, and integration redirect URIs already use this hostname.

## 5. Build and start the stack
From the KazaDashboard repo root (where `docker-compose.yml` lives):
```
docker compose up -d --build
```
This builds and starts:
- `sqlserver` — SQL Server 2022, persisted in the `sqlserver-data` volume
- `backend` — JMAPI; on startup it auto-applies EF Core migrations
  (`db.Database.Migrate()` in `Program.cs`), creating the `OrderManagement` database
  if it doesn't exist
- `frontend` — nginx serving the built React app and proxying `/api/*` to `backend:5000`

## 6. Verify
- `docker compose ps` — all three containers should be `Up` (sqlserver shows `healthy`)
- `docker compose logs backend --tail 30` — should show migrations applied and
  `Now listening on: http://[::]:5000`
- Open `http://kazadashboard` in a browser — the dashboard should load
- Sign up a new account (first-time use — there's no seeded user)
- Log in — should succeed

## 7. Optional: Square / eBay integrations
Only needed if those dashboards will be used. Once developer accounts exist:
- Add `Square__AppId`, `Square__AppSecret`, `eBay__ClientId`, `eBay__ClientSecret`,
  `eBay__RuName` to the `backend` service `environment:` block in `docker-compose.yml`
  (same pattern as the existing `JwtSettings__Key` override), sourced from new `.env` variables
- Redirect URIs are already configured for `http://kazadashboard/api/integrations/...`
  in `appsettings.json` — register these exact URIs in the Square/eBay developer portals

## 8. Security note
The global exception handler in `Program.cs` returns full exception messages and stack
traces in API responses for debugging. Before this is exposed beyond a trusted local
network, gate it behind `app.Environment.IsDevelopment()` or remove it.
