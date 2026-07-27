export interface User {
  id: string;
  email: string;
  name: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
}

export interface Household {
  id: string;
  name: string;
  inviteCode: string;
}

export interface ManagedUser {
  id: string;
  name: string;
  email: string;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  createdAt: string;
}

export interface ManagedHousehold {
  id: string;
  name: string;
  inviteCode: string;
  createdAt: string;
  userCount: number;
  recipeCount: number;
}

export interface Ingredient {
  id?: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  category?: string | null;
}

export interface Recipe {
  id: string;
  name: string;
  instructions?: string | null;
  tags?: string | null;
  sourceUrl?: string | null;
  ingredients: Ingredient[];
}

export interface RecipeImportDraft {
  name: string;
  tags?: string;
  instructions?: string;
  ingredients: Ingredient[];
  sourceUrl: string;
}

export const MEAL_TYPES = ["breakfast", "lunch", "dinner"] as const;
export type MealType = (typeof MEAL_TYPES)[number];

export interface MealPlanEntry {
  id: string;
  date: string;
  mealType: MealType;
  customTitle?: string | null;
  recipeId?: string | null;
  recipe?: Recipe | null;
}

export interface ShoppingListItem {
  id: string;
  name: string;
  quantity?: string | null;
  unit?: string | null;
  category?: string | null;
  checked: boolean;
}
