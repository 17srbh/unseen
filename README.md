# UNSEEN

UNSEEN is a learning-intelligence and career-growth platform designed to make consistent effort and skill development visible.

## Product modules

### Module 1 — Public website

- `/` — Home: mission, product promise and visual preview.
- `/about` — About: why UNSEEN exists and the principles behind it.
- `/how-it-works` — How it works: the proposed capture, reflect and recognise learning loop.

### Module 2 — Learner application (AI learning sessions in progress)

- `/login` — Branded UNSEEN sign-in entry page.
- `/signup` — Branded sign-up entry page; users continue to Cognito Classic Hosted UI and choose its Sign up link.
- `/auth/callback` — OAuth authorization-code callback.
- `/app/dashboard` — Protected learner dashboard and profile.
- `/app/learn` — Start an AI-guided learning session.
- `/app/learn/:sessionId` — Resume a session or view its completed scorecard.

The development backend includes a DynamoDB learner table, a Cognito JWT-protected HTTP API and a Lambda session orchestrator. The session flow uses `openai/gpt-oss-20b` through Groq's Responses API, keeps a bounded recent conversation plus a rolling summary, and stores one final scorecard (0–100) per completed session. Lifetime points, ranks, daily point limits and separate turn records are deferred.

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
- AWS Lambda (authenticated learner profile and AI session orchestration)
- AWS Secrets Manager (server-side Groq API key)
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

## AI learning sessions

The protected learner flow uses these API routes:

| Method | Route | Purpose |
|---|---|---|
| POST | `/v1/sessions` | Start a session from the learner's initial entry |
| GET | `/v1/sessions/{sessionId}` | Restore the learner's own session |
| POST | `/v1/sessions/{sessionId}/message` | Continue the conversation with one learner message |
| POST | `/v1/sessions/{sessionId}/complete` | Generate and persist the final scorecard |

Every route is protected by the Cognito JWT authorizer. Lambda derives the learner identity from the verified `sub` claim; a browser-supplied user ID is never trusted.

Learner conversation content is sent over HTTPS to Groq for model inference. The model prompt does not include the learner's email, Cognito subject or access token. The interface warns learners not to submit passwords, API keys or confidential information. The Groq API key remains in AWS Secrets Manager and is used only by Lambda.

Groq's Responses API is currently in beta and does not support `previous_response_id`, `store`, `truncation`, `include` or `prompt_cache_key`. It also does not maintain stateful conversations; UNSEEN therefore supplies its bounded saved conversation history on every request. See [Groq's Responses API documentation](https://console.groq.com/docs/responses-api) and review [Groq's data controls](https://console.groq.com/docs/your-data) before using confidential or regulated information.

The session item stores the initial entry, status, topic, rolling context summary, knowledge gaps, counters and at most 12 recent display messages. It also holds the Responses API output items needed to continue the conversation for at most the last 8 turns and sends them back with the next request. Groq does not currently support provider-managed stateful conversations, so the application owns this bounded context. There is no separate DynamoDB item for each mentor question or answer. Completion stores one `ASSESSMENT#<sessionId>` item and marks the session complete in a DynamoDB transaction. Repeating the completion request returns the existing scorecard.

### Configure the Groq API key

1. Create an API key in the [Groq Console](https://console.groq.com/keys). Do not put it in a Vite variable, React code, GitHub, or this repository.
2. Store it in AWS Secrets Manager as `unseen/dev/groq-api-key`. The secret may be a plain API key string or JSON containing an `apiKey` field. The Lambda execution role is granted access only to the configured secret path.
3. Deploy the updated `api-backend.yaml` template after the secret exists.

On macOS, a hidden terminal prompt can be used to enter the key without echoing it:

```bash
read -s GROQ_API_KEY
echo
aws secretsmanager create-secret \
  --name unseen/dev/groq-api-key \
  --description "UNSEEN development Groq API key" \
  --secret-string "$GROQ_API_KEY" \
  --profile dev \
  --region ap-south-1
unset GROQ_API_KEY
```

If the secret already exists, use `aws secretsmanager put-secret-value` instead of `create-secret`.

The default model parameter is `openai/gpt-oss-20b`. Each mentor reply and each final scorecard requires a model request and may incur Groq usage charges. Review your Groq usage limits before using the integration beyond initial tests.

### Session API deployment

Validate the template before deployment:

```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/api-backend.yaml \
  --profile dev \
  --region ap-south-1
```

Deploy using the existing development stack and execution role after reviewing the change:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/api-backend.yaml \
  --stack-name unseen-api-backend-dev \
  --capabilities CAPABILITY_NAMED_IAM \
  --role-arn arn:aws:iam::470044069008:role/CloudFormationExecutionRole \
  --parameter-overrides \
    ProjectName=unseen \
    EnvironmentName=dev \
    LearningTableName=unseen-dev-learning \
    CognitoUserPoolId=ap-south-1_tI7jDRdV4 \
    CognitoAppClientId=116brlu7snrt6tdo9e290l9srb \
    GroqApiKeySecretName=unseen/dev/groq-api-key \
    GroqModel=openai/gpt-oss-20b \
  --profile dev \
  --region ap-south-1
```

This updates the existing API/Lambda stack; it does not create a second API or replace the DynamoDB table. The frontend needs no Groq key and uses the existing `VITE_UNSEEN_API_URL`.

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
│   └── shared/                 # Session score validation
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

- Never commit `.env.local`, AWS credentials, Groq API keys, app-client secrets or private keys.
- The browser Cognito app client is public and has no client secret.
- The deployed API Gateway HTTP API validates Cognito access-token signature, issuer, expiry, client ID and required scopes using its JWT authorizer.
- Backend code must derive the user ID from validated token claims, not from a client-supplied user ID.
- Groq API calls must run in Lambda. Never expose the Groq API key in a Vite `VITE_*` variable or browser bundle.
- The configured model generates one overall session score and supporting feedback; the backend validates the 0–100 value and owns persistence.
- Lifetime points, ranks and daily point caps are deferred from the first release.
- Do not store passwords or access tokens in the learning data table.

## AWS hosting status

The S3 + CloudFront CloudFormation template is retained for a future AWS deployment. The AWS account's CloudFront access request was declined pending further account usage and billing history. The AWS static-site workflow is guarded and remains dormant until its required repository variables are configured.

Cloudflare Pages is the current hosting path for the public frontend.

## Continuation brief

> Continue the UNSEEN project from the existing GitHub repository. Module 1 public pages are Home, About and How It Works. Module 2 Cognito authentication works on branch `feature/module2-cognito-auth`: React login/signup entry pages, Cognito Hosted UI OAuth Authorization Code + PKCE via AWS Amplify, callback handling and protected dashboard. The development DynamoDB table and API stack are deployed. The API exposes public `GET /health` and Cognito JWT-protected `GET /v1/me`; the latter initializes or retrieves the signed-in learner's profile. The React dashboard now calls that endpoint using Amplify's Cognito access token and displays the authenticated learner profile. Current task: set `VITE_UNSEEN_API_URL` in local `.env.local` and Cloudflare Pages environments, pull latest branch, run tests/build, then verify the authenticated profile end to end. Next build a session orchestration endpoint that manages Groq context, stores a bounded active-session summary and saves one completed session scorecard (0–100) with feedback; lifetime points and ranks are deferred. Preserve the dark navy/mint design, keep UI minimal, include meaningful comments, update docs and test the Vite build. Inspect current files before changing them.
