import Link from "next/link";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#020617",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        color: "#FFFFFF",
      }}
    >
      <div style={{ textAlign: "center", maxWidth: "500px" }}>
        <div
          style={{
            fontSize: "120px",
            fontWeight: 900,
            background: "linear-gradient(135deg, #3B82F6, #6366F1)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            lineHeight: 1,
            marginBottom: "16px",
          }}
        >
          404
        </div>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: 800,
            marginBottom: "16px",
            letterSpacing: "-0.5px",
          }}
        >
          Page Not Found
        </h1>
        <p
          style={{
            color: "#94A3B8",
            fontSize: "16px",
            lineHeight: 1.7,
            marginBottom: "32px",
          }}
        >
          The page you are looking for does not exist or has been moved. Please
          check the URL or navigate back to our homepage.
        </p>
        <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
          <Link
            href="/"
            style={{
              background: "linear-gradient(135deg, #3B82F6, #6366F1)",
              color: "#fff",
              border: "none",
              padding: "14px 32px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 700,
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            Back to Home
          </Link>
          <Link
            href="/contact"
            style={{
              background: "transparent",
              color: "#94A3B8",
              border: "1px solid #1F2937",
              padding: "14px 32px",
              borderRadius: "10px",
              fontSize: "15px",
              fontWeight: 600,
              textDecoration: "none",
            }}
          >
            Contact Us
          </Link>
        </div>
      </div>
    </div>
  );
}
