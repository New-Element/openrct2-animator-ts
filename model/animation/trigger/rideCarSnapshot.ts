/// <reference path="../../../openrct2.d.ts" />

/**
 * Per-tick car positions for rides watched by car tile events (e.g. carEnters).
 * Conductor prepares once per tick for distinct rideIds; events read only.
 */

export interface CarPos {
    carId: number;
    trainIndex: number;
    carIndex: number;
    tileX: number;
    tileY: number;
}

let snapshotByRide: { [rideId: number]: CarPos[] } = {};

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
                tileY: Math.floor(trackLocation.y / 32)
            });

            const next = car.nextCarOnTrain;
            v = typeof next === "number" ? next : null;
            carIndex += 1;
        }
    }

    return cars;
}

/**
 * Distinct rideIds from triggers that need car tile positions this tick.
 * Cheap JS scan — not cached; invalidation would cost more than the scan.
 */
export function collectRideIdsForCarTileEvents(
    triggers: { event: { type: string } | null }[]
): number[] {
    const seen: { [rideId: number]: boolean } = {};
    const ids: number[] = [];
    for (let i = 0; i < triggers.length; i++) {
        const event = triggers[i].event;
        if (!event || event.type !== "carEnters") {
            continue;
        }
        const rideId = (event as { rideId?: number }).rideId;
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

export function getRideCarSnapshot(rideId: number): CarPos[] {
    const cars = snapshotByRide[rideId];
    return cars ? cars : [];
}
