import type { DeviceInfo } from "./types";

/**
 * Real mobile-OS detection via user agent — deliberately not a viewport-width
 * check. A narrowed or DevTools-resized desktop Chrome window still has the
 * Prompt API; only genuine mobile browsers don't, regardless of window width.
 */
export function isMobileDevice(userAgent: string): boolean {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(userAgent);
}

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
