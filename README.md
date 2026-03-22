# Miguel Lacanienta - Portfolio

Interactive portfolio website featuring an animated avatar with video presentations about Miguel's professional profile.

## 🚀 GitHub Pages Deployment

### Prerequisites
- Node.js 18+ installed
- GitHub account

### Local Development

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Run development server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

3. **Build for production:**
   ```bash
   npm run build
   ```
   The static site will be generated in the `out/` directory.

### Deploy to GitHub Pages

1. **Create a new GitHub repository**

2. **Initialize and push:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: Portfolio site"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

3. **Enable GitHub Pages:**
   - Go to your repository Settings → Pages
   - Under "Source", select "GitHub Actions"
   - The workflow will automatically deploy on push to main branch

4. **Access your site:**
   - Your site will be available at: `https://<username>.github.io/<repo-name>/`

## 🛠️ Tech Stack

- **Framework:** Next.js 15 (App Router) with static export
- **Styling:** Tailwind CSS
- **Deployment:** GitHub Pages via GitHub Actions
- **Video:** Interactive avatar with section videos

## 📝 Features

- Interactive animated avatar
- Video presentations for:
  - Objective
  - Skills
  - Certifications
  - Applied Skills
  - Projects
- QR code for easy sharing
- Mobile-responsive design
- Fully static site (no backend required)

## 📁 Project Structure

```
├── app/
│   ├── components/
│   │   ├── Avatar.js       # Animated avatar component
│   │   └── QRCode.js       # QR code display
│   ├── page.js             # Main page
│   ├── layout.js           # Root layout
│   └── globals.css         # Global styles
├── public/
│   ├── *.mp4              # Video files
│   ├── Avatar.png         # Avatar image
│   └── QRcode.png         # QR code image
├── .github/
│   └── workflows/
│       └── deploy.yml     # GitHub Actions deployment
└── next.config.js         # Next.js configuration
```

## 🎬 Adding New Videos

To add new video sections:

1. Add your video file to the `public/` directory
2. Update the video buttons in `app/page.js`
3. Add a button with `onClick={() => playVideo('YourVideoName')}`

## 📚 Scripts

- `npm run dev` - Start development server
- `npm run build` - Build static site for production
- `npm run export` - Same as build (creates static export)
