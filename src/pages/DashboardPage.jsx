import { BookOpen, LogOut, Sparkles, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

// Temporary authenticated landing page. The real learning dashboard and journal arrive next.
export default function DashboardPage() {
  const { user, signOut } = useAuth();

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
        <p>{user?.email || user?.username || "Your account"} — this is the beginning of your UNSEEN journey.</p>
      </section>

      <section className="learner-empty-card">
        <div className="learner-empty-icon"><BookOpen size={25} /></div>
        <span className="auth-card-kicker">YOUR FIRST STEP</span>
        <h2>Your learning story starts here.</h2>
        <p>Your account is connected. The next milestone is your daily learning journal, where you can capture what you studied, practised and figured out.</p>
        <div className="learner-next-items">
          <span><Sparkles size={15} /> Record what you learned</span>
          <span><TrendingUp size={15} /> See progress take shape</span>
        </div>
        <span className="learner-coming-soon">Learning Journal is the next build milestone.</span>
      </section>
    </main>
  );
}
