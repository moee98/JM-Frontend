I built a full-stack business management system from scratch — here's what I shipped.

Running a service business means juggling jobs, customers, invoices, expenses, and payments across spreadsheets, emails, and sticky notes. I wanted one dashboard to replace all of that.

**What it does:**
→ Create and track work orders from open to paid
→ Manage customer & vehicle records with inspection forms and image attachments
→ Generate and email VAT invoices in one click
→ Log expenses with categorised reporting and file attachments
→ Record split payments across multiple payment methods
→ Schedule jobs on a calendar view
→ Integrates with eBay and Square

**Tech I used:**
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS 4 + TanStack Query + Zustand
- **Backend**: ASP.NET Core (.NET 10) + Entity Framework Core + SQL Server
- **Auth**: JWT with HttpOnly cookies + role-based access control
- **Deployment**: Docker Compose + Nginx, self-hosted on a local Windows server

**What I learned:**

Building something end-to-end — from DB schema to React component — forces you to think about every layer. The biggest lessons were around keeping service abstractions clean in C# and managing async state predictably on the frontend with Zustand + TanStack Query.

The project is open source — happy to chat about the architecture or the problems it solves.

🔗 GitHub: https://github.com/moee98/jm-frontend | https://github.com/moee98/jm-api

#FullStack #React #DotNet #TypeScript #OpenSource #SideProject #SoftwareEngineering #WebDevelopment
