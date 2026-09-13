# Slovo — Learn Slovak

A Duolingo-inspired **Progressive Web App** for learning beginner Slovak. Original branding and lesson content (not affiliated with Duolingo).

## Features

- **Learning path** with 5 units and locked/unlocked lesson progression
- **5 exercise types:** multiple choice, tap the meaning, word-bank translation, fill in the blank, match pairs
- **Hearts**, **XP**, **streak**, and **daily goal**
- Progress saved in **localStorage**
- **PWA**: web manifest, icons, service worker (offline shell), iOS Add to Home Screen meta tags
- Bottom tabs: Learn · Practice · Profile

## Quick start

```bash
cd slovo
npm install
npm run dev
```

Open the URL Vite prints (default **http://localhost:5173**).

## Scripts

| Command           | Description                |
|-------------------|----------------------------|
| `npm run dev`     | Start Vite dev server      |
| `npm run build`   | Typecheck + production build |
| `npm run preview` | Preview the production build |

## Units (beginner)

1. Greetings & Basics  
2. Numbers  
3. Food & Drink  
4. Family  
5. Colors & Verbs  

Content lives in `src/content/curriculum.ts` — extend with more lessons/exercises anytime.

## Deploy

Static SPA — works on **Vercel**, **Netlify**, **Cloudflare Pages**, or **GitHub Pages**.

### Vercel / Cloudflare / Netlify

- Build command: `npm run build`
- Output directory: `dist`
- Framework preset: Vite (if asked)

### GitHub Pages

1. Set `base` in `vite.config.ts` to your repo path, e.g. `base: '/slovo/'`.
2. Build and publish the `dist` folder (GitHub Actions or `gh-pages`).

PWA install / Add to Home Screen works best over **HTTPS** (or localhost).

## Tech

Vite · React 19 · TypeScript · Tailwind CSS v4 · Zustand · vite-plugin-pwa

## License

Original educational content for personal / demo use. Slovak language examples are common vocabulary for learners.
