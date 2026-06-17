# Remote Access via Tailscale

Goal: be able to remotely connect to the mini PC (the Docker host running
KazaDashboard) from anywhere — to pull updates, rebuild containers, check logs,
and fix issues — without opening any ports on your router to the internet.

Tailscale creates a private VPN ("tailnet") between your devices using WireGuard.
Once installed, devices can reach each other by a stable Tailscale IP/hostname,
regardless of which network they're on.

## 1. Create a Tailscale account
- Go to tailscale.com and sign up (free for personal use, up to 100 devices)
- You can sign in with Google/Microsoft/GitHub — no separate password to manage

## 2. Install Tailscale on the mini PC (server)
- Download the Windows installer from tailscale.com/download
- Install and sign in with the same account
- It runs as a background service — once signed in, the mini PC appears in your
  Tailscale admin console (login.tailscale.com/admin/machines) with a name like
  `thinkcentre` and a Tailscale IP like `100.x.x.x`

**Make it persistent:**
- In the Tailscale admin console, click the mini PC's device → **Disable key expiry**
  (otherwise you'll be locked out after ~6 months and need physical access to re-auth)

## 3. Install Tailscale on your devices
- Install on your laptop (Windows/Mac) and phone (iOS/Android) from the same site/app stores
- Sign in with the same account — they'll all join the same tailnet and can see each other

## 4. Enable remote access to the mini PC

### Option A: Remote Desktop (full GUI access)
Best for: Docker Desktop GUI, general troubleshooting, file management.

On the mini PC:
1. Settings → System → Remote Desktop → turn **On**
2. Note the PC name or use its Tailscale IP

From your laptop:
- Open **Remote Desktop Connection** (`mstsc`)
- Connect to the mini PC's Tailscale IP (e.g. `100.x.x.x`) or its Tailscale name
  (e.g. `thinkcentre`, found in the admin console)
- Log in with the mini PC's Windows account credentials

### Option B: SSH (lightweight, terminal-only)
Best for: quick `git pull` + `docker compose` commands without a full desktop session.

On the mini PC, enable OpenSSH Server (PowerShell as Administrator):
```powershell
Add-WindowsCapability -Online -Name OpenSSH.Server~~~~0.0.1.0
Start-Service sshd
Set-Service -Name sshd -StartupType 'Automatic'
```

From your laptop:
```
ssh <your-windows-username>@<mini-pc-tailscale-ip>
```

## 5. Doing an update / bug fix remotely
Once connected (via RDP terminal or SSH):

```powershell
cd "C:\path\to\KazaDashboard"
git pull
cd "C:\path\to\OrderManagementAPI"
git pull
cd "C:\path\to\KazaDashboard"
docker compose up -d --build
docker compose logs -f backend   # watch for errors, Ctrl+C to exit
```

This is the same workflow as local deployment — Tailscale just gives you a secure
path to run these commands from anywhere.

## 6. Accessing the dashboard itself remotely
With Tailscale installed on your phone/laptop, you can also browse to the dashboard
from outside your home network:
```
http://<mini-pc-tailscale-ip>
```
This is separate from the `kazadashboard` LAN hostname (Pi-hole) setup — that only
works on your local network. The Tailscale IP works from anywhere your phone has
internet, as long as Tailscale is connected.

(Optional) Enable **MagicDNS** in the Tailscale admin console to use a friendly name
like `http://thinkcentre` instead of the raw IP, from any device on your tailnet.

## 7. Security notes
- Only devices you've explicitly signed into your tailnet can connect — Tailscale
  is not exposed to the public internet
- Disable key expiry on the mini PC (step 2) so it doesn't drop off the tailnet unexpectedly
- If you ever lose a device (e.g. phone), remove it from the tailnet in the admin
  console immediately
- For extra safety, you can restrict which devices can reach the mini PC using
  **ACLs** in the Tailscale admin console (Access Controls tab) — e.g. only your
  laptop and phone, not every device on the tailnet
