'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AircraftWithLive } from '@/types/aircraft';

interface AddAircraftFormProps {
  onAdded: (aircraft: AircraftWithLive) => void;
}

export function AddAircraftForm({ onAdded }: AddAircraftFormProps) {
  const [tailNumber, setTailNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Step 1: resolve tail → icao24
      const lookupRes = await fetch(`/api/aircraft/lookup?tail=${encodeURIComponent(tailNumber)}`);
      if (lookupRes.status === 404) {
        setError('Tail number not found in aircraft database. Please check and try again.');
        return;
      }
      if (!lookupRes.ok) {
        setError('Lookup failed. Please try again.');
        return;
      }
      const { icao24 } = await lookupRes.json();

      // Step 2: save to DB
      const addRes = await fetch('/api/aircraft', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tailNumber, icao24, notes: notes || undefined }),
      });

      if (addRes.status === 409) {
        setError("You've already added this aircraft.");
        return;
      }
      if (!addRes.ok) {
        setError('Failed to add aircraft. Please try again.');
        return;
      }

      const aircraft = await addRes.json();
      onAdded({ ...aircraft, live: null });
      setTailNumber('');
      setNotes('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label htmlFor="tail-number">Tail Number</Label>
        <Input
          id="tail-number"
          placeholder="N12345"
          value={tailNumber}
          onChange={(e) => setTailNumber(e.target.value.toUpperCase())}
          required
          className="w-full"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="notes">Notes (optional)</Label>
        <Input
          id="notes"
          placeholder="United flight to Tokyo"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? 'Adding…' : 'Add Aircraft'}
      </Button>
    </form>
  );
}
