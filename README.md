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

The first backend foundation now defines the learner data model, DynamoDB table template and deterministic assessment scoring/rank utilities. The table is not yet connected to API Gateway, Lambda or Grok.

### Module 3 — Career intelligence and talent marketplace

Planned future capabilities include professional career journeys, career benchmarks, learner talent profiles and employer discovery.

## Technology

- React 18 + Vite 6
- React Router
- Lucide React
- AWS Amplify Auth (Cognito integration)
- Amazon Cognito User Pool (OAuth 2.0 authorization code grant + PKCE)
- Amazon DynamoDB (learning data model; CloudFormation deployment template)
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

## Learning data and scoring foundation

See [docs/LEARNING-DATA-MODEL.md](docs/LEARNING-DATA-MODEL.md) for the DynamoDB single-table design, access patterns, initial score rubric, points policy and rank thresholds.

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
│   └── learning-data.yaml      # Learning data DynamoDB table
├── src/
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
- Future APIs must validate Cognito access-token signature, issuer, expiry and token use using an API Gateway JWT authorizer.
- Backend code must derive the user ID from validated token claims, not from a client-supplied user ID.
- Grok API calls must run in Lambda. Never expose the xAI API key in a Vite `VITE_*` variable or browser bundle.
- Grok may assess rubric dimensions and provide evidence, but backend code calculates scores, points and ranks.
- Points awards must be idempotent and daily caps enforced atomically with DynamoDB transactions.
- Do not store passwords or access tokens in the learning data table.

## AWS hosting status

The S3 + CloudFront CloudFormation template is retained for a future AWS deployment. The AWS account's CloudFront access request was declined pending further account usage and billing history. The AWS static-site workflow is guarded and remains dormant until its required repository variables are configured.

Cloudflare Pages is the current hosting path for the public frontend.

## Continuation brief

> Continue the UNSEEN project from the existing GitHub repository. Module 1 public pages are Home, About and How It Works. Module 2 Cognito authentication is working on branch `feature/module2-cognito-auth`: React login/signup entry pages, Cognito Hosted UI OAuth Authorization Code + PKCE via AWS Amplify, callback handling and protected dashboard. The first backend foundation now adds a DynamoDB CloudFormation template, a single-table data model document, and pure scoring/rank utilities with Node tests. The DynamoDB table has not yet been deployed or connected to an API. Next build Lambda handlers, the xAI/Grok Responses API adapter with its key stored server-side, an API Gateway HTTP API with Cognito JWT authorization, and then the learner conversation UI. Preserve the dark navy/mint design, keep UI minimal, include meaningful comments, update docs and test the Vite build. Inspect the current repository before changing files.
