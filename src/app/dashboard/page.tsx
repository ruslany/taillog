'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import dynamic from 'next/dynamic';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { AircraftWithLive } from '@/types/aircraft';

const FleetMap = dynamic(() => import('@/components/map').then((m) => m.FleetMap), { ssr: false });

export default function DashboardPage() {
  const [aircraft, setAircraft] = useState<AircraftWithLive[]>([]);
  const [liveError, setLiveError] = useState(false);
  const [selectedAircraft, setSelectedAircraft] = useState<AircraftWithLive | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchAircraft = useCallback(async () => {
    const res = await fetch('/api/aircraft');
    if (!res.ok) return;
    const data = await res.json();
    setAircraft(data.aircraft);
    setLiveError(data.liveError ?? false);
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
    toast.success(`${newAircraft.tailNumber} added to your fleet.`);
  }

  function handleDeleted(id: string) {
    const removed = aircraft.find((a) => a.id === id);
    setAircraft((prev) => prev.filter((a) => a.id !== id));
    if (removed) toast.success(`${removed.tailNumber} removed from your fleet.`);
  }

  function handleEdited(updated: AircraftWithLive) {
    setAircraft((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
  }

  return (
    <SidebarProvider style={{ '--sidebar-width': '24rem' } as React.CSSProperties}>
      <AppSidebar
        aircraft={aircraft}
        loading={loading}
        liveError={liveError}
        onSelectAircraft={setSelectedAircraft}
        onAdded={handleAdded}
        onDeleted={handleDeleted}
        onEdited={handleEdited}
      />
      <SidebarInset className="flex flex-col overflow-hidden">
        <header className="flex h-12 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator orientation="vertical" className="mr-1 h-4" />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbPage>My Fleet</BreadcrumbPage>
              </BreadcrumbItem>
              {selectedAircraft && (
                <>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbPage>{selectedAircraft.tailNumber}</BreadcrumbPage>
                  </BreadcrumbItem>
                </>
              )}
            </BreadcrumbList>
          </Breadcrumb>
        </header>
        <div className="flex-1 overflow-hidden">
          <FleetMap aircraft={aircraft} selectedAircraft={selectedAircraft} />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
