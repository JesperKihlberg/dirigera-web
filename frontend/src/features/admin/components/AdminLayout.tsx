import React from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Tabs } from "antd";
import "./AdminLayout.css";

const ADMIN_PAGES = [
  { key: "floors", label: "Floors" },
  { key: "rooms", label: "Rooms" },
  { key: "scenes", label: "Scenes" },
  { key: "devices", label: "Device photos" },
];

export function AdminLayout() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const activeKey = pathname.split("/")[2] ?? "floors";

  return (
    <>
      <Tabs
        className="admin-tabs"
        activeKey={activeKey}
        items={ADMIN_PAGES}
        onChange={(key) => navigate(`/admin/${key}`)}
        size="small"
        tabBarGutter={16}
        style={{ padding: "0 16px" }}
      />
      <Outlet />
    </>
  );
}
