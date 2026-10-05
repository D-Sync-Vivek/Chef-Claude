import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Header from "../components/Header.jsx";
import LoginPage from "../components/LoginPage.jsx";
import MealPlanPage from "../components/MealPlanPage.jsx";
import MealPlansPage from "../components/MealPlansPage.jsx";
import Main from "../components/Main.jsx";
import ProtectedRoute from "../components/ProtectedRoute.jsx";
import PublicOnlyRoute from "../components/PublicOnlyRoute.jsx";
import RecipeDetailPage from "../components/RecipeDetailPage.jsx";
import RecipesPage from "../components/RecipesPage.jsx";
import RegisterPage from "../components/RegisterPage.jsx";
import ShoppingListPage from "../components/ShoppingListPage.jsx";
import ShoppingListsPage from "../components/ShoppingListsPage.jsx";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Main />} />
          {/* key forces a fresh page (filters, list) when switching between the two views */}
          <Route path="/recipes" element={<RecipesPage key="all" />} />
          <Route path="/favorites" element={<RecipesPage key="favorites" favoritesOnly />} />
          <Route path="/recipes/:id" element={<RecipeDetailPage />} />
          <Route path="/meal-plans" element={<MealPlansPage />} />
          <Route path="/meal-plans/:id" element={<MealPlanPage />} />
          <Route path="/shopping-lists" element={<ShoppingListsPage />} />
          <Route path="/shopping-lists/:id" element={<ShoppingListPage />} />
        </Route>
        <Route element={<PublicOnlyRoute />}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
