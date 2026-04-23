import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import UploadPage from "../pages/UploadPage";
import ReviewPage from "../pages/ReviewPage";
import SignPage from "../pages/SignPage";
import ResultPage from "../pages/ResultPage";
import AdminPage from "../pages/AdminPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <DashboardPage /> },
  { path: "/upload", element: <UploadPage /> },
  { path: "/documents/:id/review", element: <ReviewPage /> },
  { path: "/documents/:id/sign", element: <SignPage /> },
  { path: "/documents/:id/result", element: <ResultPage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
