"use client";

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Park, RouteStop } from "@/types";
import { approximateDriveMiles, approximateDriveHours, formatHours } from "@/lib/distance";

export default function TripStopList({
  parkCodes,
  parks,
  stops,
  onReorder,
  onRemove,
  onNightsChange
}: {
  parkCodes: string[];
  parks: Park[];
  stops: RouteStop[];
  onReorder: (codes: string[]) => void;
  onRemove: (code: string) => void;
  onNightsChange: (parkCode: string, nights: number) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const ordered = parkCodes
    .map((c) => parks.find((p) => p.parkCode === c))
    .filter((p): p is Park => Boolean(p));

  const stopByCode = new Map(stops.map((s) => [s.parkCode, s]));

  function handleDragEnd(e: DragEndEvent) {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = parkCodes.indexOf(String(active.id));
    const newIndex = parkCodes.indexOf(String(over.id));
    if (oldIndex < 0 || newIndex < 0) return;
    onReorder(arrayMove(parkCodes, oldIndex, newIndex));
  }

  if (ordered.length === 0) {
    return (
      <div className="text-sm text-bark-500 dark:text-forest-300 italic py-8 text-center">
        No stops yet. Use the picker below to add parks.
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={parkCodes} strategy={verticalListSortingStrategy}>
        <ol className="space-y-2">
          {ordered.map((p, i) => {
            const next = ordered[i + 1];
            const legMiles = next
              ? approximateDriveMiles(
                  { lat: p.latitude, lon: p.longitude },
                  { lat: next.latitude, lon: next.longitude }
                )
              : 0;
            const stop = stopByCode.get(p.parkCode);
            return (
              <SortableItem
                key={p.parkCode}
                park={p}
                index={i}
                legMiles={legMiles}
                hasNext={!!next}
                nights={stop?.nights ?? 1}
                onRemove={onRemove}
                onNightsChange={onNightsChange}
              />
            );
          })}
        </ol>
      </SortableContext>
    </DndContext>
  );
}

function SortableItem({
  park,
  index,
  legMiles,
  hasNext,
  nights,
  onRemove,
  onNightsChange
}: {
  park: Park;
  index: number;
  legMiles: number;
  hasNext: boolean;
  nights: number;
  onRemove: (code: string) => void;
  onNightsChange: (parkCode: string, nights: number) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: park.parkCode });
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="rounded-lg bg-white dark:bg-forest-900 border border-bark-100 dark:border-forest-800 p-3 flex items-center gap-3 shadow-soft">
        <button
          {...attributes}
          {...listeners}
          className="text-bark-400 hover:text-bark-700 dark:hover:text-forest-200 cursor-grab active:cursor-grabbing px-1 flex-shrink-0"
          aria-label="Drag to reorder"
        >
          ⋮⋮
        </button>
        <div className="flex-shrink-0 w-7 h-7 rounded-full bg-forest-600 text-white text-sm font-bold flex items-center justify-center">
          {index + 1}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-bark-800 dark:text-forest-100 truncate">{park.fullName}</div>
          <div className="text-xs text-bark-500 dark:text-forest-300">{park.states}</div>
        </div>
        <label className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-xs text-bark-500 dark:text-forest-300 whitespace-nowrap">nights:</span>
          <input
            type="number"
            min={0}
            max={14}
            value={nights}
            onChange={(e) => onNightsChange(park.parkCode, Math.max(0, parseInt(e.target.value || "0", 10)))}
            className="w-12 px-1.5 py-0.5 rounded border border-bark-200 dark:border-forest-700 bg-white dark:bg-forest-800 text-sm text-center"
            onPointerDown={(e) => e.stopPropagation()}
          />
        </label>
        <button
          onClick={() => onRemove(park.parkCode)}
          className="text-bark-400 hover:text-red-600 px-2 flex-shrink-0"
          aria-label="Remove stop"
        >
          ×
        </button>
      </div>
      {hasNext && (
        <div className="ml-9 my-1 text-xs text-bark-500 dark:text-forest-300 flex items-center gap-2">
          <span className="text-bark-300">↓</span>
          ~{Math.round(legMiles)} mi · {formatHours(approximateDriveHours(legMiles))}
        </div>
      )}
    </li>
  );
}
