# Hornsby Meal Tracker

A simple meal-planning and shopping-list app for two people sharing a household.

- **Weekly calendar** — plan breakfast/lunch/dinner for each day, either from your recipe library or a free-text meal (e.g. "Leftovers").
- **Recipe library** — save recipes with ingredients; add all of a recipe's ingredients to the shopping list in one click.
- **Shared shopping list** — grouped by category, check items off, clear checked items.
- **Admin-managed accounts** — there's no public signup. An admin creates, edits, and removes accounts from the `/admin` page.
- **Multiple households** — a super-admin can spin up additional, fully separate households on the same instance (e.g. for other family/friends), each with its own admin, users, recipes, and shopping list, invisible to each other.
- **Import a recipe from a URL** — paste a link (e.g. a Substack post) and it pre-fills the recipe form for you to review before saving.

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

## Multiple households

Every household on this instance is fully separate — its own recipes, meal plan, shopping list, and accounts, invisible to every other household. By default there's just the one household created on first run, but a **super-admin** (a global role, distinct from the per-household admin above) can create more from a **Households** page in the nav.

- The very first account ever created (the startup bootstrap, from `ADMIN_*` in `.env`) is automatically the instance's super-admin. There's no other way to become one in this version — it's meant for a single instance owner.
- From **Households**, the super-admin creates a new household by providing a name and its first admin's name/email/password. That person can then manage their own household's accounts from `/admin` exactly as described above, with zero visibility into anyone else's data.
- The super-admin can also delete a household (with confirmation) — this permanently removes its accounts, recipes, meal plans, and shopping list. You can't delete your own household this way.

## Importing recipes from a URL

On the Recipes page, "+ Import from URL" fetches a page and tries to pre-fill the new-recipe form from it, in two stages:

1. **Structured data first (free, instant)** — many recipe-blog sites embed a `schema.org Recipe` block for SEO. If present, it's parsed directly.
2. **AI-assisted fallback** — general newsletter/blog platforms like Substack don't have that structured markup; the recipe is just prose mixed into a post. If step 1 finds nothing, the page's article text is sent to Claude (Haiku, for cost) to extract the recipe. This needs `ANTHROPIC_API_KEY` set in your `.env` — it's optional, costs a small amount per import, and without it you'll just get a clear message asking you to enter that recipe manually instead.

Either way, nothing is saved automatically — the result pre-fills the normal recipe form for you to review, correct, and save (or discard).

## Running in Docker (e.g. on a Raspberry Pi)

A single Docker image bundles the built client and the API together, backed by a SQLite file on a bind-mounted volume so your data survives container rebuilds. See `docker-compose.yml`, `Dockerfile`, and `server/docker-entrypoint.sh`.

```bash
# On the Pi (64-bit Raspberry Pi OS, with Docker + the compose plugin installed):
git clone https://github.com/gazbonk/meal-tracker.git
cd meal-tracker

cp .env.example .env
nano .env   # set JWT_SECRET and ADMIN_EMAIL/ADMIN_PASSWORD/ADMIN_NAME at minimum

docker compose build
docker compose up -d

docker compose logs -f   # watch it come up; Ctrl+C to stop watching (container keeps running)
```

Then visit `http://<pi-ip-address>:4000` from any device on your home network. On startup the container automatically runs pending database migrations and — the very first time, when the database is empty — creates one admin account from the `ADMIN_*` values in `.env`. Log in with that, then use `/admin` to add your partner's account.

The SQLite database file lives at `./data/prod.db` on the Pi's own filesystem (outside the container), so `docker compose down` / rebuilding the image never loses data. Back up that one file to back up the whole app.

To update after pulling new code: `docker compose up -d --build`.

## Making it reachable at a real domain (Cloudflare Tunnel)

By default the app is only reachable on your home network, at `http://<pi-ip>:4000`. If you want a real domain (e.g. `meals.yourdomain.com`) that works from anywhere, with HTTPS, **without opening any ports on your router**, use Cloudflare Tunnel — a small program (`cloudflared`) that runs on the Pi and makes an outbound-only connection to Cloudflare. Nothing needs to be forwarded inbound, which is both simpler and safer than traditional port-forwarding.

