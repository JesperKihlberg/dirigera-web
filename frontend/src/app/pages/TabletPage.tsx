import React from "react";
import { Card, Skeleton, Result } from "@/components/ui";
import { useRooms } from "@/features/rooms";
import {
  MobileRoomCard,
  visibleDevices,
} from "@/features/rooms/components/containers/MobileRoomCard";
import { useScenes, useActivateScene } from "@/features/scenes";
import type { Scene } from "@/features/scenes";
import { useFloors, useSceneScopes } from "@/hooks";
import type { Room } from "@/graphql.types";
import "./TabletPage.css";

// All floors on one screen, rooms packed per floor. Scenes and scene scopes
// are fetched once here, not per room card.
export function TabletPage() {
  const { rooms, loading, error } = useRooms();
  const { groupRoomsByFloor } = useFloors();
  const { scenes } = useScenes();
  const { activateScene, activeSceneId } = useActivateScene();
  const { getRoomScenes, filterScenes } = useSceneScopes();

  if (loading && !rooms.length) {
    return (
      <Card>
        <Skeleton active={true} />
      </Card>
    );
  }
  if (error) {
    return <Result status="error" title="Error" subTitle={error.message} />;
  }

  const roomScenes = (room: Room) =>
    filterScenes<Scene>(scenes, getRoomScenes(room.id));

  const groups = Array.from(groupRoomsByFloor<Room>(rooms).entries())
    .map(([key, { floor, rooms: floorRooms }]) => ({
      key,
      name: floor?.name ?? "Other",
      rooms: floorRooms.filter(
        (room) => visibleDevices(room).length > 0 || roomScenes(room).length > 0
      ),
    }))
    .filter((group) => group.rooms.length > 0);

  return (
    <div className="tablet-page">
      {groups.map((group) => (
        <section key={group.key} className="tablet-floor">
          <h2 className="tablet-floor-name">{group.name}</h2>
          <div className="tablet-floor-rooms">
            {group.rooms.map((room) => (
              <MobileRoomCard
                key={room.id}
                room={room}
                scenes={roomScenes(room)}
                onActivateScene={activateScene}
                activeSceneId={activeSceneId}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
