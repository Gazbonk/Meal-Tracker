import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { Recipe, RecipeImportDraft } from "../types";

export default function RecipesPage() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

  const [showImport, setShowImport] = useState(false);
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<Recipe[]>("/recipes");
      setRecipes(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load recipes");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(id: string) {
    if (!confirm("Delete this recipe?")) return;
    await api.delete(`/recipes/${id}`);
    setRecipes((prev) => prev.filter((r) => r.id !== id));
  }

  async function handleAddToList(id: string) {
    setAddingId(id);
    try {
      await api.post(`/recipes/${id}/add-to-shopping-list`);
      setAddedId(id);
      setTimeout(() => setAddedId(null), 1500);
    } finally {
      setAddingId(null);
    }
  }

  async function handleImport(e: React.FormEvent) {
    e.preventDefault();
    if (!importUrl.trim()) return;
    setImporting(true);
    setImportError(null);
    try {
      const prefill = await api.post<RecipeImportDraft>("/recipes/import", { url: importUrl.trim() });
      navigate("/recipes/new", { state: { prefill } });
    } catch (err) {
      setImportError(err instanceof ApiError ? err.message : "Failed to import recipe");
    } finally {
      setImporting(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Recipes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="text-sm px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            + Import from URL
          </button>
          <Link
            to="/recipes/new"
            className="bg-brand-600 text-white text-sm px-4 py-2 rounded-xl font-medium shadow-soft hover:bg-brand-700 hover:shadow-soft-md transition-all"
          >
            + New recipe
          </Link>
        </div>
      </div>

      {showImport && (
        <form
          onSubmit={handleImport}
          className="flex flex-wrap gap-2 mb-5 bg-white border border-gray-200/70 rounded-2xl shadow-soft p-3"
        >
          <input
            type="url"
            required
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Paste a recipe URL (e.g. a Substack post)"
            className="flex-1 min-w-[200px] border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
          />
          <button
            type="submit"
            disabled={importing}
            className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-medium shadow-soft hover:bg-brand-700 transition-colors disabled:opacity-50"
          >
            {importing ? "Fetching..." : "Fetch"}
          </button>
          {importError && <p className="w-full text-sm text-red-600">{importError}</p>}
        </form>
      )}

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/70 h-44 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-dashed border-gray-200">
          <p className="text-3xl mb-2">🍳</p>
          <p className="text-gray-500">No recipes yet. Add your first one!</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-white border border-gray-200/70 rounded-2xl p-4 shadow-soft hover:shadow-soft-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <h2 className="font-semibold text-gray-800">{recipe.name}</h2>
              {recipe.tags && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {recipe.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px] font-medium bg-brand-50 text-brand-700 px-2 py-0.5 rounded-full"
                      >
                        {tag}
                      </span>
                    ))}
                </div>
              )}
              <ul className="text-sm text-gray-600 mt-3 space-y-1">
                {recipe.ingredients.slice(0, 4).map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-gray-300 shrink-0" />
                    <span>
                      {ing.quantity} {ing.unit} {ing.name}
                    </span>
                  </li>
                ))}
                {recipe.ingredients.length > 4 && (
                  <li className="text-gray-400 pl-3">+ {recipe.ingredients.length - 4} more</li>
                )}
              </ul>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-100 text-sm">
                <Link to={`/recipes/${recipe.id}/edit`} className="text-brand-700 font-medium hover:text-brand-800">
                  Edit
                </Link>
                <button onClick={() => handleDelete(recipe.id)} className="text-red-500 hover:text-red-700">
                  Delete
                </button>
                <button
                  onClick={() => handleAddToList(recipe.id)}
                  disabled={addingId === recipe.id}
                  className="ml-auto text-brand-600 hover:text-brand-800 text-xs font-medium disabled:opacity-50"
                >
                  {addedId === recipe.id ? "Added ✓" : addingId === recipe.id ? "Adding..." : "+ Add to list"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
