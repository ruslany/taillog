'use client';

import { Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { AircraftWithLive } from '@/types/aircraft';

interface AircraftItemProps {
  aircraft: AircraftWithLive;
  onDelete: (id: string) => void;
  onSelect: (aircraft: AircraftWithLive) => void;
}

export function AircraftItem({ aircraft, onDelete, onSelect }: AircraftItemProps) {
  const isAirborne = aircraft.live?.airborne === true;

  async function handleDelete() {
    if (!window.confirm(`Remove ${aircraft.tailNumber} from your fleet?`)) return;
    const res = await fetch(`/api/aircraft/${aircraft.id}`, { method: 'DELETE' });
    if (res.ok) {
      onDelete(aircraft.id);
    }
  }

  return (
    <div
      className="flex min-h-[48px] items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50"
    >
      {/* Photo placeholder — replaced in Stage 8 */}
      <div className="h-12 w-[72px] shrink-0 rounded bg-muted" />

      {/* Info */}
      <div
        className="flex flex-1 cursor-pointer flex-col gap-0.5 overflow-hidden"
        onClick={() => isAirborne && onSelect(aircraft)}
        role={isAirborne ? 'button' : undefined}
        tabIndex={isAirborne ? 0 : undefined}
        onKeyDown={(e) => {
          if (isAirborne && (e.key === 'Enter' || e.key === ' ')) onSelect(aircraft);
        }}
      >
        <span className="truncate font-semibold leading-tight">{aircraft.tailNumber}</span>
        {aircraft.nickname && (
          <span className="truncate text-xs text-muted-foreground">{aircraft.nickname}</span>
        )}
        <Badge
          variant={isAirborne ? 'default' : 'secondary'}
          className={`mt-0.5 w-fit text-xs ${isAirborne ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {isAirborne ? 'Airborne' : 'On Ground / Not Tracked'}
        </Badge>
      </div>

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-destructive"
            onClick={handleDelete}
            aria-label={`Delete ${aircraft.tailNumber}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete aircraft</TooltipContent>
      </Tooltip>
    </div>
  );
}
