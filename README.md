# AI Pitch Deck Creator

An AI-powered pitch deck creation platform that enables you to create stunning presentations with automated brand extraction, AI-generated graphics, and beautiful animations.

## Features

### 🎨 Brand Extraction
- Automatically extract brand colors, logos, and assets from any website URL
- Smart color palette detection and assignment
- Logo and favicon extraction
- Image scraping for brand assets

### 🤖 AI-Generated Content
- **Leonardo.ai Integration**: Generate custom slide backgrounds and illustrations
- **IconKit.ai Integration**: Create professional icons that match your brand
- Multiple style options (flat, 3D, isometric, minimal)
- Brand color-aware generation

### ✨ Presentation Mode
- Full-screen presentation with smooth animations
- Multiple transition types (fade, slide, zoom, flip, rotate, bounce)
- Keyboard navigation (arrow keys, space, escape)
- Auto-play with configurable intervals
- Progress tracking and slide thumbnails
- Speaker notes support

### 📁 Reference Materials
- Upload reference files (PDFs, PowerPoint, images, videos)
- Drag-and-drop file upload interface
- Organize files by type and tags
- Link files to specific decks
- Preview uploaded materials
- Maximum 100MB per file
- Secure cloud storage with Supabase Storage

### 🛠️ Advanced Features
- Drag-and-drop slide editor
- Real-time preview
- Collaborative editing with sharing permissions
- Analytics tracking for presentations
- Export to various formats
- Cloud storage with Supabase

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Database**: Supabase (PostgreSQL)
- **State Management**: Zustand
- **AI APIs**: Leonardo.ai, IconKit.ai
- **Web Scraping**: Cheerio, Axios

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Supabase account
- Leonardo.ai API key
- IconKit.ai API key

### Installation

1. **Clone the repository** (or navigate to the project directory)
   ```bash
   cd development/pitch-deck
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**

   Copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

   Fill in your environment variables:
   ```env
   # API Keys
   LEONARDO_API_KEY=your_leonardo_api_key_here
   ICONKIT_API_KEY=your_iconkit_api_key_here

   # Supabase
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

   # App Configuration
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

4. **Set up Supabase database**

   Run the SQL schema in your Supabase SQL editor:
   ```bash
   # Copy the contents of supabase/schema.sql and execute in Supabase dashboard
   ```

   Or use the Supabase CLI:
   ```bash
   supabase db push
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## API Setup

### Leonardo.ai

1. Sign up at [Leonardo.ai](https://leonardo.ai)
2. Navigate to your account settings
3. Generate an API key
4. Add to `.env.local` as `LEONARDO_API_KEY`

### IconKit.ai

1. Sign up at [IconKit.ai](https://iconkit.ai)
2. Get your API key from the dashboard
3. Add to `.env.local` as `ICONKIT_API_KEY`

### Supabase

1. Create a new project at [Supabase](https://supabase.com)
2. Get your project URL and keys from Settings > API
3. Add to `.env.local`
4. Run the database schema from `supabase/schema.sql`
5. **Enable Authentication Providers** (optional):
   - Go to Authentication > Providers in Supabase dashboard
   - Enable Email provider (enabled by default)
   - Enable Google OAuth: Add your Google Client ID and Secret
   - Enable GitHub OAuth: Add your GitHub Client ID and Secret
   - Configure redirect URLs: `http://localhost:3000/auth/callback` (development) and your production URL

## Authentication

The application includes a complete authentication system with:

- **Email/Password Authentication**: Sign up and login with email
- **OAuth Providers**: Google and GitHub sign-in (requires configuration in Supabase)
- **Protected Routes**: Dashboard and editor pages require authentication
- **Session Management**: Automatic session refresh via middleware
- **User-based Access**: Each user can only access their own pitch decks

### Authentication Flow

1. Users sign up at `/signup` or login at `/login`
2. After authentication, users are redirected to `/dashboard`
3. All pitch decks are associated with the authenticated user's account
4. API routes verify authentication before allowing deck operations

## Project Structure

```
pitch-deck/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   └── callback/       # OAuth callback handler
│   │   ├── brand-extract/      # Brand extraction endpoint
│   │   ├── leonardo/           # Leonardo.ai integration
│   │   ├── iconkit/            # IconKit.ai integration
│   │   └── decks/              # Deck CRUD operations
│   ├── login/                  # Login page
│   ├── signup/                 # Sign up page
│   ├── dashboard/              # User dashboard (protected)
│   ├── page.tsx                # Home page
│   └── layout.tsx              # Root layout with AuthProvider
├── components/
│   ├── auth/
│   │   ├── AuthProvider.tsx    # Authentication context provider
│   │   └── ProtectedRoute.tsx  # Protected route wrapper
│   ├── editor/                 # Slide editor components
│   ├── presentation/           # Presentation mode
│   │   ├── PresentationMode.tsx
│   │   └── SlideRenderer.tsx
│   └── slides/                 # Slide templates
├── lib/
│   ├── api/
│   │   ├── leonardo.ts         # Leonardo.ai client
│   │   └── iconkit.ts          # IconKit.ai client
│   ├── brand/
│   │   └── extractor.ts        # Brand extraction utility
│   ├── supabase/
│   │   ├── client.ts           # Supabase client (browser)
│   │   ├── server.ts           # Supabase client (server)
│   │   └── auth.ts             # Authentication utilities
│   └── utils/                  # Utility functions
├── store/
│   └── deckStore.ts            # Zustand state management
├── types/
│   └── deck.ts                 # TypeScript type definitions
├── supabase/
│   └── schema.sql              # Database schema
└── middleware.ts               # Auth session refresh middleware
```

