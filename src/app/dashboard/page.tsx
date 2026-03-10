'use client';

import { useState, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { AircraftList } from '@/components/aircraft-list';
import { MobileTabs } from '@/components/mobile-tabs';
import { AircraftWithLive } from '@/types/aircraft';

const FleetMap = dynamic(() => import('@/components/map').then((m) => m.FleetMap), { ssr: false });

export default function DashboardPage() {
  const [aircraft, setAircraft] = useState<AircraftWithLive[]>([]);
  const [openskyError, setOpenskyError] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftWithLive | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAircraft = useCallback(async () => {
    const res = await fetch('/api/aircraft');
    if (!res.ok) return;
    const data = await res.json();
    setAircraft(data.aircraft);
    setOpenskyError(data.openskyError ?? false);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchAircraft();
    const id = setInterval(fetchAircraft, 30_000);
    return () => clearInterval(id);
  }, [fetchAircraft]);

  function handleAdded(newAircraft: AircraftWithLive) {
    setAircraft((prev) => [newAircraft, ...prev]);
    fetchAircraft();
  }

  function handleDeleted(id: string) {
    setAircraft((prev) => prev.filter((a) => a.id !== id));
  }

  const mapSlot = <FleetMap aircraft={aircraft} selectedAircraft={selectedAircraft} />;

  return (
    <>
      {/* Mobile: tabbed layout */}
      <div className="flex flex-1 flex-col md:hidden">
        <MobileTabs
          aircraft={aircraft}
          loading={loading}
          openskyError={openskyError}
          onSelectAircraft={setSelectedAircraft}
          onAdded={handleAdded}
          onDeleted={handleDeleted}
          mapSlot={mapSlot}
        />
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <aside className="w-[35%] overflow-y-auto border-r">
          <AircraftList
            aircraft={aircraft}
            loading={loading}
            openskyError={openskyError}
            onSelectAircraft={setSelectedAircraft}
            onAdded={handleAdded}
            onDeleted={handleDeleted}
          />
        </aside>
        <div className="flex-1">
          {mapSlot}
        </div>
      </div>
    </>
  );
}
