import { useEffect, useMemo, useState, useCallback } from "react";
import { api, ApiError } from "../api/client";
import { MealPlanEntry, MealType, Recipe, MEAL_TYPES } from "../types";
import { startOfWeek, addDays, toISODate, formatDayLabel } from "../utils/date";
import MealSlotEditor from "../components/MealSlotEditor";

const MEAL_LABELS: Record<MealType, string> = {
  breakfast: "Breakfast",
  lunch: "Lunch",
  dinner: "Dinner",
};

export default function CalendarPage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [entries, setEntries] = useState<MealPlanEntry[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<{ date: string; mealType: MealType } | null>(null);
  const [addingToList, setAddingToList] = useState<string | null>(null);

  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const start = toISODate(days[0]);
  const end = toISODate(days[6]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [entriesRes, recipesRes] = await Promise.all([
        api.get<MealPlanEntry[]>(`/mealplan?start=${start}&end=${end}`),
        api.get<Recipe[]>("/recipes"),
      ]);
      setEntries(entriesRes);
      setRecipes(recipesRes);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load meal plan");
    } finally {
      setLoading(false);
    }
  }, [start, end]);

  useEffect(() => {
    load();
  }, [load]);

  function entryFor(date: string, mealType: MealType) {
    return entries.find((e) => e.date === date && e.mealType === mealType);
  }

  async function saveSlot(date: string, mealType: MealType, data: { recipeId: string | null; customTitle: string | null }) {
    const updated = await api.put<MealPlanEntry>("/mealplan", { date, mealType, ...data });
    setEntries((prev) => {
      const without = prev.filter((e) => !(e.date === date && e.mealType === mealType));
      return [...without, updated];
    });
  }

  async function clearSlot(date: string, mealType: MealType) {
    const existing = entryFor(date, mealType);
    if (!existing) return;
    await api.delete(`/mealplan/${existing.id}`);
    setEntries((prev) => prev.filter((e) => e.id !== existing.id));
  }

  async function addIngredientsToShoppingList(recipeId: string) {
    setAddingToList(recipeId);
    try {
      await api.post(`/recipes/${recipeId}/add-to-shopping-list`);
    } finally {
      setAddingToList(null);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-semibold text-gray-800 tracking-tight">Weekly Plan</h1>
        <div className="flex items-center gap-1 text-sm bg-white border border-gray-200 rounded-full p-1 shadow-soft">
          <button
            onClick={() => setWeekStart((w) => addDays(w, -7))}
            className="px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekStart(startOfWeek(new Date()))}
            className="px-3 py-1.5 rounded-full font-medium bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            Today
          </button>
          <button
            onClick={() => setWeekStart((w) => addDays(w, 7))}
            className="px-3 py-1.5 rounded-full text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Next →
          </button>
        </div>
      </div>

      {error && <p className="text-red-600 text-sm mb-3">{error}</p>}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl border border-gray-200/70 h-64 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-3">
          {days.map((day) => {
            const dateStr = toISODate(day);
            const isToday = dateStr === toISODate(new Date());
            return (
              <div
                key={dateStr}
                className={`bg-white rounded-2xl border overflow-hidden transition-shadow ${
                  isToday ? "border-brand-300 shadow-soft-md" : "border-gray-200/70 shadow-soft"
                }`}
              >
                <div
                  className={`px-3 py-2.5 text-sm font-semibold ${
                    isToday
                      ? "bg-gradient-to-r from-brand-600 to-brand-700 text-white"
                      : "bg-gray-50/80 text-gray-700"
                  }`}
                >
                  {formatDayLabel(day)}
                </div>
                <div className="divide-y divide-gray-100">
                  {MEAL_TYPES.map((mealType) => {
                    const entry = entryFor(dateStr, mealType);
                    const title = entry?.recipe?.name || entry?.customTitle;
                    return (
                      <div key={mealType} className="relative p-2.5 min-h-[74px]">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400 mb-1.5">
                          {MEAL_LABELS[mealType]}
                        </p>
                        {title ? (
                          <div>
                            <button
                              onClick={() => setEditing({ date: dateStr, mealType })}
                              className="text-sm text-left font-medium text-gray-800 hover:text-brand-700 transition-colors"
                            >
                              {title}
                            </button>
                            {entry?.recipeId && (
                              <button
                                onClick={() => addIngredientsToShoppingList(entry.recipeId as string)}
                                disabled={addingToList === entry.recipeId}
                                className="block mt-1 text-[11px] text-brand-600 hover:text-brand-800 disabled:opacity-50"
                              >
                                {addingToList === entry.recipeId ? "Adding..." : "+ Add ingredients to list"}
                              </button>
                            )}
                          </div>
                        ) : (
                          <button
                            onClick={() => setEditing({ date: dateStr, mealType })}
                            className="text-sm text-gray-300 hover:text-brand-600 border border-dashed border-gray-200 hover:border-brand-300 rounded-lg px-2 py-1 w-full text-left transition-colors"
                          >
                            + Add meal
                          </button>
                        )}

                        {editing && editing.date === dateStr && editing.mealType === mealType && (
                          <MealSlotEditor
                            recipes={recipes}
                            initialRecipeId={entry?.recipeId}
                            initialCustomTitle={entry?.customTitle}
                            onSave={(data) => saveSlot(dateStr, mealType, data)}
                            onClear={() => clearSlot(dateStr, mealType)}
                            onClose={() => setEditing(null)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
