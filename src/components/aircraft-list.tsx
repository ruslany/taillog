'use client';

import { useEffect, useState, useCallback } from 'react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { AddAircraftForm } from '@/components/add-aircraft-form';
import { AircraftItem } from '@/components/aircraft-item';
import { AircraftWithLive } from '@/types/aircraft';

interface AircraftListProps {
  onSelectAircraft: (aircraft: AircraftWithLive) => void;
}

export function AircraftList({ onSelectAircraft }: AircraftListProps) {
  const [aircraft, setAircraft] = useState<AircraftWithLive[]>([]);
  const [openskyError, setOpenskyError] = useState(false);

  const fetchAircraft = useCallback(async () => {
    const res = await fetch('/api/aircraft');
    if (!res.ok) return;
    const data = await res.json();
    setAircraft(data.aircraft);
    setOpenskyError(data.openskyError ?? false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAircraft();
    const id = setInterval(fetchAircraft, 30_000);
    return () => clearInterval(id);
  }, [fetchAircraft]);

  function handleAdded(newAircraft: AircraftWithLive) {
    setAircraft((prev) => [newAircraft, ...prev]);
    // Refresh to get live data
    fetchAircraft();
  }

  function handleDeleted(id: string) {
    setAircraft((prev) => prev.filter((a) => a.id !== id));
  }

  return (
    <TooltipProvider>
      <div className="flex flex-col gap-4 p-4">
        <AddAircraftForm onAdded={handleAdded} />

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
                onDelete={handleDeleted}
                onSelect={onSelectAircraft}
              />
            ))}
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
