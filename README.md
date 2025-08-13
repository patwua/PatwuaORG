# PatwuaORG

PatwuaORG is a full-stack JavaScript project combining an Express/MongoDB API and a React + TypeScript client. This repository now includes a public README outlining the file structure and how the pieces fit together.

## Top-level layout

```
.
├── client/            # React front-end built with Vite and Tailwind
├── server/            # Express API backed by MongoDB
├── package.json       # Root scripts for running server and client
├── package-lock.json
└── render.yaml        # Deployment configuration for Render
```

## Server (`server/`)

```
server/
├── app.js             # Express setup, MongoDB connection, route mounting
├── websocket.js       # WebSocket server for real-time notifications
├── middleware/
│   ├── adminOnly.js   # Guards admin-only routes
│   ├── auth.js        # JWT authentication middleware
│   └── errorHandler.js# Centralized error handling
├── models/            # Mongoose schemas
│   ├── Comment.js
│   ├── Post.js
│   ├── PostDraft.js
│   ├── User.js
│   └── Vote.js
├── routes/            # Express route modules
│   ├── auth.js
│   ├── posts.js
│   ├── review.js
│   ├── tags.js
│   ├── users.js
│   └── __tests__/     # Jest tests for routes
│       └── posts.test.js
└── utils/             # Helper libraries
    ├── html.js        # Sanitization, MJML compilation, media extraction
    ├── slug.js        # Short slug generator
    ├── tags.js        # Hashtag normalization and extraction
    ├── logger.js
    └── __tests__/
```

The server entry point `app.js` wires up middleware, connects to MongoDB, mounts route modules, and starts the HTTP and WebSocket servers. Routes interact with Mongoose models to perform CRUD operations and use the utilities for tasks such as sanitizing HTML or extracting tags. Middleware provides authentication and error handling.

## Client (`client/`)

```
client/
├── index.html
├── vite.config.ts      # Vite build configuration
├── tailwind.config.cjs # Tailwind CSS setup
├── src/
│   ├── App.tsx         # Root React component
│   ├── main.tsx        # Entry point initializing React
│   ├── components/
│   │   ├── AuthModal.tsx
│   │   ├── BottomNav.tsx
│   │   ├── EditProfileModal.tsx
│   │   ├── Hero.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostEditor.tsx
│   │   ├── Sidebar.tsx
│   │   ├── TagChips.tsx
│   │   ├── TrendingTags.tsx
│   │   ├── ArchiveModal.tsx
│   │   ├── Search.tsx
│   │   └── icons.tsx
│   │   ├── common/
│   │   │   ├── AuthButtons.tsx
│   │   │   ├── Logo.tsx
│   │   │   ├── SearchBar.tsx
│   │   │   └── ThemeToggle.tsx
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── Header.tsx
│   │   │   └── Layout.tsx
│   │   ├── posts/
│   │   │   ├── Post.tsx
│   │   │   ├── PostActions.tsx
│   │   │   ├── PostComments.tsx
│   │   │   ├── PostContent.tsx
│   │   │   ├── PostFeed.tsx
│   │   │   └── PostHeader.tsx
│   │   └── ui/
│   │       ├── VerifiedBadge.tsx
│   │       └── avatar.tsx
│   ├── context/        # React context providers
│   │   ├── AuthContext.tsx
│   │   └── ThemeContext.tsx
│   ├── hooks/
│   │   └── usePostActions.ts
│   ├── lib/            # API wrappers and helpers
│   │   ├── api.ts
│   │   ├── api.test.ts
│   │   ├── mock.ts
│   │   ├── review.ts
│   │   ├── tags.ts
│   │   ├── upload.ts
│   │   └── users.ts
│   ├── pages/
│   │   ├── AdminUsersPage.tsx
│   │   ├── EditHtmlPost.tsx
│   │   ├── PostDetailPage.tsx
│   │   ├── ProfilePage.tsx
│   │   ├── TagPage.tsx
│   │   └── __tests__/EditHtmlPost.test.tsx
│   ├── styles/
│   │   └── globals.css
│   ├── types/          # Shared TypeScript types
│   │   ├── auth.ts
│   │   ├── post.d.ts
│   │   ├── post.ts
│   │   └── user.d.ts
│   └── utils/
│       └── .gitkeep
└── README.md
```

The client uses React components organized by feature (posts, layout, UI, etc.) and contexts for authentication and theme. API helpers in `src/lib/` communicate with the Express routes, and pages compose components to render screens. Tests are included for API utilities, components, and pages via Vitest.

## Interactions

- **Client ↔ Server:** API modules in `client/src/lib` call the REST endpoints defined under `server/routes`. WebSocket connections initialized in the client can receive notifications from `server/websocket.js`.
- **Routes ↔ Models:** Express routes import Mongoose models to persist and query data. For example, `posts.js` interacts with `Post`, `PostDraft`, and others to handle post creation and moderation.
- **Utilities:** Shared logic like slug generation, tag extraction, and HTML sanitization lives in `server/utils` and is leveraged by routes and models.

## Identity & Handles

- Users may sign in and comment without picking a handle.
- Publishing a post requires setting a unique handle first.
- Handle suggestions are reserved for a limited time (TTL) via `HANDLE_RESERVE_DAYS` (default **30** days) and released automatically when expired.

## Running locally

From the repository root:

```bash
npm run server      # start Express API with nodemon
npm run client      # run React dev server
```

## Testing

- `npm test` from the `server/` directory runs Jest route tests.
- `npm test` from the `client/` directory runs Vitest unit tests.

## Deployment

- Backend env: include `https://patwuaorg.onrender.com` in `ALLOWED_ORIGIN`.
- Backend env: `HANDLE_RESERVE_DAYS` sets reservation TTL (default 30).
- Frontend (Render Static Site): add rewrite `/* -> /index.html` with status 200.
