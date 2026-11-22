import { useEffect, useRef, useState } from "react";
import { ArrowLeft, BookOpen, CheckCircle2, LoaderCircle, Send, Sparkles, Trophy } from "lucide-react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  completeLearningSession,
  getLearningSession,
  sendLearningSessionMessage,
  startLearningSession,
} from "../api/sessionApi.js";

// A session is restored from its URL; the API owns conversation history and state.
export default function SessionPage() {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const transcriptEndRef = useRef(null);
  const [session, setSession] = useState(null);
  const [entry, setEntry] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(Boolean(sessionId));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [scorecard, setScorecard] = useState(null);

  useEffect(() => {
    if (!sessionId) {
      setSession(null);
      setScorecard(null);
      setLoading(false);
      setError("");
      return undefined;
    }

    const controller = new AbortController();
    let active = true;
    setLoading(true);
    setError("");

    getLearningSession(sessionId, { signal: controller.signal })
      .then((result) => {
        if (!active) return;
        setSession(result.session);
        setScorecard(result.session.scorecard || null);
      })
      .catch((requestError) => {
        if (active && !controller.signal.aborted) {
          setError(requestError instanceof Error ? requestError.message : "Unable to load this learning session.");
        }
      })
      .finally(() => {
        if (active && !controller.signal.aborted) setLoading(false);
      });

    return () => {
      active = false;
      controller.abort();
    };
  }, [sessionId]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [session?.recentMessages, busy, scorecard]);

  const handleStart = async (event) => {
    event.preventDefault();
    const value = entry.trim();
    if (!value || busy) return;

    setBusy(true);
    setError("");
    try {
      const result = await startLearningSession(value);
      navigate(`/app/learn/${result.sessionId}`);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to start your learning session.");
    } finally {
      setBusy(false);
    }
  };

  const handleSend = async (event) => {
    event.preventDefault();
    const value = message.trim();
    if (!value || busy || !sessionId || session?.status !== "ACTIVE") return;

    setBusy(true);
    setError("");
    setMessage("");
    try {
      const result = await sendLearningSessionMessage(sessionId, value);
      setSession((current) => ({
        ...current,
        topic: result.topic,
        status: result.status,
        recentMessages: result.recentMessages,
        updatedAt: result.updatedAt,
        userTurnCount: (current?.userTurnCount || 0) + 1,
        mentorTurnCount: (current?.mentorTurnCount || 0) + 1,
      }));
    } catch (requestError) {
      setMessage(value);
      setError(requestError instanceof Error ? requestError.message : "Unable to send your answer.");
    } finally {
      setBusy(false);
    }
  };

  const handleComplete = async () => {
    if (!sessionId || busy || session?.status !== "ACTIVE") return;

    setBusy(true);
    setError("");
    try {
      const result = await completeLearningSession(sessionId);
      setScorecard(result.scorecard);
      setSession((current) => ({ ...current, status: "COMPLETED" }));
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to complete this session.");
    } finally {
      setBusy(false);
    }
  };

  if (loading) {
    return (
      <main className="session-shell">
        <div className="session-status"><LoaderCircle className="session-spin" size={22} /> Restoring your learning session…</div>
      </main>
    );
  }

  if (!sessionId) {
    return (
      <main className="session-shell">
        <header className="session-header">
          <Link className="session-back" to="/app/dashboard"><ArrowLeft size={16} /> Dashboard</Link>
          <Link className="brand" to="/app/dashboard">
            <span className="brand-mark">U</span>
            <span>UNSEEN<span className="brand-period">.</span></span>
          </Link>
        </header>

        <section className="session-start">
          <span className="session-eyebrow"><Sparkles size={14} /> YOUR AI LEARNING MENTOR</span>
          <h1>What did you<br /><span>learn today?</span></h1>
          <p>Tell UNSEEN what you studied, built, practised or struggled with. Your mentor will take it from there, one question at a time.</p>
          <form className="session-entry-card" onSubmit={handleStart}>
            <label htmlFor="learning-entry">Your learning note</label>
            <textarea
              id="learning-entry"
              value={entry}
              onChange={(event) => setEntry(event.target.value)}
              placeholder="For example: I deployed an application on AWS using ECS and an Application Load Balancer. I understand the high-level flow, but I'm not fully clear on how target health checks work…"
              maxLength={3000}
              rows={7}
              required
            />
            <div className="session-entry-footer">
              <span>{entry.length}/3000</span>
              <button className="button button-primary" type="submit" disabled={!entry.trim() || busy}>
                {busy ? <><LoaderCircle className="session-spin" size={16} /> Starting…</> : <>Start learning session <Sparkles size={16} /></>}
              </button>
            </div>
          </form>
          {error && <div className="session-error" role="alert">{error}</div>}
          <p className="session-private-note">Your learning conversation is sent securely to xAI to generate mentor responses and saved to your UNSEEN account. Do not include passwords, API keys or confidential information.</p>
        </section>
      </main>
    );
  }

  if (error && !session) {
    return (
      <main className="session-shell">
        <header className="session-header">
          <Link className="session-back" to="/app/dashboard"><ArrowLeft size={16} /> Dashboard</Link>
          <span className="session-header-wordmark">UNSEEN<span>.</span></span>
        </header>
        <div className="session-error session-load-error" role="alert">{error}</div>
      </main>
    );
  }

  const recentMessages = session?.recentMessages || [];
  const canComplete = session?.status === "ACTIVE" && (session.userTurnCount || 0) >= 2;

  return (
    <main className="session-shell">
      <header className="session-header">
        <Link className="session-back" to="/app/dashboard"><ArrowLeft size={16} /> Dashboard</Link>
        <span className="session-header-wordmark">UNSEEN<span>.</span></span>
        <span className={session?.status === "COMPLETED" ? "session-state completed" : "session-state"}>
          {session?.status === "COMPLETED" ? "Session completed" : "Learning session"}
        </span>
      </header>

      <section className="session-conversation">
        <div className="session-conversation-heading">
          <span className="session-eyebrow"><Sparkles size={14} /> YOUR AI LEARNING MENTOR</span>
          <h1>{session?.topic || "Let's explore what you learned."}</h1>
          <p>UNSEEN will ask, explain and challenge your understanding as you go.</p>
        </div>

        <div className="session-transcript" aria-live="polite">
          {recentMessages.map((item, index) => (
            <article className={item.role === "assistant" ? "session-message mentor" : "session-message learner"} key={`${item.role}-${index}`}>
              <span className="session-message-label">{item.role === "assistant" ? "UNSEEN MENTOR" : "YOU"}</span>
              <p>{item.content}</p>
            </article>
          ))}
          {busy && (
            <article className="session-message mentor session-thinking">
              <span className="session-message-label">UNSEEN MENTOR</span>
              <p><LoaderCircle className="session-spin" size={16} /> Thinking about your response…</p>
            </article>
          )}
          <div ref={transcriptEndRef} />
        </div>

        {error && <div className="session-error" role="alert">{error}</div>}

        {scorecard ? (
          <section className="session-scorecard">
            <div className="scorecard-heading">
              <span className="session-score-icon"><Trophy size={21} /></span>
              <div>
                <span className="session-eyebrow">YOUR SESSION SCORECARD</span>
                <h2>Progress you can see.</h2>
              </div>
            </div>
            <div className="scorecard-score">
              <strong>{scorecard.score}</strong><span>/ 100</span>
            </div>
            <h3>{scorecard.topic}</h3>
            <p className="scorecard-summary">{scorecard.summary}</p>
            <div className="scorecard-grid">
              <div><h4>Strengths</h4><ul>{(scorecard.strengths || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h4>Knowledge gaps</h4><ul>{(scorecard.knowledgeGaps || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h4>Recommended next steps</h4><ul>{(scorecard.recommendations || []).map((item) => <li key={item}>{item}</li>)}</ul></div>
              <div><h4>Interview readiness</h4><p>{scorecard.interviewReadiness}</p></div>
            </div>
            <div className="scorecard-actions">
              <Link className="button button-primary" to="/app/learn"><Sparkles size={16} /> Start another session</Link>
              <Link className="session-secondary-link" to="/app/dashboard">Back to dashboard</Link>
            </div>
          </section>
        ) : session?.status === "ACTIVE" ? (
          <>
            <form className="session-reply-form" onSubmit={handleSend}>
              <label htmlFor="mentor-reply">Your response</label>
              <textarea
                id="mentor-reply"
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Explain it in your own words…"
                rows={3}
                maxLength={2500}
                disabled={busy}
              />
              <div className="session-reply-footer">
                <span>One honest answer is more useful than a perfect one.</span>
                <button className="button button-primary" type="submit" disabled={!message.trim() || busy}>
                  Send response <Send size={15} />
                </button>
              </div>
            </form>
            <div className="session-finish-row">
              {canComplete ? (
                <button className="session-finish-button" type="button" onClick={handleComplete} disabled={busy}>
                  <CheckCircle2 size={16} /> Finish and generate scorecard
                </button>
              ) : (
                <span>Answer your mentor's first follow-up before generating a scorecard.</span>
              )}
            </div>
          </>
        ) : (
          <div className="session-error" role="status">
            This session is marked complete, but its scorecard is unavailable. Contact support if the problem continues.
          </div>
        )}
      </section>
    </main>
  );
}
