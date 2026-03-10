'use client';

import { useState } from 'react';
import { AircraftList } from '@/components/aircraft-list';
import { MobileTabs } from '@/components/mobile-tabs';
import { AircraftWithLive } from '@/types/aircraft';

// Map placeholder — replaced in Stage 7
function MapPlaceholder() {
  return <div className="h-full w-full bg-muted flex items-center justify-center text-muted-foreground text-sm">Map coming in Stage 7</div>;
}

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftWithLive | null>(null);

  const mapSlot = <MapPlaceholder />;

  return (
    <>
      {/* Mobile: tabbed layout */}
      <div className="flex flex-1 flex-col md:hidden">
        <MobileTabs onSelectAircraft={setSelectedAircraft} mapSlot={mapSlot} />
      </div>

      {/* Desktop: side-by-side layout */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        <aside className="w-[35%] overflow-y-auto border-r">
          <AircraftList onSelectAircraft={setSelectedAircraft} />
        </aside>
        <div className="flex-1">
          {mapSlot}
        </div>
      </div>
    </>
  );
}
