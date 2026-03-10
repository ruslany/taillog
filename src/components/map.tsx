'use client';

import 'leaflet/dist/leaflet.css';
import { useEffect } from 'react';
import { MapContainer, TileLayer, useMap } from 'react-leaflet';
import { PlaneMarker } from '@/components/plane-marker';
import { AircraftWithLive } from '@/types/aircraft';

function MapController({ selectedAircraft }: { selectedAircraft: AircraftWithLive | null }) {
  const map = useMap();
  useEffect(() => {
    if (
      selectedAircraft?.live?.airborne &&
      selectedAircraft.live.latitude != null &&
      selectedAircraft.live.longitude != null
    ) {
      map.flyTo([selectedAircraft.live.latitude, selectedAircraft.live.longitude], 8);
    }
  }, [selectedAircraft, map]);
  return null;
}

interface FleetMapProps {
  aircraft: AircraftWithLive[];
  selectedAircraft: AircraftWithLive | null;
}

export function FleetMap({ aircraft, selectedAircraft }: FleetMapProps) {
  const tileUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
  const attribution =
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

  const airborne = aircraft.filter(
    (a) => a.live?.airborne && a.live.latitude != null && a.live.longitude != null,
  );

  return (
    <MapContainer center={[30, 10]} zoom={3} className="h-full w-full">
      <TileLayer key={tileUrl} url={tileUrl} attribution={attribution} />
      <MapController selectedAircraft={selectedAircraft} />
      {airborne.map((a) => (
        <PlaneMarker key={a.id} aircraft={a} />
      ))}
    </MapContainer>
  );
}
