# MedCare AI — Frontend

Next.js (App Router) + TypeScript + Tailwind CSS + lucide-react.

## Run locally

```bash
cd frontend
npm install
cp .env.example .env.local
npm run dev
```

App: http://localhost:3000

## Environment

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_API_URL` | Base URL of the FastAPI backend |

`NEXT_PUBLIC_*` values are baked in at build time, so changing the API URL on a
hosted deploy requires a rebuild.

## Structure

```
app/
  layout.tsx        root layout + metadata
  page.tsx          renders the landing page
  globals.css       Tailwind layers, theme base, component classes
components/
  LandingPage.tsx   section order: Navbar, Hero, Features, Consultation, CTA, Footer
  Navbar.tsx        sticky nav, mobile sheet, scroll-to-consultation helper
  Hero.tsx          headline, ambient gradient, primary CTAs
  Features.tsx      feature grid, RAG explanation, how-it-works steps
  Consultation.tsx  orchestrates quiz -> chat -> result
  ConsultationQuiz.tsx  five-step assessment (symptoms, duration, severity, other, notes)
  Chatbot.tsx       chat UI: bubbles, typing indicator, suggested answers, composer
  ResultDashboard.tsx   risk level, reported data, guidance, next steps, sources
  EmergencyAlert.tsx    prominent urgent-attention card
  SelectableCard.tsx    answer card with cyan border + glow + check icon
  LoadingState.tsx / ErrorState.tsx   async states
lib/
  api.ts            typed client, status-code-aware error messages
  constants.ts      quiz options and risk-level styling
```

## Design identity

Background `#07111f`, surface `#0d1b2a`, accent `#22d3ee`. Defined in
`tailwind.config.js` as `base`, `surface`, and `accent`.

## Notes

- Every button performs a real action — nothing is decorative.
- The composer uses a 16px base font size on mobile so iOS does not zoom on focus.
- Motion is disabled under `prefers-reduced-motion`.
