import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const templatePath = resolve(root, "infrastructure/cloudformation/api-backend.yaml");
const template = readFileSync(templatePath, "utf8");

function extractInlineLambda(source) {
  const marker = "      Code:\n        ZipFile: |\n";
  const start = source.indexOf(marker);
  assert.notEqual(start, -1, "CloudFormation template must contain inline Lambda code.");

  const lines = source.slice(start + marker.length).split(/\r?\n/);
  const codeLines = [];

  for (const line of lines) {
    if (line.trim() && !line.startsWith("          ")) break;
    codeLines.push(line.startsWith("          ") ? line.slice(10) : "");
  }

  return codeLines.join("\n");
}

const lambdaSource = extractInlineLambda(template);

test("inline Lambda source is valid JavaScript", () => {
  assert.doesNotThrow(() => new vm.Script(lambdaSource));
});

test("session routes are Cognito-protected and have corresponding handler paths", () => {
  for (const route of [
    "POST /v1/sessions",
    "GET /v1/sessions/{sessionId}",
    "POST /v1/sessions/{sessionId}/message",
    "POST /v1/sessions/{sessionId}/complete",
  ]) {
    assert.ok(template.includes(`RouteKey: '${route}'`), `Missing API Gateway route: ${route}`);
    assert.ok(lambdaSource.includes(`"${route}"`), `Missing Lambda handler route: ${route}`);
  }

  assert.match(template, /AuthorizationType: JWT/);
  assert.match(lambdaSource, /authorizer[\s\S]*?claims[\s\S]*?sub/);
});

test("Grok 4.7 is called from Lambda through the Responses API with structured output", () => {
  assert.match(lambdaSource, /https:\/\/api\.x\.ai\/v1\/responses/);
  assert.match(lambdaSource, /text:\s*\{[\s\S]*?format:\s*\{[\s\S]*?type:\s*"json_schema"/);
  assert.match(template, /XAI_API_KEY_SECRET_ID: !Ref XaiApiKeySecretName/);
  assert.match(template, /secretsmanager:GetSecretValue/);
  assert.match(template, /XaiModel:[\s\S]*?Default: grok-4\.7/);
});

test("session context is bounded and scorecard persistence is transactional", () => {
  assert.match(lambdaSource, /MAX_RECENT_MESSAGES = 12/);
  assert.match(lambdaSource, /MAX_USER_TURNS = 16/);
  assert.match(lambdaSource, /TransactWriteItemsCommand/);
  assert.match(lambdaSource, /ASSESSMENT#/);
  assert.match(lambdaSource, /ConditionExpression: "#version = :version AND #status = :active"/);
  assert.match(lambdaSource, /Answer at least one mentor follow-up/);
});

test("API throttling and allowed POST CORS method are configured", () => {
  assert.match(template, /AllowMethods:[\s\S]*?- POST/);
  assert.match(template, /ThrottlingBurstLimit: 8/);
  assert.match(template, /ThrottlingRateLimit: 2/);
});
