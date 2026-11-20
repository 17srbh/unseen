import { ArrowRight, ArrowUpRight, ShieldCheck } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Provides UNSEEN-branded entry screens while Cognito securely handles credentials.
// Cognito Classic Hosted UI displays the actual sign-in, sign-up and password-recovery forms.
export default function AuthPage({ mode = "login" }) {
  const { user, loading, authConfigured, authError, clearAuthError, startSignIn, startSignUp } = useAuth();
  const isSignup = mode === "signup";

  if (!loading && user) {
    return <Navigate to="/app/dashboard" replace />;
  }

  const continueToCognito = async () => {
    clearAuthError();
    if (isSignup) {
      await startSignUp();
    } else {
      await startSignIn();
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-page-glow auth-page-glow-one" />
      <div className="auth-page-glow auth-page-glow-two" />

      <div className="auth-topbar">
        <Link className="brand auth-brand" to="/">
          <span className="brand-mark">U</span>
          <span>UNSEEN<span className="brand-period">.</span></span>
        </Link>
        <Link className="auth-back-link" to="/">Back to website <ArrowUpRight size={15} /></Link>
      </div>

      <div className="auth-layout">
        <section className="auth-story">
          <span className="auth-eyebrow"><span /> YOUR JOURNEY STARTS HERE</span>
          <h1>{isSignup ? <>Make your effort<br /><span>count.</span></> : <>Welcome back<br /><span>to your journey.</span></>}</h1>
          <p>
            {isSignup
              ? "Create a space for everything you're learning, practising and becoming. Your progress starts with one small step."
              : "Your learning journey is still moving forward. Pick up where you left off and keep building on what you've learned."}
          </p>

          <div className="auth-belief-card">
            <span className="auth-belief-mark">“</span>
            <div>
              <strong>Your effort deserves to be seen.</strong>
              <small>Every lesson. Every attempt. Every step forward.</small>
            </div>
          </div>
        </section>

        <section className="auth-card" aria-labelledby="auth-title">
          <div className="auth-card-brand">
            <span className="auth-card-mark">U</span>
            <span>UNSEEN<span className="brand-period">.</span></span>
          </div>

          <span className="auth-card-kicker">{isSignup ? "START SOMETHING FOR YOURSELF" : "YOUR PROGRESS IS WAITING"}</span>
          <h2 id="auth-title">{isSignup ? "Create your account" : "Sign in to UNSEEN"}</h2>
          <p className="auth-card-description">
            {isSignup
              ? "We'll take you to AWS's secure sign-up page to create and verify your account."
              : "Continue securely with your UNSEEN account."}
          </p>

          {!authConfigured && (
            <div className="auth-config-notice" role="status">
              <strong>AWS authentication is not connected yet.</strong>
              <span>Deploy the Cognito CloudFormation stack, then add the public Cognito configuration values to your local .env file and Cloudflare Pages settings.</span>
            </div>
          )}

          {authError && <div className="auth-error" role="alert">{authError}</div>}

          <button
            className="button button-primary auth-submit"
            type="button"
            onClick={continueToCognito}
            disabled={!authConfigured || loading}
          >
            {isSignup ? "Continue to secure sign up" : "Continue to secure sign in"}
            <ArrowRight size={17} />
          </button>

          <div className="auth-security-note">
            <ShieldCheck size={17} />
            <span>Your password is entered on an AWS-hosted page. UNSEEN never sees or stores it.</span>
          </div>

          <div className="auth-switch">
            {isSignup ? (
              <>Already have an account? <Link to="/login">Sign in</Link></>
            ) : (
              <>New to UNSEEN? <Link to="/signup">Create an account</Link></>
            )}
          </div>
        </section>
      </div>

      <div className="auth-page-footer">
        <span>© {new Date().getFullYear()} UNSEEN.</span>
        <span>Small steps. Real progress.</span>
      </div>
    </main>
  );
}
