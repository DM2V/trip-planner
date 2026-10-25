import { CalendarIcon, LocationIcon } from "@/components/ui/icons";
import { formatDateRange } from "@/lib/utils";

interface TripInfoRowsProps {
  startDate: string;
  endDate: string;
  originLabel: string;
}

// Two icon + label rows instead of one dense "dates · from origin" line — easier to scan at a
// glance, and gives a long origin address room to wrap onto a second line without crowding the
// dates next to it.
export function TripInfoRows({ startDate, endDate, originLabel }: TripInfoRowsProps) {
  return (
    <div className="mt-1 flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-[0.9375rem] text-(--color-label-secondary)">
        <CalendarIcon className="h-4 w-4 shrink-0" />
        <span>{formatDateRange(startDate, endDate)}</span>
      </div>
      <div className="flex items-start gap-1.5 text-[0.9375rem] text-(--color-label-secondary)">
        <LocationIcon className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{originLabel}</span>
      </div>
    </div>
  );
}
