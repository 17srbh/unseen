import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { fetchAuthSession, getCurrentUser, signInWithRedirect, signOut as cognitoSignOut } from "aws-amplify/auth";
import { Hub } from "aws-amplify/utils";
import { isCognitoConfigured } from "./amplifyConfig";

// Shares the current Cognito session with navigation, protected pages and auth screens.
const AuthContext = createContext(null);

// Resolves the signed-in user from Amplify's persisted Cognito session.
// fetchAuthSession also lets Amplify refresh expired tokens when a valid refresh token exists.
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState("");

  const syncCurrentUser = useCallback(async () => {
    if (!isCognitoConfigured) {
      setUser(null);
      setLoading(false);
      return null;
    }

    try {
      const [currentUser, session] = await Promise.all([
        getCurrentUser(),
        fetchAuthSession(),
      ]);

      const claims = session.tokens?.idToken?.payload ?? {};
      const signedInUser = {
        userId: currentUser.userId,
        username: currentUser.username,
        email: typeof claims.email === "string" ? claims.email : currentUser.username,
      };

      setUser(signedInUser);
      return signedInUser;
    } catch {
      // No valid local session is a normal state for a signed-out visitor.
      setUser(null);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Listen for Cognito Hosted UI redirects, sign-outs and token refresh failures.
    const stopListening = Hub.listen("auth", async ({ payload }) => {
      if (!mounted) return;

      switch (payload.event) {
        case "signInWithRedirect":
        case "signedIn": {
          setAuthError("");
          const signedInUser = await syncCurrentUser();
          if (mounted && signedInUser) {
            // The OAuth callback has completed; move the browser into the protected app.
            window.location.replace("/app/dashboard");
          }
          break;
        }
        case "signedOut":
          setUser(null);
          setLoading(false);
          break;
        case "signInWithRedirect_failure":
          setAuthError("We couldn't complete sign-in. Please try again.");
          setLoading(false);
          break;
        case "tokenRefresh_failure":
          setAuthError("Your session could not be refreshed. Please sign in again.");
          setUser(null);
          setLoading(false);
          break;
        default:
          break;
      }
    });

    // Restore a previous session when the visitor reloads or returns to the site.
    syncCurrentUser();

    return () => {
      mounted = false;
      stopListening();
    };
  }, [syncCurrentUser]);

  // Starts Cognito's hosted authorization-code flow. Cognito hosts credential entry,
  // email verification, password recovery and the Sign up link.
  const startSignIn = useCallback(async () => {
    setAuthError("");
    if (!isCognitoConfigured) {
      setAuthError("Authentication is not configured yet. Add the Cognito values to your local or Cloudflare environment.");
      return;
    }
    await signInWithRedirect();
  }, []);

  // Cognito Classic Hosted UI exposes its Sign up link on the hosted login page.
  // Both entry points use the same PKCE-protected redirect so Amplify owns state and tokens.
  const startSignUp = useCallback(async () => {
    setAuthError("");
    if (!isCognitoConfigured) {
      setAuthError("Authentication is not configured yet. Deploy the Cognito stack and add its outputs to your environment.");
      return;
    }
    await signInWithRedirect();
  }, []);

  // Signs the user out through Amplify and Cognito's configured sign-out endpoint.
  const signOut = useCallback(async () => {
    setAuthError("");
    await cognitoSignOut();
    setUser(null);
  }, []);

  const value = useMemo(() => ({
    user,
    loading,
    authConfigured: isCognitoConfigured,
    authError,
    clearAuthError: () => setAuthError(""),
    startSignIn,
    startSignUp,
    signOut,
    refreshUser: syncCurrentUser,
  }), [user, loading, authError, startSignIn, startSignUp, signOut, syncCurrentUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Provides one consistent hook for consuming authentication state throughout React.
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }
  return context;
}
