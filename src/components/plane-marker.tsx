'use client';

import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { AircraftPhoto } from '@/components/aircraft-photo';
import { AircraftWithLive } from '@/types/aircraft';

function createPlaneIcon(heading: number | null): L.DivIcon {
  const rotation = heading ?? 0;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="28" style="transform:rotate(${rotation}deg);filter:drop-shadow(0 1px 2px rgba(0,0,0,.4))"><path fill="#3b82f6" d="M21 16v-2l-8-5V3.5C13 2.67 12.33 2 11.5 2S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z"/></svg>`;
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -14],
  });
}

interface PlaneMarkerProps {
  aircraft: AircraftWithLive;
}

export function PlaneMarker({ aircraft }: PlaneMarkerProps) {
  const { live } = aircraft;
  if (!live || live.latitude == null || live.longitude == null) return null;

  const icon = createPlaneIcon(live.heading);
  const lastUpdated = live.lastContact
    ? new Date(live.lastContact * 1000).toLocaleTimeString()
    : '—';

  return (
    <Marker position={[live.latitude, live.longitude]} icon={icon}>
      <Popup maxWidth={260}>
        <div className="flex flex-col gap-0.5 text-sm">
          <AircraftPhoto icao24={aircraft.icao24} size="full" />
          <div className="font-bold">{aircraft.tailNumber}</div>
          {aircraft.notes && (
            <div className="text-muted-foreground text-xs">{aircraft.notes}</div>
          )}
          <div className="mt-0 grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
            {aircraft.route && (
              <>
                <span className="text-muted-foreground">From</span>
                <span>
                  {aircraft.route.origin
                    ? `${aircraft.route.origin.iata} — ${aircraft.route.origin.name}`
                    : '—'}
                </span>
                <span className="text-muted-foreground">To</span>
                <span>
                  {aircraft.route.destination
                    ? `${aircraft.route.destination.iata} — ${aircraft.route.destination.name}`
                    : '—'}
                </span>
              </>
            )}
            {live.aircraftType && (
              <>
                <span className="text-muted-foreground">Type</span>
                <span>{live.aircraftType}</span>
              </>
            )}
            <span className="text-muted-foreground">Altitude</span>
            <span>{live.altitude != null ? `${live.altitude.toLocaleString()} ft` : '—'}</span>
            <span className="text-muted-foreground">Speed (mph)</span>
            <span>{live.velocity != null ? `${Math.round(live.velocity * 1.151)} mph` : '—'}</span>
            <span className="text-muted-foreground">Speed (km/h)</span>
            <span>{live.velocity != null ? `${Math.round(live.velocity * 1.852)} km/h` : '—'}</span>
            <span className="text-muted-foreground">Heading</span>
            <span>{live.heading != null ? `${live.heading}°` : '—'}</span>
            <span className="text-muted-foreground">Country</span>
            <span>{live.originCountry ?? '—'}</span>
            <span className="text-muted-foreground">Updated</span>
            <span>{lastUpdated}</span>
          </div>
        </div>
      </Popup>
    </Marker>
  );
}
