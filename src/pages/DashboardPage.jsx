import { useCallback, useEffect, useState } from "react";
import { BookOpen, LogOut, RefreshCw, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchMyProfile } from "../api/learnerApi.js";

// Loads the signed-in learner's server-owned profile; points and rank come from DynamoDB.
export default function DashboardPage() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState("");

  const loadProfile = useCallback(async (signal) => {
    setProfileLoading(true);
    setProfileError("");

    try {
      const result = await fetchMyProfile({ signal });
      if (!signal?.aborted) setProfile(result);
    } catch (error) {
      if (!signal?.aborted) {
        setProfileError(error instanceof Error ? error.message : "Unable to load your learner profile.");
      }
    } finally {
      if (!signal?.aborted) setProfileLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProfile(controller.signal);
    return () => controller.abort();
  }, [loadProfile]);

  const handleRetry = () => loadProfile();

  return (
    <main className="learner-shell">
      <header className="learner-header">
        <Link className="brand" to="/">
          <span className="brand-mark">U</span>
          <span>UNSEEN<span className="brand-period">.</span></span>
        </Link>
        <button className="learner-signout" type="button" onClick={signOut}>
          <LogOut size={16} /> Sign out
        </button>
      </header>

      <section className="learner-welcome">
        <span className="auth-eyebrow"><span /> YOUR PERSONAL LEARNING SPACE</span>
        <h1>Welcome back<span className="brand-period">.</span></h1>
        <p>{user?.email || user?.username || "Your account"} — your learning journey is taking shape.</p>
      </section>

      <section className="learner-profile-card" aria-labelledby="profile-heading">
        <div className="learner-profile-heading">
          <div>
            <span className="auth-card-kicker">YOUR UNSEEN PROFILE</span>
            <h2 id="profile-heading">Your progress, saved.</h2>
          </div>
          <span className="learner-profile-icon"><TrendingUp size={21} /></span>
        </div>

        {profileLoading ? (
          <div className="learner-profile-message" role="status">
            <span className="auth-spinner" />
            <p>Loading your learner profile…</p>
          </div>
        ) : profileError ? (
          <div className="learner-profile-error" role="alert">
            <p>{profileError}</p>
            <button className="learner-retry" type="button" onClick={handleRetry}>
              <RefreshCw size={15} /> Try again
            </button>
          </div>
        ) : profile ? (
          <>
            <div className="learner-profile-stats">
              <div>
                <span>Lifetime points</span>
                <strong>{profile.totalPoints ?? 0}</strong>
              </div>
              <div>
                <span>Current rank</span>
                <strong>{profile.currentRank || "Learner"}</strong>
              </div>
            </div>
            <p className="learner-profile-note">This profile is loaded from your UNSEEN account, not from the browser.</p>
          </>
        ) : null}
      </section>

      <section className="learner-empty-card">
        <div className="learner-empty-icon"><BookOpen size={25} /></div>
        <span className="auth-card-kicker">YOUR FIRST STEP</span>
        <h2>Your learning story starts here.</h2>
        <p>Your account and learner profile are connected. The next milestone is your daily learning journal, where you can capture what you studied, practised and figured out.</p>
        <div className="learner-next-items">
          <span><Sparkles size={15} /> Record what you learned</span>
          <span><TrendingUp size={15} /> See progress take shape</span>
        </div>
        <span className="learner-coming-soon">Learning Journal is the next build milestone.</span>
      </section>
    </main>
  );
}
