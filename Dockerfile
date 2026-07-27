# syntax=docker/dockerfile:1

# This is an npm workspaces monorepo: there is exactly one lockfile, at the
# repo root, covering both client/ and server/. All stages below install
# from that single root lockfile instead of a per-package one (there isn't
# one) — npm hoists everything into the root node_modules.

# ---- Stage 0: shared dependency install ----
FROM node:20-bookworm-slim AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci

# ---- Stage 1: build the React client ----
FROM deps AS client-build
COPY client client
RUN npm run build -w client

# ---- Stage 2: build the Express server ----
FROM deps AS server-build
COPY server server
RUN cd server && npx prisma generate
RUN cd server && npx tsc -p tsconfig.json

# ---- Stage 3: runtime image ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY package.json package-lock.json ./
COPY client/package.json client/package.json
COPY server/package.json server/package.json
RUN npm ci --omit=dev

# Overwrite the plain @prisma/client install above with the one already
# generated against our schema (correct query engine binary included).
# npm hoists @prisma/client to the root node_modules, not server/node_modules.
COPY --from=server-build /app/node_modules/.prisma node_modules/.prisma
COPY --from=server-build /app/node_modules/@prisma node_modules/@prisma

COPY --from=server-build /app/server/dist server/dist
COPY server/prisma server/prisma
COPY server/docker-entrypoint.sh server/docker-entrypoint.sh
RUN chmod +x server/docker-entrypoint.sh

COPY --from=client-build /app/client/dist client-dist

WORKDIR /app/server
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
