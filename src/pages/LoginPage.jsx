import React, { useState } from "react";
import { signInWithPopup } from "firebase/auth";
import { auth, googleProvider } from "../firebase/config";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogle = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (e) {
      setError("Sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-logo">
          <div className="logo-dv">DV</div>
          <span className="logo-text">Devverse</span>
        </div>

        <h1 className="login-title">Intern Portal</h1>
        <p className="login-sub">
          Track your daily sessions, log tasks, and build your internship record — all in one place.
        </p>

        {error && <div className="alert alert-red">{error}</div>}

        <button className="google-btn" onClick={handleGoogle} disabled={loading}>
          <svg width="18" height="18" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9 3.2l6.7-6.7C35.8 2.5 30.2 0 24 0 14.6 0 6.6 5.4 2.6 13.3l7.8 6C12.4 13.2 17.7 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v8.5h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17z"/>
            <path fill="#FBBC05" d="M10.4 28.7A14.7 14.7 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.8-6A23.9 23.9 0 0 0 0 24c0 3.9.9 7.5 2.6 10.7l7.8-6z"/>
            <path fill="#34A853" d="M24 48c6.2 0 11.4-2 15.2-5.5l-7.5-5.8c-2 1.4-4.7 2.2-7.7 2.2-6.3 0-11.6-3.7-13.6-9.2l-7.8 6C6.6 42.6 14.6 48 24 48z"/>
          </svg>
          {loading ? "Signing in…" : "Continue with Google"}
        </button>

        <div className="divider">or</div>

        <p style={{ fontSize: 13, color: "var(--text3)", lineHeight: 1.6 }}>
          Use your college or personal Google account. Your sessions are tracked automatically once you sign in.
        </p>

        <p style={{ marginTop: 24, fontSize: 12, color: "var(--text3)" }}>
          Powered by Devverse · UDYAM-TN-24-0155140
        </p>
      </div>
    </div>
  );
}
