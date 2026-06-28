import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFirebaseAuth } from "../lib/FirebaseAuthContext";

export default function Login() {
  const { login, signup, loginWithGoogle, resetPassword } = useFirebaseAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      if (isSignup) {
        await signup(email, password);
      } else {
        await login(email, password);
      }

      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } catch (err) {
      console.error("EMAIL AUTH ERROR:", err);
      setError(`${err.code || "auth/error"}: ${err.message || "Something went wrong."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setSuccess("");

    try {
      setLoading(true);
      await loginWithGoogle();
      localStorage.setItem("isLoggedIn", "true");
      navigate("/");
    } catch (err) {
      console.error("GOOGLE AUTH ERROR:", err);
      setError(`${err.code || "auth/error"}: ${err.message || "Google sign-in failed."}`);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setError("");
    setSuccess("");

    if (!email) {
      setError("Enter your email first, then click forgot password.");
      return;
    }

    try {
      setLoading(true);
      await resetPassword(email);
      setSuccess("Password reset email sent 💕 Check your inbox.");
    } catch (err) {
      console.error("RESET PASSWORD ERROR:", err);
      setError(`${err.code || "auth/error"}: ${err.message || "Could not send reset email."}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #fdeef4 0%, #f8dce6 45%, #f4b7c8 100%)",
        padding: "16px",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "420px",
          background: "rgba(255, 250, 250, 0.96)",
          borderRadius: "34px",
          boxShadow: "0 18px 45px rgba(231, 91, 150, 0.18)",
          padding: "32px",
          border: "1px solid rgba(255,255,255,0.7)",
        }}
      >
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div
            style={{
              width: "92px",
              height: "92px",
              borderRadius: "28px",
              background: "linear-gradient(135deg, #f5a2bc, #ef87ad, #f78e9b)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "44px",
              fontWeight: "900",
              boxShadow: "0 12px 28px rgba(231,91,150,0.25)",
            }}
          >
            L
          </div>
        </div>

        <h1
          style={{
            fontSize: "42px",
            fontWeight: "900",
            textAlign: "center",
            marginBottom: "8px",
            color: "#ec64a8",
            letterSpacing: "-0.05em",
          }}
        >
          Welcome to Limi
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#80636f",
            marginBottom: "24px",
            fontWeight: "700",
          }}
        >
          {isSignup ? "Create your account 💕" : "Sign in to continue 💕"}
        </p>

        {error && (
          <p
            style={{
              color: "#b91c1c",
              background: "#fee2e2",
              padding: "12px",
              borderRadius: "16px",
              textAlign: "center",
              marginBottom: "16px",
              fontWeight: "700",
              fontSize: "13px",
              lineHeight: "1.5",
              wordBreak: "break-word",
            }}
          >
            {error}
          </p>
        )}

        {success && (
          <p
            style={{
              color: "#15803d",
              background: "#dcfce7",
              padding: "12px",
              borderRadius: "16px",
              textAlign: "center",
              marginBottom: "16px",
              fontWeight: "700",
            }}
          >
            {success}
          </p>
        )}

        <button
          onClick={handleGoogleAuth}
          disabled={loading}
          style={{
            width: "100%",
            border: "1px solid #f0d8e2",
            borderRadius: "18px",
            padding: "15px",
            marginBottom: "24px",
            background: "white",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "800",
            color: "#263142",
          }}
        >
          {loading ? "Please wait..." : "Continue with Google"}
        </button>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "12px",
            marginBottom: "24px",
          }}
        >
          <div style={{ height: "1px", background: "#f0d8e2", flex: 1 }} />
          <span style={{ color: "#80636f", fontSize: "14px", fontWeight: "700" }}>
            OR
          </span>
          <div style={{ height: "1px", background: "#f0d8e2", flex: 1 }} />
        </div>

        <form onSubmit={handleEmailAuth}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "800" }}>
            Email
          </label>

          <input
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #f0d8e2",
              borderRadius: "18px",
              padding: "15px",
              marginBottom: "16px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          <label style={{ display: "block", marginBottom: "8px", fontWeight: "800" }}>
            Password
          </label>

          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{
              width: "100%",
              border: "1px solid #f0d8e2",
              borderRadius: "18px",
              padding: "15px",
              marginBottom: "10px",
              boxSizing: "border-box",
              outline: "none",
            }}
          />

          {!isSignup && (
            <button
              type="button"
              onClick={handleForgotPassword}
              disabled={loading}
              style={{
                background: "none",
                border: "none",
                color: "#d94b93",
                fontWeight: "800",
                cursor: loading ? "not-allowed" : "pointer",
                marginBottom: "18px",
                padding: 0,
              }}
            >
              Forgot password?
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: "linear-gradient(135deg, #f5a2bc, #ef87ad, #d94b93)",
              color: "white",
              border: "none",
              borderRadius: "999px",
              padding: "16px",
              fontSize: "16px",
              fontWeight: "900",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: "0 10px 24px rgba(231,91,150,0.24)",
            }}
          >
            {loading ? "Please wait..." : isSignup ? "Sign up" : "Sign in"}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "18px" }}>
          <button
            type="button"
            onClick={() => {
              setIsSignup(!isSignup);
              setError("");
              setSuccess("");
            }}
            style={{
              background: "none",
              border: "none",
              color: "#263142",
              fontWeight: "800",
              cursor: "pointer",
            }}
          >
            {isSignup
              ? "Already have an account? Sign in"
              : "Need an account? Sign up"}
          </button>
        </div>
      </div>
    </div>
  );
}