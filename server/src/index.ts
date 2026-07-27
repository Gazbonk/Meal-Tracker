import "dotenv/config";
import path from "path";
import fs from "fs";
import express from "express";
import cors from "cors";
import authRoutes from "./routes/auth";
import recipeRoutes from "./routes/recipes";
import mealPlanRoutes from "./routes/mealplan";
import shoppingListRoutes from "./routes/shoppinglist";
import adminRoutes from "./routes/admin";
import superAdminRoutes from "./routes/superadmin";
import { bootstrapAdmin } from "./bootstrapAdmin";

const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://localhost:5173" }));
app.use(express.json());

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/recipes", recipeRoutes);
app.use("/api/mealplan", mealPlanRoutes);
app.use("/api/shoppinglist", shoppingListRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/superadmin", superAdminRoutes);

// In the Docker image the built client sits alongside the server at
// /app/client-dist. In local dev that directory doesn't exist — Vite
// serves the client itself and proxies /api to this server instead.
const clientDist = path.join(__dirname, "../../client-dist");
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get(/^\/(?!api).*/, (_req, res) => {
    res.sendFile(path.join(clientDist, "index.html"));
  });
}

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = Number(process.env.PORT) || 4000;

bootstrapAdmin()
  .catch((err) => console.error("Failed to bootstrap admin account:", err))
  .finally(() => {
    app.listen(PORT, () => {
      console.log(`Hornsby Meal Tracker API listening on http://localhost:${PORT}`);
    });
  });
