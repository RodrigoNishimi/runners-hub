import type { EventDetail } from "./events";
import type { SavedEventStatus } from "./db/schema";

export interface CalendarEntry {
  status: SavedEventStatus;
  event: EventDetail;
}

export const SAVED_STATUS_STYLES: Record<
  SavedEventStatus,
  { label: string; chip: string; dot: string }
> = {
  registered: {
    label: "Inscrito",
    chip: "bg-emerald-100 text-emerald-800 hover:bg-emerald-200",
    dot: "bg-emerald-500",
  },
  want: {
    label: "Quero fazer",
    chip: "bg-sky-100 text-sky-800 hover:bg-sky-200",
    dot: "bg-sky-500",
  },
  maybe: {
    label: "Talvez",
    chip: "bg-amber-100 text-amber-800 hover:bg-amber-200",
    dot: "bg-amber-500",
  },
};
