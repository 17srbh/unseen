import { useState } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import {
  ArrowRight, ArrowUpRight, BookOpen, Brain, Check, ChevronRight,
  Compass, Flame, Layers3, Menu, ShieldCheck, Sparkles, Target, TrendingUp,
  X
} from "lucide-react";

// Shared navigation keeps the three initial pages visually and functionally consistent.
function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  // Closes the mobile menu after a visitor chooses a page.
  const closeMenu = () => setMenuOpen(false);

  return (
    <header className="site-header">
      <div className="nav-shell">
        <Link className="brand" to="/" onClick={closeMenu} aria-label="UNSEEN home">
          <span className="brand-mark">U</span>
          <span>UNSEEN<span className="brand-period">.</span></span>
        </Link>

        <button
          className="menu-toggle"
          type="button"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label={menuOpen ? "Close navigation" : "Open navigation"}
        >
          {menuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>

        <nav className={menuOpen ? "nav-links open" : "nav-links"} aria-label="Main navigation">
          <NavLink to="/" end onClick={closeMenu}>Home</NavLink>
          <NavLink to="/about" onClick={closeMenu}>About</NavLink>
          <NavLink to="/how-it-works" onClick={closeMenu}>How it works</NavLink>
          <a className="nav-cta" href="mailto:hello@unseen.example" onClick={closeMenu}>
            Get in touch <ArrowUpRight size={15} />
          </a>
        </nav>
      </div>
    </header>
  );
}

// Reusable footer reinforces the product's mission without adding unfinished pages.
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <Link className="brand footer-brand" to="/">
          <span className="brand-mark">U</span>
          <span>UNSEEN<span className="brand-period">.</span></span>
        </Link>
        <p>Your effort deserves to be seen.</p>
        <span className="footer-copy">© {new Date().getFullYear()} UNSEEN. Built around progress.</span>
      </div>
    </footer>
  );
}

// Small label component used to make section context easy to scan.
function Eyebrow({ children }) {
  return <div className="eyebrow"><span />{children}</div>;
}

