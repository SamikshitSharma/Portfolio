# Samikshit Sharma

An Astro portfolio about cloud operations, backend systems and applied AI. The home page includes an original, scroll-driven Three.js environment. Five case studies document source-backed engineering decisions, contributions and verification.

## Development

Use Node 22.12 or newer. The browser suite requires Chrome.

```sh
npm ci
npm run dev
npm run lint
npm run typecheck
npm run build
npm test
```

The tests serve the build on port 4380. Set `PORTFOLIO_TEST_URL` to test an existing server or Preview.

## Source

- `src/data/projects.ts` holds the technical case studies and their pinned source evidence. `src/data/portfolio.ts` holds profile, achievement, credential and skill data.
- `src/client/world.ts` drives the camera across the home page. Light mode and hidden tabs park the renderer. Reduced motion, data saver and graphics failure use a still from the same scene.
- The site uses static HTML, ordinary links and native score disclosures. Locally served fonts have notices in `public/licenses`.
- Certificate and leaderboard images are private supporting evidence. The site publishes the authorized credential details and personal evaluation results as text.
