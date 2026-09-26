/// <reference path="./../../../../openrct2.d.ts" />

import MapTile from "../../../../game/mapTile";
import TileCoords from "../../../../game/tileCoords";
import {carById, identifyCar, resolveCarId} from "../../entityRematch";
import {TileTargetDesc, VehicleTargetDesc} from "../../jsonTypes";
import {loadTileTarget, resolveLoadedTile} from "../../step/tileTarget";
import TriggerContext from "../triggerContext";

export function guestIdFromContext(context: TriggerContext): number | undefined {
    if (typeof context.guestId === "number") {
        return context.guestId;
    }
    if ("guestId" in context.target) {
        return context.target.guestId;
    }
    return undefined;
}

export function staffIdFromContext(context: TriggerContext): number | undefined {
    if ("staffId" in context.target) {
        return context.target.staffId;
    }
    return undefined;
}

export function resolveConditionRide(
    rideId: number | undefined,
    context: TriggerContext
): Ride | null {
    const id = rideId !== undefined ? rideId : context.rideId;
    if (id === undefined) {
        return null;
    }
    const ride = map.getRide(id);
    return ride ? ride : null;
}

function carFromId(carId: number | undefined): Car | null {
    if (typeof carId !== "number") {
        return null;
    }
    return carById(carId);
}

function carFromIdentity(
    rideId: number | undefined,
    trainIndex: number | undefined,
    carIndex: number | undefined
): Car | null {
    if (typeof rideId !== "number" || typeof trainIndex !== "number") {
        return null;
    }
    const index = typeof carIndex === "number" ? carIndex : 0;
    const carId = resolveCarId({
        rideId: rideId,
        trainIndex: trainIndex,
        carIndex: index
    });
    return carId === null ? null : carFromId(carId);
}

function triggerCar(context: TriggerContext): Car | null {
    if ("carId" in context.target) {
        const fromTarget = carFromId(context.target.carId);
        if (fromTarget) {
            return fromTarget;
        }
    }
    const fromCrash = carFromId(context.vehicleId);
    if (fromCrash) {
        return fromCrash;
    }
    return carFromIdentity(context.rideId, context.trainIndex, context.carIndex);
}

function trainHeadFromCar(car: Car | null): Car | null {
    if (!car || car.id === null) {
        return null;
    }
    const identity = identifyCar(car.id);
    if (!identity) {
        return null;
    }
    return carFromIdentity(identity.rideId, identity.trainIndex, 0);
}

export function resolveConditionCar(
    target: VehicleTargetDesc,
    context: TriggerContext
): Car | null {
    if (target.useTriggerTarget !== false) {
        return triggerCar(context);
    }
    return carFromIdentity(target.rideId, target.trainIndex, target.carIndex);
}

export function resolveConditionTrainHead(
    target: VehicleTargetDesc,
    context: TriggerContext
): Car | null {
    if (target.useTriggerTarget !== false) {
        const fromIdentity = carFromIdentity(context.rideId, context.trainIndex, 0);
        if (fromIdentity) {
            return fromIdentity;
        }
        return trainHeadFromCar(triggerCar(context));
    }
    return carFromIdentity(target.rideId, target.trainIndex, 0);
}

export function resolveConditionGuest(
    useTrigger: boolean,
    guestId: number | undefined,
    context: TriggerContext
): Guest | null {
    const id = useTrigger ? guestIdFromContext(context) : guestId;
    if (typeof id !== "number") {
        return null;
    }
    const entity = map.getEntity(id);
    if (!entity || entity.type !== "guest") {
        return null;
    }
    return entity as Guest;
}

export function resolveConditionStaff(
    useTrigger: boolean,
    staffId: number | undefined,
    context: TriggerContext
): Staff | null {
    const id = useTrigger ? staffIdFromContext(context) : staffId;
    if (typeof id !== "number") {
        return null;
    }
    const entity = map.getEntity(id);
    if (!entity || entity.type !== "staff") {
        return null;
    }
    return entity as Staff;
}

export function resolveConditionTile(
    desc: TileTargetDesc,
    context: TriggerContext
): TileCoords | null {
    const target = loadTileTarget(desc);
    return resolveLoadedTile(target, context.tile, "Condition Tile");
}

export function resolveConditionTrack(
    desc: TileTargetDesc,
    rideId: number,
    trackType: number,
    context: TriggerContext
): TrackElement | null {
    const tile = resolveConditionTile(desc, context);
    if (!tile) {
        return null;
    }
    const mapTile = MapTile.at(tile);
    if (!mapTile) {
        return null;
    }
    return mapTile.findTrack(rideId, trackType);
}

export function entityTile(entity: {x: number; y: number}): TileCoords {
    return {
        x: Math.floor(entity.x / 32),
        y: Math.floor(entity.y / 32)
    };
}

export function carTrackTile(car: Car): TileCoords | null {
    const loc = car.trackLocation;
    if (!loc || (loc.x === 0 && loc.y === 0)) {
        return null;
    }
    return {
        x: Math.floor(loc.x / 32),
        y: Math.floor(loc.y / 32)
    };
}

export function tilesEqual(a: TileCoords, b: TileCoords): boolean {
    return a.x === b.x && a.y === b.y;
}

export function worldCoordsForTile(tile: TileCoords): CoordsXY {
    return {x: tile.x * 32, y: tile.y * 32};
}
