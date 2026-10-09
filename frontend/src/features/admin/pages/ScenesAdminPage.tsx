import React, { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Table, Checkbox, Select, Button, Tag, message } from "antd";
import type { ColumnsType } from "antd/es/table";
import { adminFetch } from "@/lib/adminApi";
import { useScenes } from "@/features/scenes";
import { useRooms } from "@/features/rooms";
import { useFloors } from "@/hooks";
import type { Scene, Room } from "@/graphql.types";

interface SceneScopesResponse {
  house: string[];
  floors: Record<string, string[]>;
  rooms: Record<string, string[]>;
}

interface SceneDraft {
  house: boolean;
  floorIds: string[];
  roomIds: string[];
}

const SCENE_SCOPES_KEY = ["admin", "scene-scopes"];

export function ScenesAdminPage() {
  const queryClient = useQueryClient();
  const { scenes: rawScenes, loading } = useScenes();
  const scenes = rawScenes as Scene[];
  const { rooms: rawRooms } = useRooms();
  const rooms = rawRooms as Room[];
  const { floors } = useFloors();

  const { data, isLoading } = useQuery({
    queryKey: SCENE_SCOPES_KEY,
    queryFn: () => adminFetch<SceneScopesResponse>("/scene-scopes"),
  });

  const scopes: SceneScopesResponse = data ?? {
    house: [],
    floors: {},
    rooms: {},
  };

  const buildDraft = (sceneId: string): SceneDraft => ({
    house: scopes.house.includes(sceneId),
    floorIds: Object.entries(scopes.floors)
      .filter(([, ids]) => ids.includes(sceneId))
      .map(([floorId]) => floorId),
    roomIds: Object.entries(scopes.rooms)
      .filter(([, ids]) => ids.includes(sceneId))
      .map(([roomId]) => roomId),
  });

  const [drafts, setDrafts] = useState<Record<string, SceneDraft>>({});

  useEffect(() => {
    if (!data) return;
    const next: Record<string, SceneDraft> = {};
    scenes.forEach((scene) => {
      next[scene.id] = buildDraft(scene.id);
    });
    setDrafts(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, scenes]);

  const saveMutation = useMutation({
    mutationFn: ({
      sceneId,
      draft,
    }: {
      sceneId: string;
      draft: SceneDraft;
    }) =>
      adminFetch(`/scene-scopes/${sceneId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft),
      }),
    onSuccess: () => {
      message.success("Scene scopes updated");
      queryClient.invalidateQueries({ queryKey: SCENE_SCOPES_KEY });
    },
    onError: (err: Error) => message.error(err.message),
  });

  const isOrphaned = (sceneId: string) =>
    !scopes.house.includes(sceneId) &&
    !Object.values(scopes.floors).some((ids) => ids.includes(sceneId)) &&
    !Object.values(scopes.rooms).some((ids) => ids.includes(sceneId));

  const getDraft = (sceneId: string): SceneDraft =>
    drafts[sceneId] ?? buildDraft(sceneId);

  const columns: ColumnsType<Scene> = [
    {
      title: "Scene",
      dataIndex: "name",
      key: "name",
      render: (name, scene) => (
        <>
          {name}{" "}
          {isOrphaned(scene.id) && <Tag color="orange">Orphaned</Tag>}
        </>
      ),
    },
    {
      title: "House",
      key: "house",
      render: (_, scene) => (
        <Checkbox
          checked={getDraft(scene.id).house}
          onChange={(e) =>
            setDrafts((prev) => ({
              ...prev,
              [scene.id]: { ...getDraft(scene.id), house: e.target.checked },
            }))
          }
        />
      ),
    },
    {
      title: "Floors",
      key: "floors",
      render: (_, scene) => (
        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          value={getDraft(scene.id).floorIds}
          onChange={(floorIds) =>
            setDrafts((prev) => ({
              ...prev,
              [scene.id]: { ...getDraft(scene.id), floorIds },
            }))
          }
          options={floors.map((floor) => ({
            value: floor.id,
            label: floor.name,
          }))}
        />
      ),
    },
    {
      title: "Rooms",
      key: "rooms",
      render: (_, scene) => (
        <Select
          mode="multiple"
          style={{ minWidth: 200 }}
          value={getDraft(scene.id).roomIds}
          onChange={(roomIds) =>
            setDrafts((prev) => ({
              ...prev,
              [scene.id]: { ...getDraft(scene.id), roomIds },
            }))
          }
          options={rooms.map((room) => ({
            value: room.id,
            label: room.name,
          }))}
        />
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, scene) => (
        <Button
          size="small"
          type="primary"
          onClick={() =>
            saveMutation.mutate({
              sceneId: scene.id,
              draft: getDraft(scene.id),
            })
          }
        >
          Save
        </Button>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <h2>Scenes</h2>
      <Table
        rowKey="id"
        columns={columns}
        dataSource={scenes}
        loading={loading || isLoading}
        pagination={false}
      />
    </div>
  );
}
