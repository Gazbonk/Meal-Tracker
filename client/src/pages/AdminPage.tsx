import { useEffect, useState } from "react";
import { api, ApiError } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { ManagedUser } from "../types";

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
      <h1 className="text-xl font-bold mb-4">Manage accounts</h1>

      {error && <p className="text-sm text-red-600 mb-3">{error}</p>}

      <form onSubmit={handleCreate} className="bg-white border border-gray-200 rounded-lg p-4 mb-6 space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">Add an account</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name"
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
          <input
            required
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password (8+ chars)"
            className="border border-gray-300 rounded-md px-2 py-1.5 text-sm"
          />
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={isAdmin}
            onChange={(e) => setIsAdmin(e.target.checked)}
            className="h-4 w-4 accent-brand-600"
          />
          Grant admin access
        </label>
        <button
          type="submit"
          disabled={creating}
          className="bg-brand-600 text-white text-sm px-3 py-1.5 rounded-md font-medium hover:bg-brand-700 disabled:opacity-50"
        >
          {creating ? "Creating..." : "Create account"}
        </button>
      </form>

      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <ul className="divide-y divide-gray-100">
            {users.map((u) => (
              <li key={u.id} className="p-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-800">
                      {u.name} {u.id === currentUser?.id && <span className="text-xs text-gray-400">(you)</span>}
                    </p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs">
                    {u.isAdmin && (
                      <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                    <button
                      onClick={() => toggleAdmin(u)}
                      className="text-brand-600 hover:text-brand-800 font-medium"
                    >
                      {u.isAdmin ? "Revoke admin" : "Make admin"}
                    </button>
                    <button
                      onClick={() => setEditingId(editingId === u.id ? null : u.id)}
                      className="text-gray-500 hover:text-gray-700 font-medium"
                    >
                      Reset password
                    </button>
                    <button onClick={() => handleDelete(u.id)} className="text-red-500 hover:text-red-700 font-medium">
                      Delete
                    </button>
                  </div>
                </div>

                {editingId === u.id && (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="password"
                      minLength={8}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="New password (8+ chars)"
                      className="border border-gray-300 rounded-md px-2 py-1 text-sm flex-1"
                    />
                    <button
                      onClick={() => handleResetPassword(u.id)}
                      className="bg-brand-600 text-white text-xs px-3 py-1 rounded-md font-medium hover:bg-brand-700"
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
