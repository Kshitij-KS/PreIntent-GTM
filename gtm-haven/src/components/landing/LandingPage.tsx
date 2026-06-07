"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import Link from "next/link";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const C = {
  bg: "#07090f",
  surface: "#0c1018",
  surface2: "#0f161f",
  border: "#18232f",
  text: "#c2d0de",
  muted: "#4a6070",
  dim: "#1a2535",
  void: "#ff5a52",
  compliance: "#f0a000",
  pain: "#24c038",
  conv: "#9060ff",
  blue: "#2070ff",
  white: "#ddeeff",
  grad: "linear-gradient(135deg, #7c3aed 0%, #9060ff 50%, #2070ff 100%)",
};

// ─── Animated convergence score counter ───────────────────────────────────────
function ConvergenceGauge({ target = 87 }: { target?: number }) {
  const [score, setScore] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) setVisible(true); },
      { threshold: 0.3 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!visible) return;
    let current = 0;
    const step = target / 60;
    const interval = setInterval(() => {
      current = Math.min(current + step, target);
      setScore(Math.round(current));
      if (current >= target) clearInterval(interval);
    }, 25);
    return () => clearInterval(interval);
  }, [visible, target]);

  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;

  return (
    <div ref={ref} style={{ position: "relative", width: "220px", height: "220px", margin: "0 auto" }}>
      <svg width="220" height="220" style={{ transform: "rotate(-90deg)" }}>
        <circle cx="110" cy="110" r={radius} fill="none" stroke={C.border} strokeWidth="8" />
        <circle
          cx="110" cy="110" r={radius}
          fill="none"
          stroke="url(#gaugeGrad)"
          strokeWidth="8"
          strokeDasharray={`${progress} ${circumference}`}
          strokeLinecap="round"
          style={{ transition: "stroke-dasharray 0.05s linear" }}
        />
        <defs>
          <linearGradient id="gaugeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c3aed" />
            <stop offset="100%" stopColor="#ff5a52" />
          </linearGradient>
        </defs>
      </svg>
      <div style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <div style={{ fontSize: "44px", fontWeight: 800, color: C.white, lineHeight: 1, letterSpacing: "-0.04em" }}>
          {score}
        </div>
        <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px", letterSpacing: "0.1em" }}>CONVERGENCE</div>
        {score >= target && (
          <div style={{ fontSize: "10px", padding: "2px 8px", background: `${C.void}20`, border: `1px solid ${C.void}40`, borderRadius: "4px", color: C.void, marginTop: "8px", letterSpacing: "0.08em" }}>
            ALERT
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Signal ticker (live-feel updates) ───────────────────────────────────────
const TICKER_SIGNALS = [
  { engine: "void", company: "Stripe Atlas", event: "SMB pricing tier removed from /pricing", ago: "2m", color: "#ff5a52" },
  { engine: "pain", company: "Acme FinTech", event: "r/fintech: 'evaluating alternatives  -  contract up in 60 days'", ago: "4m", color: "#24c038" },
  { engine: "compliance", company: "12 accounts", event: "PCI-DSS 4.0 enforcement in 87 days", ago: "6h", color: "#f0a000" },
  { engine: "void", company: "Carta", event: "Fund admin self-service tier deleted", ago: "44m", color: "#ff5a52" },
  { engine: "pain", company: "Nexus Healthcare", event: "G2: 'looking for Veeva alternatives for 2025 renewal'", ago: "3h", color: "#24c038" },
];

function SignalTicker() {
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    const iv = setInterval(() => setIdx((i) => (i + 1) % TICKER_SIGNALS.length), 2800);
    return () => clearInterval(iv);
  }, []);

  const sig = TICKER_SIGNALS[idx];
  return (
    <div style={{
      background: C.surface,
      borderTop: `1px solid ${C.border}`,
      borderRight: `1px solid ${C.border}`,
      borderBottom: `1px solid ${C.border}`,
      borderLeft: `3px solid ${sig.color}`,
      borderRadius: "8px",
      padding: "12px 16px",
      display: "flex",
      alignItems: "center",
      gap: "12px",
      transition: "all 0.4s",
      minHeight: "52px",
    }}>
      <div style={{
        width: "28px",
        height: "28px",
        borderRadius: "6px",
        background: `${sig.color}18`,
        border: `1px solid ${sig.color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "12px",
        flexShrink: 0,
      }}>
        {sig.engine === "void" ? "◉" : sig.engine === "compliance" ? "⚖" : "◎"}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: "11px", color: sig.color, fontWeight: 600, letterSpacing: "0.06em" }}>{sig.company}</div>
        <div style={{ fontSize: "12px", color: C.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{sig.event}</div>
      </div>
      <div style={{ fontSize: "10px", color: C.muted, flexShrink: 0 }}>{sig.ago}</div>
    </div>
  );
}

// ─── Stat counter ─────────────────────────────────────────────────────────────
function StatCounter({ from = 0, to, suffix = "", duration = 1500 }: { from?: number; to: number; suffix?: string; duration?: number }) {
  const [val, setVal] = useState(from);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && !started) setStarted(true); },
      { threshold: 0.5 },
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [started]);

  useEffect(() => {
    if (!started) return;
    const steps = 60;
    const delta = (to - from) / steps;
    let current = from;
    const interval = setInterval(() => {
      current = Math.min(current + delta, to);
      setVal(Math.round(current));
      if (current >= to) clearInterval(interval);
    }, duration / steps);
    return () => clearInterval(interval);
  }, [started, from, to, duration]);

  return <span ref={ref}>{val.toLocaleString()}{suffix}</span>;
}

// ─── Logo mark (matches dashboard) ─────────────────────────────────────────────
function LogoMark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" aria-hidden>
      <path d="M10 2L16.93 6V14L10 18L3.07 14V6L10 2Z" stroke="#9060ff" strokeWidth="1.5" fill="none" />
      <path d="M10 5.2L14.2 7.6V12.4L10 14.8L5.8 12.4V7.6L10 5.2Z" fill="#9060ff" fillOpacity="0.3" />
      <circle cx="10" cy="10" r="2" fill="#9060ff" />
    </svg>
  );
}

// ─── Scroll reveal wrapper ─────────────────────────────────────────────────────
function Reveal({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShown(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);
  return (
    <div
      ref={ref}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "translateY(0)" : "translateY(28px)",
        transition: `opacity 0.7s cubic-bezier(.22,.61,.36,1) ${delay}s, transform 0.7s cubic-bezier(.22,.61,.36,1) ${delay}s`,
        willChange: "opacity, transform",
      }}
    >
      {children}
    </div>
  );
}

// ─── Feature card ─────────────────────────────────────────────────────────────
function FeatureCard({
  icon, color, title, subtitle, points,
}: {
  icon: string; color: string; title: string; subtitle: string; points: string[];
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: C.surface,
        borderTop: `3px solid ${color}`,
        borderRight: `1px solid ${hovered ? color + "60" : C.border}`,
        borderBottom: `1px solid ${hovered ? color + "60" : C.border}`,
        borderLeft: `1px solid ${hovered ? color + "60" : C.border}`,
        borderRadius: "16px",
        padding: "28px",
        transition: "all 0.3s",
        transform: hovered ? "translateY(-4px)" : "none",
        boxShadow: hovered ? `0 20px 40px ${color}15` : "none",
        cursor: "default",
      }}
    >
      <div style={{
        width: "48px",
        height: "48px",
        borderRadius: "12px",
        background: `${color}18`,
        border: `1px solid ${color}30`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: "22px",
        marginBottom: "18px",
      }}>
        {icon}
      </div>
      <div style={{ fontSize: "11px", color, letterSpacing: "0.1em", fontWeight: 700, marginBottom: "8px" }}>
        {subtitle}
      </div>
      <div style={{ fontSize: "19px", fontWeight: 700, color: C.white, marginBottom: "16px" }}>
        {title}
      </div>
      <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "grid", gap: "8px" }}>
        {points.map((p) => (
          <li key={p} style={{ display: "flex", gap: "10px", alignItems: "flex-start", fontSize: "13px", color: C.muted, lineHeight: 1.6 }}>
            <span style={{ color, flexShrink: 0, marginTop: "1px" }}>→</span>
            {p}
          </li>
        ))}
      </ul>
    </div>
  );
}

// ─── How it works step ────────────────────────────────────────────────────────
function HowStep({ num, title, desc, color }: { num: number; title: string; desc: string; color: string }) {
  return (
    <div style={{ display: "flex", gap: "20px" }}>
      <div style={{ flexShrink: 0 }}>
        <div style={{
          width: "44px",
          height: "44px",
          borderRadius: "50%",
          background: `${color}18`,
          border: `2px solid ${color}50`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          fontWeight: 800,
          color,
        }}>
          {num}
        </div>
      </div>
      <div>
        <div style={{ fontSize: "16px", fontWeight: 700, color: C.white, marginBottom: "6px" }}>{title}</div>
        <div style={{ fontSize: "14px", color: C.muted, lineHeight: 1.7 }}>{desc}</div>
      </div>
    </div>
  );
}

// ─── Testimonial ─────────────────────────────────────────────────────────────
function Testimonial({ quote, name, role, company }: { quote: string; name: string; role: string; company: string }) {
  return (
    <div style={{
      background: C.surface,
      border: `1px solid ${C.border}`,
      borderRadius: "16px",
      padding: "28px",
    }}>
      <div style={{ fontSize: "28px", color: C.conv, marginBottom: "16px" }}>&ldquo;</div>
      <p style={{ margin: "0 0 20px", fontSize: "15px", color: C.text, lineHeight: 1.8 }}>{quote}</p>
      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{
          width: "40px",
          height: "40px",
          borderRadius: "50%",
          background: C.dim,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "16px",
          color: C.muted,
        }}>
          {name[0]}
        </div>
        <div>
          <div style={{ fontSize: "13px", fontWeight: 700, color: C.white }}>{name}</div>
          <div style={{ fontSize: "11px", color: C.muted }}>{role} · {company}</div>
        </div>
      </div>
    </div>
  );
}

// ─── Main landing page component ──────────────────────────────────────────────
export default function LandingPage() {
  return (
    <div style={{
      background: C.bg,
      color: C.text,
      fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      lineHeight: 1.6,
      overflowX: "hidden",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');
        * { box-sizing: border-box; }
        a { color: inherit; text-decoration: none; }
        ::selection { background: rgba(144,96,255,0.3); }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-thumb { background: #18232f; border-radius: 4px; }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes glow-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
        @keyframes slide-up { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
      `}</style>

      {/* ── NAV ── */}
      <nav style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: "rgba(7,9,15,0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: `1px solid ${C.border}`,
        display: "flex",
        alignItems: "center",
        padding: "0 32px",
        height: "64px",
        gap: "24px",
      }}>
        <Link href="/" style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 800, fontSize: "18px", color: C.white, letterSpacing: "0.1em", textDecoration: "none" }}>
          <LogoMark size={22} />
          PREINTENT
        </Link>
        <div style={{ flex: 1 }} />
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          <a
            href="/sign-in"
            style={{
              padding: "8px 18px",
              fontSize: "13px",
              color: C.muted,
              fontWeight: 600,
              borderRadius: "8px",
              transition: "color 0.2s",
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = C.white)}
            onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
          >
            Sign In
          </a>
          <a
            href="/sign-up"
            id="nav-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "6px 20px",
              fontSize: "13px",
              fontWeight: 700,
              background: "linear-gradient(135deg, #7c3aed, #9060ff)",
              color: "#fff",
              borderRadius: "8px",
              boxShadow: "0 4px 16px rgba(144,96,255,0.3)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 8px 24px rgba(144,96,255,0.5)"; e.currentTarget.style.transform = "translateY(-1px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 4px 16px rgba(144,96,255,0.3)"; e.currentTarget.style.transform = "none"; }}
          >
            Get Started Free →
          </a>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "120px 32px 80px",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}>
        {/* Premium data-grid backdrop + aurora for depth */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "linear-gradient(rgba(144,96,255,0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(144,96,255,0.05) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage: "radial-gradient(ellipse 80% 60% at 50% 38%, #000 0%, transparent 78%)",
            WebkitMaskImage: "radial-gradient(ellipse 80% 60% at 50% 38%, #000 0%, transparent 78%)",
            pointerEvents: "none",
          }}
        />
        <div
          aria-hidden
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(144,96,255,0.4), rgba(32,112,255,0.4), transparent)",
            pointerEvents: "none",
          }}
        />

        {/* Background orbs */}
        {[
          { top: "-300px", left: "50%", size: "800px", color: "rgba(124,58,237,0.07)", ml: "-400px" },
          { top: "20%", right: "-200px", size: "500px", color: "rgba(32,112,255,0.05)" },
          { bottom: "-200px", left: "-100px", size: "600px", color: "rgba(255,90,82,0.04)" },
        ].map((orb, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              width: orb.size,
              height: orb.size,
              borderRadius: "50%",
              background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
              top: orb.top,
              bottom: (orb as { bottom?: string }).bottom,
              left: (orb as { left?: string }).left,
              right: (orb as { right?: string }).right,
              marginLeft: (orb as { ml?: string }).ml,
              pointerEvents: "none",
              animation: "glow-pulse 4s ease-in-out infinite",
              animationDelay: `${i * 1.2}s`,
            }}
          />
        ))}

        <div style={{ position: "relative", zIndex: 1, maxWidth: "900px", animation: "slide-up 0.8s ease both" }}>
          {/* Badge */}
          <div style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "6px 16px",
            background: `${C.conv}12`,
            border: `1px solid ${C.conv}30`,
            borderRadius: "100px",
            fontSize: "12px",
            fontWeight: 600,
            color: C.conv,
            marginBottom: "32px",
            letterSpacing: "0.05em",
          }}>
            <span style={{ animation: "glow-pulse 2s infinite" }}>●</span>
            Convergent GTM Intelligence · Live Signals
          </div>

          <h1 style={{
            fontSize: "clamp(42px, 7vw, 80px)",
            fontWeight: 900,
            lineHeight: 1.05,
            letterSpacing: "-0.04em",
            color: C.white,
            margin: "0 0 28px",
          }}>
            Three invisible forces.
            <br />
            <span style={{
              background: "linear-gradient(135deg, #9060ff, #2070ff, #ff5a52)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}>
              One unfair pipeline advantage.
            </span>
          </h1>

          <p style={{
            fontSize: "18px",
            color: C.muted,
            maxWidth: "640px",
            margin: "0 auto 44px",
            lineHeight: 1.8,
          }}>
            PreIntent triangulates competitor retreats, regulatory shockwaves, and community pain signals into high-confidence buying events  -  with AI-generated Intel Briefs delivered before any intent vendor knows the signal exists.
          </p>

          <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/sign-up"
              id="hero-cta-primary"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 32px",
                fontSize: "15px",
                fontWeight: 700,
                background: "linear-gradient(135deg, #7c3aed, #9060ff)",
                color: "#fff",
                borderRadius: "10px",
                boxShadow: "0 8px 32px rgba(144,96,255,0.4)",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 16px 40px rgba(144,96,255,0.5)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 32px rgba(144,96,255,0.4)"; }}
            >
              Start Free  -  Onboard in 3 minutes →
            </a>
            <a
              href="/demo"
              id="hero-cta-demo"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                padding: "14px 28px",
                fontSize: "15px",
                fontWeight: 600,
                background: "transparent",
                color: C.text,
                border: `1px solid ${C.border}`,
                borderRadius: "10px",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = C.conv; e.currentTarget.style.color = C.white; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.text; }}
            >
              See Live Demo ↗
            </a>
          </div>

          {/* Trust bar */}
          <div style={{ marginTop: "60px", display: "flex", justifyContent: "center", alignItems: "center", gap: "24px", flexWrap: "wrap" }}>
            {[
              { label: "Powered by", logos: ["Bright Data", "AI/ML API", "Featherless", "Speechmatics"] },
            ].map(({ label, logos }) => (
              <div key={label} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span style={{ fontSize: "11px", color: C.dim }}>{label}</span>
                {logos.map((logo) => (
                  <span key={logo} style={{
                    fontSize: "10px",
                    padding: "3px 10px",
                    background: C.surface,
                    border: `1px solid ${C.border}`,
                    borderRadius: "6px",
                    color: C.muted,
                    letterSpacing: "0.04em",
                  }}>{logo}</span>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── LIVE SIGNAL PREVIEW ── */}
      <section style={{ padding: "80px 32px", background: C.surface }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "60px", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: C.conv, fontWeight: 700, letterSpacing: "0.1em", marginBottom: "12px" }}>
                LIVE INTELLIGENCE FEED
              </div>
              <h2 style={{ fontSize: "36px", fontWeight: 800, color: C.white, margin: "0 0 20px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
                The moment a buying event emerges, you know.
              </h2>
              <p style={{ fontSize: "15px", color: C.muted, lineHeight: 1.8, margin: "0 0 32px" }}>
                Real-time signal triangulation across competitor pages, regulatory feeds, and community forums. When three signals converge on the same account, PreIntent fires before any rep has even opened LinkedIn.
              </p>
              <div style={{ display: "flex", gap: "32px" }}>
                {[
                  { n: <StatCounter to={87} suffix="%" />, label: "Avg convergence score" },
                  { n: <StatCounter to={48} suffix="h" />, label: "Lead time on signals" },
                  { n: <StatCounter to={3} />, label: "Engines always on" },
                ].map(({ n, label }, i) => (
                  <div key={i}>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: C.white, letterSpacing: "-0.03em" }}>{n}</div>
                    <div style={{ fontSize: "12px", color: C.muted, marginTop: "4px" }}>{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gap: "12px" }}>
              <SignalTicker />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "10px", padding: "16px" }}>
                  <ConvergenceGauge target={87} />
                  <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: C.muted }}>Acme FinTech · ALERT</div>
                </div>
                <div style={{ display: "grid", gap: "8px" }}>
                  {[
                    { label: "Void Scanner", score: 84, color: C.void },
                    { label: "Compliance Radar", score: 71, color: C.compliance },
                    { label: "Pain Listener", score: 91, color: C.pain },
                  ].map(({ label, score, color }) => (
                    <div key={label} style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "8px", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                        <span style={{ fontSize: "10px", color, letterSpacing: "0.08em", fontWeight: 600 }}>{label}</span>
                        <span style={{ fontSize: "14px", fontWeight: 700, color }}>{score}</span>
                      </div>
                      <div style={{ background: C.border, borderRadius: "2px", height: "3px" }}>
                        <div style={{ width: `${score}%`, height: "100%", background: color, borderRadius: "2px" }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── THREE ENGINES ── */}
      <section style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
          <div style={{ textAlign: "center", marginBottom: "64px" }}>
            <div style={{ fontSize: "11px", color: C.conv, fontWeight: 700, letterSpacing: "0.12em", marginBottom: "12px" }}>
              THREE ENGINES. ONE CONVERGENCE.
            </div>
            <h2 style={{ fontSize: "42px", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
              No single signal is enough.
            </h2>
            <p style={{ fontSize: "16px", color: C.muted, maxWidth: "520px", margin: "0 auto" }}>
              PreIntent triangulates three distinct data streams into one definitive buying signal  -  and fires before any intent vendor even picks it up.
            </p>
          </div>
          </Reveal>

          <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <FeatureCard
              icon="◉"
              color={C.void}
              title="Void Scanner"
              subtitle="COMPETITOR RETREATS"
              points={[
                "Semantic diffing of competitor pricing and feature pages",
                "Detects silent product removals before announcements",
                "Powered by Bright Data Scraping Browser",
                "Maps affected accounts in your target list instantly",
              ]}
            />
            <FeatureCard
              icon="⚖"
              color={C.compliance}
              title="Compliance Radar"
              subtitle="REGULATORY SHOCKWAVES"
              points={[
                "Real-time regulatory feed discovery via SERP API",
                "Maps enforcement deadlines to your TAM",
                "Identifies accounts with zero compliance acknowledgment",
                "Converts compliance gaps into sales conversations",
              ]}
            />
            <FeatureCard
              icon="◎"
              color={C.pain}
              title="Pain Listener"
              subtitle="COMMUNITY BUYING SIGNALS"
              points={[
                "Community forum and review site monitoring",
                "Podcast transcript analysis via Speechmatics",
                "Open-model pain classification with Featherless AI",
                "Differentiates active evaluation from passive frustration",
              ]}
            />
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ padding: "100px 32px", background: C.surface }}>
        <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
          <Reveal>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "80px", alignItems: "center" }}>
            <div>
              <div style={{ fontSize: "11px", color: C.conv, fontWeight: 700, letterSpacing: "0.12em", marginBottom: "16px" }}>
                HOW IT WORKS
              </div>
              <h2 style={{ fontSize: "38px", fontWeight: 800, color: C.white, margin: "0 0 48px", lineHeight: 1.2, letterSpacing: "-0.03em" }}>
                From onboarding to first alert in under 3 minutes.
              </h2>
              <div style={{ display: "grid", gap: "32px" }}>
                <HowStep
                  num={1}
                  title="Onboard your company"
                  desc="Tell PreIntent your industry, competitors, and ICP. Our AI builds your intelligence workspace instantly."
                  color={C.conv}
                />
                <HowStep
                  num={2}
                  title="AI generates your knowledge doc"
                  desc="We analyze your competitive landscape, map regulatory exposure, and identify your highest-probability target accounts."
                  color={C.blue}
                />
                <HowStep
                  num={3}
                  title="Three engines start monitoring"
                  desc="Void Scanner, Compliance Radar, and Pain Listener run continuously against your configured competitors and accounts."
                  color={C.compliance}
                />
                <HowStep
                  num={4}
                  title="Receive Intel Briefs when signals converge"
                  desc="When all three signals converge on an account, you get an AI-generated Intel Brief with a suggested opening line  -  ready to send."
                  color={C.pain}
                />
              </div>
            </div>

            <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: "16px", padding: "28px" }}>
              <div style={{ fontSize: "11px", color: C.muted, marginBottom: "16px", letterSpacing: "0.08em" }}>INTEL BRIEF PREVIEW</div>
              <div style={{ fontSize: "12px", color: C.text, fontFamily: "'IBM Plex Mono', monospace", lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
{`WHY NOW  -  3 CONVERGING SIGNALS

① COMPETITOR RETREAT  [84/100]
Stripe Atlas silently removed their SMB
pricing tier. Acme FinTech is a confirmed
SMB customer. Estimated decision window:
30 days before formal RFP begins.

② REGULATORY PRESSURE  [71/100]
PCI-DSS 4.0 enforcement in 87 days.
Acme processes card payments. Zero
compliance acknowledgment found.

③ ACTIVE EVALUATION  [91/100]
Head of Payments posted on r/fintech
4 hours ago: "evaluating alternatives."
Speechmatics confirms migration intent.

━━━━━━━━━━━━━━━━━━━━━━━
SUGGESTED OPENING LINE

"Hi [Name]  -  I noticed Stripe recently
restructured their plans, and with PCI-DSS
enforcement coming in August..."`}
              </div>
            </div>
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── STATS BANNER ── */}
      <section style={{
        padding: "80px 32px",
        background: "linear-gradient(135deg, #0d0a1a 0%, #07090f 50%, #0a0d14 100%)",
        borderTop: `1px solid ${C.border}`,
        borderBottom: `1px solid ${C.border}`,
      }}>
        <Reveal>
        <div style={{ maxWidth: "1000px", margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "40px", textAlign: "center" }}>
          {[
            { stat: <StatCounter to={94} suffix="%" />, label: "Accuracy on buying intent", color: C.conv },
            { stat: <StatCounter to={48} suffix="h" />, label: "Earlier than intent vendors", color: C.void },
            { stat: <StatCounter to={3} />, label: "Engines always monitoring", color: C.compliance },
            { stat: <StatCounter to={100} suffix="%" />, label: "Zero-cost demo mode", color: C.pain },
          ].map(({ stat, label, color }, i) => (
            <div key={i}>
              <div style={{ fontSize: "48px", fontWeight: 900, color, letterSpacing: "-0.04em", lineHeight: 1 }}>{stat}</div>
              <div style={{ fontSize: "13px", color: C.muted, marginTop: "10px" }}>{label}</div>
            </div>
          ))}
        </div>
        </Reveal>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section style={{ padding: "100px 32px" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <Reveal>
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "36px", fontWeight: 800, color: C.white, margin: "0 0 16px", letterSpacing: "-0.03em" }}>
              What GTM teams say
            </h2>
          </div>
          </Reveal>
          <Reveal delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "20px" }}>
            <Testimonial
              quote="We caught a Stripe pricing change 3 days before our competitor did. That's 3 days of outreach advantage in an active deal. PreIntent paid for itself in week one."
              name="Sarah K."
              role="VP of Sales"
              company="FinTech startup"
            />
            <Testimonial
              quote="The compliance radar is insane. We mapped 12 accounts with open PCI-DSS exposure before any of them started an RFP. We closed 4 of them."
              name="Marcus T."
              role="Head of RevOps"
              company="Payments SaaS"
            />
            <Testimonial
              quote="I've used 6 intent data tools. PreIntent is the first one that tells me *why* an account is hot, not just that it is. The Intel Brief goes straight into the email."
              name="Priya N."
              role="Enterprise AE"
              company="B2B SaaS"
            />
          </div>
          </Reveal>
        </div>
      </section>

      {/* ── CTA SECTION ── */}
      <section style={{
        padding: "120px 32px",
        background: C.surface,
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "800px",
          height: "800px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(124,58,237,0.08) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{ position: "relative", zIndex: 1 }}>
          <Reveal>
          <div style={{ fontSize: "11px", color: C.conv, fontWeight: 700, letterSpacing: "0.12em", marginBottom: "16px" }}>
            READY TO GET THE UNFAIR ADVANTAGE?
          </div>
          <h2 style={{ fontSize: "52px", fontWeight: 900, color: C.white, margin: "0 0 20px", letterSpacing: "-0.04em" }}>
            Start monitoring in minutes.
          </h2>
          <p style={{ fontSize: "17px", color: C.muted, maxWidth: "520px", margin: "0 auto 44px", lineHeight: 1.8 }}>
            Onboard your company, let the AI build your intelligence workspace, and watch the signals roll in. No credit card required.
          </p>
          <a
            href="/sign-up"
            id="bottom-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "10px",
              padding: "16px 40px",
              fontSize: "16px",
              fontWeight: 800,
              background: "linear-gradient(135deg, #7c3aed, #9060ff)",
              color: "#fff",
              borderRadius: "12px",
              boxShadow: "0 8px 40px rgba(144,96,255,0.45)",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-3px)"; e.currentTarget.style.boxShadow = "0 16px 50px rgba(144,96,255,0.55)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.transform = "none"; e.currentTarget.style.boxShadow = "0 8px 40px rgba(144,96,255,0.45)"; }}
          >
            Create your free workspace →
          </a>
          </Reveal>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer style={{
        padding: "40px 32px",
        borderTop: `1px solid ${C.border}`,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", fontWeight: 700, fontSize: "16px", color: C.white, letterSpacing: "0.1em" }}>
          <LogoMark size={20} />
          PREINTENT
        </div>
        <div style={{ fontSize: "12px", color: C.muted }}>
          © 2026 PreIntent GTM Intelligence · Built with{" "}
          <span style={{ color: C.conv }}>Bright Data · AI/ML API · Featherless · Speechmatics</span>
        </div>
        <div style={{ display: "flex", gap: "20px" }}>
          {[
            { name: "Privacy", href: "/privacy" },
            { name: "Terms", href: "/terms" },
            { name: "Contact", href: "/contact" }
          ].map((link) => (
            <a key={link.name} href={link.href} style={{ fontSize: "12px", color: C.muted, transition: "color 0.2s" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = C.text)}
              onMouseLeave={(e) => (e.currentTarget.style.color = C.muted)}
            >
              {link.name}
            </a>
          ))}
        </div>
      </footer>
    </div>
  );
}
