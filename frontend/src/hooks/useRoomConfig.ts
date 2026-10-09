import { useEffect, useState, useMemo, createElement } from "react";
import * as MdIcons from "react-icons/md";
import { adminFetch } from "@/lib/adminApi";

interface RoomSettings {
  name?: string;
  icon?: string;
}

interface RoomConfigData {
  rooms: Record<string, RoomSettings>;
}

interface RoomConfig {
  name?: string;
  icon?: string;
}

/**
 * Custom hook to load room configuration from the admin API
 * Provides room-specific settings like display name and icon
 */
export function useRoomConfig() {
  const [config, setConfig] = useState<Record<string, RoomConfig>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const data = await adminFetch<RoomConfigData>("/room-config");

        // Build config from rooms object
        const roomConfig: Record<string, RoomConfig> = {};
        if (data.rooms) {
          Object.entries(data.rooms).forEach(([roomId, settings]) => {
            if (settings.icon || settings.name) {
              roomConfig[roomId] = {
                ...(settings.name ? { name: settings.name } : {}),
                ...(settings.icon ? { icon: settings.icon } : {}),
              };
            }
          });
        }

        setConfig(roomConfig);
        setError(null);
      } catch (err) {
        console.warn("Could not load rooms config:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setConfig({});
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  /**
   * Get the icon component for a room by ID
   * Returns undefined if no icon is configured
   */
  const getRoomIcon = useMemo(() => {
    return (roomId: string): React.ReactNode | undefined => {
      const roomConfig = config[roomId];
      if (!roomConfig?.icon) return undefined;

      const iconName = roomConfig.icon;
      const IconComponent = (MdIcons as Record<string, React.ComponentType>)[
        iconName
      ];

      if (!IconComponent) {
        console.warn(`Icon "${iconName}" not found in react-icons/md`);
        return undefined;
      }

      return createElement(IconComponent);
    };
  }, [config]);

  /**
   * Get the room config for a specific room
   */
  const getRoomConfig = (roomId: string): RoomConfig | undefined => {
    return config[roomId];
  };

  return {
    getRoomIcon,
    getRoomConfig,
    isLoading,
    error,
    hasConfig: Object.keys(config).length > 0,
  };
}
