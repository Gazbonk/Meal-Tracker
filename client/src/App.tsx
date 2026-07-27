import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Nav from "./components/Nav";
import LoginPage from "./pages/LoginPage";
import CalendarPage from "./pages/CalendarPage";
import RecipesPage from "./pages/RecipesPage";
import RecipeFormPage from "./pages/RecipeFormPage";
import ShoppingListPage from "./pages/ShoppingListPage";
import AdminPage from "./pages/AdminPage";
import SuperAdminPage from "./pages/SuperAdminPage";

function ProtectedLayout({
  children,
  adminOnly,
  superAdminOnly,
}: {
  children: React.ReactNode;
  adminOnly?: boolean;
  superAdminOnly?: boolean;
}) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen text-muted">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (adminOnly && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  if (superAdminOnly && !user.isSuperAdmin) {
    return <Navigate to="/" replace />;
  }
  return (
    <div className="min-h-screen">
      <Nav />
      <main className="max-w-5xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedLayout>
            <CalendarPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/recipes"
        element={
          <ProtectedLayout>
            <RecipesPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/recipes/new"
        element={
          <ProtectedLayout>
            <RecipeFormPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/recipes/:id/edit"
        element={
          <ProtectedLayout>
            <RecipeFormPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/shopping-list"
        element={
          <ProtectedLayout>
            <ShoppingListPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/admin"
        element={
          <ProtectedLayout adminOnly>
            <AdminPage />
          </ProtectedLayout>
        }
      />
      <Route
        path="/households"
        element={
          <ProtectedLayout superAdminOnly>
            <SuperAdminPage />
          </ProtectedLayout>
        }
      />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
