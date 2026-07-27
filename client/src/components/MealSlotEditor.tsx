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
      className="fixed inset-0 z-30 bg-ink/20 backdrop-blur-[2px] flex items-start justify-center pt-24"
      onClick={onClose}
    >
      <div
        className="bg-surface rounded border border-line p-5 w-72"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display font-semibold text-sm text-ink mb-3.5">Plan this meal</h3>

        <label className="block text-xs font-medium text-muted mb-1">Pick a recipe</label>
        <select
          value={recipeId}
          onChange={(e) => {
            setRecipeId(e.target.value);
            if (e.target.value) setCustomTitle("");
          }}
          className="w-full border border-line bg-canvas rounded px-2.5 py-2 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-signal transition-shadow"
        >
          <option value="">-- none --</option>
          {recipes.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <label className="block text-xs font-medium text-muted mb-1">Or type something custom</label>
        <input
          value={customTitle}
          onChange={(e) => {
            setCustomTitle(e.target.value);
            if (e.target.value) setRecipeId("");
          }}
          placeholder="e.g. Leftovers, Eating out"
          className="w-full border border-line bg-canvas rounded px-2.5 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-signal transition-shadow"
        />

        <div className="flex justify-between items-center gap-2">
          <button
            onClick={() => {
              onClear();
              onClose();
            }}
            className="text-xs text-failed hover:underline font-medium"
          >
            Clear slot
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-xs text-muted px-2.5 py-1.5 rounded hover:bg-surface2 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="text-xs bg-sageDeep text-white px-3.5 py-1.5 rounded font-medium hover:bg-signal transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
