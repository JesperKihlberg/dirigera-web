import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/adminApi";

interface DeviceImageEntry {
  url: string;
  contentType: string;
  uploadedAt: string;
}

type DeviceImageConfig = Record<string, DeviceImageEntry>;

export function useDeviceImages() {
  const [config, setConfig] = useState<DeviceImageConfig>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        setIsLoading(true);
        const data = await adminFetch<DeviceImageConfig>("/device-images");

        setConfig(data);
        setError(null);
      } catch (err) {
        console.warn("Could not load device images config:", err);
        setError(err instanceof Error ? err : new Error("Unknown error"));
        setConfig({}); // Use empty config as fallback
      } finally {
        setIsLoading(false);
      }
    };

    loadConfig();
  }, []);

  const getDeviceImage = (deviceId: string): string | undefined => {
    return config[deviceId]?.url;
  };

  return {
    getDeviceImage,
    isLoading,
    error,
    hasConfig: Object.keys(config).length > 0,
  };
}
