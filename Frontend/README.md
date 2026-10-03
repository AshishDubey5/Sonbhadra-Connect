# SonbhadraConnect Platform (sonbhadraconnect.com)

> **Discover Sonbhadra Through Local Eyes** — Uttar Pradesh, India

The official web platform bridging **Tourists**, **Local Creators**, **Destinations**, and **Local Businesses** into a sustainable, win-win tourism ecosystem.

## Architecture

This project follows a clean, modular, scalable architecture ready for future migration to React/Next.js and TypeScript:

```
sonbhadra-tourism/
├── public/
│   └── assets/
│       ├── images/       (destinations, creators, ui, stories)
│       └── videos/       (hero chapters, reels, drone footage)
├── src/
│   ├── app/              (index.html - semantic single-source landing page)
│   ├── data/             (destinations, creators, stories, categories)
│   ├── services/         (abstraction layer over data/APIs)
│   ├── styles/
│   │   ├── abstracts/    (design tokens, variables, typography)
│   │   ├── base/         (reset, base styling)
│   │   ├── components/   (buttons, badges, cards, navigation)
│   │   ├── sections/     (hero, destinations, creators, experiences, editorial, map, cta, footer)
│   │   ├── animations/   (reveals, transitions, keyframes)
│   │   └── main.css      (master stylesheet)
│   └── scripts/
│       ├── animations/   (IntersectionObserver reveal system)
│       ├── modules/      (hero cinematic player, navigation, audio/video controller)
│       ├── utils/        (DOM helpers)
│       └── main.js       (application bootstrap)
```

## Running Locally

```bash
# Start static development server
npx serve -s . -l 3000
```
Open `http://localhost:3000/src/app/index.html` or root redirect.
