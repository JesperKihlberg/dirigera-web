import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Table,
  Modal,
  Form,
  Input,
  InputNumber,
  Select,
  Button,
  Popconfirm,
  message,
} from "antd";
import type { ColumnsType } from "antd/es/table";
import { adminFetch } from "@/lib/adminApi";
import { useRooms } from "@/features/rooms";
import type { Floor } from "@/hooks";

interface FloorsResponse {
  floors: Floor[];
}

interface FloorFormValues {
  name: string;
  shortName: string;
  order: number;
  floorPlan?: string | null | undefined;
}

// SVGs shipped in frontend/public/floorplan/
const FLOOR_PLANS = ["basement.svg", "ground.svg", "first.svg", "second.svg"];

const FLOORS_KEY = ["admin", "floors"];

export function FloorsAdminPage() {
  const queryClient = useQueryClient();
  const { rooms } = useRooms();
  type RoomRow = (typeof rooms)[number];

  const { data, isLoading } = useQuery({
    queryKey: FLOORS_KEY,
    queryFn: () => adminFetch<FloorsResponse>("/floors"),
  });
  const floors = data?.floors ?? [];

  const [modalOpen, setModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState<Floor | null>(null);
  const [form] = Form.useForm<FloorFormValues>();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: FLOORS_KEY });

  const createMutation = useMutation({
    mutationFn: (values: FloorFormValues) =>
      adminFetch("/floors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      message.success("Floor created");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, values }: { id: string; values: FloorFormValues }) =>
      adminFetch(`/floors/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      }),
    onSuccess: () => {
      message.success("Floor updated");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) =>
      adminFetch(`/floors/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Floor deleted");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const assignRoomMutation = useMutation({
    mutationFn: ({
      roomId,
      floorId,
    }: {
      roomId: string;
      floorId: string | null;
    }) =>
      adminFetch(`/rooms/${roomId}/floor`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ floorId }),
      }),
    onSuccess: () => {
      message.success("Room assigned");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const openCreateModal = () => {
    setEditingFloor(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEditModal = (floor: Floor) => {
    setEditingFloor(floor);
    form.setFieldsValue({
      name: floor.name,
      shortName: floor.shortName,
      order: floor.order,
      floorPlan: floor.floorPlan ?? undefined,
    });
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    const formValues = await form.validateFields();
    // A cleared Select is undefined, which JSON drops; send null to clear it.
    const values = { ...formValues, floorPlan: formValues.floorPlan ?? null };
    if (editingFloor) {
      await updateMutation.mutateAsync({ id: editingFloor.id, values });
    } else {
      await createMutation.mutateAsync(values);
    }
    setModalOpen(false);
  };

  const getFloorForRoom = (roomId: string) =>
    floors.find((floor) => floor.rooms.includes(roomId));

  const columns: ColumnsType<Floor> = [
    { title: "Name", dataIndex: "name", key: "name" },
    { title: "Short name", dataIndex: "shortName", key: "shortName" },
    { title: "Order", dataIndex: "order", key: "order" },
    { title: "Floor plan", dataIndex: "floorPlan", key: "floorPlan" },
    {
      title: "Actions",
      key: "actions",
      render: (_, floor) => (
        <>
          <Button
            size="small"
            onClick={() => openEditModal(floor)}
            style={{ marginRight: 8 }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Delete this floor?"
            onConfirm={() => deleteMutation.mutate(floor.id)}
          >
            <Button size="small" danger>
              Delete
            </Button>
          </Popconfirm>
        </>
      ),
    },
  ];

  const roomColumns: ColumnsType<RoomRow> = [
    { title: "Room", dataIndex: "name", key: "name" },
    {
      title: "Floor",
      key: "floor",
      render: (_, room) => (
        <Select
          allowClear
          style={{ minWidth: 200 }}
          value={getFloorForRoom(room.id)?.id}
          placeholder="Unassigned"
          onChange={(floorId) =>
            assignRoomMutation.mutate({
              roomId: room.id,
              floorId: floorId ?? null,
            })
          }
          options={floors.map((floor) => ({
            value: floor.id,
            label: floor.name,
          }))}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Floors</h2>
      <Button
        type="primary"
        onClick={openCreateModal}
        style={{ marginBottom: 16 }}
      >
        Add floor
      </Button>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={floors}
        loading={isLoading}
        pagination={false}
        style={{ marginBottom: 32 }}
      />

      <h2>Room assignment</h2>
      <Table
        rowKey="id"
        columns={roomColumns}
        dataSource={rooms}
        pagination={false}
      />

      <Modal
        open={modalOpen}
        title={editingFloor ? "Edit floor" : "Add floor"}
        onCancel={() => setModalOpen(false)}
        onOk={handleSubmit}
        confirmLoading={createMutation.isPending || updateMutation.isPending}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="name"
            label="Name"
            rules={[{ required: true, message: "Name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="shortName"
            label="Short name"
            rules={[{ required: true, message: "Short name is required" }]}
          >
            <Input />
          </Form.Item>
          <Form.Item
            name="order"
            label="Order"
            rules={[{ required: true, message: "Order is required" }]}
          >
            <InputNumber style={{ width: "100%" }} />
          </Form.Item>
          <Form.Item name="floorPlan" label="Floor plan">
            <Select
              allowClear
              placeholder="None"
              options={FLOOR_PLANS.map((file) => ({
                value: file,
                label: file,
              }))}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}
