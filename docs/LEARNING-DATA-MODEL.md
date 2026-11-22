# UNSEEN Learning Data Model

## First-release objective

UNSEEN provides an AI-led learning mentor and interview-readiness session.

Grok manages the conversation dynamically:
- Asking questions.
- Giving suggestions and explanations.
- Identifying knowledge gaps.
- Running interview-style scenarios.
- Generating one overall session assessment.

The first release uses one score from 0 to 100 per completed session.

There are no lifetime points, ranks, daily point caps or separate
rubric-weight calculations in this release.

## DynamoDB infrastructure

Development stack: `unseen-learning-data-dev`

Table: `unseen-dev-learning`

- Billing: PAY_PER_REQUEST
- Partition key: PK
- Sort key: SK
- Deletion protection: enabled
- CloudFormation deletion policy: Retain

## User identity

Every learner record uses:

`PK = USER#<cognito-sub>`

The backend obtains the Cognito subject from API Gateway's validated JWT.
Never trust a user ID supplied by the browser.

## Records

| Record | Sort key | Purpose |
|---|---|---|
| Profile | PROFILE | Basic learner profile metadata |
| Learning session | SESSION#<sessionId> | Initial entry, active status and bounded conversation context |
| Assessment | ASSESSMENT#<sessionId> | One final scorecard for the completed session |

## Active learning session

A session record can contain:

- Initial learning entry.
- Topic.
- Session status.
- Rolling context summary.
- Bounded recent conversation context.
- Current knowledge gaps.
- Last updated timestamp.

We do not need a separate DynamoDB item for every question, suggestion
or explanation.

Lambda retrieves the saved session context and supplies it to Grok
on each request. The context should use a rolling summary and bounded
recent history rather than grow indefinitely.

## Completed assessment

A completed session produces one assessment record containing:

- Overall session score (integer, 0-100).
- Topic.
- Summary of understanding.
- Strengths.
- Knowledge gaps.
- Recommendations.
- Interview readiness feedback.
- Completion timestamp.

Grok generates the overall score and feedback.

The backend validates the score and response structure before saving.
The backend owns user identity and persistence.

## Implemented session flow

The development API provides the following Cognito-protected routes:

- `POST /v1/sessions` — creates a session and asks Grok for the first mentor response.
- `GET /v1/sessions/{sessionId}` — restores a session belonging to the authenticated Cognito subject.
- `POST /v1/sessions/{sessionId}/message` — appends one learner response, sends the rolling context to Grok and persists the next mentor response.
- `POST /v1/sessions/{sessionId}/complete` — generates a scorecard and atomically saves the assessment while marking the session completed.

A session stores no more than the most recent 12 display messages, plus a rolling summary, topic, current knowledge gaps and turn counters. For Grok 4.7 continuity, it also stores the opaque Responses API output items (including encrypted reasoning) for at most the most recent 8 turns. Those items are passed back unchanged on the next request; they are not shown to the browser. A session is limited to 16 learner turns. The API requires at least one learner response to the mentor before completion.

The completed assessment is saved at `ASSESSMENT#<sessionId>` using a DynamoDB transaction together with the session status update. A repeated completion request returns the existing scorecard instead of creating a second assessment.

Grok 4.7 is called only from Lambda through the xAI Responses API with a JSON Schema response format, low reasoning effort for interactive mentor turns, medium reasoning effort for final assessment, and a per-session prompt-cache key. Full response records are not stored for later `previous_response_id` retrieval (`store: false`). Encrypted reasoning output is held in the bounded DynamoDB session context so the next request can continue coherently; xAI documents that Grok 4.7's encrypted reasoning trace may still be retained server-side for rehydration. Learner conversation content is sent to xAI for model inference; user email, Cognito subject and access tokens are not included in the model prompt. The UI tells learners not to submit passwords, API keys or confidential information. The API key is read from AWS Secrets Manager and is never exposed to the browser. The application validates the model's response shape and the 0–100 score before persistence.

The first UI starts a session at `/app/learn` and restores it at `/app/learn/<sessionId>`. A separate session history/list endpoint is not implemented in this slice.

## Future development

Future versions may analyze:

- Learning frequency and consistency.
- Topics studied.
- Understanding and retention.
- Ability to grasp new concepts.
- Need for additional mentorship.
- Long-term skill development.

These are not separate scoring systems in the first release.
They can become additional learner-intelligence signals later.
