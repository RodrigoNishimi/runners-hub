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
    chip: "bg-emerald-400/15 text-emerald-300 ring-1 ring-inset ring-emerald-400/25 hover:bg-emerald-400/25",
    dot: "bg-emerald-400",
  },
  want: {
    label: "Quero fazer",
    chip: "bg-sky-400/15 text-sky-300 ring-1 ring-inset ring-sky-400/25 hover:bg-sky-400/25",
    dot: "bg-sky-400",
  },
  maybe: {
    label: "Talvez",
    chip: "bg-amber-400/15 text-amber-300 ring-1 ring-inset ring-amber-400/25 hover:bg-amber-400/25",
    dot: "bg-amber-400",
  },
};
