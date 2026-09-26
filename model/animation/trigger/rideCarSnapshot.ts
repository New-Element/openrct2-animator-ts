/// <reference path="../../../openrct2.d.ts" />

/**
 * Per-tick car / train-head positions for rides watched by tile events.
 * Conductor prepares once per tick for distinct rideIds; events read only.
 */

export interface CarPos {
    carId: number;
    trainIndex: number;
    carIndex: number;
    tileX: number;
    tileY: number;
    /** Signed track speed. Positive = forwards, negative = backwards. */
    velocity: number;
}

let snapshotByRide: { [rideId: number]: CarPos[] } = {};
let trainHeadSnapshotByRide: { [rideId: number]: CarPos[] } = {};

export function walkRide(rideId: number): CarPos[] {
    const cars: CarPos[] = [];
    const ride = map.getRide(rideId);
    if (!ride) {
        return cars;
    }

    const vehicleIds = ride.vehicles;
    const ln = vehicleIds.length;

    for (let trainIndex = 0; trainIndex < ln; trainIndex += 1) {
        // Use null-check (not truthiness): car entity id 0 is valid.
        let v: number | null = vehicleIds[trainIndex];
        let carIndex = 0;
        while (v !== null && v !== undefined) {
            const entity = map.getEntity(v);
            if (!entity || entity.type !== "car") {
                break;
            }

            const car = entity as Car;
            const trackLocation = car.trackLocation;
            cars.push({
                carId: v,
                trainIndex: trainIndex,
                carIndex: carIndex,
                tileX: Math.floor(trackLocation.x / 32),
                tileY: Math.floor(trackLocation.y / 32),
                velocity: car.velocity
            });

            const next = car.nextCarOnTrain;
            v = typeof next === "number" ? next : null;
            carIndex += 1;
        }
    }

    return cars;
}

/** Lead car of each train only — O(trains), no nextCarOnTrain walk. */
export function walkRideTrainHeads(rideId: number): CarPos[] {
    const heads: CarPos[] = [];
    const ride = map.getRide(rideId);
    if (!ride) {
        return heads;
    }

    const vehicleIds = ride.vehicles;
    for (let trainIndex = 0; trainIndex < vehicleIds.length; trainIndex += 1) {
        const v = vehicleIds[trainIndex];
        if (v === null || v === undefined) {
            continue;
        }
        const entity = map.getEntity(v);
        if (!entity || entity.type !== "car") {
            continue;
        }
        const car = entity as Car;
        const trackLocation = car.trackLocation;
        heads.push({
            carId: v,
            trainIndex: trainIndex,
            carIndex: 0,
            tileX: Math.floor(trackLocation.x / 32),
            tileY: Math.floor(trackLocation.y / 32),
            velocity: car.velocity
        });
    }

    return heads;
}

/**
 * Distinct rideIds from triggers that need full car tile positions this tick.
 * Cheap JS scan — not cached; invalidation would cost more than the scan.
 */
export function collectRideIdsForCarTileEvents(
    triggers: { event: TileEventForSnapshot | null }[]
): number[] {
    return collectRideIdsForEventType(triggers, "carEnters");
}

/** Distinct rideIds from trainEnters triggers. */
export function collectRideIdsForTrainTileEvents(
    triggers: { event: TileEventForSnapshot | null }[]
): number[] {
    return collectRideIdsForEventType(triggers, "trainEnters");
}

type TileEventForSnapshot = {
    type: string;
    rideId?: number;
    isPollDue?: () => boolean;
};

function collectRideIdsForEventType(
    triggers: { event: TileEventForSnapshot | null }[],
    eventType: string
): number[] {
    const seen: { [rideId: number]: boolean } = {};
    const ids: number[] = [];
    for (let i = 0; i < triggers.length; i++) {
        const event = triggers[i].event;
        if (!event || event.type !== eventType) {
            continue;
        }
        if (typeof event.isPollDue === "function" && !event.isPollDue()) {
            continue;
        }
        const rideId = event.rideId;
        if (typeof rideId !== "number" || seen[rideId]) {
            continue;
        }
        seen[rideId] = true;
        ids.push(rideId);
    }
    return ids;
}

export function prepareRideCarSnapshots(rideIds: number[]): void {
    snapshotByRide = {};
    for (let i = 0; i < rideIds.length; i++) {
        const rideId = rideIds[i];
        snapshotByRide[rideId] = walkRide(rideId);
    }
}

/**
 * Prepare train-head snapshots for rides that are not already covered by a
 * full car walk (heads can be derived from that for free).
 */
export function prepareRideTrainHeadSnapshots(
    trainRideIds: number[],
    carRideIds: number[]
): void {
    trainHeadSnapshotByRide = {};
    const coveredByCarWalk: { [rideId: number]: boolean } = {};
    for (let i = 0; i < carRideIds.length; i++) {
        coveredByCarWalk[carRideIds[i]] = true;
    }
    for (let i = 0; i < trainRideIds.length; i++) {
        const rideId = trainRideIds[i];
        if (coveredByCarWalk[rideId]) {
            continue;
        }
        trainHeadSnapshotByRide[rideId] = walkRideTrainHeads(rideId);
    }
}

export function getRideCarSnapshot(rideId: number): CarPos[] {
    const cars = snapshotByRide[rideId];
    return cars ? cars : [];
}

/**
 * Lead-car positions for a ride. Prefers filtering a full car snapshot when
 * one was prepared this tick; otherwise uses the train-head-only walk.
 */
export function getRideTrainHeadSnapshot(rideId: number): CarPos[] {
    const full = snapshotByRide[rideId];
    if (full) {
        const heads: CarPos[] = [];
        for (let i = 0; i < full.length; i++) {
            if (full[i].carIndex === 0) {
                heads.push(full[i]);
            }
        }
        return heads;
    }
    const headsOnly = trainHeadSnapshotByRide[rideId];
    return headsOnly ? headsOnly : [];
}
