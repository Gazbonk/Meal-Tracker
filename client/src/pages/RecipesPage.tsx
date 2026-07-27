import { useEffect, useMemo, useState } from "react";
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
  const [search, setSearch] = useState("");

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

  const filteredRecipes = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return recipes;
    return recipes.filter((recipe) => {
      if (recipe.name.toLowerCase().includes(query)) return true;
      if (recipe.tags?.toLowerCase().includes(query)) return true;
      return recipe.ingredients.some((ing) => ing.name.toLowerCase().includes(query));
    });
  }, [recipes, search]);

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
        <h1 className="font-display text-2xl font-semibold text-ink tracking-tight">Recipes</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowImport((v) => !v)}
            className="text-sm px-4 py-2 rounded font-medium text-muted hover:bg-surface transition-colors"
          >
            + Import from URL
          </button>
          <Link
            to="/recipes/new"
            className="bg-sageDeep text-white text-sm px-4 py-2 rounded font-medium hover:bg-signal transition-colors"
          >
            + New recipe
          </Link>
        </div>
      </div>

      <div className="mb-5">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search recipes by name, tag, or ingredient"
          className="w-full border border-line bg-surface rounded px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal focus:bg-canvas transition-shadow"
        />
      </div>

      {showImport && (
        <form
          onSubmit={handleImport}
          className="flex flex-wrap gap-2 mb-5 bg-surface border border-line rounded p-3"
        >
          <input
            type="url"
            required
            value={importUrl}
            onChange={(e) => setImportUrl(e.target.value)}
            placeholder="Paste a recipe URL (e.g. a Substack post)"
            className="flex-1 min-w-[200px] border border-line bg-canvas rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-signal transition-shadow"
          />
          <button
            type="submit"
            disabled={importing}
            className="bg-sageDeep text-white px-4 py-2 rounded text-sm font-medium hover:bg-signal transition-colors disabled:opacity-50"
          >
            {importing ? "Fetching..." : "Fetch"}
          </button>
          {importError && <p className="w-full text-sm text-failed">{importError}</p>}
        </form>
      )}

      {error && <p className="text-failed text-sm mb-3">{error}</p>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-surface rounded border border-line h-44 animate-pulse" />
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded border border-dashed border-line">
          <p className="text-3xl mb-2">🍳</p>
          <p className="text-muted">No recipes yet. Add your first one!</p>
        </div>
      ) : filteredRecipes.length === 0 ? (
        <div className="text-center py-16 bg-surface rounded border border-dashed border-line">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-muted">No recipes match "{search}".</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredRecipes.map((recipe) => (
            <div
              key={recipe.id}
              className="bg-surface border border-line rounded p-4 hover:border-sageMid transition-colors"
            >
              <h2 className="font-display font-semibold text-ink">{recipe.name}</h2>
              {recipe.tags && (
                <div className="flex flex-wrap gap-1 mt-1.5">
                  {recipe.tags
                    .split(",")
                    .map((t) => t.trim())
                    .filter(Boolean)
                    .map((tag) => (
                      <span key={tag} className="bk-pill text-sageDeep bg-sage/30">
                        {tag}
                      </span>
                    ))}
                </div>
              )}
              <ul className="text-sm text-ink mt-3 space-y-1">
                {recipe.ingredients.slice(0, 4).map((ing, i) => (
                  <li key={i} className="flex items-baseline gap-1.5">
                    <span className="h-1 w-1 rounded-full bg-sageMid shrink-0" />
                    <span>
                      {ing.quantity} {ing.unit} {ing.name}
                    </span>
                  </li>
                ))}
                {recipe.ingredients.length > 4 && (
                  <li className="text-muted pl-3">+ {recipe.ingredients.length - 4} more</li>
                )}
              </ul>
              <div className="flex items-center gap-3 mt-4 pt-3 border-t border-line text-sm">
                <Link to={`/recipes/${recipe.id}/edit`} className="text-sageDeep font-medium hover:text-signal">
                  Edit
                </Link>
                <button onClick={() => handleDelete(recipe.id)} className="text-failed hover:underline">
                  Delete
                </button>
                <button
                  onClick={() => handleAddToList(recipe.id)}
                  disabled={addingId === recipe.id}
                  className="ml-auto text-sageDeep hover:text-signal text-xs font-medium disabled:opacity-50"
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
