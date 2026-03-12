export interface Metar {
  flightCategory: 'VFR' | 'MVFR' | 'IFR' | 'LIFR' | null;
  windDir: number | null;
  windSpeed: number | null;
  visibility: number | null;
  ceiling: number | null;
  temp: number | null;
  altimeter: number | null;
  rawOb: string | null;
}

export interface FlightRoute {
  origin: { iata: string; name: string } | null;
  destination: {
    iata: string;
    name: string;
    latitude?: number;
    longitude?: number;
    metar?: Metar | null;
  } | null;
}

export interface LiveState {
  airborne: boolean;
  callsign: string | null;
  aircraftType: string | null;
  latitude: number | null;
  longitude: number | null;
  altitude: number | null;
  velocity: number | null;
  heading: number | null;
  originCountry: string | null;
  lastContact: number | null;
}

export interface AircraftWithLive {
  id: string;
  tailNumber: string;
  icao24: string;
  notes: string | null;
  addedAt: string;
  live: LiveState | null;
  route: FlightRoute | null;
}
