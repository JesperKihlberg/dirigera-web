import React from "react";
import { createHashRouter, RouterProvider, Navigate } from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { Providers } from "./Providers";
import "@/styles/global.css";

const router = createHashRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        lazy: async () => {
          const { RoomsPage } = await import("./pages/RoomsPage");
          return { Component: RoomsPage };
        },
      },
      {
        path: "room/:roomId",
        lazy: async () => {
          const { RoomPage } = await import("./pages/RoomPage");
          return { Component: RoomPage };
        },
      },
      {
        path: "admin",
        element: <Navigate to="/admin/floors" replace />,
      },
      {
        path: "admin/floors",
        lazy: async () => {
          const { FloorsAdminPage } = await import(
            "@/features/admin/pages/FloorsAdminPage"
          );
          return { Component: FloorsAdminPage };
        },
      },
      {
        path: "admin/rooms",
        lazy: async () => {
          const { RoomsAdminPage } = await import(
            "@/features/admin/pages/RoomsAdminPage"
          );
          return { Component: RoomsAdminPage };
        },
      },
      {
        path: "admin/scenes",
        lazy: async () => {
          const { ScenesAdminPage } = await import(
            "@/features/admin/pages/ScenesAdminPage"
          );
          return { Component: ScenesAdminPage };
        },
      },
      {
        path: "admin/devices",
        lazy: async () => {
          const { DevicePhotosAdminPage } = await import(
            "@/features/admin/pages/DevicePhotosAdminPage"
          );
          return { Component: DevicePhotosAdminPage };
        },
      },
    ],
  },
]);

export function App() {
  return (
    <Providers>
      <RouterProvider router={router} />
    </Providers>
  );
}

