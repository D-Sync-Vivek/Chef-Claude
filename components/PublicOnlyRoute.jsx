import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../src/auth/useAuth.js";
import SessionMessage from "./SessionMessage.jsx";

// Layout route for /login and /register: logged-in users are sent away from them.
export default function PublicOnlyRoute() {
  const { status, error, retry } = useAuth();
  const location = useLocation();

  if (status === "loading" || status === "error") {
    return <SessionMessage status={status} error={error} onRetry={retry} />;
  }
  if (status === "authenticated") {
    return <Navigate to={location.state?.from?.pathname || "/"} replace />;
  }
  return <Outlet />;
}
