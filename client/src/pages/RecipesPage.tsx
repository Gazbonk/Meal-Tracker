import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { Recipe } from "../types";

export default function RecipesPage() {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);

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

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold">Recipes</h1>
        <Link
          to="/recipes/new"
          className="bg-brand-600 text-white text-sm px-3 py-2 rounded-md font-medium hover:bg-brand-700"
        >
          + New recipe
        </Link>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (
        <p className="text-gray-400">Loading...</p>
      ) : recipes.length === 0 ? (
        <p className="text-gray-400">No recipes yet. Add your first one!</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {recipes.map((recipe) => (
            <div key={recipe.id} className="bg-white border border-gray-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <h2 className="font-semibold text-gray-800">{recipe.name}</h2>
              </div>
              {recipe.tags && <p className="text-xs text-gray-400 mt-1">{recipe.tags}</p>}
              <ul className="text-sm text-gray-600 mt-2 space-y-0.5">
                {recipe.ingredients.slice(0, 4).map((ing, i) => (
                  <li key={i}>
                    • {ing.quantity} {ing.unit} {ing.name}
                  </li>
                ))}
                {recipe.ingredients.length > 4 && (
                  <li className="text-gray-400">+ {recipe.ingredients.length - 4} more</li>
                )}
              </ul>
              <div className="flex items-center gap-3 mt-3 text-sm">
                <Link to={`/recipes/${recipe.id}/edit`} className="text-brand-700 font-medium hover:underline">
                  Edit
                </Link>
                <button onClick={() => handleDelete(recipe.id)} className="text-red-500 hover:underline">
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
