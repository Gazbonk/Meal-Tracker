import { useEffect, useMemo, useState } from "react";
import { api, ApiError } from "../api/client";
import { ShoppingListItem } from "../types";

const UNCATEGORIZED = "Other";

export default function ShoppingListPage() {
  const [items, setItems] = useState<ShoppingListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [category, setCategory] = useState("");

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<ShoppingListItem[]>("/shoppinglist");
      setItems(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load shopping list");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const grouped = useMemo(() => {
    const map = new Map<string, ShoppingListItem[]>();
    for (const item of items) {
      const cat = item.category?.trim() || UNCATEGORIZED;
      if (!map.has(cat)) map.set(cat, []);
      map.get(cat)!.push(item);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [items]);

  const hasChecked = items.some((i) => i.checked);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    const item = await api.post<ShoppingListItem>("/shoppinglist", {
      name: name.trim(),
      quantity: quantity || undefined,
      category: category || undefined,
    });
    setItems((prev) => [...prev, item]);
    setName("");
    setQuantity("");
    setCategory("");
  }

  async function toggleChecked(item: ShoppingListItem) {
    const updated = await api.patch<ShoppingListItem>(`/shoppinglist/${item.id}`, { checked: !item.checked });
    setItems((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
  }

  async function removeItem(id: string) {
    await api.delete(`/shoppinglist/${id}`);
    setItems((prev) => prev.filter((i) => i.id !== id));
  }

  async function clearChecked() {
    await api.delete("/shoppinglist/checked/all");
    setItems((prev) => prev.filter((i) => !i.checked));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Shopping List</h1>
        {hasChecked && (
          <button onClick={clearChecked} className="text-sm text-gray-500 hover:text-red-600 transition-colors">
            Clear checked items
          </button>
        )}
      </div>

      <form
        onSubmit={handleAdd}
        className="flex flex-wrap gap-2 mb-5 bg-white border border-gray-200/70 rounded-2xl shadow-soft p-3"
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Item name"
          className="flex-1 min-w-[120px] border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
        />
        <input
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="Qty"
          className="w-20 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          className="w-32 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
        />
        <button
          type="submit"
          className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-soft hover:bg-brand-700 transition-colors"
        >
          Add
        </button>
      </form>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/70 h-28 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-3xl mb-2">🛒</p>
          <p className="text-gray-500">Your shopping list is empty.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([cat, catItems]) => (
            <div
              key={cat}
              className="bg-white border border-gray-200/70 rounded-2xl shadow-soft overflow-hidden"
            >
              <div className="px-4 py-2.5 bg-gray-50/80 text-xs font-semibold uppercase tracking-wider text-gray-500">
                {cat}
              </div>
              <ul className="divide-y divide-gray-100">
                {catItems.map((item) => (
                  <li key={item.id} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-gray-50/60 transition-colors">
                    <input
                      type="checkbox"
                      checked={item.checked}
                      onChange={() => toggleChecked(item)}
                      className="h-[18px] w-[18px] rounded accent-brand-600 cursor-pointer"
                    />
                    <span className={`flex-1 text-sm ${item.checked ? "line-through text-gray-400" : "text-gray-700"}`}>
                      {item.name}
                      {(item.quantity || item.unit) && (
                        <span className="text-gray-400"> — {item.quantity} {item.unit}</span>
                      )}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-gray-300 hover:text-red-500 text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
