# Hornsby Meal Tracker

A simple meal-planning and shopping-list app for two people sharing a household.

- **Weekly calendar** — plan breakfast/lunch/dinner for each day, either from your recipe library or a free-text meal (e.g. "Leftovers").
- **Recipe library** — save recipes with ingredients; add all of a recipe's ingredients to the shopping list in one click.
- **Shared shopping list** — grouped by category, check items off, clear checked items.
- **Admin-managed accounts** — there's no public signup. An admin creates, edits, and removes accounts from the `/admin` page.

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
# Edit server/.env:
#   - set JWT_SECRET to a long random string, e.g.:
#       node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
#   - set ADMIN_EMAIL / ADMIN_PASSWORD / ADMIN_NAME to create your own first account

# 3. Create the SQLite database and tables
npm run db:migrate

# 4. (Optional) Seed some demo data instead of using the ADMIN_* bootstrap
npm run db:seed
# This creates a household with two demo logins:
#   demo@example.com / password123 (admin)
#   partner@example.com / password123

# 5. Start both the API and the web app
npm run dev
```

The web app runs at http://localhost:5173 and proxies API requests to the server at http://localhost:4000.

## Accounts

There's no public signup page — signing up is disabled entirely.

- **First run**: if the database has no users yet, the server creates one admin account on startup from the `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` values in `server/.env`. Log in with those.
- **Adding your partner (or anyone else)**: log in as an admin, open **Admin** in the nav, and use "Add an account" to create their login directly — no invite code needed, they're added straight to your shared household.
- From the same `/admin` page you can promote/demote admins, reset anyone's password, or delete an account. You can't remove your own admin access or delete the last remaining admin.

## Project structure

```
server/            Express API (TypeScript)
  prisma/schema.prisma   Data models (User w/ isAdmin, Household, Recipe, MealPlanEntry, ShoppingListItem)
  prisma/seed.ts         Demo data seed script
  src/bootstrapAdmin.ts  Creates the first admin account on startup if none exist
  src/routes/            auth, recipes, mealplan, shoppinglist, admin endpoints
client/             React app (TypeScript, Vite, Tailwind)
  src/pages/              Login, Calendar, Recipes, Recipe form, Shopping list, Admin
  src/context/AuthContext.tsx   Stores the JWT and current user/household
  src/api/client.ts             Thin fetch wrapper that attaches the auth token
```

## Notes for production use

This is set up for local/self-hosted use out of the box (SQLite file database, no external services). Before deploying it somewhere reachable over the internet:

- Set a strong, unique `JWT_SECRET` and a real `ADMIN_PASSWORD`.
- Put the app behind HTTPS.
- Consider swapping SQLite for Postgres (Prisma supports this with a small `schema.prisma` change) if you expect concurrent write load or want managed backups.
