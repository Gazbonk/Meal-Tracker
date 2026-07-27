import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client";
import { Ingredient, Recipe } from "../types";

const emptyIngredient = (): Ingredient => ({ name: "", quantity: "", unit: "", category: "" });

const inputClass =
  "w-full border border-gray-200 bg-gray-50 rounded-xl px-3.5 py-2.5 text-sm transition-shadow focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white";

export default function RecipeFormPage() {
  const { id } = useParams();
  const isEditing = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [tags, setTags] = useState("");
  const [instructions, setInstructions] = useState("");
  const [ingredients, setIngredients] = useState<Ingredient[]>([emptyIngredient()]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(isEditing);

  useEffect(() => {
    if (!id) return;
    api
      .get<Recipe>(`/recipes/${id}`)
      .then((recipe) => {
        setName(recipe.name);
        setTags(recipe.tags || "");
        setInstructions(recipe.instructions || "");
        setIngredients(
          recipe.ingredients.length
            ? recipe.ingredients.map((ing) => ({
                name: ing.name,
                quantity: ing.quantity || "",
                unit: ing.unit || "",
                category: ing.category || "",
              }))
            : [emptyIngredient()]
        );
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load recipe"))
      .finally(() => setLoading(false));
  }, [id]);

  function updateIngredient(index: number, field: keyof Ingredient, value: string) {
    setIngredients((prev) => prev.map((ing, i) => (i === index ? { ...ing, [field]: value } : ing)));
  }

  function addIngredientRow() {
    setIngredients((prev) => [...prev, emptyIngredient()]);
  }

  function removeIngredientRow(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const payload = {
        name,
        tags: tags || undefined,
        instructions: instructions || undefined,
        ingredients: ingredients
          .filter((ing) => ing.name.trim())
          .map((ing) => ({
            name: ing.name.trim(),
            quantity: ing.quantity || undefined,
            unit: ing.unit || undefined,
            category: ing.category || undefined,
          })),
      };
      if (isEditing) {
        await api.put(`/recipes/${id}`, payload);
      } else {
        await api.post("/recipes", payload);
      }
      navigate("/recipes");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save recipe");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <p className="text-gray-400">Loading...</p>;

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-semibold text-gray-800 tracking-tight mb-5">
        {isEditing ? "Edit recipe" : "New recipe"}
      </h1>

      <form onSubmit={handleSubmit} className="space-y-5 bg-white border border-gray-200/70 rounded-2xl shadow-soft p-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Name</label>
          <input required value={name} onChange={(e) => setName(e.target.value)} className={inputClass} />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags (comma-separated)</label>
          <input
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="dinner, pasta, quick"
            className={inputClass}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Ingredients</label>
          <div className="space-y-2">
            {ingredients.map((ing, i) => (
              <div key={i} className="flex items-center gap-2 bg-gray-50 rounded-xl p-2">
                <input
                  value={ing.name}
                  onChange={(e) => updateIngredient(i, "name", e.target.value)}
                  placeholder="Name"
                  className="flex-[2] min-w-0 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  value={ing.quantity || ""}
                  onChange={(e) => updateIngredient(i, "quantity", e.target.value)}
                  placeholder="Qty"
                  className="w-16 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  value={ing.unit || ""}
                  onChange={(e) => updateIngredient(i, "unit", e.target.value)}
                  placeholder="Unit"
                  className="w-16 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <input
                  value={ing.category || ""}
                  onChange={(e) => updateIngredient(i, "category", e.target.value)}
                  placeholder="Category"
                  className="flex-1 min-w-0 border border-gray-200 bg-white rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
                <button
                  type="button"
                  onClick={() => removeIngredientRow(i)}
                  className="shrink-0 h-7 w-7 flex items-center justify-center rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={addIngredientRow}
            className="mt-2.5 text-sm text-brand-600 hover:text-brand-800 font-medium"
          >
            + Add ingredient
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Instructions</label>
          <textarea
            value={instructions}
            onChange={(e) => setInstructions(e.target.value)}
            rows={5}
            className={inputClass}
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-1">
          <button
            type="submit"
            disabled={submitting}
            className="bg-brand-600 text-white px-4 py-2 rounded-xl font-medium shadow-soft hover:bg-brand-700 hover:shadow-soft-md transition-all disabled:opacity-50"
          >
            {submitting ? "Saving..." : "Save recipe"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/recipes")}
            className="px-4 py-2 rounded-xl font-medium text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
