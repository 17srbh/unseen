# UNSEEN — Module 1

Public website foundation for the UNSEEN learning-progress platform.

## Included pages

- `/` — Home: mission, product promise and visual preview.
- `/about` — About: why UNSEEN exists and the principles behind it.
- `/how-it-works` — How it works: the proposed capture, reflect and recognise learning loop.

Features, authentication, signup, contact forms and waitlist are intentionally not implemented in this milestone.

## Technology

- React 18
- Vite 6
- React Router 6
- Lucide React icons
- Plain CSS with responsive breakpoints

## Run locally

Requires Node.js 18 or later.

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually http://localhost:5173).

## Production build

```bash
npm run build
npm run preview
```

The production output is generated in `dist/`.

## Project structure

```text
unseen-module1/
├── index.html             # HTML document shell and SEO metadata
├── package.json           # Project dependencies and commands
├── vite.config.js         # Vite + React configuration
└── src/
    ├── main.jsx           # React entry point and router provider
    ├── App.jsx            # Header, footer, shared components and three pages
    └── styles.css         # Design tokens, page styling and responsive rules
```

## Code documentation standard

Major components, functions, route definitions, configuration and CSS sections include comments explaining their purpose. When adding features, preserve this convention and document non-obvious decisions near the relevant code.

## Current product boundaries

This is a frontend prototype. It does not yet have a backend, user accounts, database, AI integration, waitlist storage or employer functionality. The dashboard preview is illustrative and should not be represented as a functioning learner account.

## Continuation brief for a new ChatGPT conversation

Paste the following to continue the project:

> Continue my UNSEEN startup website project from Module 1. The project uses React + Vite + React Router + Lucide React + plain CSS. Module 1 currently includes only Home (`/`), About (`/about`) and How It Works (`/how-it-works`). The visual identity is premium dark navy with mint-green accents, motivational but professional, responsive on mobile and desktop. Features, Login/Signup, Contact/Waitlist are deliberately postponed. All major code components, functions, configuration and CSS sections must have meaningful explanatory comments. First inspect the current project files that I upload or paste; do not recreate or overwrite existing work blindly. Help me run, test and refine Module 1 before moving to the next page or module. Keep README and architecture/requirements documentation updated.


## AWS deployment (Module 1 only)

The project now includes CloudFormation and GitHub Actions deployment files:

- `infrastructure/cloudformation/frontend-hosting.yaml` — private S3 bucket, CloudFront OAC, CloudFront distribution and bucket policy.
- `infrastructure/cloudformation/github-deploy-role.yaml` — restricted IAM role for GitHub Actions OIDC. The GitHub OIDC identity provider must already exist in the AWS account.
- `.github/workflows/deploy-module1.yml` — builds the Vite site, syncs `dist/` to S3 and invalidates CloudFront when the `main` branch site source changes.
- `docs/DEPLOYMENT.md` — deployment prerequisites and step-by-step instructions.

This deployment intentionally does not create ECS, Fargate, VPC, ALB, database, authentication or backend resources.
