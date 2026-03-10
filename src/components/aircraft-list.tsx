'use client';

import { useState } from 'react';
import { Plus } from 'lucide-react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
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
  const [open, setOpen] = useState(false);

  function handleAdded(newAircraft: AircraftWithLive) {
    onAdded(newAircraft);
    setOpen(false);
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="w-full">
              <Plus className="mr-2 h-4 w-4" />
              Add Aircraft
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Aircraft</DialogTitle>
            </DialogHeader>
            <AddAircraftForm key={String(open)} onAdded={handleAdded} />
          </DialogContent>
        </Dialog>

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
            No aircraft yet. Add one using the button above.
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
