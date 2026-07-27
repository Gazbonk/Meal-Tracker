import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { ApiError } from "../api/client";

export default function LoginPage() {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) return <Navigate to="/" replace />;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate("/");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-canvas">
      <div className="w-full max-w-sm">
        <div className="flex justify-center mb-5">
          <span className="flex h-14 w-14 items-center justify-center rounded bg-sageDeep text-2xl">
            🍽️
          </span>
        </div>

        <div className="bg-surface p-8 rounded border border-line">
          <h1 className="font-display text-xl font-semibold text-center text-ink tracking-tight mb-1">
            Hornsby Meal Tracker
          </h1>
          <p className="text-center text-muted text-sm mb-6">Log in to your household</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-line bg-canvas rounded px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-signal"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-ink mb-1.5">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full border border-line bg-canvas rounded px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-signal"
              />
            </div>
            {error && <p className="text-sm text-failed">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-sageDeep text-white rounded py-2.5 font-medium hover:bg-signal transition-colors disabled:opacity-50"
            >
              {submitting ? "Logging in..." : "Log in"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
