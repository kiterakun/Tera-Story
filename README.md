# 🌌 Tera-Story

> An AI-powered interactive storytelling platform where you create worlds, characters, and embark on dynamically generated adventures with branching narratives.

---

## 📋 Table of Contents
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [API Reference](#-api-reference)
- [Scripts](#-scripts)

---

## ✨ Features

- **🌍 World Building**: Create and manage intricate fictional worlds with rich lore.
- **👤 Character Creation**: Design diverse characters with unique traits and backgrounds.
- **📖 AI Story Generation**: Experience dynamically generated stories tailored to your choices.
- **🛤️ Playthrough System**: Embark on interactive journeys, track your inventory, and make branching choices.
- **🎨 AI Image Generation**: Automatically generate beautiful visuals for characters, items, and worlds.
- **🎯 Player Progression**: Earn XP, level up, and unlock stat boosts as you play (Supports Level 1-50+).
- **🗣️ Whispers of the World**: AI-generated world rumors, letters, and news that evolve based on your story.
- **⏳ Echoes System**: Delayed consequences — choices made early in a playthrough return to affect later chapters.
- **🌐 Localization**: Full support for English and Vietnamese (i18n).
- **🔒 Security**: Secure user authentication and authorization using JWT.
- **⚙️ Customization**: Comprehensive settings management to tailor your experience.
- **🏆 Achievement System**: Unlock 40+ achievements across 6 categories with progress tracking and toast notifications.
- **🃏 Story Gallery**: Collect unique story cards from pivotal scenes — each with rarity tiers and social sharing.
- **📜 Chronicle**: Auto-generated playthrough timeline with arc summaries, stats, and shareable recap.
- **📅 Daily Engagement**: Login streaks, daily quests, 7-day reward calendar, and streak freeze protection — build daily habits.
- **🕸️ Fate Threads**: Interactive branch visualization showing story paths taken and ghost threads unexplored. Peek into "what if" alternate timelines.
- **👥 Social Features**: Friend system, leaderboards, story sharing, and granular privacy controls — opt-in community layer.
- **🗺️ Interactive World Map**: AI-generated world maps with 3-level zoom (continent → region → location), Voronoi-based territory rendering, dynamic location discovery during gameplay, and d3-powered SVG visualization — node-based travel between discovered locations with terrain type coloring and real-time SSE updates.

---

## 🛠️ Tech Stack

### Frontend (Client)
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v4
- **State Management**: Zustand
- **Routing**: React Router v7
- **Icons & UI**: Lucide React, Sonner (Toasts)
- **HTTP Client**: Axios

### Backend (Server)
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js v5
- **Database**: MongoDB with Mongoose v9
- **AI Integration**: Vercel AI SDK (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`)
- **Authentication**: JWT & bcryptjs
- **Validation**: Zod

---

## 📁 Project Structure

```text
Tera-Story/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── agents/         # AI agents for story & image generation
│   │   ├── config/         # Configuration & Environment setup
│   │   ├── middleware/     # Express middlewares (Auth, Error handling)
│   │   ├── models/         # Mongoose database schemas
│   │   ├── providers/      # AI provider integrations
│   │   ├── routes/         # REST API routes
│   │   ├── services/       # Core business logic
│   │   ├── types/          # TypeScript definitions
│   │   └── index.ts        # Application entry point
│   └── uploads/            # Local storage for media
│
├── frontend/               # React Application
│   ├── src/
│   │   ├── assets/         # Static assets & images
│   │   ├── components/     # Reusable UI components (Cards, Modals)
│   │   ├── hooks/          # Custom React hooks
│   │   ├── i18n/           # Translation files (en, vi)
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Application views (Reader, Playthrough, etc.)
│   │   ├── services/       # API integration layers
│   │   ├── stores/         # Zustand state stores
│   │   ├── types/          # TypeScript interfaces
│   │   └── utils/          # Helper functions
│   └── public/             # Public static files
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [MongoDB](https://www.mongodb.com/) (Local instance or Atlas)
- API Keys for your preferred AI providers (OpenAI, Anthropic, or Google)

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Edit .env with your MongoDB URI and API keys
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Ensure VITE_API_URL points to your backend
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

```env
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tera-story
JWT_SECRET=your-super-secret-jwt-key

# AI Provider Keys
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key
GOOGLE_API_KEY=your-google-api-key
```

### Frontend (`frontend/.env`)

```env
VITE_API_URL=http://localhost:3000
```

---

## 🔌 API Reference

| Resource | Endpoint | Description |
|----------|----------|-------------|
| **Auth** | `POST /api/auth/register` | Register a new user |
| | `POST /api/auth/login` | Authenticate user & get token |
| | `GET /api/auth/me` | Get current user profile |
| **Worlds** | `GET /api/worlds` | List all available worlds |
| | `POST /api/worlds` | Create a new world |
| | `GET /api/worlds/:id` | Get world details |
| **Characters** | `GET /api/characters` | List all characters |
| | `POST /api/characters` | Create a new character |
| **Stories** | `GET /api/stories` | List stories |
| | `POST /api/stories/:id/chapters` | Generate a new story chapter via AI |
| **Playthroughs**| `POST /api/playthroughs` | Start a new playthrough |
| | `POST /api/playthroughs/:id/choice`| Submit a user choice & advance story |
| | `GET /api/playthroughs/:id/echoes`| List echoes for a playthrough |
| | `GET /api/playthroughs/:id/whispers`| Get cached whispers for a playthrough |
| **Progression**| `GET /api/user/progress` | Get user XP, level, and stats |
| | `POST /api/user/xp` | Award XP to a user |
| | `GET /api/user/level-history`| Get level-up history |
| **Images** | `POST /api/images/generate`| Generate AI images |

> *Note: This is a partial list. Most resources support full CRUD operations.*

---

## 📜 Scripts

### Backend
- `npm run dev` - Start development server with hot-reload (`ts-node-dev`)
- `npm run build` - Compile TypeScript to JavaScript
- `npm start` - Run the compiled production build

### Frontend
- `npm run dev` - Start Vite development server
- `npm run build` - Create production build
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint checks

---

## 📄 License
This project is licensed under the **ISC License**.
