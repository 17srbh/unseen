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
| Learning session | SESSION#<timestamp>#<sessionId> | Initial learning entry, status and current context |
| Assessment | ASSESSMENT#<timestamp>#<sessionId> | Final session scorecard |

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
