import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Input, Button, Popconfirm, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { adminFetch } from "@/lib/adminApi";
import { useRooms } from "@/features/rooms";
import { IconPicker } from "../components/IconPicker";

interface RoomConfigEntry {
  name?: string | undefined;
  icon?: string | undefined;
}

interface RoomConfigResponse {
  rooms: Record<string, RoomConfigEntry>;
}

const ROOM_CONFIG_KEY = ["admin", "room-config"];

export function RoomsAdminPage() {
  const queryClient = useQueryClient();
  const { rooms, loading } = useRooms();
  type RoomRow = (typeof rooms)[number];

  const { data, isLoading } = useQuery({
    queryKey: ROOM_CONFIG_KEY,
    queryFn: () => adminFetch<RoomConfigResponse>("/room-config"),
  });

  const [draft, setDraft] = useState<Record<string, RoomConfigEntry>>({});

  useEffect(() => {
    setDraft(data?.rooms ?? {});
  }, [data]);

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ROOM_CONFIG_KEY });

  const saveMutation = useMutation({
    mutationFn: ({
      roomId,
      values,
    }: {
      roomId: string;
      values: RoomConfigEntry;
    }) =>
      adminFetch(`/room-config/${roomId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      message.success("Room updated");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const resetMutation = useMutation({
    mutationFn: (roomId: string) =>
      adminFetch(`/room-config/${roomId}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Room reset to defaults");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const columns: ColumnsType<RoomRow> = [
    { title: "Hub name", dataIndex: "name", key: "name" },
    {
      title: "Display name override",
      key: "displayName",
      render: (_, room) => (
        <Input
          value={draft[room.id]?.name ?? ""}
          placeholder={room.name}
          onChange={(e) =>
            setDraft((prev) => ({
              ...prev,
              [room.id]: { ...prev[room.id], name: e.target.value },
            }))
          }
        />
      ),
    },
    {
      title: "Icon",
      key: "icon",
      render: (_, room) => (
        <IconPicker
          value={draft[room.id]?.icon}
          onChange={(icon) =>
            setDraft((prev) => ({
              ...prev,
              [room.id]: { ...prev[room.id], icon },
            }))
          }
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, room) => (
        <>
          <Button
            size="small"
            type="primary"
            style={{ marginRight: 8 }}
            onClick={() =>
              saveMutation.mutate({
                roomId: room.id,
                values: draft[room.id] ?? {},
              })
            }
          >
            Save
          </Button>
          <Popconfirm
            title="Revert to hub defaults?"
            onConfirm={() => resetMutation.mutate(room.id)}
          >
            <Button size="small">Reset</Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Rooms</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={rooms}
        loading={loading || isLoading}
        pagination={false}
      />
    </div>
  );
}
