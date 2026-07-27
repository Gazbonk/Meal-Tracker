# Meal Tracker

A simple meal-planning and shopping-list app for two people sharing a household.

- **Weekly calendar** — plan breakfast/lunch/dinner for each day, either from your recipe library or a free-text meal (e.g. "Leftovers").
- **Recipe library** — save recipes with ingredients; add all of a recipe's ingredients to the shopping list in one click.
- **Shared shopping list** — grouped by category, check items off, clear checked items.
- **Real accounts** — sign up with email/password. The first person creates a household and gets an invite code; the second person joins with that code, so you both see the same shared plan and list.

## Stack

- **Server**: Node.js, Express, TypeScript, Prisma + SQLite, JWT auth (bcrypt password hashing)
- **Client**: React, TypeScript, Vite, Tailwind CSS, React Router

## Getting started

Requires Node.js 18+.

```bash
# 1. Install dependencies for both server and client
npm install

# 2. Configure the server environment
cp server/.env.example server/.env
# Edit server/.env and set JWT_SECRET to a long random string, e.g.:
#   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Create the SQLite database and tables
npm run db:migrate

# 4. (Optional) Seed some demo data
npm run db:seed
# This creates a household with two demo logins:
#   demo@example.com / password123
#   partner@example.com / password123

# 5. Start both the API and the web app
npm run dev
```

The web app runs at http://localhost:5173 and proxies API requests to the server at http://localhost:4000.

## How you and your partner share data

1. One of you signs up and chooses "Start a household" — you'll get a 6-character invite code (click your household's name in the top-right nav any time to see it again).
2. The other signs up choosing "Join with code" and enters that invite code.
3. You'll both now see the same meal plan, recipes, and shopping list, kept in sync whenever either of you makes changes (refresh to pick up the other person's edits).

## Project structure

```
server/            Express API (TypeScript)
  prisma/schema.prisma   Data models (User, Household, Recipe, MealPlanEntry, ShoppingListItem)
  prisma/seed.ts         Demo data seed script
  src/routes/            auth, recipes, mealplan, shoppinglist endpoints
client/             React app (TypeScript, Vite, Tailwind)
  src/pages/              Login, Signup, Calendar, Recipes, Recipe form, Shopping list
  src/context/AuthContext.tsx   Stores the JWT and current user/household
  src/api/client.ts             Thin fetch wrapper that attaches the auth token
```

## Notes for production use

This is set up for local/self-hosted use out of the box (SQLite file database, no external services). Before deploying it somewhere reachable over the internet:

- Set a strong, unique `JWT_SECRET`.
- Put the app behind HTTPS.
- Consider swapping SQLite for Postgres (Prisma supports this with a small `schema.prisma` change) if you expect concurrent write load or want managed backups.
