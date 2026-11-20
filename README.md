# UNSEEN

UNSEEN is a learning-intelligence and career-growth platform designed to make consistent effort and skill development visible.

## Product modules

### Module 1 — Public website

- `/` — Home: mission, product promise and visual preview.
- `/about` — About: why UNSEEN exists and the principles behind it.
- `/how-it-works` — How it works: the proposed capture, reflect and recognise learning loop.

### Module 2 — Learner application (in progress)

- `/login` — Branded UNSEEN sign-in entry page.
- `/signup` — Branded sign-up entry page; users continue to Cognito Classic Hosted UI and choose its Sign up link.
- `/auth/callback` — OAuth authorization-code callback.
- `/app/dashboard` — Protected authenticated landing page placeholder.

This milestone adds Cognito authentication. Learning journal CRUD, user onboarding, progress storage and AI assessments are not implemented yet.

### Module 3 — Career intelligence and talent marketplace

Planned future capabilities include professional career journeys, career benchmarks, learner talent profiles and employer discovery.

## Technology

- React 18 + Vite 6
- React Router
- Lucide React
- AWS Amplify Auth (Cognito integration)
- Amazon Cognito User Pool (OAuth 2.0 authorization code grant + PKCE)
- Cloudflare Pages for current static frontend hosting
- AWS CloudFormation for infrastructure
- GitHub for source control

## Run locally

Requires Node.js 20 or later.

```bash
npm install
cp .env.example .env.local
npm run dev
```

The application can still run without Cognito values so the public pages remain available. Login and signup display a setup notice until the public Cognito environment variables are configured.

## Cognito setup

See [docs/COGNITO-AUTH.md](docs/COGNITO-AUTH.md) for:

- Cognito User Pool CloudFormation deployment.
- OAuth callback and logout URL configuration.
- Local environment setup.
- Cloudflare Pages environment variables.
- Token refresh and security boundaries.

The Cognito stack is independent of frontend hosting. Cloudflare serves the React application; Cognito authenticates users and issues tokens.

## Production build

```bash
npm run build
npm run preview
```

Vite generates the production website in `dist/`.

## Project structure

```text
unseen/
├── .github/workflows/         # GitHub Actions workflows
├── docs/                      # Deployment and architecture docs
├── infrastructure/cloudformation/
│   ├── frontend-hosting.yaml  # Planned AWS S3 + CloudFront hosting
│   └── cognito-auth.yaml      # Cognito User Pool and public SPA client
├── src/
│   ├── auth/                   # Amplify config and auth context
│   ├── components/             # Protected route guard
│   ├── pages/                  # Auth, callback and dashboard pages
│   ├── App.jsx                 # Public and authenticated routes
│   ├── auth.css                # Auth/dashboard styles
│   ├── main.jsx                # React entry point
│   └── styles.css              # Public site design system
├── .env.example                # Public Cognito configuration template
├── index.html
├── package.json
└── vite.config.js
```

## Code documentation standard

Major components, functions, configuration and CSS sections should include explanatory comments. Update documentation when changing architecture or deployment behaviour.

## Security boundaries

- Never commit `.env.local`, AWS credentials, app-client secrets or private keys.
- The browser app client is public and has no client secret.
- Cognito authenticates the user. Future APIs must validate Cognito access-token signatures, issuer, expiry and token use.
- Backend code must derive the user ID from validated token claims, not from a client-supplied user ID.
- The current authenticated dashboard is a placeholder and does not yet persist learning data.

## AWS hosting status

The S3 + CloudFront CloudFormation template is retained for a future AWS deployment. The AWS account's CloudFront access request was declined pending further account usage and billing history. The AWS static-site workflow is guarded and remains dormant until its required repository variables are configured.

Cloudflare Pages is the current hosting path for the public frontend.

## Continuation brief

> Continue the UNSEEN project from the existing GitHub repository. Module 1 public pages are Home, About and How It Works. Module 2 authentication is being added on branch `feature/module2-cognito-auth`: React login/signup entry pages, Cognito Hosted UI OAuth Authorization Code + PKCE via AWS Amplify, callback handling, protected dashboard placeholder and Cognito CloudFormation template. Cloudflare Pages serves the React frontend; Cognito handles identity. No learning API, DynamoDB journal or ECS services exist yet. Inspect the current repository before changing files. Preserve the existing premium dark navy and mint-green visual identity, include meaningful code comments, update the README/docs, and test the Vite production build after installing dependencies.
