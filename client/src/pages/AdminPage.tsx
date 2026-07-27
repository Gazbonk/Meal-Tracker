import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ManagedUser } from "../types";

const inputClass =
  "border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white";

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
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight mb-5">Manage accounts</h1>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <form
        onSubmit={handleCreate}
        className="bg-white border border-gray-200/70 rounded-2xl shadow-soft p-5 mb-6 space-y-3.5"
      >
        <h2 className="text-sm font-semibold text-gray-700">Add an account</h2>
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
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 rounded accent-brand-600"
          />
          Grant admin access
        </label>
        <button
          type="submit"
          disabled={creating}
          className="bg-brand-600 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-soft hover:bg-brand-700 hover:shadow-soft-md transition-all disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create account"}
        </button>
      </form>

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200/70 h-40 animate-pulse" />
      ) : (
        <div className="bg-white border border-gray-200/70 rounded-2xl shadow-soft overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="p-4">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700 text-xs font-semibold shrink-0">
                      {initials(u.name)}
                    </span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-400 font-normal">(you)</span>}
                      </p>
                      <p className="text-xs text-gray-500">{u.email}</p>
                    </div>
                    {u.isAdmin && (
                      <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full text-[11px] font-medium">
                        Admin
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 text-xs">
                    <button
                      onClick={() => toggleAdmin(u)}
                      className="text-brand-600 hover:text-brand-800 hover:bg-brand-50 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      {u.isAdmin ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                      className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
                    >
                      Reset password
                    </button>
                    <button
                      onClick={() => handleDelete(u.id)}
                      className="text-red-500 hover:text-red-700 hover:bg-red-50 font-medium px-2.5 py-1.5 rounded-lg transition-colors"
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
                      className="bg-brand-600 text-white text-xs px-3.5 py-2 rounded-xl font-medium hover:bg-brand-700 transition-colors"
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
