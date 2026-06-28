import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useFirebaseAuth } from "@/lib/FirebaseAuthContext";

export default function Signup() {
  const { signup } = useFirebaseAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await signup(email, password);
      navigate("/");
    } catch (err) {
      setError("Could not create account.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8fb] px-4">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-md p-8">
        <h1 className="text-4xl font-bold text-center mb-2">Create your Limi account</h1>
        <p className="text-center text-gray-600 mb-6">Sign up to continue</p>

        {error && (
          <p className="text-red-500 text-sm text-center mb-4">{error}</p>
        )}

        <form onSubmit={handleSignup}>
          <label className="block text-center font-semibold mb-2">Email</label>
          <input
            type="email"
            placeholder="you@example.com"
            className="w-full border rounded-2xl px-4 py-3 mb-5"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <label className="block text-center font-semibold mb-2">Password</label>
          <input
            type="password"
            placeholder="Choose a password"
            className="w-full border rounded-2xl px-4 py-3 mb-6"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white rounded-2xl py-3 text-lg font-semibold"
          >
            {loading ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-600 mt-5">
          Already have an account?{" "}
          <Link to="/login" className="font-semibold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}