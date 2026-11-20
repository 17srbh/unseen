# UNSEEN Module 2 — Cognito authentication

## Scope of this milestone

This stack adds user authentication only:

- Cognito User Pool and email-based sign-up.
- Public browser app client without a client secret.
- OAuth 2.0 authorization-code grant with PKCE through Amplify Auth.
- Cognito-hosted sign-in, sign-up, email verification and password recovery.
- React login, signup, callback and protected dashboard placeholder pages.

It does **not** create the learning API, DynamoDB learning table, Lambda functions, ECS services or journal CRUD yet.

## Architecture

1. Cloudflare Pages serves the static React application.
2. The React app uses AWS Amplify Auth to redirect the browser to the Cognito Hosted UI.
3. Cognito authenticates the user and redirects to the registered `/auth/callback` URL with an authorization code.
4. Amplify completes the code exchange using PKCE and stores the Cognito session.
5. The app uses the Cognito access token for future protected API calls.
6. Amplify `fetchAuthSession()` automatically refreshes expired access/ID tokens when a valid refresh token is available.

Cloudflare is the frontend host; it does not authenticate users or receive their passwords. Cognito is the authentication service.

## Why Lite + Classic Hosted UI

The CloudFormation template explicitly selects the Cognito Lite tier and Classic Hosted UI (branding version 1). AWS documents Classic Hosted UI as available on all feature plans, including Lite. The newer Managed Login (version 2) requires Essentials or Plus. This keeps the initial authentication setup simpler and avoids selecting a higher feature tier solely for its newer branding editor.

The Classic Hosted UI has a Sign up link on its login page. The UNSEEN `/signup` route guides users to that AWS-hosted sign-up flow.

## Deploy Cognito with CloudFormation

From the project root:

```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/cognito-auth.yaml \
  --profile dev \
  --region ap-south-1
```

Choose a globally unique, lowercase Cognito domain prefix. Then deploy:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/cognito-auth.yaml \
  --stack-name unseen-module2-auth \
  --parameter-overrides \
    DomainPrefix=unseen-470044069008-login \
    CallbackUrls=http://localhost:5173/auth/callback \
    LogoutUrls=http://localhost:5173/ \
  --role-arn arn:aws:iam::470044069008:role/CloudFormationExecutionRole \
  --profile dev \
  --region ap-south-1
```

If the domain prefix is already taken, choose another globally unique prefix. Do not create a second stack until the first stack's status is known.

Retrieve the outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name unseen-module2-auth \
  --profile dev \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

## Connect the React app locally

Copy `.env.example` to `.env.local` and replace the placeholders with the CloudFormation outputs:

- `VITE_COGNITO_USER_POOL_ID`
- `VITE_COGNITO_USER_POOL_CLIENT_ID`
- `VITE_COGNITO_DOMAIN`

The redirect variables default to the local Vite URL. If overriding them, register the exact same URLs in the Cognito app client.

Then install dependencies and run the app:

```bash
cp .env.example .env.local
npm install
npm run dev
```

The Cognito callback URL must exactly match the URL configured on the User Pool app client.

## Connect Cloudflare Pages

Once the Pages project has its final `*.pages.dev` hostname:

1. Update the Cognito stack's `CallbackUrls` to include `https://YOUR-PAGES-HOST/auth/callback`.
2. Update `LogoutUrls` to include `https://YOUR-PAGES-HOST/`.
3. Set the same three public Cognito variables in Cloudflare Pages → Settings → Environment variables for Production and Preview as appropriate.
4. Trigger a fresh Pages build because Vite embeds `VITE_*` values at build time.

These identifiers are public application configuration. **Never** add AWS access keys, Cognito app-client secrets, or private credentials to `VITE_*` variables.

## Security notes

- The browser app client has `GenerateSecret: false`; a browser cannot protect a client secret.
- The flow uses OAuth authorization code and PKCE, not the implicit grant.
- Do not trust a user ID supplied by the browser when implementing APIs. The backend must validate the Cognito access-token signature, issuer, expiration and token use, then derive the user identity from validated claims.
- The current milestone has no business API. Authentication alone does not yet save learning journal entries.
- Cognito's default email delivery is suitable for initial testing; configure and verify a production email sending setup before a broad launch.
- Review Cognito monthly-active-user and email/SMS charges in the AWS pricing page and billing console.

## New-conversation continuation notes

Current Module 2 milestone: Cognito auth frontend + Cognito User Pool CloudFormation. The frontend is still hosted by Cloudflare Pages. The AWS stack is independent of Cloudflare hosting. After auth works, the next implementation milestone is user onboarding and the Learning API (not ECS by default).
