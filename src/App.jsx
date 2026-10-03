import { Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import Header from "../components/Header.jsx";
import LoginPage from "../components/LoginPage.jsx";
import Main from "../components/Main.jsx";
import PublicOnlyRoute from "../components/PublicOnlyRoute.jsx";
import RegisterPage from "../components/RegisterPage.jsx";

function App() {
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<Main />} />
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
