import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { generateInviteCode } from "../src/utils/inviteCode";

const prisma = new PrismaClient();

async function main() {
  const email1 = "demo@example.com";
  const email2 = "partner@example.com";

  const existing = await prisma.user.findUnique({ where: { email: email1 } });
  if (existing) {
    console.log("Seed data already exists, skipping.");
    return;
  }

  const passwordHash = await bcrypt.hash("password123", 10);

  const household = await prisma.household.create({
    data: {
      name: "Demo Household",
      inviteCode: generateInviteCode(),
    },
  });

  await prisma.user.create({
    data: { email: email1, passwordHash, name: "Demo User", householdId: household.id },
  });
  await prisma.user.create({
    data: { email: email2, passwordHash, name: "Demo Partner", householdId: household.id },
  });

  const spaghetti = await prisma.recipe.create({
    data: {
      name: "Spaghetti Bolognese",
      instructions: "Brown the mince, add sauce, simmer 20 min, serve over cooked spaghetti.",
      tags: "dinner,pasta",
      householdId: household.id,
      ingredients: {
        create: [
          { name: "Spaghetti", quantity: "500", unit: "g", category: "Pantry" },
          { name: "Beef mince", quantity: "500", unit: "g", category: "Meat" },
          { name: "Passata", quantity: "700", unit: "g", category: "Pantry" },
          { name: "Onion", quantity: "1", unit: "", category: "Produce" },
          { name: "Garlic", quantity: "2", unit: "cloves", category: "Produce" },
        ],
      },
    },
  });

  await prisma.recipe.create({
    data: {
      name: "Veggie Omelette",
      instructions: "Whisk eggs, saute veggies, combine and cook until set.",
      tags: "breakfast",
      householdId: household.id,
      ingredients: {
        create: [
          { name: "Eggs", quantity: "4", unit: "", category: "Dairy" },
          { name: "Bell pepper", quantity: "1", unit: "", category: "Produce" },
          { name: "Spinach", quantity: "1", unit: "handful", category: "Produce" },
          { name: "Cheddar", quantity: "50", unit: "g", category: "Dairy" },
        ],
      },
    },
  });

  const today = new Date();
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  await prisma.mealPlanEntry.create({
    data: {
      date: iso(today),
      mealType: "dinner",
      recipeId: spaghetti.id,
      householdId: household.id,
    },
  });

  await prisma.shoppingListItem.createMany({
    data: [
      { name: "Milk", quantity: "1", unit: "L", category: "Dairy", householdId: household.id },
      { name: "Bread", quantity: "1", unit: "loaf", category: "Bakery", householdId: household.id },
    ],
  });

  console.log("Seed complete.");
  console.log(`Household invite code: ${household.inviteCode}`);
  console.log(`Login as ${email1} or ${email2} with password: password123`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
