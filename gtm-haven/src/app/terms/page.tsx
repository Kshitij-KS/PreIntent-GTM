import Link from "next/link";

const C = {
  bg: "#0B0F1A",
  card: "#151B2B",
  conv: "#7C3AED",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#9CA3AF",
};

export default function TermsPage() {
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
      
      <main style={{ maxWidth: "800px", margin: "0 auto", padding: "60px 20px" }}>
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "40px", color: C.white }}>Terms of Service</h1>
        
        <div style={{ lineHeight: "1.8", color: C.text }}>
          <p style={{ marginBottom: "20px" }}>
            Welcome to PreIntent. By accessing or using our platform, you agree to be bound by these Terms of Service.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Acceptance of Terms</h2>
          <p style={{ marginBottom: "20px" }}>
            By creating an account or using PreIntent, you acknowledge that you have read, understood, and agree to be bound by these Terms.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Description of Service</h2>
          <p style={{ marginBottom: "20px" }}>
            PreIntent provides GTM (Go-To-Market) intelligence platform services that help businesses identify and analyze market signals, track competitors, and generate actionable insights.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>User Responsibilities</h2>
          <p style={{ marginBottom: "20px" }}>
            You agree to:
          </p>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Provide accurate and complete information when creating an account</li>
            <li>Maintain the security of your account credentials</li>
            <li>Use the service in compliance with all applicable laws</li>
            <li>Not attempt to access other users' data or system resources without authorization</li>
          </ul>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Intellectual Property</h2>
          <p style={{ marginBottom: "20px" }}>
            All content, features, and functionality of PreIntent are owned by PreIntent and are protected by copyright, trademark, and other intellectual property laws.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Limitation of Liability</h2>
          <p style={{ marginBottom: "20px" }}>
            PreIntent is provided "as is" without warranties of any kind. We shall not be liable for any indirect, incidental, special, or consequential damages arising from your use of the service.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Termination</h2>
          <p style={{ marginBottom: "20px" }}>
            We reserve the right to suspend or terminate your account at our sole discretion for violation of these Terms or for any other reason.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Changes to Terms</h2>
          <p style={{ marginBottom: "20px" }}>
            We may modify these Terms at any time. Continued use of the service after changes constitutes acceptance of the new Terms.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Contact Us</h2>
          <p style={{ marginBottom: "20px" }}>
            If you have any questions about these Terms, please contact us at{" "}
            <a href="mailto:legal@preintent.com" style={{ color: C.conv }}>legal@preintent.com</a>
          </p>
          
          <p style={{ marginTop: "40px", fontSize: "12px", color: C.muted }}>
            Last updated: January 2026
          </p>
        </div>
      </main>
    </div>
  );
}
