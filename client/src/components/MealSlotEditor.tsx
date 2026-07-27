import { useState } from "react";
import { Recipe } from "../types";

interface Props {
  recipes: Recipe[];
  initialRecipeId?: string | null;
  initialCustomTitle?: string | null;
  onSave: (data: { recipeId: string | null; customTitle: string | null }) => void;
  onClear: () => void;
  onClose: () => void;
}

export default function MealSlotEditor({
  recipes,
  initialRecipeId,
  initialCustomTitle,
  onSave,
  onClear,
  onClose,
}: Props) {
  const [recipeId, setRecipeId] = useState(initialRecipeId ?? "");
  const [customTitle, setCustomTitle] = useState(initialCustomTitle ?? "");

  function handleSave() {
    if (recipeId) {
      onSave({ recipeId, customTitle: null });
    } else if (customTitle.trim()) {
      onSave({ recipeId: null, customTitle: customTitle.trim() });
    }
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-30 bg-gray-900/20 backdrop-blur-[2px] flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-soft-md border border-gray-100 p-5 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-semibold text-sm text-gray-800 mb-3.5">Plan this meal</h3>

        <label className="block text-xs font-medium text-gray-500 mb-1">Pick a recipe</label>
        <select
          value={recipeId}
          onChange={(e) => {
            setRecipeId(e.target.value);
            if (e.target.value) setCustomTitle("");
          }}
          className="w-full border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
        >
          <option value="">-- none --</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label className="block text-xs font-medium text-gray-500 mb-1">Or type something custom</label>
        <input
          value={customTitle}
          onChange={(e) => {
            setCustomTitle(e.target.value);
            if (e.target.value) setRecipeId("");
          }}
          placeholder="e.g. Leftovers, Eating out"
          className="w-full border border-gray-200 bg-gray-50 rounded-lg px-2.5 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:bg-white transition-shadow"
        />

        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => {
              onClear();
              onClose();
            }}
            className="text-xs text-red-500 hover:text-red-700 font-medium"
          >
            Clear slot
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-gray-500 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs bg-brand-600 text-white px-3.5 py-1.5 rounded-lg font-medium shadow-soft hover:bg-brand-700 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
