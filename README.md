# 10x Cards

> A web application for students to rapidly create and manage educational flashcards, leveraging AI generation and spaced-repetition sessions.

## Table of Contents

1. [Project Description](#project-description)
2. [Tech Stack](#tech-stack)
3. [Getting Started](#getting-started)
4. [Available Scripts](#available-scripts)
5. [Project Scope](#project-scope)
6. [Project Status](#project-status)
7. [License](#license)

---

## Project Description

10x Cards empowers learners to generate high-quality flashcards in seconds, either by:

- Pasting 1,000–10,000 characters of text to auto-generate 10 AI-powered flashcard candidates (with progress feedback).
- Editing generated candidates on the client-side before saving collections.
- Manually creating custom flashcards (front/back) individually or as collections.
- Saving flashcard collections with automatic source tracking (AI, AI-edited, manual).
- Managing collections with pagination, search, edit, and delete.
- Launching spaced-repetition study sessions via an integrated open-source library.

---

## Tech Stack

- **Frontend**
  - Astro 5
  - React 19
  - TypeScript 5
  - Tailwind CSS 4
  - Shadcn/ui (Radix + Tailwind components)
  - Lucide-React (icons)
  - Radix Slot
  - tailwind-merge
  - tw-animate-css

- **Backend**
  - Supabase (PostgreSQL & Auth SDK)

- **AI Integration**
  - Openrouter.ai (supports OpenAI, Anthropic, Google, etc.)

- **Testing**
  - Vitest (unit & integration tests)
  - React Testing Library (component tests)
  - Playwright (E2E tests)
  - MSW - Mock Service Worker (API mocking)

- **CI/CD & Hosting**
  - GitHub Actions
  - Docker & DigitalOcean

---

## Getting Started

### Prerequisites

- **Node.js** v22.14.0 (see `.nvmrc`)
- **npm** (bundled with Node)
- A **Supabase** project with:
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
- An **Openrouter.ai** API key: `OPENROUTER_API_KEY`

### Installation

```bash
git clone https://github.com/<YOUR_USERNAME>/10x-cards.git
cd 10x-cards
nvm use
npm install
```

### Environment Variables

Create a `.env` file in the project root with:

```dotenv
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
OPENROUTER_API_KEY=your-openrouter-api-key
```

### Run Locally

```bash
npm run dev
```

Open your browser at `http://localhost:3000` (default Astro port).

---

## Available Scripts

| Command            | Description                    |
| ------------------ | ------------------------------ |
| `npm run dev`      | Start Astro development server |
| `npm run build`    | Build for production           |
| `npm run preview`  | Preview production build       |
| `npm run astro`    | Astro CLI (e.g., `astro add`)  |
| `npm run lint`     | Run ESLint                     |
| `npm run lint:fix` | Run ESLint with auto-fix       |
| `npm run format`   | Format code with Prettier      |

---

## Project Scope

### Features

- User authentication (register, login, logout)
- AI flashcard candidate generation (input validation, progress bar)
- Client-side editing of AI-generated candidates
- Collection saving with source tracking (AI, AI-edited, manual)
- Manual flashcard creation (individual or batch)
- Collection management: pagination, search, edit, delete
- Spaced-repetition study sessions
- Input validation & clear error messaging
- Informational tooltips on hover

### Boundaries

- Relies on third-party spaced-repetition library (no custom algorithm)
- No PDF/DOCX imports or rich-text formatting
- No sharing of sets, multi-deck, or tagging support
- No mobile app or native client
- No subscription or monetization features

---

## Project Status

**MVP / In Active Development**  
This project is under active development. Core features are being implemented and refined according to the product requirements (PRD).

---

## License

_No license specified._  
Please add a `LICENSE` file to clarify usage and distribution rights.
