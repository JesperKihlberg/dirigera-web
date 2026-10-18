import React from "react";
import { Card, Skeleton, Result } from "@/components/ui";
import { useRooms } from "@/features/rooms";
import {
  MobileRoomCard,
  visibleDevices,
} from "@/features/rooms/components/containers/MobileRoomCard";
import type { Room } from "@/graphql.types";
import "./MobilePage.css";

export function MobilePage() {
  const { rooms, loading, error } = useRooms();

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

  return (
    <div className="mobile-page">
      {rooms
        .filter((room: Room) => visibleDevices(room).length > 0)
        .map((room: Room) => (
          <MobileRoomCard key={room.id} room={room} />
        ))}
    </div>
  );
}
