---
name: frontend-design
description: >-
  Expert guidelines for crafting distinctive, production-grade frontend web interfaces.
  Enforces human-crafted aesthetics, intentional typography, bespoke color palettes,
  tactile animations, and eliminates generic AI-generated templates.
---

# Frontend Design Craftsmanship Skill

This skill enforces world-class visual polish and intentional UX design for frontend projects. It is specifically designed to eliminate "AI slop" (cliché purples, generic hero gradients, predictable card grids, and artificial corporate tropes) in favor of high-craft, industry-specific web applications.

---

## 1. Core Design Philosophy: Anti-AI Aesthetics

Generic AI designs look identical: dark purple gradients, glowing neon borders, generic floating illustrations, and text like "Supercharge your workflow with next-gen AI". 

### Rules to Eliminate AI Slop:
1. **Never use generic futuristic tropes** unless building a video game or cyber-themed tool.
2. **Never claim AI capabilities** when building standard utilities, SaaS, or commercial consumer apps.
3. **Typography first:** Choose distinctive, intentional typography pairs (e.g., Plus Jakarta Sans + Inter, Space Grotesk + JetBrains Mono, or Playfair + Satoshi).
4. **Authentic textures & depth:** Use subtle 1px border contrast (`rgba(0,0,0,0.06)` or `rgba(255,255,255,0.08)`), natural multi-layered box shadows, and tangible physical elements (status pills, metallic bevels, realistic device frames).
5. **Real-world data & human trust:** Display real avatars, concrete metrics (e.g., "±3.5m accuracy", "324ms carrier latency"), verified timestamps, and regulatory trust signals (GDPR, ISO 27001, carrier networks).

---

## 2. Color System & Contrast Rules

- **The 60-30-10 Distribution Rule:**
  - **60% Dominant:** Clean background & surface (`#f8fafc`, `#ffffff` or clean dark `#0c1524`, `#111827`).
  - **30% Structure:** Text, structural borders, secondary cards, muted badges (`#1e293b`, `#475569`, `#e2e8f0`).
  - **10% Accent:** One signature accent color used deliberately for primary actions and active states (`#10b981` emerald green, `#2563eb` telecom blue, etc.).
- **Contrast Ratios:** Minimum 4.5:1 for standard body text, 3:1 for large headers and prominent interactive buttons (WCAG AA compliant).
- **Surface Elevation:**
  - Level 0 (Base): `#0c1524` or `#f8fafc`
  - Level 1 (Card/Container): `#ffffff` or `#131f33`
  - Level 2 (Elevated/Dropdown/Modal): `#ffffff` or `#1a2942` with shadow `0 20px 25px -5px rgba(0,0,0,0.1), 0 8px 10px -6px rgba(0,0,0,0.1)`

---

## 3. Micro-Interactions & Tactile Polish

1. **State Transitions:** Every interactive button and input must have defined `:hover`, `:active`, and `:focus-visible` styles with smooth easing (`transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1)`).
2. **Audio Feedback (Optional/Tactile):** For scanning, radar, or status checks, leverage the Web Audio API with subtle 440Hz-880Hz sine wave chimes or soft mechanical clicks.
3. **Progress Disclosure:** Multi-step workflows must break complex actions into transparent stages with animated step pills, live telemetry feeds, and real progress calculation.
4. **Mobile Ergonomics:** Ensure 44px+ touch targets on all interactive items, zero horizontal overflow, and sticky conversion bars on viewports under 768px.

---

## 4. Component Standards

- **Header / Navigation:** Sticky top header with subtle backdrop blur (`backdrop-filter: blur(12px)`), high-contrast logo, clean nav links, and distinct CTA button.
- **Hero Section:** Split-screen layout or centered hero with an interactive widget (e.g., live phone lookup, realistic device frame with dynamic island, live animated radar canvas).
- **Trust Strip:** Grayed/monochrome partner carrier badges (Maroc Telecom, Orange, Inwi, Vodafone, AT&T) with realistic opacity hover.
- **Interactive Modals:** Centered backdrop blur with smooth scale-in animation (`transform: scale(0.95)` to `scale(1)`), ESC key dismissal, and clear action pathways.
