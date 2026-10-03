<div align="center">

# SonbhadraConnect

### Discover Sonbhadra Through Local Eyes

**The definitive digital platform connecting tourists with verified local creators across Sonbhadra, Uttar Pradesh — India''s most underexplored tribal district.**

[![GitHub repo](https://img.shields.io/badge/GitHub-AshishDubey5%2FSonbhadra--Connect-181717?style=for-the-badge&logo=github)](https://github.com/AshishDubey5/Sonbhadra-Connect)
[![License: MIT](https://img.shields.io/badge/License-MIT-orange?style=for-the-badge)](./Frontend/LICENSE)

</div>

---

## Table of Contents

- [About the Project](#-about-the-project)
- [Live Demo](#-live-demo)
- [Key Features](#-key-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Pages and Screens](#-pages-and-screens)
- [API Reference](#-api-reference)
- [Database Models](#-database-models)
- [Getting Started](#-getting-started)
- [Environment Variables](#-environment-variables)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Author](#-author)

---

## About the Project

**SonbhadraConnect** is a full-stack local tourism platform built to put **Sonbhadra, Uttar Pradesh** on the map — through the stories, trails, and lens of its native creators.

Sonbhadra is India''s second-largest district by area, rich with ancient cave pictographs, Vindhyan plateaus, tribal culture, the Son and Rihand rivers, and forgotten forts. Yet it remains one of the most undiscovered destinations in the country. SonbhadraConnect bridges that gap.

### The Mission

> "Let locals lead, let travellers connect."

The platform operates on a **win-win ecosystem**:

- **Tourists** discover authentic, off-the-beaten-path experiences guided by people who actually live there.
- **Local Creators** (guides, photographers, researchers, videographers) monetise their knowledge, grow their audience, and preserve local heritage.

---

## Live Demo

> The frontend is deployable via **Vercel** and the backend via any Node.js host (Railway, Render, etc.).

| Layer    | Stack       | Default Port |
|----------|-------------|------|
| Frontend | Static HTML | 3000 |
| Backend  | Express API | 8000 |

---

## Key Features

### For Tourists
- **Discover Destinations** — curated cards for Sonbhadra''s top spots: Rihand Dam, Vijaygarh Fort, Lakhaniya Dari, Agori Fort, Mukha Falls, Salkhan Fossils Park
- **Editorial Stories** — long-form narratives written by local creators
- **Creator Profiles** — verified local guide profiles with specialities, stats, and content
- **Video Showcase** — cinematic reel section featuring drone and trail footage
- **Experience Booking** — book guided treks, heritage walks, river trails, and village stays
- **Tourist Auth** — sign-up / sign-in with JWT-secured sessions

### For Creators
- **Creator Dashboard** — analytics, booking overview, coverage hotspot map
- **Media Management** — upload and manage photos/videos via Cloudinary
- **Story Publishing** — write and publish travel editorials
- **Area Coverage Tags** — define coverage zones for discovery by tourists
- **Creator Auth** — secure JWT access + refresh token system

### Platform-Wide
- **Creator Filtering** — filter by speciality: Trail & Treks, Aerial Cinematography, Heritage & History
- **Fully Responsive** — mobile-first design that adapts across all viewports
- **Reveal Animations** — smooth scroll-triggered section animations
- **Dark Design System** — premium dark-mode-first aesthetic with glassmorphism effects
- **SEO Optimised** — semantic HTML, meta tags, OG/Twitter cards on every page

---

## Tech Stack

### Frontend

| Category | Technology | Details |
|---|---|---|
| **Structure** | HTML5 | Semantic, accessible markup |
| **Styling** | Vanilla CSS | Custom design system with CSS custom properties |
| **Logic** | Vanilla JavaScript ES Modules | Module-based, no build step needed |
| **Typography** | Google Fonts | Inter · Outfit · Space Grotesk |
| **Media CDN** | Cloudinary | Creator avatars and destination images |
| **Dev Server** | `serve` (npm) | Local static file serving |
| **Deployment** | Vercel | `vercel.json` with URL rewrite rules |

**CSS Design System Highlights:**
- CSS Custom Properties (tokens) for colours, typography, spacing, and shadows
- Component-level stylesheets: `_nav.css`, `_cards.css`, `_buttons.css`
- Section-level stylesheets: `_hero.css`, `_creators.css`, `_destinations.css`
- Utility helpers for layout and visibility

### Backend

| Category | Technology | Details |
|---|---|---|
| **Runtime** | Node.js | ES Module (`"type": "module"`) |
| **Framework** | Express.js v5 | REST API with global error middleware |
| **Database** | MongoDB | Atlas cloud-hosted |
| **ODM** | Mongoose v9 | Schema validation and aggregation pipelines |
| **Auth** | JSON Web Tokens (JWT) | Access + Refresh token dual-token strategy |
| **Password Hashing** | bcrypt | Secure credential storage |
| **File Uploads** | Multer | Multipart form-data handling |
| **Media Storage** | Cloudinary SDK v2 | Image and video upload pipeline |
| **CORS** | `cors` package | Whitelist-based origin validation |
| **Cookies** | `cookie-parser` | HTTP-only cookie management |
| **Dev Tooling** | nodemon + prettier | Hot reload and code formatting |

---

## Project Structure

```
Sonbhadra-Connect/
├── .gitignore                         # Root gitignore (covers both layers)
├── README.md
│
├── Frontend/                          # Static frontend application
│   ├── index.html                     # Root redirect to src/app/index.html
│   ├── vercel.json                    # Vercel deployment and URL rewrite rules
│   ├── serve.json                     # Local dev server config
│   ├── package.json
│   ├── .env.example
│   ├── public/
│   │   └── assets/images/
│   │       ├── destinations/          # Destination WebP images
│   │       └── creators/              # Creator portrait WebP images
│   └── src/
│       ├── app/                       # All HTML pages
│       │   ├── index.html             # Main homepage (all sections)
│       │   ├── book.html              # Booking page
│       │   ├── destinations/          # Destination detail pages (slugs)
│       │   ├── stories/               # Stories listing and detail
│       │   ├── Creators/              # Creator-facing pages
│       │   │   ├── auth/              # Creator sign-in and register
│       │   │   ├── dashboard/         # Creator public-facing directory
│       │   │   └── creator/
│       │   │       ├── dashboard/     # Creator private dashboard
│       │   │       └── profiles/      # Individual creator profile pages
│       │   └── tourists/              # Tourist-facing pages
│       │       ├── auth/              # Tourist sign-in and register
│       │       └── dashboard/         # Tourist personal dashboard
│       ├── styles/                    # Modular CSS design system
│       │   ├── abstracts/             # CSS variable tokens
│       │   ├── base/                  # Reset, base, and typography
│       │   ├── components/            # Reusable UI components
│       │   ├── layout/                # Container and grid helpers
│       │   ├── sections/              # Page-section-specific styles
│       │   ├── animations/            # Reveal and transition keyframes
│       │   ├── utilities/             # Helper classes
│       │   └── main.css               # Single compiled import stylesheet
│       ├── scripts/                   # JavaScript ES modules
│       │   ├── main.js                # App entry point
│       │   ├── modules/
│       │   │   ├── hero.js            # Hero section interactivity
│       │   │   ├── navigation.js      # Navbar scroll and mobile menu
│       │   │   ├── creators-filter.js # Creator filter and DB sync hydration
│       │   │   ├── destinations.js    # Destinations section
│       │   │   └── video-modal.js     # Video lightbox modal
│       │   ├── animations/
│       │   │   └── reveal.js          # IntersectionObserver scroll reveals
│       │   ├── utils/
│       │   │   ├── api.js             # Fetch wrapper utility
│       │   │   ├── dom.js             # DOM helpers ($, $$, on)
│       │   │   ├── auth-state.js      # Creator JWT session manager
│       │   │   └── tourist-state.js   # Tourist JWT session manager
│       │   ├── booking.js
│       │   ├── destination-page.js
│       │   ├── destinations-main.js
│       │   ├── stories-landing.js
│       │   └── story-detail.js
│       ├── services/                  # API call abstractions
│       │   ├── creator.service.js
│       │   ├── tourist.service.js
│       │   ├── destination.service.js
│       │   ├── destination-detail.service.js
│       │   └── story.service.js
│       └── data/                      # Local static fallback data
│           ├── creators.js
│           ├── destinations.js
│           ├── destination-detail.data.js
│           └── navigation.js
│
└── Backend/                           # Node.js REST API
    ├── package.json
    ├── .env.example                   # Environment variable template
    ├── .gitignore
    └── src/
        ├── index.js                   # Entry: DB connect and server start
        ├── app.js                     # Express setup: CORS, routes, error handler
        ├── constants.js               # App-level shared constants
        ├── db/
        │   └── index.js               # MongoDB connection via Mongoose
        ├── models/                    # Mongoose data schemas
        │   ├── creator.model.js
        │   ├── tourist.model.js
        │   ├── destination.model.js
        │   ├── story.model.js
        │   ├── booking.model.js
        │   ├── media.model.js
        │   └── review.model.js
        ├── controller/                # Business logic and route handlers
        │   ├── creator.controller.js
        │   ├── tourist.controller.js
        │   ├── destination.controller.js
        │   ├── story.controller.js
        │   └── booking.controller.js
        ├── routes/                    # Express routers
        │   ├── creator.routes.js
        │   ├── tourist.routes.js
        │   ├── destination.routes.js
        │   ├── story.routes.js
        │   ├── booking.routes.js
        │   ├── media.routes.js
        │   └── review.routes.js
        ├── middlewares/
        │   ├── auth.middleware.js          # JWT verification for Creators
        │   ├── tourist.auth.middleware.js  # JWT verification for Tourists
        │   └── multer.middleware.js        # File upload middleware
        └── utils/
            ├── ApiError.js            # Custom error class with statusCode
            ├── ApiResponse.js         # Standardised success response wrapper
            ├── asyncHandler.js        # Async try/catch HOF
            └── cloudinary.js          # Cloudinary upload and delete helpers
```

---

## Pages and Screens

| Page | Path | Description |
|---|---|---|
| **Homepage** | `/src/app/index.html` | Hero, destinations grid, creator cards, stories, booking CTA, video showcase, map preview, footer |
| **Destinations Index** | `/src/app/destinations/index.html` | All destinations with filter and search |
| **Destination Detail** | `/src/app/destinations/<slug>.html` | Full destination page with gallery, description, and booking |
| **Stories Listing** | `/src/app/stories/index.html` | Editorial stories grid |
| **Story Detail** | `/src/app/stories/story-detail.html` | Full story read view with author profile |
| **Creator Directory** | `/src/app/Creators/dashboard/index.html` | Public creator listing |
| **Creator Profile** | `/src/app/Creators/creator/profiles/<slug>.html` | Individual creator bio, stats, and stories |
| **Creator Auth** | `/src/app/Creators/auth/index.html` | Creator sign-in and registration |
| **Creator Private Dashboard** | `/src/app/Creators/creator/dashboard/index.html` | Booking management, analytics, hotspot coverage |
| **Tourist Auth** | `/src/app/tourists/auth/index.html` | Tourist sign-in and registration |
| **Tourist Dashboard** | `/src/app/tourists/dashboard/index.html` | Tourist trip history and saved destinations |
| **Booking** | `/src/app/book.html` | Experience booking form |

---

## API Reference

All endpoints are prefixed with `/api/v1/`.

### Creators — `/api/v1/creators`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new creator account |
| `POST` | `/login` | No | Login and receive access + refresh tokens |
| `POST` | `/logout` | Yes | Invalidate current session |
| `GET` | `/` | No | List all creators (supports `?limit=`) |
| `GET` | `/:creatorName` | No | Get creator profile by username |
| `PATCH` | `/update` | Yes | Update creator profile fields |

### Tourists — `/api/v1/tourists`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/register` | No | Register a new tourist account |
| `POST` | `/login` | No | Login tourist and receive tokens |
| `POST` | `/logout` | Yes | Logout tourist |
| `GET` | `/profile` | Yes | Get own tourist profile |
| `PATCH` | `/update` | Yes | Update tourist profile |

### Destinations — `/api/v1/destinations`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | No | List all destinations |
| `GET` | `/:slug` | No | Get destination by slug |
| `POST` | `/` | Yes | Create a destination (creator only) |
| `PATCH` | `/:id` | Yes | Update destination |

### Stories — `/api/v1/stories`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `GET` | `/` | No | Get all published stories |
| `GET` | `/:slug` | No | Get a single story |
| `POST` | `/` | Yes | Create and publish a story |
| `PATCH` | `/:id` | Yes | Update story content |
| `DELETE` | `/:id` | Yes | Delete a story |

### Bookings — `/api/v1/bookings`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/` | Yes | Create a new booking |
| `GET` | `/my` | Yes | Get the tourist''s own bookings |
| `GET` | `/creator` | Yes | Get all bookings for a creator |
| `PATCH` | `/:id/status` | Yes | Update booking status |

### Media — `/api/v1/media`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/upload` | Yes | Upload image or video to Cloudinary |
| `DELETE` | `/:publicId` | Yes | Delete media from Cloudinary |

### Reviews — `/api/v1/reviews`

| Method | Endpoint | Auth Required | Description |
|---|---|---|---|
| `POST` | `/` | Yes | Submit a review for a destination |
| `GET` | `/:destinationId` | No | Get all reviews for a destination |

> **Auth Required = Yes** means the route requires an `Authorization: Bearer <token>` header or an `accessToken` HTTP-only cookie.

---

## Database Models

### Creator
```
creatorName    String  — unique username, indexed
fullName       String
email          String  — unique
password       String  — bcrypt hashed
avatar         String  — Cloudinary URL
bio            String
coveringCity   String
speciality     String
refreshToken   String
```

### Tourist
```
name           String
email          String  — unique
password       String  — bcrypt hashed
avatar         String  — Cloudinary URL
refreshToken   String
```

### Destination
```
title          String
slug           String  — unique URL slug
description    String
location       String
category       String
coverImage     String  — Cloudinary URL
gallery        [String]
creator        ObjectId -> Creator
rating         Number
```

### Story
```
title          String
slug           String  — unique URL slug
content        String  — rich text body
coverImage     String
author         ObjectId -> Creator
tags           [String]
readTime       Number  — estimated minutes
publishedAt    Date
```

### Booking
```
tourist        ObjectId -> Tourist
creator        ObjectId -> Creator
destination    ObjectId -> Destination
date           Date
groupSize      Number
experience     String
status         Enum: pending | confirmed | cancelled
totalAmount    Number
```

### Media
```
publicId       String  — Cloudinary public ID
url            String  — Cloudinary delivery URL
resourceType   Enum: image | video
uploadedBy     ObjectId -> Creator
```

### Review
```
tourist        ObjectId -> Tourist
destination    ObjectId -> Destination
rating         Number (1 to 5)
comment        String
createdAt      Date
```

---

## Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm** v9 or higher
- **MongoDB** (Atlas URI or a local instance)
- **Cloudinary** account (free tier is sufficient)

---

### 1. Clone the Repository

```bash
git clone https://github.com/AshishDubey5/Sonbhadra-Connect.git
cd Sonbhadra-Connect
```

---

### 2. Set Up the Backend

```bash
cd Backend

# Install all dependencies
npm install

# Copy the environment template
cp .env.example .env
```

Open `.env` and fill in your values (see Environment Variables below).

```bash
# Start the dev server with hot reload
npm run dev
```

The API server will start at **`http://localhost:8000`**.

---

### 3. Set Up the Frontend

```bash
cd Frontend

# Install the local dev server tool
npm install

# Start the frontend dev server
npm run dev
```

Open **`http://localhost:3000`** in your browser.

> The frontend is a **zero-build static site**. You can also open `Frontend/src/app/index.html` directly in any browser without a dev server.

---

## Environment Variables

Create a `.env` file inside the `Backend/` directory using `.env.example` as the template:

```env
# Server port
PORT=8000

# MongoDB connection string
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/sonbhadraconnect

# JWT secrets (use long, random strings in production)
JWT_ACCESS_SECRET=your_access_token_secret_here
JWT_REFRESH_SECRET=your_refresh_token_secret_here

# Allowed CORS origin (your frontend URL)
CORS_ORIGIN=http://localhost:3000

# Cloudinary credentials (from cloudinary.com dashboard)
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
```

> **Never commit your `.env` file.** It is already protected by `.gitignore`.

---

## Deployment

### Frontend — Vercel

1. Push the repository to GitHub (already done)
2. Import the repo at [vercel.com](https://vercel.com)
3. Set the **Root Directory** to `Frontend`
4. No build command is needed — Vercel auto-detects static files
5. `vercel.json` handles URL rewrites and asset cache headers automatically

### Backend — Render or Railway

1. Create a new **Web Service** pointing to the `Backend/` directory
2. Set the **Start Command** to:
   ```bash
   node -r dotenv/config src/index.js
   ```
3. Add all variables from `.env.example` in the platform''s environment dashboard
4. Update `CORS_ORIGIN` to point to your live Vercel frontend URL

---

## Contributing

Contributions, issues, and feature requests are welcome!

1. **Fork** the repository
2. Create your feature branch:
   ```bash
   git checkout -b feat/your-feature-name
   ```
3. Commit your changes with a conventional message:
   ```bash
   git commit -m "feat: describe what you added"
   ```
4. Push to your branch:
   ```bash
   git push origin feat/your-feature-name
   ```
5. Open a **Pull Request** against `main`

Both `Frontend/.prettierrc` and `Backend/.prettierrc` are included — please format your code before submitting.

---

## Author

**Ashish Dubey**

- GitHub: [@AshishDubey5](https://github.com/AshishDubey5)
- Project: [Sonbhadra-Connect](https://github.com/AshishDubey5/Sonbhadra-Connect)

---

<div align="center">

Built with love for Sonbhadra, Uttar Pradesh

*Empowering local voices. Connecting curious travellers.*

</div>
