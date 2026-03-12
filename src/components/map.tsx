'use client';

import 'leaflet/dist/leaflet.css';
import React, { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import { PlaneMarker } from '@/components/plane-marker';
import { AircraftWithLive } from '@/types/aircraft';

const destinationPinIcon = L.divIcon({
  html: `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="36" viewBox="0 0 28 36" style="filter:drop-shadow(0 1px 3px rgba(0,0,0,.4))">
    <path fill="#3b82f6" d="M14 0C6.27 0 0 6.27 0 14c0 9.625 14 22 14 22S28 23.625 28 14C28 6.27 21.73 0 14 0z"/>
    <circle cx="14" cy="14" r="5" fill="white"/>
  </svg>`,
  className: '',
  iconSize: [28, 36],
  iconAnchor: [14, 36],
  popupAnchor: [0, -36],
});

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
    <div className="relative z-0 h-full w-full">
      <MapContainer center={[30, 10]} zoom={3} className="h-full w-full">
        <TileLayer key={tileUrl} url={tileUrl} attribution={attribution} />
        <MapController selectedAircraft={selectedAircraft} />
        {airborne.map((a) => {
          const dest = a.route?.destination;
          const showLine =
            dest?.latitude != null &&
            dest?.longitude != null &&
            a.live?.latitude != null &&
            a.live?.longitude != null;
          return (
            <React.Fragment key={a.id}>
              <PlaneMarker aircraft={a} />
              {showLine && (
                <>
                  <Polyline
                    positions={[
                      [a.live!.latitude!, a.live!.longitude!],
                      [dest!.latitude!, dest!.longitude!],
                    ]}
                    pathOptions={{ color: '#3b82f6', weight: 1.5, dashArray: '6 6', opacity: 0.7 }}
                  />
                  <Marker position={[dest!.latitude!, dest!.longitude!]} icon={destinationPinIcon}>
                    <Popup>
                      <div className="text-sm">
                        <div className="font-bold">{dest!.iata}</div>
                        <div>{dest!.name}</div>
                        <div className="text-muted-foreground text-xs mt-0.5">
                          Destination — {a.tailNumber}
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </>
              )}
            </React.Fragment>
          );
        })}
      </MapContainer>
    </div>
  );
}
