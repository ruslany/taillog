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
import { Skeleton } from '@/components/ui/skeleton';
import { AddAircraftForm } from '@/components/add-aircraft-form';
import { AircraftItem } from '@/components/aircraft-item';
import { AircraftWithLive } from '@/types/aircraft';

function AircraftItemSkeleton() {
  return (
    <div className="flex min-h-[48px] items-center gap-3 px-1 py-2">
      <Skeleton className="h-10 w-10 shrink-0 rounded-md" />
      <div className="flex flex-1 flex-col gap-1.5">
        <Skeleton className="h-3.5 w-20" />
        <Skeleton className="h-5 w-24 rounded-full" />
      </div>
      <Skeleton className="h-8 w-8 shrink-0 rounded-md" />
    </div>
  );
}

interface AircraftListProps {
  aircraft: AircraftWithLive[];
  loading: boolean;
  openskyError: boolean;
  onSelectAircraft: (aircraft: AircraftWithLive) => void;
  onAdded: (newAircraft: AircraftWithLive) => void;
  onDeleted: (id: string) => void;
}

export function AircraftList({
  aircraft,
  loading,
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

        {loading ? (
          <div className="flex flex-col divide-y">
            {Array.from({ length: 3 }).map((_, i) => (
              <AircraftItemSkeleton key={i} />
            ))}
          </div>
        ) : aircraft.length === 0 ? (
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
