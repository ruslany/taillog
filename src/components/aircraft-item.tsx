'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Trash2Icon, PencilIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Card } from '@/components/ui/card';
import { AircraftPhoto } from '@/components/aircraft-photo';
import { AircraftWithLive } from '@/types/aircraft';

interface AircraftItemProps {
  aircraft: AircraftWithLive;
  onDelete: (id: string) => void;
  onSelect: (aircraft: AircraftWithLive) => void;
  onEdited: (updated: AircraftWithLive) => void;
}

export function AircraftItem({ aircraft, onDelete, onSelect, onEdited }: AircraftItemProps) {
  const isAirborne = aircraft.live?.airborne === true;
  const [deleting, setDeleting] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [notes, setNotes] = useState(aircraft.notes ?? '');
  const [saving, setSaving] = useState(false);
  const [editPhoto, setEditPhoto] = useState<{
    url: string;
    urlLarge: string | null;
    photographer: string | null;
  } | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [viewPhoto, setViewPhoto] = useState<{
    url: string;
    urlLarge: string | null;
    photographer: string | null;
  } | null>(null);

  async function handleSaveNickname() {
    setSaving(true);
    const res = await fetch(`/api/aircraft/${aircraft.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes }),
    });
    setSaving(false);
    if (res.ok) {
      onEdited({ ...aircraft, notes: notes.trim() || null });
      setEditOpen(false);
      toast.success(`${aircraft.tailNumber} notes updated.`);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    const res = await fetch(`/api/aircraft/${aircraft.id}`, { method: 'DELETE' });
    setDeleting(false);
    if (res.ok) {
      onDelete(aircraft.id);
    }
  }

  return (
    <div className="flex min-h-[48px] items-center gap-3 rounded-md px-1 py-2 hover:bg-muted/50">
      <AircraftPhoto
        icao24={aircraft.icao24}
        size="thumb"
        onPhotoClick={(url, urlLarge, photographer) => {
          setViewPhoto({ url, urlLarge, photographer });
          setViewOpen(true);
        }}
      />

      {/* Info */}
      <div
        className="flex flex-1 cursor-pointer flex-col gap-0.5 overflow-hidden"
        onClick={() => isAirborne && onSelect(aircraft)}
        role={isAirborne ? 'button' : undefined}
        tabIndex={isAirborne ? 0 : undefined}
        onKeyDown={(e) => {
          if (isAirborne && (e.key === 'Enter' || e.key === ' ')) onSelect(aircraft);
        }}
      >
        <span className="truncate font-semibold leading-tight">{aircraft.tailNumber}</span>
        {aircraft.notes && (
          <span className="truncate text-xs text-muted-foreground">{aircraft.notes}</span>
        )}
        <Badge
          variant={isAirborne ? 'default' : 'secondary'}
          className={`mt-0.5 w-fit text-xs ${isAirborne ? 'bg-green-600 hover:bg-green-700' : ''}`}
        >
          {isAirborne ? 'Airborne' : 'On Ground / Not Tracked'}
        </Badge>
        {isAirborne && aircraft.route && (
          <span className="truncate text-xs text-muted-foreground">
            {aircraft.route.origin?.iata ?? '?'} → {aircraft.route.destination?.iata ?? '?'}
          </span>
        )}
        {isAirborne && aircraft.live?.aircraftType && (
          <span className="truncate text-xs text-muted-foreground">
            {aircraft.live.aircraftType}
          </span>
        )}
      </div>

      {/* Edit notes */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="shrink-0 text-muted-foreground hover:text-foreground"
            aria-label={`Edit ${aircraft.tailNumber}`}
            onClick={() => {
              setNotes(aircraft.notes ?? '');
              setEditPhoto(null);
              setEditOpen(true);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Edit notes</TooltipContent>
      </Tooltip>

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) setViewPhoto(null);
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{aircraft.tailNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {viewPhoto ? (
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={viewPhoto.urlLarge ?? viewPhoto.url}
                  alt="Aircraft photo"
                  className="max-h-[50vh] max-w-full rounded object-contain"
                />
                {viewPhoto.photographer && (
                  <span className="text-sm text-muted-foreground">© {viewPhoto.photographer}</span>
                )}
              </div>
            ) : (
              <Card className="items-center p-4">
                <AircraftPhoto
                  icao24={aircraft.icao24}
                  size="full"
                  onPhotoLoad={(url, urlLarge, photographer) =>
                    setViewPhoto({ url, urlLarge, photographer })
                  }
                />
              </Card>
            )}
            {aircraft.notes && <p className="text-sm text-muted-foreground">{aircraft.notes}</p>}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={editOpen}
        onOpenChange={(open) => {
          setEditOpen(open);
          if (!open) setEditPhoto(null);
        }}
      >
        <DialogContent className="max-w-[90vw] sm:max-w-lg" aria-describedby={undefined}>
          <DialogHeader>
            <DialogTitle>{aircraft.tailNumber}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            {editPhoto ? (
              <div className="flex flex-col items-center gap-1.5">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={editPhoto.urlLarge ?? editPhoto.url}
                  alt="Aircraft photo"
                  className="max-h-[50vh] max-w-full rounded object-contain"
                />
                {editPhoto.photographer && (
                  <span className="text-sm text-muted-foreground">© {editPhoto.photographer}</span>
                )}
              </div>
            ) : (
              <Card className="items-center p-4">
                <AircraftPhoto
                  icao24={aircraft.icao24}
                  size="full"
                  onPhotoLoad={(url, urlLarge, photographer) =>
                    setEditPhoto({ url, urlLarge, photographer })
                  }
                />
              </Card>
            )}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="notes-input">Notes</Label>
              <Input
                id="notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Seen at KSFO, June 2024"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNickname();
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveNickname} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete */}
      <AlertDialog>
        <Tooltip>
          <TooltipTrigger asChild>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="shrink-0 text-muted-foreground hover:text-destructive"
                aria-label={`Delete ${aircraft.tailNumber}`}
              >
                <Trash2Icon className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
          </TooltipTrigger>
          <TooltipContent>Delete aircraft</TooltipContent>
        </Tooltip>
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogMedia className="bg-destructive/10 text-destructive dark:bg-destructive/20 dark:text-destructive">
              <Trash2Icon />
            </AlertDialogMedia>
            <AlertDialogTitle>Remove {aircraft.tailNumber}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove {aircraft.tailNumber}
              {aircraft.notes ? ` (${aircraft.notes})` : ''} from your fleet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel variant="outline">Cancel</AlertDialogCancel>
            <AlertDialogAction variant="destructive" disabled={deleting} onClick={handleDelete}>
              {deleting ? 'Removing…' : 'Remove'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
