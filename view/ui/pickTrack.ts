/// <reference path="./../../openrct2.d.ts" />

import MapTile from "../../game/mapTile";
import TileCoords from "../../game/tileCoords";
import {
    activatePickerTool,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile,
    PickerToolEvent
} from "./pickerTool";

const TOOL_ID = "animator-pick-track";

export type PickedTrack = {
    tile: TileCoords;
    rideId: number;
    trackType: number;
};

function isSelectableRide(rideId: number): boolean {
    const ride = map.getRide(rideId);
    return !!ride && ride.classification === "ride";
}

function resolvePickedTrack(event: PickerToolEvent): PickedTrack | null {
    const tile = mapCoordsToTile(event.mapCoords);
    if (!tile) {
        return null;
    }
    const mapTile = MapTile.at(tile);
    if (!mapTile) {
        return null;
    }

    if (event.tileElementIndex !== undefined) {
        const element = mapTile.getElement(event.tileElementIndex);
        if (element && element.type === "track") {
            const track = element as TrackElement;
            if (isSelectableRide(track.ride)) {
                return {
                    tile: tile,
                    rideId: track.ride,
                    trackType: track.trackType
                };
            }
        }
    }

    const tracks = mapTile.tracks();
    for (let i = 0; i < tracks.length; i++) {
        if (isSelectableRide(tracks[i].ride)) {
            return {
                tile: tile,
                rideId: tracks[i].ride,
                trackType: tracks[i].trackType
            };
        }
    }

    return null;
}

/**
 * Activate a track-piece picker. Click a track element to capture tile, ride, and trackType.
 */
export function pickTrack(onPicked: (picked: PickedTrack) => void): void {
    activatePickerTool<PickedTrack>({
        id: TOOL_ID,
        filter: ["ride"],
        resolve: (event) => resolvePickedTrack(event),
        onHover: (picked) => highlightMapTile(picked.tile),
        onPick: onPicked,
        onFinish: () => clearTileSelection()
    });
}
