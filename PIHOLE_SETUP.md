# Pi-hole Setup — Local DNS for "kazadashboard"

Goal: let any device on the home/office network type `http://kazadashboard` in a
browser and reach the dashboard, instead of needing the mini PC's raw IP address.
Uses a Raspberry Pi 2 running Pi-hole as the network's DNS server, with a custom
Local DNS Record pointing `kazadashboard` at the mini PC.

## 1. Give the mini PC a fixed IP first
Before configuring DNS, the mini PC's IP must not change.
- In your router admin page, find the mini PC's current IP (e.g. `192.168.1.50`)
  and create a **DHCP reservation** for its MAC address so it always gets that IP.
- Confirm with `ipconfig` (Windows) that the IP matches after a reboot.

## 2. Flash the Raspberry Pi 2
- Download **Raspberry Pi Imager** on your PC
- Insert the microSD card
- In Imager: choose OS → **Raspberry Pi OS Lite (32-bit)** (Pi 2 is ARMv7, no 64-bit support)
- Click the gear/settings icon before writing:
  - Enable SSH (set a username/password)
  - Set WiFi if not using Ethernet (Ethernet is recommended for a DNS server)
  - Set hostname, e.g. `pihole`
- Write the image, then insert the SD card into the Pi and power it on

## 3. Connect and set a static IP for the Pi
- Find the Pi's IP (check router's connected devices list, or use `ping pihole.local`)
- SSH in:
  ```
  ssh <username>@<pi-ip>
  ```
- Give the Pi a **DHCP reservation** in your router too (same as step 1), so the
  Pi's IP never changes — every device's DNS settings will point at this IP.

## 4. Install Pi-hole
```bash
curl -sSL https://install.pi-hole.net | bash
```
- Follow the prompts:
  - Choose an upstream DNS provider (e.g. Cloudflare or Google)
  - Keep default blocklists
  - Note the **admin web password** shown at the end of install (or set one with
    `pihole -a -p`)

## 5. Add the local DNS record for kazadashboard
- Open `http://<pi-ip>/admin` in a browser, log in with the admin password
- Go to **Local DNS → DNS Records**
- Add:
  - **Domain**: `kazadashboard`
  - **IP Address**: the mini PC's reserved IP from step 1 (e.g. `192.168.1.50`)
- Click **Add**

## 6. Point your network at the Pi for DNS
Two options — router-wide (recommended) or per-device:

**Router-wide (every device gets it automatically):**
- In your router admin page, find the DNS settings (often under DHCP/WAN settings)
- Set the primary DNS server to the Pi's IP (e.g. `192.168.1.x`)
- Devices may need to reconnect/renew their DHCP lease to pick up the new DNS

**Per-device (if you can't change router DNS):**
- On each device's WiFi network settings, manually set DNS to the Pi's IP

## 7. Test
- From your phone (on the same WiFi), open a browser and go to:
  ```
  http://kazadashboard
  ```
- It should load the dashboard, same as `http://<mini-pc-ip>` does today
- Test ad-blocking is working too: visit a known ad-heavy site and confirm fewer ads,
  or check the Pi-hole admin dashboard's "Queries Blocked" counter is increasing

## 8. Troubleshooting
- **`kazadashboard` doesn't resolve**: confirm the device's DNS server is actually
  the Pi's IP (`ipconfig /all` on Windows, or check WiFi settings on phone)
- **Pi-hole down = no internet for the network**: if the Pi is off, devices using it
  as their *only* DNS server lose all DNS resolution (including normal browsing).
  Set a secondary DNS (e.g. `1.1.1.1`) as a fallback in router settings if this is a concern
- **Mini PC IP changed**: update the Local DNS Record in Pi-hole to match (this is
  why steps 1 and 3 set DHCP reservations — to avoid this)
