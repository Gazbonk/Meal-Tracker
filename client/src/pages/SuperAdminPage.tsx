import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ManagedHousehold } from "../types";

const inputClass =
  "border border-line bg-canvas rounded px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-signal";

export default function SuperAdminPage() {
  const { household: currentHousehold } = useAuth();
  const [households, setHouseholds] = useState<ManagedHousehold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [householdName, setHouseholdName] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [creating, setCreating] = useState(false);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ManagedHousehold[]>("/superadmin/households");
      setHouseholds(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load households");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setCreating(true);
    try {
      const res = await api.post<{ household: ManagedHousehold }>("/superadmin/households", {
        householdName,
        adminName,
        adminEmail,
        adminPassword,
      });
      setHouseholds((prev) => [...prev, res.household]);
      setHouseholdName("");
      setAdminName("");
      setAdminEmail("");
      setAdminPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create household");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(household: ManagedHousehold) {
    const confirmed = confirm(
      `Delete "${household.name}"? This will permanently delete its ${household.userCount} user account(s), ${household.recipeCount} recipe(s), and all of its meal plans and shopping list items. This cannot be undone.`
    );
    if (!confirmed) return;
    setError(null);
    try {
      await api.delete(`/superadmin/households/${household.id}`);
      setHouseholds((prev) => prev.filter((h) => h.id !== household.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete household");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink tracking-tight mb-5">Households</h1>

      {error && <p className="text-sm text-failed mb-3">{error}</p>}

      <form
        onSubmit={handleCreate}
        className="bg-surface border border-line rounded p-5 mb-6 space-y-3.5"
      >
        <h2 className="text-sm font-semibold text-ink">Create a new household</h2>
        <input
          required
          value={householdName}
          onChange={(e) => setHouseholdName(e.target.value)}
          placeholder="Household name"
          className={`${inputClass} w-full`}
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            required
            value={adminName}
            onChange={(e) => setAdminName(e.target.value)}
            placeholder="Their name"
            className={inputClass}
          />
          <input
            required
            type="email"
            value={adminEmail}
            onChange={(e) => setAdminEmail(e.target.value)}
            placeholder="Their email"
            className={inputClass}
          />
          <input
            required
            type="password"
            minLength={8}
            value={adminPassword}
            onChange={(e) => setAdminPassword(e.target.value)}
            placeholder="Their password (8+ chars)"
            className={inputClass}
          />
        </div>
        <p className="text-xs text-muted">
          They'll be created as the admin of this new, fully separate household.
        </p>
        <button
          type="submit"
          disabled={creating}
          className="bg-sageDeep text-white text-sm px-4 py-2 rounded font-medium hover:bg-signal transition-colors disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create household"}
        </button>
      </form>

      {loading ? (
        <div className="bg-surface rounded border border-line h-40 animate-pulse" />
      ) : (
        <div className="bg-surface border border-line rounded overflow-hidden">
          <ul className="divide-y divide-line">
            {households.map((h) => (
              <li key={h.id} className="p-4 flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <p className="text-sm font-medium text-ink">
                    {h.name}{" "}
                    {h.id === currentHousehold?.id && (
                      <span className="text-xs text-muted font-normal">(yours)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted">
                    {h.userCount} user{h.userCount === 1 ? "" : "s"} · {h.recipeCount} recipe
                    {h.recipeCount === 1 ? "" : "s"} · invite code{" "}
                    <span className="font-mono">{h.inviteCode}</span>
                  </p>
                </div>
                {h.id !== currentHousehold?.id && (
                  <button
                    onClick={() => handleDelete(h)}
                    className="text-failed hover:bg-surface2 font-medium text-xs px-2.5 py-1.5 rounded transition-colors"
                  >
                    Delete
                  </button>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
