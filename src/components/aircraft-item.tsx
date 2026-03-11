'use client';

import { useState } from 'react';
import { Trash2Icon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { AircraftPhoto } from '@/components/aircraft-photo';
import { AircraftWithLive } from '@/types/aircraft';

interface AircraftItemProps {
  aircraft: AircraftWithLive;
  onDelete: (id: string) => void;
  onSelect: (aircraft: AircraftWithLive) => void;
}

export function AircraftItem({ aircraft, onDelete, onSelect }: AircraftItemProps) {
  const isAirborne = aircraft.live?.airborne === true;
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/aircraft/${aircraft.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      onDelete(aircraft.id);
    }
  }

  return (
    <div className="flex min-h-[48px] items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50">
      <AircraftPhoto icao24={aircraft.icao24} size="thumb" />

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
        {isAirborne && aircraft.route && (
          <span className="truncate text-xs text-muted-foreground">
            {aircraft.route.origin?.iata ?? '?'} → {aircraft.route.destination?.iata ?? '?'}
          </span>
        )}
        {isAirborne && aircraft.live?.aircraftType && (
          <span className="truncate text-xs text-muted-foreground">{aircraft.live.aircraftType}</span>
        )}
      </div>

      {/* Delete */}
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${aircraft.tailNumber}`}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete aircraft</TooltipContent>
        </Tooltip>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove {aircraft.tailNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {aircraft.tailNumber}
              {aircraft.nickname ? ` (${aircraft.nickname})` : ''} from your fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
