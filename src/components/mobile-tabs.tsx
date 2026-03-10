'use client';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AircraftList } from '@/components/aircraft-list';
import { AircraftWithLive } from '@/types/aircraft';

interface MobileTabsProps {
  onSelectAircraft: (aircraft: AircraftWithLive) => void;
  mapSlot: React.ReactNode;
}

export function MobileTabs({ onSelectAircraft, mapSlot }: MobileTabsProps) {
  return (
    <Tabs defaultValue="fleet" className="flex flex-1 flex-col">
      <TabsList className="grid w-full grid-cols-2 rounded-none border-b">
        <TabsTrigger value="fleet">My Fleet</TabsTrigger>
        <TabsTrigger value="map">Map</TabsTrigger>
      </TabsList>
      <TabsContent value="fleet" className="flex-1 overflow-y-auto mt-0">
        <AircraftList onSelectAircraft={onSelectAircraft} />
      </TabsContent>
      <TabsContent value="map" className="flex-1 mt-0 p-0">
        {mapSlot}
      </TabsContent>
    </Tabs>
  );
}
