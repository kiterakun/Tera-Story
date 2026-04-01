# Tera-Story

An AI-powered interactive storytelling platform where you create worlds, characters, and embark on AI-generated adventures with branching narratives.

## Tech Stack

### Backend
- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **AI**: Multi-provider support (OpenAI, Anthropic, Google)
- **Authentication**: JWT with bcrypt password hashing
- **Image Generation**: AI-powered image generation

### Frontend
- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Routing**: React Router
- **i18n**: English & Vietnamese

## Features

- **World Building**: Create and manage fictional worlds with unique lore
- **Character Creation**: Design characters with traits and backgrounds
- **AI Story Generation**: Dynamically generated stories with branching choices
- **Playthrough System**: Track your journey with inventory and choices
- **Image Generation**: AI-generated images for characters, items, and worlds
- **User Authentication**: Secure login and registration
- **Settings Management**: Customize your experience

## Project Structure

```
Tera-Story/
├── backend/                 # Express.js API server
│   ├── src/
│   │   ├── agents/         # AI agents for story generation
│   │   ├── config/         # Configuration files
│   │   ├── middleware/     # Express middleware
│   │   ├── models/         # Mongoose models
│   │   ├── providers/      # AI provider integrations
│   │   ├── routes/         # API routes
│   │   ├── services/       # Business logic services
│   │   ├── types/          # TypeScript type definitions
│   │   └── index.ts        # Entry point
│   └── uploads/            # Uploaded files storage
├── frontend/               # React application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── i18n/           # Internationalization
│   │   ├── lib/            # Utility libraries
│   │   ├── pages/          # Page components
│   │   ├── services/       # API services
│   │   ├── stores/          # Zustand stores
│   │   └── utils/          # Helper functions
│   └── public/             # Static assets
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB instance
- API keys for AI providers (OpenAI, Anthropic, Google)

### Backend Setup

```bash
cd backend
cp .env.example .env
# Edit .env with your configuration
npm install
npm run dev
```

### Frontend Setup

```bash
cd frontend
cp .env.example .env
# Edit .env with your backend URL
npm install
npm run dev
```

### Environment Variables

**Backend (.env):**
```
PORT=3000
MONGODB_URI=mongodb://localhost:27017/tera-story
JWT_SECRET=your-secret-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

**Frontend (.env):**
```
VITE_API_URL=http://localhost:3000
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user

### Worlds
- `GET /api/worlds` - List all worlds
- `POST /api/worlds` - Create a new world
- `GET /api/worlds/:id` - Get world details
- `PUT /api/worlds/:id` - Update world
- `DELETE /api/worlds/:id` - Delete world

### Characters
- `GET /api/characters` - List characters
- `POST /api/characters` - Create character
- `GET /api/characters/:id` - Get character details
- `PUT /api/characters/:id` - Update character
- `DELETE /api/characters/:id` - Delete character

### Stories
- `GET /api/stories` - List stories
- `POST /api/stories` - Create story
- `GET /api/stories/:id` - Get story details
- `POST /api/stories/:id/chapters` - Generate new chapter

### Playthroughs
- `GET /api/playthroughs` - List playthroughs
- `POST /api/playthroughs` - Start new playthrough
- `GET /api/playthroughs/:id` - Get playthrough details
- `PUT /api/playthroughs/:id` - Update playthrough
- `POST /api/playthroughs/:id/choice` - Make a choice

### Items & Special Items
- `GET /api/items` - List items
- `POST /api/items` - Create item
- `GET /api/special-items` - List special items
- `POST /api/special-items` - Create special item

### Settings
- `GET /api/settings` - Get user settings
- `PUT /api/settings` - Update user settings

### Images
- `POST /api/images/generate` - Generate AI image
- `POST /api/images/upload` - Upload image

### Support
- `POST /api/support/story` - Story generation support
- `POST /api/support/context` - Context management support

## Scripts

### Backend
```bash
npm run dev      # Development with hot reload
npm run build   # Build for production
npm start       # Start production server
```

### Frontend
```bash
npm run dev     # Development server
npm run build   # Build for production
npm run lint    # Run ESLint
npm run preview # Preview production build
```

## License

ISC
