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
- `/app/dashboard` — Protected authenticated landing page; the learning UI is the next frontend milestone.

The first backend slice is deployed in AWS: a DynamoDB learner table, an HTTP API, a Cognito JWT authorizer and a Lambda-backed `GET /v1/me` profile endpoint. The React dashboard calls the endpoint with the signed-in user's Cognito access token. The first release will use one Grok-generated overall score (0–100) per completed learning session; lifetime points, ranks and daily point limits are deferred.

### Module 3 — Career intelligence and talent marketplace

Planned future capabilities include professional career journeys, career benchmarks, learner talent profiles and employer discovery.

## Technology

- React 18 + Vite 6
- React Router
- Lucide React
- AWS Amplify Auth (Cognito integration)
- Amazon Cognito User Pool (OAuth 2.0 authorization code grant + PKCE)
- Amazon DynamoDB (deployed learner data table)
- Amazon API Gateway HTTP API (Cognito JWT-protected routes)
- AWS Lambda (learner profile handler)
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

See [docs/COGNITO-AUTH.md](docs/COGNITO-AUTH.md) for Cognito User Pool deployment, OAuth callback and logout URL configuration, local environment setup, Cloudflare Pages variables, token refresh and security boundaries.

## API connection

The deployed development API base URL is `https://q3darm7zjg.execute-api.ap-south-1.amazonaws.com`. Set it as `VITE_UNSEEN_API_URL` in the local `.env.local` file and in Cloudflare Pages Preview/Production environment variables as appropriate. It is a public endpoint URL, not a secret. Vite embeds this value at build time, so rebuild/redeploy the frontend after changing it.

The dashboard uses Amplify `fetchAuthSession()` to obtain the Cognito access token and sends it as a Bearer token to `GET /v1/me`. Never print or commit that token.

## Learning data and scoring foundation

See [docs/LEARNING-DATA-MODEL.md](docs/LEARNING-DATA-MODEL.md) for the DynamoDB single-table design, access patterns and session scorecard model.

Validate the development table template:

```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/learning-data.yaml \
  --profile dev \
  --region ap-south-1
```

Deploy the development table only after reviewing the template:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/learning-data.yaml \
  --stack-name unseen-learning-data-dev \
  --parameter-overrides ProjectName=unseen EnvironmentName=dev EnablePointInTimeRecovery=false \
  --profile dev \
  --region ap-south-1
```

The development table uses on-demand billing and has deletion protection plus CloudFormation retain policies. Point-in-time recovery is disabled for development by default; review its additional backup charge before enabling it in production. DynamoDB encrypts data at rest by default using an AWS-owned key.

Run the deterministic scoring tests:

```bash
npm test
```

## Production build

```bash
npm run build
npm run preview
```

Vite generates the production website in `dist/`.

## Project structure

```text
unseen/
├── .github/workflows/          # GitHub Actions workflows
├── backend/
│   └── shared/                 # Deterministic scoring and rank utilities
├── docs/                       # Deployment, architecture and data-model docs
├── infrastructure/cloudformation/
│   ├── frontend-hosting.yaml   # Planned AWS S3 + CloudFront hosting
│   ├── cognito-auth.yaml       # Cognito User Pool and public SPA client
│   ├── learning-data.yaml      # Learning data DynamoDB table
│   └── api-backend.yaml        # HTTP API, JWT authorizer and profile Lambda
├── src/
│   ├── api/                     # Authenticated API client
│   ├── auth/                    # Amplify config and auth context
│   ├── components/              # Protected route guard
│   ├── pages/                   # Public pages, auth and dashboard
│   ├── App.jsx
│   ├── auth.css
│   ├── main.jsx
│   └── styles.css
├── .env.example
├── index.html
├── package.json
└── vite.config.js
```

## Security boundaries

- Never commit `.env.local`, AWS credentials, xAI API keys, app-client secrets or private keys.
- The browser Cognito app client is public and has no client secret.
- The deployed API Gateway HTTP API validates Cognito access-token signature, issuer, expiry, client ID and required scopes using its JWT authorizer.
- Backend code must derive the user ID from validated token claims, not from a client-supplied user ID.
- Grok API calls must run in Lambda. Never expose the xAI API key in a Vite `VITE_*` variable or browser bundle.
- Grok generates one overall session score and supporting feedback; the backend validates the 0–100 value and owns persistence.
- Lifetime points, ranks and daily point caps are deferred from the first release.
- Do not store passwords or access tokens in the learning data table.

## AWS hosting status

The S3 + CloudFront CloudFormation template is retained for a future AWS deployment. The AWS account's CloudFront access request was declined pending further account usage and billing history. The AWS static-site workflow is guarded and remains dormant until its required repository variables are configured.

Cloudflare Pages is the current hosting path for the public frontend.

## Continuation brief

> Continue the UNSEEN project from the existing GitHub repository. Module 1 public pages are Home, About and How It Works. Module 2 Cognito authentication works on branch `feature/module2-cognito-auth`: React login/signup entry pages, Cognito Hosted UI OAuth Authorization Code + PKCE via AWS Amplify, callback handling and protected dashboard. The development DynamoDB table and API stack are deployed. The API exposes public `GET /health` and Cognito JWT-protected `GET /v1/me`; the latter initializes or retrieves the signed-in learner's profile. The React dashboard now calls that endpoint using Amplify's Cognito access token and reads points/rank from the backend. Current task: set `VITE_UNSEEN_API_URL` in local `.env.local` and Cloudflare Pages environments, pull latest branch, run tests/build, then verify the authenticated profile end to end. Next add learning-session and conversation-turn endpoints, server-side xAI/Grok Responses API using a Secrets Manager key, atomic assessment/points transactions and the learner conversation UI. Preserve the dark navy/mint design, keep UI minimal, include meaningful comments, update docs and test the Vite build. Inspect current files before changing them.
