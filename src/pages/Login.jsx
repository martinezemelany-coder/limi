import { getFriendlyFirebaseErrorMessage } from "../lib/firebaseError";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Eye, EyeOff, Mail, Sparkles } from "lucide-react";
import { useFirebaseAuth } from "../lib/FirebaseAuthContext";

export default function Login() {
  const {
    login,
    signup,
    loginWithGoogle,
    resetPassword,
    checkEmailMethods,
  } = useFirebaseAuth();

  const navigate = useNavigate();

  const [emailOpen, setEmailOpen] = useState(false);
  const [mode, setMode] = useState("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const prettyError = (err) => {
    if (err.code === "auth/email-already-in-use") {
      return "This email already has a Limi account.";
    }

    if (err.code === "auth/invalid-credential") {
      return "That email or password is wrong.";
    }

    if (err.code === "auth/weak-password") {
      return "Password should be at least 6 characters.";
    }

    if (err.code === "auth/invalid-email") {
      return "Please enter a valid email.";
    }

    return err.message || "Something went wrong.";
  };

  const handleGoogle = async () => {
    try {
      setLoading(true);
      setError("");
      await loginWithGoogle();
      navigate("/");
    } catch (err) {
      console.error(err);
      setError(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEmailContinue = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      setLoading(true);

      const methods = checkEmailMethods
        ? await checkEmailMethods(email.trim())
        : [];

      if (methods.includes("password")) {
        setMode("login");
      } else if (methods.includes("google.com")) {
        setMode("google");
      } else {
        setMode("signup");
      }
    } catch (err) {
      console.error(err);
      setMode("signup");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!password.trim()) {
      setError("Enter your password.");
      return;
    }

    try {
      setLoading(true);

      if (mode === "signup") {
        await signup(email.trim(), password.trim());
        navigate("/onboarding");
      } else {
        await login(email.trim(), password.trim());
        navigate("/");
      }
    } catch (err) {
      console.error(err);

      if (err.code === "auth/email-already-in-use") {
        setMode("existing");
        setPassword("");
        setError("");
        return;
      }

      setError(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      setError("Enter your email first.");
      return;
    }

    try {
      setLoading(true);
      setError("");
      await resetPassword(email.trim());
      setSuccess("Password reset email sent 💕 Check your inbox.");
    } catch (err) {
      console.error(err);
      setError(prettyError(err));
    } finally {
      setLoading(false);
    }
  };

  const resetEmailFlow = () => {
    setMode("email");
    setPassword("");
    setError("");
    setSuccess("");
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#fdeef4] via-[#f8dce6] to-[#f4b7c8] px-4">
      <div className="w-full max-w-md rounded-[38px] border border-white/70 bg-white/95 p-8 shadow-[0_18px_45px_rgba(231,91,150,0.18)]">
        <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-[30px] bg-gradient-to-br from-[#f5a2bc] via-[#ef87ad] to-[#f78e9b] text-5xl font-black text-white shadow-[0_12px_28px_rgba(231,91,150,0.25)]">
          L
        </div>

        <h1
          className="text-center text-[48px] leading-none tracking-[-0.06em] text-[#ec64a8]"
          style={{ fontWeight: 1000 }}
        >
          Limi
        </h1>

        <p className="mt-3 text-center text-lg font-black text-[#80636f]">
          Meet your people 💕
        </p>

        {error && (
          <p className="mt-5 rounded-2xl bg-red-100 p-3 text-center text-sm font-bold text-red-700">
            {error}
          </p>
        )}

        {success && (
          <p className="mt-5 rounded-2xl bg-green-100 p-3 text-center text-sm font-bold text-green-700">
            {success}
          </p>
        )}

        {!emailOpen ? (
          <div className="mt-8 space-y-4">
            <button
              onClick={handleGoogle}
              disabled={loading}
              className="w-full rounded-full border border-[#f0d8e2] bg-white py-4 text-base font-black text-[#263142] shadow-sm disabled:opacity-60"
            >
              {loading ? "Please wait..." : "Continue with Google"}
            </button>

            <button
              onClick={() => setEmailOpen(true)}
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white shadow-[0_10px_24px_rgba(231,91,150,0.24)] disabled:opacity-60"
            >
              <Mail size={19} />
              Continue with Email
            </button>

            <p className="pt-3 text-center text-xs font-semibold leading-5 text-[#9a7b87]">
              By continuing, you agree to Limi’s Terms and Privacy Policy.
            </p>
          </div>
        ) : (
          <div className="mt-8">
            <button 
              type = "button"
              onClick={() => {
                setEmailOpen(false);
                setMode("email");
                setEmail("");
                setPassword("");
                setError("");
                setSuccess("");
              }} 
              className="mb-5 flex items-center gap-2 text-sm font-black text-[#d94b93]">
              <ArrowLeft size={17} />
              Back
            </button>

            {mode === "email" && (
              <form onSubmit={handleEmailContinue} className="space-y-4">
                <label className="mb-2 block text-sm font-black text-[#80636f]">
                  What’s your email?
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border border-[#f0d8e2] bg-white px-4 py-4 outline-none focus:border-[#ef87ad]"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white disabled:opacity-60"
                >
                  {loading ? "Checking..." : "Continue"}
                </button>
              </form>
            )}

            {(mode === "google" || mode === "existing") && (
              <div className="space-y-4">
                <div className="rounded-[26px] bg-[#fff6fa] p-5 text-center">
                  <Sparkles className="mx-auto mb-3 text-[#ec64a8]" size={30} />

                  <h2 className="text-xl font-black text-[#2b1d28]">
                    This email already has a Limi account.
                  </h2>

                  <p className="mt-2 text-sm font-semibold text-[#80636f]">
                    Continue with Google, or sign in with your password 💕
                  </p>
                </div>

                <button
                  onClick={handleGoogle}
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white disabled:opacity-60"
                >
                  Continue with Google
                </button>

                <button
                  onClick={() => {
                    setMode("login");
                    setError("");
                    setPassword("");
                  }}
                  className="w-full rounded-full border border-[#f1d8e3] bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Sign in with password
                </button>

                <button
                  onClick={() => {
                    setEmail("");
                    resetEmailFlow();
                  }}
                  className="w-full rounded-full bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Use a different email
                </button>
              </div>
            )}

            {(mode === "login" || mode === "signup") && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="rounded-[22px] bg-[#fff6fa] p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-[#d94b93]">
                    {mode === "signup" ? "Create account" : "Welcome back"}
                  </p>
                  <p className="mt-1 text-sm font-bold text-[#80636f]">
                    {email}
                  </p>
                </div>

                <label className="mb-2 block text-sm font-black text-[#80636f]">
                  {mode === "signup" ? "Create password" : "Password"}
                </label>

                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder={
                      mode === "signup"
                        ? "Create a password"
                        : "Enter your password"
                    }
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-2xl border border-[#f0d8e2] bg-white px-4 py-4 pr-12 outline-none focus:border-[#ef87ad]"
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#d94b93]"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>

                {mode === "login" && (
                  <button
                    type="button"
                    onClick={handleForgotPassword}
                    disabled={loading}
                    className="text-sm font-black text-[#d94b93] disabled:opacity-60"
                  >
                    Forgot password?
                  </button>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-full bg-gradient-to-r from-[#f4a1bd] via-[#f38cad] to-[#fb8f9f] py-4 text-base font-black text-white disabled:opacity-60"
                >
                  {loading
                    ? "Please wait..."
                    : mode === "signup"
                    ? "Create Limi account"
                    : "Sign In"}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEmail("");
                    resetEmailFlow();
                  }}
                  className="w-full rounded-full bg-white py-4 text-sm font-black text-[#d94b93]"
                >
                  Use a different email
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}