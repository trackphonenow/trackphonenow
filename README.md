# 🛰️ GeoLocate AI - Next-Gen Phone Geolocation & Tracking SaaS Platform

> **A high-converting, professional, and functional alternative to legacy tracking services (such as location-tool.com).**

---

## 🌟 What makes this 10x better than Location-Tool.com?

1. **Ultra-Modern Cyberpunk / SaaS Aesthetics:**
   - Dark Obsidian theme with glowing cyan/emerald accents and glassmorphism.
   - Interactive HTML5 Canvas **Radar Scanner** with sweeping beam and real-time blips.
   - Synthesized Web Audio effects (radar sweep sound, lock chord, target acquired beep).
   - Live ticker feed showcasing verified locations worldwide.

2. **High-Converting Psychological Funnel:**
   - **Carrier & HLR Identification:** Dynamically identifies carrier (Maroc Telecom, Orange, Inwi, SFR, Verizon, etc.) as the user types.
   - **Multi-Step Triangulation Animation:**
     - Step 1: Carrier & HLR Gateway lookup.
     - Step 2: Satellite constellation ping (GPS III / Galileo).
     - Step 3: GSM cell tower triangulation (RSSI signal strength, Cell ID).
     - Step 4: Coordinates locked with blurred satellite map preview and accuracy badge (± 3.8m).
   - **Express Checkout Modal:** Transparent trial ($0.99 / 10 DH) with countdown timer (14:59).

3. **REAL & Functional Geolocation Engine (Not a fake scam):**
   - **Consent-based SMS Tracking Link:** Generates customizable pretext links (Package Delivery, Contact Sharing, Emergency).
   - **Target Mobile Page (`/track.html`):** Captures high-accuracy GPS coordinates (`navigator.geolocation`), IP, device platform, and battery status.
   - **Real-Time Interactive Dashboard (`/dashboard.html`):**
     - Live **Leaflet.js** map with Satellite & Street view toggles.
     - Pulsing accuracy radius circle.
     - Real-time **Server-Sent Events (SSE)**: instantly beeps and zooms in when the target opens the link and shares coordinates!
     - QR code for instantaneous testing with your phone.

---

## 🚀 Quick Start Guide

### 1. Start the Server
Make sure Node.js is installed, then run:
```bash
node server.js
```
or
```bash
npm start
```

### 2. Access the Application:
- 🌐 **Landing Page:** [http://localhost:3000/](http://localhost:3000/)
- 📊 **Live Command Console:** [http://localhost:3000/dashboard.html](http://localhost:3000/dashboard.html)
- 📍 **Demo Target Tracking Page:** [http://localhost:3000/track.html?id=demo-track-iam](http://localhost:3000/track.html?id=demo-track-iam)

---

## 📲 How to Test the Live GPS Ping in 30 Seconds:
1. Open the **Console** at `http://localhost:3000/dashboard.html`.
2. Click **"Track New Phone"** or scan the **QR Code** on the screen with your smartphone camera.
3. Open the link on your smartphone and tap **"Share Location & Confirm"**.
4. Allow browser GPS permission.
5. **Watch your Dashboard screen update in REAL TIME!** It will play a ping sound, update the coordinates, and zoom the satellite map right to your exact doorstep!

---

## 🛠️ Tech Stack:
- **Backend:** Node.js, Express.js, Server-Sent Events (SSE), UUID
- **Frontend:** HTML5, Tailwind CSS, Lucide Icons, Leaflet.js (OpenStreetMap & Esri Satellite)
- **Audio:** Web Audio API (real-time procedural sound synthesis)
- **Visuals:** HTML5 Canvas Radar Animation, Glassmorphism
