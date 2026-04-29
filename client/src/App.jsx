/**
 * App.jsx
 *
 * Root React component.
 * Defines application routes and wraps pages with the main layout.
 */

import { Navigate, Outlet, createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import DevicesPage from "./pages/DevicesPage";
import DeviceDetailsPage from "./pages/DeviceDetailsPage";
import AddDevicePage from "./pages/AddDevicePage";
import AlertsPage from "./pages/AlertsPage";
import AppShell from "./components/layout/AppShell";
import { isAuthenticated } from "./api/auth.api";
import "./App.css";
import AlertRuleDetailsPage from "./pages/AlertDetailsPage";

const RequireAuth = () => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const PublicOnlyRoute = ({ children }) => {
  if (isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const router = createBrowserRouter([
  {
    path: "/",
    element: <AppShell />,
    children: [
      {
        element: <RequireAuth />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: "devices", element: <DevicesPage /> },
          { path: "devices/add", element: <AddDevicePage /> },
          { path: "devices/:deviceId", element: <DeviceDetailsPage /> },
          { path: "alerts", element: <AlertsPage /> },
          { path: "alerts/:id", element: <AlertRuleDetailsPage /> },
        ],
      },
      {
        path: "login",
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: "register",
        element: (
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        ),
      },
    ],
  },
]);

export default function App() {
  return <RouterProvider router={router} />;
}