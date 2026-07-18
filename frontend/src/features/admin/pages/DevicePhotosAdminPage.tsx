import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Upload, Button, Popconfirm, message, Image } from "antd";
import type { ColumnsType } from "antd/es/table";
import { adminFetch } from "@/lib/adminApi";
import { useRooms } from "@/features/rooms";
import type { Room, Device } from "@/graphql.types";

interface DeviceImageEntry {
  url: string;
  contentType: string;
  uploadedAt: string;
}

type DeviceImagesResponse = Record<string, DeviceImageEntry>;

const DEVICE_IMAGES_KEY = ["admin", "device-images"];
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface UploadCustomRequestOptions {
  file: string | Blob | File;
  onSuccess?: ((body: unknown) => void) | undefined;
  onError?: ((err: Error) => void) | undefined;
}

export function DevicePhotosAdminPage() {
  const queryClient = useQueryClient();
  const { rooms: rawRooms, loading } = useRooms();
  const rooms = rawRooms as Room[];
  type DeviceRow = Device & { roomName: string };

  const { data, isLoading } = useQuery({
    queryKey: DEVICE_IMAGES_KEY,
    queryFn: () => adminFetch<DeviceImagesResponse>("/device-images"),
  });
  const images = data ?? {};

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: DEVICE_IMAGES_KEY });

  const uploadMutation = useMutation({
    mutationFn: ({ deviceId, file }: { deviceId: string; file: File }) => {
      const formData = new FormData();
      formData.append("image", file);
      return adminFetch<DeviceImageEntry>(`/device-images/${deviceId}`, {
        method: "POST",
        body: formData,
      });
    },
    onSuccess: () => {
      message.success("Photo uploaded");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (deviceId: string) =>
      adminFetch(`/device-images/${deviceId}`, { method: "DELETE" }),
    onSuccess: () => {
      message.success("Photo removed");
      invalidate();
    },
    onError: (err: Error) => message.error(err.message),
  });

  const deviceRows: DeviceRow[] = rooms.flatMap((room) =>
    room.devices.map((device) => ({ ...device, roomName: room.name }))
  );

  const columns: ColumnsType<DeviceRow> = [
    { title: "Room", dataIndex: "roomName", key: "roomName" },
    { title: "Device", dataIndex: "name", key: "name" },
    {
      title: "Photo",
      key: "photo",
      render: (_, device) => {
        const image = images[device.id];
        return image ? (
          <Image src={image.url} width={64} />
        ) : (
          <span>No photo</span>
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, device) => (
        <>
          <Upload
            accept="image/jpeg,image/png,image/webp"
            showUploadList={false}
            customRequest={(options: UploadCustomRequestOptions) => {
              const { file } = options;
              if (!(file instanceof File)) {
                options.onError?.(new Error("Invalid file"));
                return;
              }
              if (file.size > MAX_UPLOAD_BYTES) {
                message.error("Image must be 5MB or smaller");
                options.onError?.(new Error("File too large"));
                return;
              }
              if (!ALLOWED_TYPES.includes(file.type)) {
                message.error(
                  "Only JPEG, PNG, and WebP images are supported"
                );
                options.onError?.(new Error("Unsupported file type"));
                return;
              }
              uploadMutation
                .mutateAsync({ deviceId: device.id, file })
                .then(() => options.onSuccess?.({}))
                .catch((err: Error) => options.onError?.(err));
            }}
          >
            <Button size="small" style={{ marginRight: 8 }}>
              Upload
            </Button>
          </Upload>
          {images[device.id] && (
            <Popconfirm
              title="Remove this photo?"
              onConfirm={() => deleteMutation.mutate(device.id)}
            >
              <Button size="small" danger>
                Remove
              </Button>
            </Popconfirm>
          )}
        </>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Device photos</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={deviceRows}
        loading={loading || isLoading}
        pagination={false}
      />
    </div>
  );
}