## Usage

### Creating a New Deck

```typescript
import { useDeckStore } from '@/store/deckStore';

const { setCurrentDeck } = useDeckStore();

const newDeck: PitchDeck = {
  id: crypto.randomUUID(),
  name: 'My Pitch Deck',
  slides: [],
  theme: {
    colors: { ... },
    fontFamily: 'Inter'
  },
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

setCurrentDeck(newDeck);
```

### Extracting Brand Assets

```typescript
const { extractBrandAssets } = useDeckStore();

await extractBrandAssets('https://example.com');
// Automatically updates deck with brand colors and assets
```

### Generating AI Graphics

```typescript
const { generateSlideBackground, generateIcon } = useDeckStore();

// Generate background
await generateSlideBackground('slide-id', 'modern tech startup office');

// Generate icon
await generateIcon('slide-id', 'growth chart trending up');
```

### Presentation Mode

```typescript
import PresentationMode from '@/components/presentation/PresentationMode';

<PresentationMode
  slides={deck.slides}
  settings={{
    autoPlay: false,
    enableKeyboardNav: true,
    showNotes: true,
  }}
  onExit={() => setIsPresentationMode(false)}
/>
```

## Animation Types

The platform supports multiple animation types for slides and elements:

- **fade**: Smooth opacity transition
- **slide**: Horizontal sliding animation
- **zoom**: Scale-based zoom effect
- **flip**: 3D flip animation
- **rotate**: Rotation animation
- **bounce**: Spring-based bounce effect
- **none**: No animation

## Database Schema

### Tables

- **pitch_decks**: Main deck storage with JSONB for slides
- **shared_decks**: Collaboration and sharing permissions
- **presentation_analytics**: View tracking and analytics

### Row Level Security

All tables use RLS policies to ensure users can only access their own data or shared decks.

## API Endpoints

### Authentication
All deck-related endpoints require authentication. Include the Supabase session cookie in your requests.

### Brand Extraction
```
POST /api/brand-extract
Body: { url: string }
```

### Leonardo.ai Image Generation
```
POST /api/leonardo/generate
Body: {
  prompt: string,
  type: 'background' | 'illustration',
  brandColors?: string[],
  style?: 'flat' | '3d' | 'isometric' | 'minimal'
}
```

### IconKit.ai Icon Generation
```
POST /api/iconkit/generate
Body: {
  prompt: string,
  style?: 'line' | 'solid' | 'duotone' | '3d' | 'flat' | 'hand-drawn',
  color?: string,
  type?: 'single' | 'set' | 'theme'
}
```

### Deck Operations (Authentication Required)
```
GET    /api/decks          # List all decks for authenticated user
POST   /api/decks          # Create new deck
Body: {
  name: string,
  description?: string,
  brandUrl?: string
}

GET    /api/decks/[id]     # Get specific deck
PUT    /api/decks/[id]     # Update deck
Body: Partial<PitchDeck>

DELETE /api/decks/[id]     # Delete deck
```

**Note**: All deck operations automatically filter by the authenticated user's ID via Row Level Security.

### Reference Materials (Authentication Required)
```
GET    /api/reference-materials          # List all reference materials
       ?deckId=<uuid>                     # Optional: filter by deck
       ?fileType=<type>                   # Optional: filter by file type

POST   /api/reference-materials/upload   # Upload a file
Body: FormData {
  file: File (max 100MB),
  deckId?: string
}

GET    /api/reference-materials/[id]     # Get specific file metadata
PATCH  /api/reference-materials/[id]     # Update file metadata
Body: {
  deck_id?: string,
  tags?: string[],
  notes?: string
}

DELETE /api/reference-materials/[id]     # Delete file and metadata
```

**Supported File Types**: PDF, PPTX, PPT, DOCX, DOC, PNG, JPG, JPEG, GIF, SVG, WEBP, MP4, WEBM, MOV

## Keyboard Shortcuts (Presentation Mode)

- `→` or `Space`: Next slide
- `←`: Previous slide
- `Home`: First slide
- `End`: Last slide
- `F`: Toggle fullscreen
- `Esc`: Exit presentation

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Other Platforms

Ensure you set all required environment variables and configure the build command:
```bash
npm run build
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - feel free to use this project for your own purposes.

## Support

For issues or questions:
- Create an issue on GitHub
- Check the documentation
- Review the code comments

## Roadmap

- [ ] PDF export
- [ ] PowerPoint export
- [ ] More slide templates
- [ ] Voice narration
- [ ] Real-time collaboration
- [ ] Version history
- [ ] Template marketplace
- [ ] Mobile app

---

Built with Next.js, TypeScript, and AI.
