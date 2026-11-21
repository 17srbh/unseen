# UNSEEN Learning Data Model — first release

## Scope

This is the first backend foundation for the learner experience. It defines a single DynamoDB table and the deterministic scoring rules used by the application.

The first release stores:

- A learner profile and lifetime points.
- Learning sessions started from the learner's daily note.
- Individual learner and mentor conversation turns.
- Completed assessments and rubric evidence.
- An append-only points ledger.
- A per-UTC-day points counter used to enforce the daily cap.
- Skill progress records for future learning analytics.

The table is deployed in the development account. The first API/Lambda template now exists at `infrastructure/cloudformation/api-backend.yaml`; it has not yet been deployed. Its initial protected operation is `GET /v1/me`, which initializes or retrieves the authenticated learner's profile.

## Infrastructure

CloudFormation template: `infrastructure/cloudformation/learning-data.yaml`

Development stack name: `unseen-learning-data-dev`

Development table name: `unseen-dev-learning`

- Billing mode: `PAY_PER_REQUEST` (on-demand).
- Primary key: string partition key `PK` and string sort key `SK`.
- Deletion protection: enabled.
- CloudFormation deletion and replacement policies: `Retain`.
- DynamoDB encryption at rest: AWS-owned key by default; no customer-managed KMS key is created.
- Point-in-time recovery: disabled by default for development to avoid introducing backup charges before there is valuable data. Enable it for production after reviewing its cost.

AWS documents on-demand capacity as `PAY_PER_REQUEST`; DynamoDB encrypts all table data at rest by default. See the official AWS references in the project architecture notes.

## Key design

Every record belonging to a person uses the authenticated Cognito subject:

```text
PK = USER#<cognito-sub>
```

The backend must get this subject only from API Gateway's validated JWT claims. Never accept a user ID from the request body or query string as the source of identity.

| Record | Sort key | Purpose |
|---|---|---|
| Profile | `PROFILE` | Lifetime points, current rank and profile timestamps |
| Learning session | `SESSION#<ISO timestamp>#<sessionId>` | Original learning note and session state |
| Conversation turn | `TURN#<sessionId>#<zero-padded turn number>` | One learner or mentor message per item |
| Assessment | `ASSESSMENT#<ISO timestamp>#<sessionId>` | Final rubric, total score, strengths and next steps |
| Points ledger | `POINTS#<ISO timestamp>#<sessionId>` | Immutable record of points awarded for a session |
| Daily points counter | `DAILY#<YYYY-MM-DD UTC>` | Points already awarded on a UTC day |
| Skill progress | `SKILL#<normalized skill key>` | Latest and historical skill evidence |

Only `PK` and `SK` are declared as DynamoDB attributes at table creation. Other fields are ordinary item attributes and do not need AttributeDefinitions unless later indexed.

## Example items

### Learner profile

```json
{
  "PK": "USER#<cognito-sub>",
  "SK": "PROFILE",
  "entityType": "PROFILE",
  "totalPoints": 82,
  "currentRank": "Learner",
  "createdAt": "2026-11-22T10:30:00.000Z",
  "updatedAt": "2026-11-22T10:30:00.000Z"
}
```

### Learning session

```json
{
  "PK": "USER#<cognito-sub>",
  "SK": "SESSION#2026-11-22T10:30:00.000Z#<sessionId>",
  "entityType": "SESSION",
  "sessionId": "<sessionId>",
  "topic": "AWS IAM and Lambda permissions",
  "initialNote": "I deployed an API using AI but do not fully understand the invoke permission.",
  "status": "IN_PROGRESS",
  "startedAt": "2026-11-22T10:30:00.000Z",
  "turnCount": 1
}
```

### Conversation turn

```json
{
  "PK": "USER#<cognito-sub>",
  "SK": "TURN#<sessionId>#000002",
  "entityType": "TURN",
  "sessionId": "<sessionId>",
  "turnNumber": 2,
  "role": "mentor",
  "content": "Which permission allows API Gateway to invoke the Lambda function?",
  "createdAt": "2026-11-22T10:31:00.000Z"
}
```

### Assessment and points ledger

The assessment stores the AI's rubric ratings and evidence. The backend calculates the official total score and points; model-generated point totals are ignored.

The points ledger is append-only. Awarding points must be idempotent: write the unique ledger item and update the profile and daily counter together in a DynamoDB transaction. Put the ledger item with a condition that the key does not already exist. Apply a conditional daily-counter update so concurrent requests cannot exceed the daily cap.

## Access patterns supported by the first key design

1. Get the current learner profile: `GetItem(PK=USER#sub, SK=PROFILE)`.
2. List recent learning sessions: query `PK=USER#sub` with `begins_with(SK, SESSION#)`, descending.
3. Get a session's conversation: query `PK=USER#sub` with `begins_with(SK, TURN#<sessionId>#)`.
4. Get the assessment for a session: query the same partition with `begins_with(SK, ASSESSMENT#)` and match the session identifier, or use the deterministic assessment sort key.
5. Read points history: query `PK=USER#sub` with `begins_with(SK, POINTS#)`, descending.
6. Read a UTC daily counter: `GetItem(PK=USER#sub, SK=DAILY#<date>)`.

No secondary index is needed for these initial user-scoped access patterns. Add a GSI only when a real product query requires access by a different partition key.

## Initial assessment policy (provisional)

The AI returns a rating from 0 to 5 for each dimension. The backend validates the four integers and calculates:

| Dimension | Weight |
|---|---:|
| Conceptual accuracy | 30 |
| Reasoning | 25 |
| Practical application | 25 |
| Interview explanation | 20 |

Each rating is converted proportionally to its dimension's weight. The resulting score is an integer from 0 to 100.

Initial points policy:

- One point per ten assessment points, rounded down.
- Maximum ten points per completed assessment.
- Maximum twenty points per UTC day.
- A session may award points only once.
- Points are added only when an assessment is completed.

Rank thresholds:

| Lifetime points | Rank |
|---:|---|
| 0–99 | Learner |
| 100–499 | Amateur |
| 500+ | Veteran |

These scoring and reward values are an initial product proposal, centralised in `backend/shared/scoring.js`. Review them before launch; do not let Grok write directly to the profile's points or rank.

## Tests

Run:

```bash
npm test
```

The tests cover rubric validation, weighted scoring, point caps and rank boundaries.

## API foundation

CloudFormation template: `infrastructure/cloudformation/api-backend.yaml`

The first API stack creates:

- An HTTP API with a public `GET /health` route.
- A Cognito JWT authorizer using the deployed User Pool issuer and public app client ID.
- A protected `GET /v1/me` route that reads the authenticated `sub` from API Gateway's validated JWT claims.
- A Lambda execution role scoped to `GetItem` and `PutItem` on the configured learning table, plus CloudWatch logging.
- First-use profile creation with a conditional write to handle concurrent first requests.

The initial Lambda uses the runtime-provided AWS SDK because it is defined inline in CloudFormation. AWS recommends packaging SDK dependencies for normal deployment packages; the inline template is intentionally a small first slice.

## Next backend milestone

1. Validate and deploy the API stack, then test the public health route and authenticated profile route.
2. Add protected endpoints to start a learning session and append a conversation turn.
3. Add a server-side Grok adapter using the xAI Responses API and a secret stored outside the frontend.
4. Persist Grok questions and learner answers as separate turn items.
5. Complete an assessment and record the score, points ledger and profile update atomically.
