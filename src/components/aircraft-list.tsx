'use client';

import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { AddAircraftForm } from '@/components/add-aircraft-form';
import { AircraftItem } from '@/components/aircraft-item';
import { AircraftWithLive } from '@/types/aircraft';

interface AircraftListProps {
  aircraft: AircraftWithLive[];
  openskyError: boolean;
  onSelectAircraft: (aircraft: AircraftWithLive) => void;
  onAdded: (newAircraft: AircraftWithLive) => void;
  onDeleted: (id: string) => void;
}

export function AircraftList({
  aircraft,
  openskyError,
  onSelectAircraft,
  onAdded,
  onDeleted,
}: AircraftListProps) {
  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4">
        <AddAircraftForm onAdded={onAdded} />

        <Separator />

        {openskyError && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Live tracking unavailable — OpenSky may be down.
            </AlertDescription>
          </Alert>
        )}

        {aircraft.length === 0 ? (
          <p className="text-center text-sm text-muted-foreground">
            No aircraft yet. Add one above.
          </p>
        ) : (
          <div className="flex flex-col divide-y">
            {aircraft.map((a) => (
              <AircraftItem
                key={a.id}
                aircraft={a}
                onDelete={onDeleted}
                onSelect={onSelectAircraft}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
