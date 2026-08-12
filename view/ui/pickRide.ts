/// <reference path="./../../openrct2.d.ts" />

import MapTile from "../../game/mapTile";
import {
    activatePickerTool,
    clearTileSelection,
    highlightMapTile,
    mapCoordsToTile,
    PickerToolEvent
} from "./pickerTool";

const TOOL_ID = "animator-pick-ride";

function isSelectableRide(rideId: number): boolean {
    const ride = map.getRide(rideId);
    return !!ride && ride.classification === "ride";
}

function rideIdFromEntity(entityId: number | undefined): number | null {
    if (entityId === undefined) {
        return null;
    }
    const entity = map.getEntity(entityId);
    if (!entity || entity.type !== "car") {
        return null;
    }
    const rideId = (entity as Car).ride;
    return isSelectableRide(rideId) ? rideId : null;
}

function rideIdFromTrackElement(event: PickerToolEvent): number | null {
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
            const rideId = (element as TrackElement).ride;
            if (isSelectableRide(rideId)) {
                return rideId;
            }
        }
    }

    const tracks = mapTile.tracks();
    for (let i = 0; i < tracks.length; i++) {
        if (isSelectableRide(tracks[i].ride)) {
            return tracks[i].ride;
        }
    }

    return null;
}

function resolveRideId(event: PickerToolEvent): number | null {
    const fromEntity = rideIdFromEntity(event.entityId);
    if (fromEntity !== null) {
        return fromEntity;
    }
    return rideIdFromTrackElement(event);
}

function highlightForRidePick(event: PickerToolEvent): void {
    if (event.entityId !== undefined) {
        const entity = map.getEntity(event.entityId);
        if (entity && entity.type === "car") {
            const car = entity as Car;
            const loc = car.trackLocation;
            const tile = mapCoordsToTile(loc);
            if (tile) {
                highlightMapTile(tile);
                return;
            }
        }
    }
    const tile = mapCoordsToTile(event.mapCoords);
    if (tile) {
        highlightMapTile(tile);
    }
}

/**
 * Activate a ride picker tool. Click a vehicle or track piece belonging to a ride.
 * Calls onPicked with the ride id, then cancels.
 */
export function pickRide(onPicked: (rideId: number) => void): void {
    activatePickerTool<number>({
        id: TOOL_ID,
        filter: ["ride", "entity"],
        resolve: (event) => resolveRideId(event),
        onHover: (_rideId, event) => highlightForRidePick(event),
        onPick: onPicked,
        onFinish: () => clearTileSelection()
    });
}
