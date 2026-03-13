# Educore – Integrated School Management System

Educore is a React + TypeScript + Vite single-page application (SPA) for school management, using Tailwind CSS, shadcn/ui, React Router, Supabase, and TanStack Query.

This document focuses on how to build and deploy Educore, especially to Vercel.

## Local development

- **Install dependencies**
  - `npm install`
- **Run dev server**
  - `npm run dev`

The app will be available on the port printed by Vite (typically `http://localhost:5173`).

## Build

Educore uses Vite and outputs its production build to the `dist` directory.

- **Build command**
  - `npm run build`
- **Output directory**
  - `dist/`

The `vite.config.ts` file is configured with:

```ts
build: {
  outDir: 'dist',
  // …
}
```

## Deploying to Vercel

Educore is a single-page application that relies on React Router for client-side routing. To avoid 404 errors when directly opening deep links (for example `/dashboard`, `/students`, `/attendance`, `/class-analytics`, `/term-reports`), Vercel must serve `index.html` for all routes.

### Required Vercel project settings

Configure your Vercel project with the following values:

- **Framework Preset**: `Vite`
- **Build Command**: `npm run build`
- **Output Directory**: `dist`

These are the standard defaults for a Vite project on Vercel; if you override them, ensure they match the values above.

### SPA routing (avoiding 404 on deep links)

Educore includes a `vercel.json` file at the project root with:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/" }
  ]
}
```

This configuration ensures all incoming paths are rewritten to `/`, letting React Router handle routing inside the SPA. This prevents `404: NOT_FOUND` when directly opening URLs like:

- `/dashboard`
- `/students`
- `/attendance`
- `/class-analytics`
- `/term-reports`

### Verifying a deployment

After deploying:

1. Open the Vercel URL on desktop and mobile.
2. Log in and navigate to a deep route (for example `/dashboard/hod` or `/class-analytics`).
3. Hard refresh the page or open the URL directly in a new tab.
4. Confirm that the Educore shell (topbar, sidebar, and dashboards) loads correctly instead of a 404 page.

## Mobile and PWA-ready metadata

The root `index.html` includes mobile-friendly meta tags:

- `viewport` with `viewport-fit=cover` for better handling of mobile browser UI.
- `theme-color` to control the browser UI color on mobile.
- Basic mobile web app tags (`mobile-web-app-capable`, `apple-mobile-web-app-capable`, `apple-mobile-web-app-status-bar-style`).

These prepare Educore for future Progressive Web App (PWA) support without implementing a full PWA yet (no service worker or manifest is required at this stage).

