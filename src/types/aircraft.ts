export interface FlightRoute {
  origin: { iata: string; name: string } | null;
  destination: { iata: string; name: string } | null;
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
  nickname: string | null;
  addedAt: string;
  live: LiveState | null;
  route: FlightRoute | null;
}