This costs nothing except the domain registration itself (Cloudflare's tunnel and DNS are free).

### 1. Buy a domain

Register one from any domain registrar (Cloudflare Registrar, Namecheap, Porkbun, etc. all work — it doesn't matter which, since you'll point it at Cloudflare next). A cheap `.com`, `.net`, or similar is fine.

### 2. Add your domain to Cloudflare

1. Sign up for a free account at [cloudflare.com](https://cloudflare.com) if you don't have one.
2. In the dashboard, click **Add a site**, enter your domain, and choose the **Free** plan.
3. Cloudflare gives you two nameservers (they look like `xxx.ns.cloudflare.com`). Go to whichever site you bought the domain from, find its DNS/nameserver settings, and replace the existing nameservers with the two Cloudflare gave you.
4. This can take anywhere from a few minutes to a few hours to take effect. Cloudflare emails you once your domain is active on their side.

### 3. Create a tunnel

1. In the Cloudflare dashboard, go to **Zero Trust** (in the left sidebar) → **Networks** → **Tunnels**.
2. Click **Create a tunnel**, choose **Cloudflared** as the connector type, and give it a name (e.g. `hornsby-meal-tracker`).
3. On the next screen it shows an install command containing a long token string — you only need the **token** part (everything after `--token`). Copy just that token.
4. Still in the same setup wizard, add a **Public Hostname**:
   - **Subdomain**: whatever you want, e.g. `meals`
   - **Domain**: pick your domain from the dropdown
   - **Service Type**: `HTTP`
   - **URL**: `app:4000` (this is the app container's name and port, from `docker-compose.yml` — the tunnel reaches it directly over the Docker network, not over the internet)
5. Save.

### 4. Configure the Pi

```bash
nano .env
```
Paste the token from step 3.3 as the value of `CLOUDFLARE_TUNNEL_TOKEN`, keeping the quotes:
```
CLOUDFLARE_TUNNEL_TOKEN="paste-your-long-token-here"
```
Save and exit (Ctrl+O, Enter, Ctrl+X).

### 5. Start it

```bash
git pull
docker compose --profile tunnel up -d --build
```
The `--profile tunnel` flag is what tells Compose to also start the `cloudflared` container alongside the app (it's off by default so people who don't want a public tunnel don't run it unnecessarily). From now on, always include `--profile tunnel` when you bring the stack up or down, e.g. `docker compose --profile tunnel logs -f`.

### 6. Test it

Visit `https://meals.yourdomain.com` (using whatever subdomain and domain you picked) from any device, on or off your home network. Cloudflare issues and manages the HTTPS certificate automatically — there's nothing extra to configure for that.

### Optional: an extra login layer

Because this makes the app reachable by anyone who guesses or finds the URL, consider adding a **Cloudflare Access** policy (also free for personal use, under Zero Trust → Access → Applications) restricting the hostname to specific email addresses, which requires a one-time email code before Cloudflare will even forward the request to your Pi. This sits in front of the app's own login, as a second layer.

## Project structure

```
server/            Express API (TypeScript)
  prisma/schema.prisma   Data models (User w/ isAdmin + isSuperAdmin, Household, Recipe w/ sourceUrl, MealPlanEntry, ShoppingListItem)
  prisma/seed.ts         Demo data seed script
  src/bootstrapAdmin.ts  Creates the first admin/super-admin account on startup if none exist
  src/routes/            auth, recipes (incl. /import), mealplan, shoppinglist, admin, superadmin endpoints
  src/services/recipeImport/  Fetches a URL, tries schema.org Recipe JSON-LD, falls back to an LLM extraction
  docker-entrypoint.sh   Runs `prisma migrate deploy` then starts the server (Docker only)
client/             React app (TypeScript, Vite, Tailwind)
  src/pages/              Login, Calendar, Recipes, Recipe form, Shopping list, Admin, SuperAdmin (Households)
  src/context/AuthContext.tsx   Stores the JWT and current user/household
  src/api/client.ts             Thin fetch wrapper that attaches the auth token
Dockerfile           Multi-stage build: client + server into one runtime image
docker-compose.yml   Single-service compose file for self-hosting (e.g. on a Pi)
.env.example         Template for the root .env used by docker-compose
```

## Notes for production use

This is set up for local/self-hosted use out of the box (SQLite file database, no external services). Before deploying it somewhere reachable over the internet:

- Set a strong, unique `JWT_SECRET` and a real `ADMIN_PASSWORD`.
- Put the app behind HTTPS — the Cloudflare Tunnel setup above handles this automatically if you use it.
- Consider swapping SQLite for Postgres (Prisma supports this with a small `schema.prisma` change) if you expect concurrent write load or want managed backups.
