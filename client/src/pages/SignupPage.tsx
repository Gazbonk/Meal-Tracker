import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function SignupPage() {
  const { signup, user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"create" | "join">("create");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [householdName, setHouseholdName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await signup({
        name,
        email,
        password,
        householdName: mode === "create" ? householdName : undefined,
        inviteCode: mode === "join" ? inviteCode : undefined,
      });
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-sm bg-white p-8 rounded-xl shadow-sm border border-gray-100">
        <h1 className="text-2xl font-bold text-center mb-1">🍽️ Meal Tracker</h1>
        <p className="text-center text-gray-500 text-sm mb-6">Create your account</p>

        <div className="flex mb-5 rounded-md border border-gray-200 overflow-hidden text-sm">
          <button
            type="button"
            onClick={() => setMode("create")}
            className={`flex-1 py-2 font-medium ${mode === "create" ? "bg-brand-600 text-white" : "bg-white text-gray-600"}`}
          >
            Start a household
          </button>
          <button
            type="button"
            onClick={() => setMode("join")}
            className={`flex-1 py-2 font-medium ${mode === "join" ? "bg-brand-600 text-white" : "bg-white text-gray-600"}`}
          >
            Join with code
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Your name</label>
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {mode === "create" ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Household name (optional)</label>
              <input
                value={householdName}
                onChange={(e) => setHouseholdName(e.target.value)}
                placeholder="e.g. The Smiths"
                className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">
                You'll get an invite code afterwards to share with your partner.
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Invite code</label>
              <input
                required
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                placeholder="e.g. AB12CD"
                className="w-full border border-gray-300 rounded-md px-3 py-2 uppercase tracking-widest focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
              <p className="text-xs text-gray-400 mt-1">Ask your partner for the code from their account.</p>
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-600 text-white rounded-md py-2 font-medium hover:bg-brand-700 disabled:opacity-50"
          >
            {submitting ? "Creating account..." : "Sign up"}
          </button>
        </form>

        <p className="text-sm text-gray-500 text-center mt-4">
          Already have an account?{" "}
          <Link to="/login" className="text-brand-700 font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}
