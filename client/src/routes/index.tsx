import { createBrowserRouter, Navigate } from "react-router-dom"
import { Layout } from "@/components/Layout"
import { Dashboard } from "@/pages/Dashboard"
import { Login } from "@/pages/Login"
import { Register } from "@/pages/Register"
import { MoodTracking } from "@/pages/MoodTracking"
import { Journal } from "@/pages/Journal"
import { Chat } from "@/pages/Chat"
import { Settings } from "@/pages/Settings"
import { CrisisDetection } from "@/pages/CrisisDetection"
import { ProtectedRoute } from "@/components/ProtectedRoute"

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "mood",
        element: <MoodTracking />,
      },
      {
        path: "journal",
        element: <Journal />,
      },
      {
        path: "chat",
        element: <Chat />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
      {
        path: "crisis-detection",
        element: <CrisisDetection />,
      },
    ],
  },
])