import React from "react";
import {
  createHashRouter,
  RouterProvider,
  Navigate,
  Outlet,
} from "react-router-dom";
import { RootLayout } from "./RootLayout";
import { AppLayout } from "./AppLayout";
import { AuthenticatedContent } from "./AuthenticatedContent";
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
        path: "mobile",
        lazy: async () => {
          const { MobilePage } = await import("./pages/MobilePage");
          return { Component: MobilePage };
        },
      },
      {
        path: "admin",
        lazy: async () => {
          const { AdminLayout } = await import(
            "@/features/admin/components/AdminLayout"
          );
          return { Component: AdminLayout };
        },
        children: [
          { index: true, element: <Navigate to="/admin/floors" replace /> },
          {
            path: "floors",
            lazy: async () => {
              const { FloorsAdminPage } = await import(
                "@/features/admin/pages/FloorsAdminPage"
              );
              return { Component: FloorsAdminPage };
            },
          },
          {
            path: "rooms",
            lazy: async () => {
              const { RoomsAdminPage } = await import(
                "@/features/admin/pages/RoomsAdminPage"
              );
              return { Component: RoomsAdminPage };
            },
          },
          {
            path: "scenes",
            lazy: async () => {
              const { ScenesAdminPage } = await import(
                "@/features/admin/pages/ScenesAdminPage"
              );
              return { Component: ScenesAdminPage };
            },
          },
          {
            path: "devices",
            lazy: async () => {
              const { DevicePhotosAdminPage } = await import(
                "@/features/admin/pages/DevicePhotosAdminPage"
              );
              return { Component: DevicePhotosAdminPage };
            },
          },
        ],
      },
    ],
  },
  {
    // The iPad page has no sticky header: it hangs on the wall and is
    // embedded in the home hub's iframe.
    path: "/tablet",
    element: (
      <AppLayout>
        <AuthenticatedContent>
          <Outlet />
        </AuthenticatedContent>
      </AppLayout>
    ),
    children: [
      {
        index: true,
        lazy: async () => {
          const { TabletPage } = await import("./pages/TabletPage");
          return { Component: TabletPage };
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