// Homepage: introduces the mission, the problem and the three-step product promise.
function Home() {
  const steps = [
    { icon: <BookOpen />, number: "01", title: "Capture your effort", text: "Record what you learned, what you tried and what challenged you." },
    { icon: <Brain />, number: "02", title: "Understand your growth", text: "Reflect, revisit ideas and build a clearer picture of what you know." },
    { icon: <TrendingUp />, number: "03", title: "See your progress", text: "Turn small, consistent actions into a visible story of development." },
  ];

  return (
    <main>
      <section className="hero section-wrap">
        <div className="hero-copy">
          <Eyebrow>FOR EVERYONE STILL SHOWING UP</Eyebrow>
          <h1>Your effort is<br /><span>not invisible</span><br />anymore.</h1>
          <p className="hero-lede">
            The late nights. The things you learn twice. The small steps nobody notices.
            They count — and your journey deserves to show it.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" to="/how-it-works">
              Discover how it works <ArrowRight size={17} />
            </Link>
            <Link className="text-link" to="/about">Why UNSEEN exists <ChevronRight size={16} /></Link>
          </div>
          <div className="hero-note"><span className="status-dot" /> A different way to look at progress</div>
        </div>

        {/* Decorative dashboard preview gives visitors a product impression before login exists. */}
        <div className="hero-visual" aria-label="Illustrative UNSEEN progress dashboard">
          <div className="glow glow-one" />
          <div className="glow glow-two" />
          <div className="preview-card main-preview">
            <div className="preview-top"><span className="mini-brand">UNSEEN<span>.</span></span><span className="avatar">A</span></div>
            <p className="muted small">YOUR JOURNEY, YOUR PACE</p>
            <h3>Look how far<br />you've come.</h3>
            <div className="progress-meta"><span>Learning momentum</span><strong>Growing</strong></div>
            <div className="progress-track"><span /></div>
            <div className="preview-stats">
              <div><strong>24</strong><span>days showing up</span></div>
              <div><strong>12</strong><span>ideas explored</span></div>
            </div>
            <div className="preview-quote">“Small steps still move you forward.”</div>
          </div>
          <div className="floating-card streak-card"><span className="icon-chip"><Flame size={17} /></span><div><strong>Keep going</strong><small>Consistency is building</small></div></div>
          <div className="floating-card insight-card"><span className="icon-chip mint"><Sparkles size={17} /></span><div><strong>Progress noticed</strong><small>Every effort adds up</small></div></div>
          <div className="visual-orbit orbit-one" /><div className="visual-orbit orbit-two" />
        </div>
      </section>

      <section className="belief-strip">
        <p>YOU ARE MORE THAN YOUR LATEST RESULT.</p>
        <span>Effort matters. Learning matters. Growth takes time.</span>
      </section>

      <section className="section-wrap section-space">
        <div className="section-heading centered">
          <Eyebrow>THE IDEA BEHIND UNSEEN</Eyebrow>
          <h2>Progress happens long<br className="desktop-break" /> before people notice.</h2>
          <p>Not every meaningful step comes with a certificate, a promotion or applause. We want to help you recognise the work happening in between.</p>
        </div>
        <div className="step-grid">
          {steps.map((step) => (
            <article className="step-card" key={step.number}>
              <div className="step-card-top"><span className="line-icon">{step.icon}</span><span className="step-number">{step.number}</span></div>
              <h3>{step.title}</h3><p>{step.text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="dark-panel section-wrap">
        <div className="dark-panel-copy">
          <Eyebrow>YOUR JOURNEY IS YOURS</Eyebrow>
          <h2>Don't just measure<br />the destination.<br /><span>Notice the becoming.</span></h2>
          <p>UNSEEN is being shaped as a space to document learning, reflect on what you understand and recognise the progress that can be easy to overlook.</p>
          <Link className="button button-outline" to="/how-it-works">Explore the journey <ArrowRight size={17} /></Link>
        </div>
        <div className="quote-card">
          <Sparkles className="quote-spark" size={22} />
          <blockquote>“You may not be where you want to be yet. That doesn't mean you haven't moved forward.”</blockquote>
          <span>THE UNSEEN MINDSET</span>
        </div>
      </section>

      <section className="closing-cta section-wrap">
        <Eyebrow>KEEP SHOWING UP</Eyebrow>
        <h2>Your effort deserves<br /><span>to be seen.</span></h2>
        <Link className="button button-primary" to="/about">Get to know UNSEEN <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}

// About page explains the motivation and principles behind the product.
function About() {
  const principles = [
    { icon: <ShieldCheck />, title: "Progress without judgement", text: "A slower week does not erase the work you have already done. Growth is personal, and the product should respect that." },
    { icon: <Layers3 />, title: "Evidence over appearances", text: "A polished profile is only one part of a story. We believe the learning, practice and improvement behind it matter too." },
    { icon: <Target />, title: "A direction, not a race", text: "Career goals can guide your learning without turning someone else's timeline into a deadline for yours." },
  ];

  return (
    <main className="inner-page">
      <section className="inner-hero section-wrap">
        <Eyebrow>WHY WE EXIST</Eyebrow>
        <h1>Because trying<br /><span>should count.</span></h1>
        <p className="inner-lede">Some of the hardest work happens quietly. UNSEEN exists to help people notice their own progress — especially when the outcome has not arrived yet.</p>
        <div className="about-manifesto">
          <span className="manifesto-mark">“</span>
          <p>The world often sees the result. We want to help people see the work that came before it.</p>
        </div>
      </section>

      <section className="section-wrap section-space about-story">
        <div><Eyebrow>THE PROBLEM WE SEE</Eyebrow><h2>Learning can feel invisible.</h2></div>
        <div className="story-copy">
          <p>You spend an evening understanding a new concept. You practise, get it wrong, try again and slowly improve. A week later, it can be difficult to remember just how much effort that took.</p>
          <p>When progress is hard to see, it is easy to mistake a difficult moment for a lack of ability. UNSEEN is built around a simple belief: a person's development deserves more than a snapshot of their latest result.</p>
        </div>
      </section>

      <section className="principles-section">
        <div className="section-wrap section-space">
          <div className="section-heading"><Eyebrow>WHAT WE BELIEVE</Eyebrow><h2>Make room for<br />real growth.</h2></div>
          <div className="principle-list">
            {principles.map((item, index) => (
              <article className="principle-row" key={item.title}>
                <span className="principle-index">0{index + 1}</span>
                <span className="line-icon">{item.icon}</span>
                <div><h3>{item.title}</h3><p>{item.text}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-cta section-wrap">
        <Eyebrow>ONE STEP AT A TIME</Eyebrow><h2>Your journey<br /><span>still counts.</span></h2>
        <Link className="button button-primary" to="/how-it-works">See how it works <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}

// How It Works page describes the intended learner journey without claiming unfinished features are live.
function HowItWorks() {
  const journey = [
    { number: "01", title: "Capture what you learn", text: "Write down a concept, skill, question or problem you worked through. Keep the entry simple and in your own words.", icon: <BookOpen />, tag: "NOTICE THE EFFORT" },
    { number: "02", title: "Reflect and practise", text: "Think about what made sense, what felt difficult and where you might use the idea. Revisit it so understanding has a chance to stick.", icon: <Brain />, tag: "BUILD UNDERSTANDING" },
    { number: "03", title: "Recognise your progress", text: "Over time, your learning record can help you see patterns, remember earlier milestones and choose a useful next step.", icon: <TrendingUp />, tag: "SEE THE GROWTH" },
  ];

  return (
    <main className="inner-page">
      <section className="inner-hero section-wrap how-hero">
        <Eyebrow>A SIMPLE, HUMAN LEARNING LOOP</Eyebrow>
        <h1>Learn. Reflect.<br /><span>Move forward.</span></h1>
        <p className="inner-lede">UNSEEN is designed to make your learning journey easier to notice — one honest entry and one small step at a time.</p>
      </section>

      <section className="section-wrap journey-section">
        <div className="journey-line" />
        {journey.map((item) => (
          <article className="journey-card" key={item.number}>
            <div className="journey-number">{item.number}</div>
            <div className="journey-content">
              <span className="journey-tag">{item.tag}</span>
              <h2>{item.title}</h2><p>{item.text}</p>
            </div>
            <div className="journey-icon">{item.icon}</div>
          </article>
        ))}
      </section>

      <section className="section-wrap reflection-panel">
        <div><Eyebrow>A MOMENT TO REFLECT</Eyebrow><h2>Small questions.<br /><span>Meaningful progress.</span></h2><p>As the product develops, your learning reflections can be guided by thoughtful prompts.</p></div>
        <div className="reflection-questions">
          {["What did I learn today?", "What was difficult at first?", "Can I explain it in my own words?", "Where could I use this next?"].map((question, index) => (
            <div className="reflection-question" key={question}><span>0{index + 1}</span>{question}<Check size={16} /></div>
          ))}
        </div>
      </section>

      <section className="closing-cta section-wrap">
        <Eyebrow>YOUR PACE. YOUR PATH.</Eyebrow><h2>Every small step<br /><span>adds up.</span></h2>
        <Link className="button button-primary" to="/">Back to home <ArrowRight size={17} /></Link>
      </section>
    </main>
  );
}

// App routes connect the three requested pages; unbuilt pages are intentionally not included.
export default function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="*" element={<Home />} />
      </Routes>
      <Footer />
    </>
  );
}
