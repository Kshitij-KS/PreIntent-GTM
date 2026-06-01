import Link from "next/link";

const C = {
  bg: "#0B0F1A",
  card: "#151B2B",
  conv: "#7C3AED",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#9CA3AF",
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: C.bg, color: C.text }}>
      <nav style={{ padding: "20px 40px", borderBottom: `1px solid ${C.card}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Link href="/" style={{ fontWeight: 700, fontSize: "18px", color: C.white, textDecoration: "none" }}>
          <span style={{ color: C.conv }}>▼</span> PREINTENT
        </Link>
        <Link href="/" style={{ color: C.muted, textDecoration: "none", fontSize: "14px" }}>
          ← Back to Home
        </Link>
      </nav>
      
      <main style={{ maxWidth: "600px", margin: "0 auto", padding: "60px 20px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "20px", color: C.white }}>Contact Us</h1>
        <p style={{ fontSize: "16px", color: C.muted, marginBottom: "40px" }}>
          Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
        </p>
        
        <div style={{ backgroundColor: C.card, borderRadius: "12px", padding: "30px", marginBottom: "40px" }}>
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: C.text }}>Email</label>
            <a href="mailto:hello@preintent.com" style={{ color: C.conv, fontSize: "16px", textDecoration: "none" }}>
              hello@preintent.com
            </a>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: C.text }}>Support</label>
            <a href="mailto:support@preintent.com" style={{ color: C.conv, fontSize: "16px", textDecoration: "none" }}>
              support@preintent.com
            </a>
          </div>
          
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "14px", fontWeight: 500, marginBottom: "8px", color: C.text }}>Sales</label>
            <a href="mailto:sales@preintent.com" style={{ color: C.conv, fontSize: "16px", textDecoration: "none" }}>
              sales@preintent.com
            </a>
          </div>
        </div>
        
        <div style={{ textAlign: "center" }}>
          <Link 
            href="/sign-up" 
            style={{ 
              display: "inline-block",
              backgroundColor: C.conv, 
              color: C.white, 
              padding: "14px 32px", 
              borderRadius: "8px", 
              fontWeight: 600,
              textDecoration: "none",
              transition: "transform 0.2s, box-shadow 0.2s"
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow = "0 8px 20px rgba(124, 58, 237, 0.4)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "none";
            }}
          >
            Get Started Free
          </Link>
        </div>
        
        <div style={{ marginTop: "60px", paddingTop: "40px", borderTop: `1px solid ${C.card}`, textAlign: "center" }}>
          <p style={{ fontSize: "14px", color: C.muted }}>
            PreIntent Technologies Inc.<br />
            San Francisco, CA<br />
            United States
          </p>
        </div>
      </main>
    </div>
  );
}
