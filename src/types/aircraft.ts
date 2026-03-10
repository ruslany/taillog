export interface LiveState {
  airborne: boolean;
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
}
