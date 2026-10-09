import type { DirigeraClient } from "dirigera";
import { getUserScenes } from "../graphql/definitions/scene.ts";
import {
  getDevicesNotInSet,
  getDeviceSets,
} from "../graphql/definitions/device.ts";

export async function getValidIds(client: DirigeraClient) {
  const home = await client.home();

  const roomIds = new Set(home.rooms.map((room) => room.id));
  const sceneIds = new Set(getUserScenes(home.scenes).map((scene) => scene.id));

  const devicesInRooms = home.devices.filter((device) => device.room?.id);
  const deviceIds = new Set(
    [
      ...getDevicesNotInSet(devicesInRooms),
      ...getDeviceSets(devicesInRooms),
    ].map((device) => device.id)
  );

  return { roomIds, sceneIds, deviceIds };
}
