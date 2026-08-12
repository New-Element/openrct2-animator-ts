/// <reference path="./../openrct2.d.ts" />

import TileCoords from "./tileCoords";

/** Bytes per tile element in OpenRCT2's raw tile.data layout. */
const ELEMENT_SIZE = 16;
/** Bit on element flags byte (offset 1) marking the last element on the tile. */
const LAST_ELEMENT_FLAG = 128;

/**
 * Thin wrapper around OpenRCT2's Tile. Owns element listing and any raw
 * tile.data writes so steps do not poke Uint8Array themselves.
 */
export default class MapTile {
    readonly x: number;
    readonly y: number;
    private readonly tile: Tile;

    private constructor(tile: Tile) {
        this.tile = tile;
        this.x = tile.x;
        this.y = tile.y;
    }

    static at(coords: TileCoords): MapTile | null {
        return MapTile.atXY(coords.x, coords.y);
    }

    static atXY(x: number, y: number): MapTile | null {
        const tile = map.getTile(x, y);
        if (!tile) {
            return null;
        }
        return new MapTile(tile);
    }

    get numElements(): number {
        return this.tile.numElements;
    }

    getElement(index: number): TileElement {
        return this.tile.getElement(index);
    }

    /** All tile elements in stack order. */
    elements(): TileElement[] {
        const result: TileElement[] = [];
        for (let i = 0; i < this.tile.numElements; i++) {
            result.push(this.tile.getElement(i));
        }
        return result;
    }

    /** Track elements in stack order (OpenRCT2 typed TrackElement). */
    tracks(): TrackElement[] {
        const result: TrackElement[] = [];
        for (let i = 0; i < this.tile.numElements; i++) {
            const element = this.tile.getElement(i);
            if (element.type === "track") {
                result.push(element as TrackElement);
            }
        }
        return result;
    }

    /** Track elements for a ride, in stack order. */
    tracksForRide(rideId: number): TrackElement[] {
        const result: TrackElement[] = [];
        const tracks = this.tracks();
        for (let i = 0; i < tracks.length; i++) {
            if (tracks[i].ride === rideId) {
                result.push(tracks[i]);
            }
        }
        return result;
    }

    /** First track element on the tile, if any. */
    firstTrack(): TrackElement | null {
        const tracks = this.tracks();
        return tracks.length > 0 ? tracks[0] : null;
    }

    /** Index of the first track element on the tile, if any. */
    firstTrackIndex(): number | null {
        for (let i = 0; i < this.tile.numElements; i++) {
            if (this.tile.getElement(i).type === "track") {
                return i;
            }
        }
        return null;
    }

    /**
     * Find the first track matching ride + trackType.
     */
    findTrack(rideId: number, trackType: number): TrackElement | null {
        const tracks = this.tracks();
        for (let i = 0; i < tracks.length; i++) {
            const track = tracks[i];
            if (track.ride === rideId && track.trackType === trackType) {
                return track;
            }
        }
        return null;
    }

    /**
     * Set base height and keep clearance in sync (same delta).
     */
    setTrackBaseHeight(track: TrackElement, baseHeight: number): void {
        const heightDelta = baseHeight - track.baseHeight;
        track.baseHeight = baseHeight;
        track.clearanceHeight += heightDelta;
    }

    /**
     * Shift base and clearance by the same delta (land units).
     */
    adjustTrackHeight(track: TrackElement, heightDelta: number): void {
        track.baseHeight += heightDelta;
        track.clearanceHeight += heightDelta;
    }

    /**
     * Cycle this ride's track pieces on the tile (last → first), Advanced Track
     * Switch Track style. Needs at least two track pieces for the ride.
     * Returns false if there is nothing to switch.
     */
    switchTrackOrderForRide(rideId: number): boolean {
        const trackIndices: number[] = [];
        for (let i = 0; i < this.tile.numElements; i++) {
            const element = this.tile.getElement(i);
            if (element.type !== "track") {
                continue;
            }
            if ((element as TrackElement).ride !== rideId) {
                continue;
            }
            trackIndices.push(i);
        }

        if (trackIndices.length < 2) {
            return false;
        }

        this.rotateElementSlots(trackIndices);
        return true;
    }

    /**
     * Rotate raw 16-byte element blobs among the given indices (last → first),
     * then repair the last-element flag on the tile.
     */
    private rotateElementSlots(indices: number[]): void {
        const data = this.tile.data;
        const blobs: Uint8Array[] = [];
        for (let i = 0; i < indices.length; i++) {
            const blob = new Uint8Array(ELEMENT_SIZE);
            const base = indices[i] * ELEMENT_SIZE;
            for (let j = 0; j < ELEMENT_SIZE; j++) {
                blob[j] = data[base + j];
            }
            blobs.push(blob);
        }

        let prev = indices.length - 1;
        for (let i = 0; i < indices.length; i++) {
            const base = indices[i] * ELEMENT_SIZE;
            for (let j = 0; j < ELEMENT_SIZE; j++) {
                data[base + j] = blobs[prev][j];
            }
            prev = i;
        }

        for (let i = 0; i < this.tile.numElements; i++) {
            const flagsOffset = i * ELEMENT_SIZE + 1;
            data[flagsOffset] &= ~LAST_ELEMENT_FLAG;
            if (i === this.tile.numElements - 1) {
                data[flagsOffset] |= LAST_ELEMENT_FLAG;
            }
        }

        this.tile.data = data;
    }
}
