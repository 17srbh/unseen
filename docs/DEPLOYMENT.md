# UNSEEN Module 1 — AWS deployment guide

## Scope

This deployment publishes only the existing public React website pages:

- Home (`/`)
- About (`/about`)
- How It Works (`/how-it-works`)

No ECS, Fargate, VPC, ALB, database, authentication or backend resources are created in this phase.

## Target architecture

```text
Browser
  |
  v
CloudFront HTTPS distribution
  |
  | signed origin requests (OAC / SigV4)
  v
Private S3 bucket (React/Vite dist/ output)

GitHub main branch
  |
  v
GitHub Actions build job
  |
  | GitHub OIDC -> short-lived AWS role credentials
  v
S3 sync + CloudFront invalidation
```

CloudFormation creates the S3 bucket, CloudFront OAC, CloudFront distribution and restrictive bucket policy. A second CloudFormation stack creates a deployment role scoped to the one repository/branch, one bucket and one CloudFront distribution.

## Prerequisites

- An AWS account with permission to create CloudFormation, S3, CloudFront and IAM resources.
- AWS CLI v2 installed and configured locally.
- Git installed.
- A GitHub account and a repository for this project.
- Node.js 20 or later locally.

Do not paste AWS access keys, secret keys, session tokens or passwords into chat or commit them to GitHub.

## Step 1 — Build locally

From the project root:

```bash
npm install
npm run build
```

Confirm that Vite creates the `dist/` directory. Commit the generated `package-lock.json` from your local `npm install` so future installs can be repeatable. The workflow currently uses `npm install`; it can be changed to `npm ci` after the lockfile is committed.

## Step 2 — Create a GitHub repository

Create an empty repository, for example `unseen`, then initialise and push the project from the project root:

```bash
git init
git add .
git commit -m "Initial UNSEEN Module 1 website"
git branch -M main
git remote add origin https://github.com/<GITHUB_OWNER>/<GITHUB_REPOSITORY>.git
git push -u origin main
```

Replace the placeholders with the actual repository owner and name. Do not commit `node_modules/`, `dist/`, `.env` or AWS credentials.

## Step 3 — Verify the AWS CLI identity and region

Choose the AWS region where the S3 bucket and CloudFormation stacks should live. `ap-south-1` (Mumbai) is a reasonable default for an India-based project, but use the region you intend to operate in.

```bash
aws sts get-caller-identity
aws configure list
aws --version
```

If `get-caller-identity` fails, fix the local AWS CLI profile or SSO login before continuing. CloudFront is a global service, while the bucket and CloudFormation stack are created in the selected region.

## Step 4 — Create frontend hosting with CloudFormation

From the project root, validate and deploy the template:

```bash
aws cloudformation validate-template \
  --template-body file://infrastructure/cloudformation/frontend-hosting.yaml \
  --region ap-south-1

aws cloudformation deploy \
  --template-file infrastructure/cloudformation/frontend-hosting.yaml \
  --stack-name unseen-module1-frontend \
  --parameter-overrides PriceClass=PriceClass_200 \
  --region ap-south-1
```

Replace `ap-south-1` if using another region. Wait for the stack to reach `CREATE_COMPLETE`.

Retrieve the outputs:

```bash
aws cloudformation describe-stacks \
  --stack-name unseen-module1-frontend \
  --region ap-south-1 \
  --query 'Stacks[0].Outputs' \
  --output table
```

Record the values for `WebsiteBucketName`, `CloudFrontDistributionId` and `WebsiteURL`.

The S3 bucket is private. CloudFront reads objects through Origin Access Control. The template configures 403/404 fallback to `/index.html` so direct navigation and refreshes on the current React Router routes work. This fallback means an unknown path may also return the app shell with HTTP 200; a proper not-found route/status can be refined later.

## Step 5 — Create the GitHub OIDC identity provider once per AWS account

In the AWS IAM console, open **Identity providers** and check whether `token.actions.githubusercontent.com` already exists.

If it does not exist, add an OpenID Connect provider with:

