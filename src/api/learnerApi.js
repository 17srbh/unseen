import { fetchAuthSession } from "aws-amplify/auth";

const apiBaseUrl = import.meta.env.VITE_UNSEEN_API_URL?.trim().replace(/\/$/, "");

/**
 * Loads the signed-in learner's profile from the UNSEEN API.
 * API Gateway validates the Cognito access token before Lambda sees the request.
 */
export async function fetchMyProfile({ signal } = {}) {
  if (!apiBaseUrl) {
    throw new Error("The UNSEEN API URL is not configured. Add VITE_UNSEEN_API_URL to your environment and rebuild the app.");
  }

  const session = await fetchAuthSession();
  const accessToken = session.tokens?.accessToken?.toString();

  if (!accessToken) {
    throw new Error("Your sign-in session is unavailable. Please sign out and sign in again.");
  }

  const response = await fetch(`${apiBaseUrl}/v1/me`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/json",
    },
    cache: "no-store",
    signal,
  });

  if (response.status === 401) {
    throw new Error("Your session was not accepted by the API. Please sign out and sign in again.");
  }

  if (!response.ok) {
    throw new Error(`Unable to load your learner profile (HTTP ${response.status}). Please try again.`);
  }

  const payload = await response.json();
  if (!payload.profile || typeof payload.profile !== "object") {
    throw new Error("The API response did not contain a learner profile.");
  }

  return payload.profile;
}
