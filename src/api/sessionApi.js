import { fetchAuthSession } from "aws-amplify/auth";

const apiBaseUrl = import.meta.env.VITE_UNSEEN_API_URL?.trim().replace(/\/$/, "");

async function authenticatedRequest(path, { method = "GET", body, signal } = {}) {
  if (!apiBaseUrl) {
    throw new Error("The UNSEEN API URL is not configured. Add VITE_UNSEEN_API_URL and rebuild the app.");
  }

  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();
  if (!accessToken) {
    throw new Error("Your sign-in session is unavailable. Please sign out and sign in again.");
  }

  const response = await fetch(`${apiBaseUrl}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
    cache: "no-store",
    signal,
  });

  let payload;
  try {
    payload = await response.json();
  } catch {
    throw new Error("The UNSEEN API returned an unreadable response. Please try again.");
  }

  if (response.status === 401) {
    throw new Error("Your session was not accepted by the API. Please sign out and sign in again.");
  }
  if (!response.ok) {
    throw new Error(payload.error || `The request failed (HTTP ${response.status}). Please try again.`);
  }

  return payload;
}

export function startLearningSession(initialEntry) {
  return authenticatedRequest("/v1/sessions", {
    method: "POST",
    body: { initialEntry },
  });
}

export function getLearningSession(sessionId, { signal } = {}) {
  return authenticatedRequest(`/v1/sessions/${encodeURIComponent(sessionId)}`, { signal });
}

export function sendLearningSessionMessage(sessionId, message) {
  return authenticatedRequest(`/v1/sessions/${encodeURIComponent(sessionId)}/message`, {
    method: "POST",
    body: { message },
  });
}

export function completeLearningSession(sessionId) {
  return authenticatedRequest(`/v1/sessions/${encodeURIComponent(sessionId)}/complete`, {
    method: "POST",
    body: {},
  });
}
