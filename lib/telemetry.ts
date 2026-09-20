import type { DeviceInfo } from "./types";

export function getDeviceInfo(): DeviceInfo {
  if (typeof navigator === "undefined") {
    return {
      userAgent: "",
      hardwareConcurrency: null,
      deviceMemory: null,
      isOnline: true,
    };
  }

  return {
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency ?? null,
    deviceMemory: navigator.deviceMemory ?? null,
    isOnline: navigator.onLine,
  };
}
