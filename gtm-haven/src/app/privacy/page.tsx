import Link from "next/link";

const C = {
  bg: "#0B0F1A",
  card: "#151B2B",
  conv: "#7C3AED",
  white: "#FFFFFF",
  text: "#E5E7EB",
  muted: "#9CA3AF",
};

export default function PrivacyPage() {
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
        <h1 style={{ fontSize: "36px", fontWeight: 700, marginBottom: "40px", color: C.white }}>Privacy Policy</h1>
        
        <div style={{ lineHeight: "1.8", color: C.text }}>
          <p style={{ marginBottom: "20px" }}>
            At PreIntent, we take your privacy seriously. This Privacy Policy explains how we collect, use, and protect your personal information.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Information We Collect</h2>
          <p style={{ marginBottom: "20px" }}>
            We collect information that you provide directly to us, including:
          </p>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Name and email address</li>
            <li>Company information</li>
            <li>Account credentials</li>
            <li>Usage data and analytics</li>
          </ul>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>How We Use Your Information</h2>
          <p style={{ marginBottom: "20px" }}>
            We use the information we collect to:
          </p>
          <ul style={{ marginBottom: "20px", paddingLeft: "20px" }}>
            <li>Provide and maintain our services</li>
            <li>Improve and optimize our platform</li>
            <li>Send you updates and marketing communications</li>
            <li>Respond to your inquiries and support requests</li>
          </ul>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Data Security</h2>
          <p style={{ marginBottom: "20px" }}>
            We implement appropriate technical and organizational measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
          </p>
          
          <h2 style={{ fontSize: "24px", fontWeight: 600, marginTop: "40px", marginBottom: "20px", color: C.white }}>Contact Us</h2>
          <p style={{ marginBottom: "20px" }}>
            If you have any questions about this Privacy Policy, please contact us at{" "}
            <a href="mailto:privacy@preintent.com" style={{ color: C.conv }}>privacy@preintent.com</a>
          </p>
          
          <p style={{ marginTop: "40px", fontSize: "12px", color: C.muted }}>
            Last updated: January 2026
          </p>
        </div>
      </main>
    </div>
  );
}
