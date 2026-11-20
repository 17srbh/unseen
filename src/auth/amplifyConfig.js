import { Amplify } from "aws-amplify";

// Reads public Cognito identifiers injected by the local .env file or Cloudflare Pages.
// These values identify the user pool and app client; they are not AWS credentials.
const env = import.meta.env;

const userPoolId = env.VITE_COGNITO_USER_POOL_ID?.trim();
const userPoolClientId = env.VITE_COGNITO_USER_POOL_CLIENT_ID?.trim();

// Amplify expects the Cognito domain host without the https:// prefix.
const cognitoDomain = env.VITE_COGNITO_DOMAIN?.trim().replace(/^https?:\/\//, "").replace(/\/$/, "");

export const isCognitoConfigured = Boolean(
  userPoolId && userPoolClientId && cognitoDomain
);

// The same code works locally and on Cloudflare Pages.
// Register each resulting callback and sign-out URL in the Cognito app client.
const appOrigin = typeof window !== "undefined" ? window.location.origin : "http://localhost:5173";

export const authRedirects = {
  signIn: env.VITE_COGNITO_REDIRECT_SIGN_IN?.trim() || `${appOrigin}/auth/callback`,
  signOut: env.VITE_COGNITO_REDIRECT_SIGN_OUT?.trim() || `${appOrigin}/`,
};

// Configure Amplify only when all required Cognito values are present.
// The authorization-code response type enables Cognito's OAuth code flow with PKCE.
if (isCognitoConfigured) {
  Amplify.configure({
    Auth: {
      Cognito: {
        userPoolId,
        userPoolClientId,
        loginWith: {
          oauth: {
            domain: cognitoDomain,
            scopes: ["openid", "email", "profile"],
            redirectSignIn: [authRedirects.signIn],
            redirectSignOut: [authRedirects.signOut],
            responseType: "code",
          },
        },
      },
    },
  });
}

// Exposes only the non-secret values needed by the application UI and diagnostics.
export const cognitoPublicConfig = {
  userPoolId,
  userPoolClientId,
  domain: cognitoDomain,
  region: userPoolId?.split("_")[0],
};
