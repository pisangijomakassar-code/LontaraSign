import { AuthProvider } from "../store/authStore";

export function Providers({ children }) {
  return <AuthProvider>{children}</AuthProvider>;
}
