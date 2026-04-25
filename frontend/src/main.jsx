import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { router } from "./app/router";
import { AuthProvider } from "./store/authStore";
import "./styles/index.css";

// StrictMode dimatikan: double-invoke useEffect di dev memicu duplicate calls
// untuk side-effect seperti trigger AI review (lihat backend upsert handling).
ReactDOM.createRoot(document.getElementById("root")).render(
  <AuthProvider>
    <RouterProvider router={router} />
  </AuthProvider>
);
