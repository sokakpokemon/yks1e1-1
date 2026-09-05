/**
 * Shared drag payload for the weekly schedule drag & drop system.
 * Cards in the request/ek-ders pools and cards already placed on the
 * timetables all carry this payload; drop zones read it via readDragData().
 */
import type { DragEvent } from "react";

export type DragPayload =
  | { kind: "pool"; requestId: string } // birebir ders istek havuzu
  | { kind: "extra"; extraId: string } // öğretmen ek dersi
  | { kind: "classExtra"; extraId: string } // sınıf ek dersi (sınıf programı)
  | { kind: "classGroupExtra"; extraId: string }; // sınıf (grup) ek dersi (öğretmen programı)

export const DRAG_MIME = "application/x-yks-schedule";

export function setDragData(e: DragEvent, payload: DragPayload) {
  e.dataTransfer.setData(DRAG_MIME, JSON.stringify(payload));
  e.dataTransfer.setData("text/plain", JSON.stringify(payload));
  e.dataTransfer.effectAllowed = "move";
}

export function readDragData(e: DragEvent): DragPayload | null {
  try {
    const raw =
      e.dataTransfer.getData(DRAG_MIME) || e.dataTransfer.getData("text/plain");
    if (!raw) return null;
    const parsed = JSON.parse(raw) as DragPayload;
    if (
      parsed.kind === "pool" ||
      parsed.kind === "extra" ||
      parsed.kind === "classExtra" ||
      parsed.kind === "classGroupExtra"
    ) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}
