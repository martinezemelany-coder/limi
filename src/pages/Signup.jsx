import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { useFirebaseAuth } from "../lib/FirebaseAuthContext";

export default function Signup() {
  const { signup, loginWithGoogle } = useFirebaseAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const prettyError = (err) => {
    if (err.code === "auth/email-already-in-use") {
      return "This email already has a Limi account. Try logging in instead.";
    }

    if (err.code === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    }

    if (err.code === "auth/invalid-email") {
      return "Please enter a valid email.";
    }

    return err.message || "Could not create account.";
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and create a password.");
      return;
    }

    try {
      setLoading(true);
      await signup(email.trim(), password.trim());
      localStorage.setItem("isLoggedIn", "true");
      navigate("/onboarding");
    } catch (err) {
      console.error("SIGNUP ERROR:", err);
      setError(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setError("");

    try {
      setLoading(true);
      await loginWithGoogle();
      localStorage.setItem("isLoggedIn", "true");
      navigate("/onboarding");
    } catch (err) {
      console.error("GOOGLE SIGNUP ERROR:", err);
      setError(prettyError(err));
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
        <h1
          style={{
            fontSize: "40px",
            fontWeight: "900",
            textAlign: "center",
            marginBottom: "8px",
            color: "#ec64a8",
            letterSpacing: "-0.05em",
          }}
        >
          Create your Limi account
        </h1>

        <p
          style={{
            textAlign: "center",
            color: "#80636f",
            marginBottom: "24px",
            fontWeight: "700",
          }}
        >
          Sign up to continue 💕
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
            }}
          >
            {error}
          </p>
        )}

        <button
          onClick={handleGoogleSignup}
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

        <form onSubmit={handleSignup}>
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
            Create password
          </label>

          <div style={{ position: "relative", marginBottom: "18px" }}>
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Create a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                border: "1px solid #f0d8e2",
                borderRadius: "18px",
                padding: "15px 48px 15px 15px",
                boxSizing: "border-box",
                outline: "none",
              }}
            />

            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              style={{
                position: "absolute",
                right: "14px",
                top: "50%",
                transform: "translateY(-50%)",
                border: "none",
                background: "transparent",
                color: "#d94b93",
                cursor: "pointer",
              }}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

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
            {loading ? "Creating account..." : "Create Limi account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "18px", color: "#80636f" }}>
          Already have an account?{" "}
          <Link
            to="/login"
            style={{
              color: "#d94b93",
              fontWeight: "900",
              textDecoration: "none",
            }}
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}