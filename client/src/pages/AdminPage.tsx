import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ManagedUser } from "../types";

const inputClass =
  "border border-line bg-canvas rounded px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-signal";

function initials(name: string) {
  return name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function AdminPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [creating, setCreating] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ManagedUser[]>("/admin/users");
      setUsers(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load accounts");
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
      const user = await api.post<ManagedUser>("/admin/users", { name, email, password, isAdmin });
      setUsers((prev) => [...prev, user]);
      setName("");
      setEmail("");
      setPassword("");
      setIsAdmin(false);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create account");
    } finally {
      setCreating(false);
    }
  }

  async function toggleAdmin(target: ManagedUser) {
    setError(null);
    try {
      const updated = await api.patch<ManagedUser>(`/admin/users/${target.id}`, { isAdmin: !target.isAdmin });
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update account");
    }
  }

  async function handleResetPassword(id: string) {
    if (!newPassword.trim()) return;
    setError(null);
    try {
      await api.patch(`/admin/users/${id}`, { newPassword });
      setEditingId(null);
      setNewPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reset password");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this account? This can't be undone.")) return;
    setError(null);
    try {
      await api.delete(`/admin/users/${id}`);
      setUsers((prev) => prev.filter((u) => u.id !== id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to delete account");
    }
  }

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold text-ink tracking-tight mb-5">Manage accounts</h1>

      {error && <p className="text-sm text-failed mb-3">{error}</p>}

      <form
        onSubmit={handleCreate}
        className="bg-surface border border-line rounded p-5 mb-6 space-y-3.5"
      >
        <h2 className="text-sm font-semibold text-ink">Add an account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className={inputClass}
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className={inputClass}
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 rounded accent-sageDeep"
          />
          Grant admin access
        </label>
        <button
          type="submit"
          disabled={creating}
          className="bg-sageDeep text-white text-sm px-4 py-2 rounded font-medium hover:bg-signal transition-colors disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create account"}
        </button>
      </form>

      {loading ? (
        <div className="bg-surface rounded border border-line h-40 animate-pulse" />
      ) : (
        <div className="bg-surface border border-line rounded overflow-hidden">
          <ul className="divide-y divide-line">
            {users.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-sage text-sageDeep text-xs font-semibold shrink-0">
                      {initials(u.name)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-ink">
                        {u.name} {u.id === currentUser?.id && <span className="text-xs text-muted font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-muted">{u.email}</p>
                    </div>
                    {u.isAdmin && <span className="bk-pill text-sageDeep bg-sage/30">Admin</span>}
                    {u.isSuperAdmin && <span className="bk-pill text-white bg-ink">Super Admin</span>}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => toggleAdmin(u)}
                      className="text-sageDeep hover:text-signal hover:bg-surface2 font-medium px-2.5 py-1.5 rounded transition-colors"
                    >
                      {u.isAdmin ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                      className="text-muted hover:text-ink hover:bg-surface2 font-medium px-2.5 py-1.5 rounded transition-colors"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-failed hover:bg-surface2 font-medium px-2.5 py-1.5 rounded transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === u.id && (
                  <div className="mt-3 flex gap-2 pl-12">
                    <input
                      type="password"
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (8+ chars)"
                      className={`${inputClass} flex-1`}
                    />
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="bg-sageDeep text-white text-xs px-3.5 py-2 rounded font-medium hover:bg-signal transition-colors"
                    >
                      Save
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
