"use client";

import { useStored, STORAGE_KEYS } from "@/lib/storage";
import type { Status, UserParkStatus } from "@/types";

export function useStatuses() {
  const [statuses, setStatuses] = useStored<UserParkStatus[]>(STORAGE_KEYS.STATUSES, []);

  function getStatus(parkCode: string): Status {
    return statuses.find((s) => s.parkCode === parkCode)?.status ?? "not_visited";
  }

  function getStatusObject(parkCode: string): UserParkStatus | undefined {
    return statuses.find((s) => s.parkCode === parkCode);
  }

  function setStatus(parkCode: string, status: Status, extra: Partial<UserParkStatus> = {}) {
    setStatuses((prev) => {
      const without = prev.filter((s) => s.parkCode !== parkCode);
      if (status === "not_visited" && Object.keys(extra).length === 0) return without;
      return [...without, { parkCode, status, ...extra }];
    });
  }

  function updateStatus(parkCode: string, patch: Partial<UserParkStatus>) {
    setStatuses((prev) => {
      const existing = prev.find((s) => s.parkCode === parkCode);
      if (!existing) {
        return [...prev, { parkCode, status: "not_visited", ...patch }];
      }
      return prev.map((s) => (s.parkCode === parkCode ? { ...s, ...patch } : s));
    });
  }

  return { statuses, getStatus, getStatusObject, setStatus, updateStatus };
}
