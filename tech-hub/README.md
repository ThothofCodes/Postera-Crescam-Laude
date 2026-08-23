# PCL Tech Hub

> **Postera Crescam Laude** — Empowering Kenya's Digital Future

An independent, high-performance tech content hub built with **Astro** and **Sanity CMS**. This is completely decoupled from the main e-commerce system, ensuring content operations cannot affect core business functions.

## Architecture

- **Jamstack**: Static site generation for extreme performance
- **Astro**: Zero JavaScript by default, ships only what's needed
- **Sanity**: Headless CMS with generous free tier (1M API requests/month)
- **Netlify**: Free hosting with global CDN distribution

## Tech Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| SSG | Astro | Static site generation |
| CMS | Sanity | Content management |
| Hosting | Netlify | CDN & deployment |
| Fonts | Google Fonts | Inter + Orbitron |

## Content Types

- **Articles** — In-depth tech articles (hardware, software, networking, etc.)
- **Tech Tips** — Quick tips and tricks
- **Tech News** — Curated tech news
- **Tech Facts** — Daily tech facts and trivia

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Sanity account (free tier works)

### Setup

1. Clone the repository
   ```bash
   cd tech-hub
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up environment variables
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your Sanity project credentials.

4. Start development server
   ```bash
   npm run dev
   ```

5. Open http://localhost:4321

### Sanity Setup

1. Create a new project at https://sanity.io/manage
2. Get your Project ID and Dataset name
3. Add the schemas from `sanity/schemas/` to your Sanity project
4. Update `.env` with your credentials

### Deployment

1. Push code to GitHub
2. Connect repository to Netlify
3. Set environment variables in Netlify dashboard
4. Deploy!

## Project Structure

```
tech-hub/
├── public/              # Static assets
├── sanity/
│   └── schemas/         # Sanity content schemas
│       ├── article.js
│       ├── author.js
│       ├── fact.js
│       ├── news.js
│       ├── siteSettings.js
│       └── techTip.js
├── src/
│   ├── layouts/
│   │   └── Layout.astro
│   ├── lib/
│   │   └── sanity.js    # Sanity client & queries
│   └── pages/
│       ├── index.astro
│       └── articles/
│           ├── index.astro
│           └── [slug].astro
├── .env.example
├── astro.config.mjs
├── netlify.toml
└── package.json
```

## Cost

- **Sanity CMS**: $0 (free tier: 1M API requests/month)
- **Netlify Hosting**: $0 (free tier: 100GB bandwidth)
- **Total**: **$0/month**

## License

MIT License — © 2026 Postera Crescam Laude
