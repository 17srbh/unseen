import { useEffect } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Displays a clear status while Amplify processes the Cognito authorization-code callback.
export default function AuthCallbackPage() {
  const { user, loading, authError, refreshUser } = useAuth();

  useEffect(() => {
    if (!user && !loading) {
      refreshUser();
    }
  }, [user, loading, refreshUser]);

  if (user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  return (
    <main className="auth-status-page">
      <div className="auth-status-card">
        <span className={loading ? "auth-spinner" : "auth-status-symbol"}>
          {!loading ? "!" : ""}
        </span>
        <h1>{loading ? "Finishing your sign in…" : "We couldn't finish signing you in."}</h1>
        <p>
          {loading
            ? "Cognito has returned you to UNSEEN. We're checking your secure session."
            : authError || "Please return to the sign-in page and try again."}
        </p>
        {!loading && <Link className="button button-primary" to="/login">Return to sign in</Link>}
      </div>
    </main>
  );
}
