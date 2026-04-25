import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "../pages/LoginPage";
import DashboardPage from "../pages/DashboardPage";
import UploadPage from "../pages/UploadPage";
import ReviewPage from "../pages/ReviewPage";
import SignPage from "../pages/SignPage";
import ResultPage from "../pages/ResultPage";
import AdminPage from "../pages/AdminPage";
import ProfilePage from "../pages/ProfilePage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <DashboardPage /> },
  { path: "/upload", element: <UploadPage /> },
  { path: "/documents/:id/review", element: <ReviewPage /> },
  { path: "/documents/:id/sign", element: <SignPage /> },
  { path: "/documents/:id/result", element: <ResultPage /> },
  { path: "/admin", element: <AdminPage /> },
  { path: "/profile", element: <ProfilePage /> },
  { path: "*", element: <Navigate to="/" replace /> },
]);
