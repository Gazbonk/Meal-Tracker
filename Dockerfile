# syntax=docker/dockerfile:1

# ---- Stage 1: build the React client ----
FROM node:20-bookworm-slim AS client-build
WORKDIR /app
COPY client/package*.json client/
RUN cd client && npm ci
COPY client client
RUN cd client && npm run build

# ---- Stage 2: build the Express server ----
FROM node:20-bookworm-slim AS server-build
WORKDIR /app
COPY server/package*.json server/
RUN cd server && npm ci
COPY server server
RUN cd server && npx prisma generate
RUN cd server && npx tsc -p tsconfig.json

# ---- Stage 3: runtime image ----
FROM node:20-bookworm-slim AS runtime
WORKDIR /app
ENV NODE_ENV=production

COPY server/package*.json server/
RUN cd server && npm ci --omit=dev

# Overwrite the plain @prisma/client install above with the one already
# generated against our schema (correct query engine binary included).
COPY --from=server-build /app/server/node_modules/.prisma server/node_modules/.prisma
COPY --from=server-build /app/server/node_modules/@prisma server/node_modules/@prisma

COPY --from=server-build /app/server/dist server/dist
COPY server/prisma server/prisma
COPY server/docker-entrypoint.sh server/docker-entrypoint.sh
RUN chmod +x server/docker-entrypoint.sh

COPY --from=client-build /app/client/dist client-dist

WORKDIR /app/server
EXPOSE 4000
ENTRYPOINT ["./docker-entrypoint.sh"]
