import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";
import SessionMessage from "./SessionMessage.jsx";

// Layout route for pages that need a logged-in user:
//   <Route element={<ProtectedRoute />}> ...private routes... </Route>
export default function ProtectedRoute() {
  const { status, error, retry } = useAuth();
  const location = useLocation();

  if (status === "loading" || status === "error") {
    return <SessionMessage status={status} error={error} onRetry={retry} />;
  }
  if (status === "unauthenticated") {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }
  return <Outlet />;
}
