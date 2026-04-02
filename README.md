# Miguel Lacanienta - Portfolio

Interactive portfolio website featuring a digital avatar that presents Miguel's professional profile through narrated video sections with synced image slideshows and subtitles, available in English and German.

## Local Development

**Prerequisites:** Node.js 18+

```bash
npm install
npm run dev
```

Open [http://localhost:3000/portfolio](http://localhost:3000/portfolio) in your browser.

**Build for production:**

```bash
npm run build
```

Static site is generated in the `out/` directory.

## Deploy to GitHub Pages

1. Push to `main` branch
2. Go to repository Settings > Pages > Source: "GitHub Actions"
3. The workflow deploys automatically on push
4. Site available at: `https://<username>.github.io/<repo-name>/`

## Tech Stack

- **Framework:** Next.js 15 (App Router) with static export
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages via GitHub Actions

## Features

- Digital avatar with idle animation and section-specific narration videos
- EN/DE language toggle with full subtitle support (SRT)
- Video sections: Objective, Skills, Certifications, Applied Skills, Projects
- Image slideshows synced to SRT cues (2x2 grid for 3-4 images, cycling for certifications)
- Intro playback with section button highlights
- Project demo video segments (DTR System, Interactive Resume)
- Mobile-responsive design
- Fully static site (no backend required)

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── Banner.js          # Main banner with video player, slideshow, and controls
│   │   ├── IdleOverlay.js     # Idle state overlay with name, title, and section buttons
│   │   └── Subtitles.js       # SRT parser and subtitle display synced to video
│   ├── page.js                # Main page with project cards
│   ├── layout.js              # Root layout
│   └── globals.css            # Global styles
├── public/
│   ├── EN/                    # English video segments and SRT subtitles
│   ├── DE/                    # German video segments and SRT subtitles
│   ├── images/                # Slideshow images (section-cue-position.png)
│   ├── bg.mp4                 # Background loop video
│   ├── idle.mp4               # Idle avatar animation
│   └── ambient.mp3            # Background music
├── lib/
│   └── assets.js              # Asset path configuration
├── .github/
│   └── workflows/
│       └── deploy.yml         # GitHub Actions deployment
└── next.config.js             # Next.js configuration
```

### Image Naming Convention

Images follow the pattern: `{section}-{cue}-{position}.png`

- **section:** objective, skills, certifications, applied-skills, projects
- **cue:** 1-based, matching SRT cue number (zero-padded if section has 10+ cues)
- **position:** 1-based display order within the cue

Examples: `objective-2-3.png`, `certifications-07-2.png`

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build static site for production