- Provider URL: `https://token.actions.githubusercontent.com`
- Audience: `sts.amazonaws.com`

Do not create a duplicate provider if it already exists. This provider is account-wide and may be reused by other GitHub repositories with separate, restricted IAM roles.

## Step 6 — Create a repository-scoped GitHub deployment role

Use the actual GitHub owner/repository and the three outputs from Step 4:

```bash
aws cloudformation deploy \
  --template-file infrastructure/cloudformation/github-deploy-role.yaml \
  --stack-name unseen-module1-github-deploy \
  --parameter-overrides \
    GitHubOwner=<GITHUB_OWNER> \
    GitHubRepository=<GITHUB_REPOSITORY> \
    DeploymentBranch=main \
    WebsiteBucketName=<WEBSITE_BUCKET_NAME> \
    CloudFrontDistributionId=<CLOUDFRONT_DISTRIBUTION_ID> \
  --capabilities CAPABILITY_IAM \
  --region ap-south-1
```

Replace every placeholder. The role trust policy only accepts OIDC tokens from the specified repository's `main` branch. Its permissions only allow uploads/deletions in this website bucket and invalidations on this CloudFront distribution.

Retrieve the role ARN:

```bash
aws cloudformation describe-stacks \
  --stack-name unseen-module1-github-deploy \
  --region ap-south-1 \
  --query "Stacks[0].Outputs[?OutputKey=='GitHubActionsRoleArn'].OutputValue | [0]" \
  --output text
```

## Step 7 — Add GitHub Actions repository variables

In GitHub, open **Repository → Settings → Secrets and variables → Actions → Variables** and add:

| Variable | Value |
|---|---|
| `AWS_REGION` | `ap-south-1` (or the selected region) |
| `AWS_DEPLOY_ROLE_ARN` | Role ARN from Step 6 |
| `S3_BUCKET_NAME` | `WebsiteBucketName` output from Step 4 |
| `CLOUDFRONT_DISTRIBUTION_ID` | `CloudFrontDistributionId` output from Step 4 |

These are configuration values, not long-lived AWS credentials. Do not store access keys in GitHub.

## Step 8 — Deploy from GitHub Actions

The workflow is `.github/workflows/deploy-module1.yml`. Push a change to `main` (or run it manually from the GitHub Actions tab using **Run workflow**).

The workflow:

1. Installs Node.js dependencies.
2. Runs `npm run build`.
3. Requests short-lived AWS credentials using GitHub OIDC.
4. Syncs `dist/` to the private S3 bucket.
5. Uploads `index.html` with a short cache lifetime.
6. Creates a CloudFront invalidation for `/*`.

After the workflow succeeds and the CloudFront distribution is deployed, open the `WebsiteURL` output. Test all three pages and refresh directly on `/about` and `/how-it-works`.

## Cost and clean-up notes

This design avoids always-on compute such as ECS tasks, EC2 instances, NAT gateways and an ALB. It is not guaranteed to be free: S3 storage/requests, CloudFront requests/data transfer and invalidations may incur charges under the account's applicable pricing and free-tier terms.

The website bucket has `DeletionPolicy: Retain` to protect uploaded assets from accidental stack deletion. Deleting the CloudFormation stack therefore does not delete the bucket; empty and delete it separately only when you intentionally want to remove the site.

## Troubleshooting

- `AccessDenied` during CloudFormation: check the local AWS identity and its permissions for CloudFormation, S3, CloudFront and IAM resources.
- `NoSuchBucket` in GitHub Actions: check `S3_BUCKET_NAME` repository variable.
- `Not authorized to perform sts:AssumeRoleWithWebIdentity`: verify the IAM OIDC provider exists and that GitHub owner, repository and branch exactly match the role trust policy.
- `AccessDenied` from S3 sync: inspect the GitHub role's S3 policy and confirm it references the correct bucket.
- New files not visible: inspect the workflow's CloudFront invalidation step and distribution ID.
- `/about` or `/how-it-works` returns an error on refresh: verify the distribution custom error responses and wait for the distribution deployment to finish.
