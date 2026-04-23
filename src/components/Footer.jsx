// src/components/Footer.jsx
import { Link } from "react-router-dom";

const YEAR = new Date().getFullYear();

function Footer() {
  return (
    <footer style={{
      borderTop: "1px solid var(--border)",
      background: "#060606",
      padding: "14px 24px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      flexWrap: "wrap",
      gap: 8,
      marginTop: 80,
    }}>

      <span style={{
        fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 600,
        letterSpacing: "0.1em", color: "var(--text-muted)",
      }}>
        © {YEAR} <span style={{ color: "var(--red)" }}>YF1</span> Dashboard
      </span>

      <Link to="/about" style={{
        fontFamily: "var(--font-head)", fontSize: 11, fontWeight: 700,
        letterSpacing: "0.15em", textTransform: "uppercase",
        color: "var(--text-muted)", textDecoration: "none",
        transition: "color 0.15s",
      }}
        onMouseEnter={e => e.currentTarget.style.color = "var(--red)"}
        onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
      >
        About
      </Link>

    </footer>
  );
}

export default Footer;