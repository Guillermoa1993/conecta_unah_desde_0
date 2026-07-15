import { useState, useEffect, useCallback } from "react";

export type PermissionState = "granted" | "denied" | "prompt" | "unavailable";

export interface AppPermissions {
  notifications: PermissionState;
  camera: PermissionState;
}

async function queryPermission(name: PermissionName): Promise<PermissionState> {
  try {
    const result = await navigator.permissions.query({ name });
    return result.state as PermissionState;
  } catch {
    return "unavailable";
  }
}

export function usePermissions() {
  const [permissions, setPermissions] = useState<AppPermissions>({
    notifications: "prompt",
    camera: "prompt",
  });

  const refresh = useCallback(async () => {
    const [notifications, camera] = await Promise.all([
      queryPermission("notifications"),
      queryPermission("camera" as PermissionName),
    ]);
    setPermissions({ notifications, camera });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const requestNotifications = useCallback(async (): Promise<PermissionState> => {
    if (!("Notification" in window)) return "unavailable";
    const result = await Notification.requestPermission();
    const state = result === "granted" ? "granted" : result === "denied" ? "denied" : "prompt";
    setPermissions((p) => ({ ...p, notifications: state }));
    return state;
  }, []);

  const requestCamera = useCallback(async (): Promise<PermissionState> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach((t) => t.stop());
      setPermissions((p) => ({ ...p, camera: "granted" }));
      return "granted";
    } catch {
      const state = await queryPermission("camera" as PermissionName);
      setPermissions((p) => ({ ...p, camera: state }));
      return state;
    }
  }, []);

  const requestAll = useCallback(async () => {
    await Promise.allSettled([
      requestNotifications(),
      requestCamera(),
    ]);
  }, [requestNotifications, requestCamera]);

  return { permissions, refresh, requestNotifications, requestCamera, requestAll };
}
