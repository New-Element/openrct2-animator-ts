/// <reference path="./../../openrct2.d.ts" />

import {error} from "../logger";
import {CarPos, walkRide} from "./trigger/rideCarSnapshot";

export interface TrainIdentity {
    rideId: number;
    trainIndex: number;
}

export interface CarIdentity {
    rideId: number;
    trainIndex: number;
    carIndex: number;
}

/**
 * One ride.vehicles read per ride per game tick, shared by the train-still-there
 * check, music branch, and station-start follow. Lead car is vehicles[trainIndex].
 * Later cars walk nextCarOnTrain on that train only.
 */
let cacheTick = Number.NaN;
let rideVehicleIds: { [rideId: number]: (number | null)[] | null } = {};
let trainChains: { [key: string]: number[] } = {};
let carsById: { [carId: number]: Car | null } = {};

function tickNow(): number {
    if (typeof date !== "undefined" && typeof date.ticksElapsed === "number") {
        return date.ticksElapsed;
    }
    return 0;
}

function clearCarLookupIfNewTick(): void {
    const tick = tickNow();
    if (tick === cacheTick) {
        return;
    }
    cacheTick = tick;
    rideVehicleIds = {};
    trainChains = {};
    carsById = {};
}

function vehicleIdsForRide(rideId: number): (number | null)[] | null {
    clearCarLookupIfNewTick();
    if (Object.prototype.hasOwnProperty.call(rideVehicleIds, rideId)) {
        return rideVehicleIds[rideId];
    }
    const ride = map.getRide(rideId);
    if (!ride) {
        rideVehicleIds[rideId] = null;
        return null;
    }
    const vehicles = ride.vehicles;
    const ids: (number | null)[] = [];
    for (let i = 0; i < vehicles.length; i++) {
        const id = vehicles[i];
        ids.push(typeof id === "number" ? id : null);
    }
    rideVehicleIds[rideId] = ids;
    return ids;
}

function trainChainKey(rideId: number, trainIndex: number): string {
    return rideId + ":" + trainIndex;
}

/** Car entity for this id, fetched at most once per game tick. */
export function carById(carId: number): Car | null {
    clearCarLookupIfNewTick();
    if (Object.prototype.hasOwnProperty.call(carsById, carId)) {
        return carsById[carId];
    }
    const entity = map.getEntity(carId);
    if (!entity || entity.type !== "car") {
        carsById[carId] = null;
        return null;
    }
    const car = entity as Car;
    carsById[carId] = car;
    return car;
}

/**
 * Resolve a stable ride/train/car identity to the current entity id.
 */
export function resolveCarId(identity: CarIdentity): number | null {
    if (typeof identity.carIndex !== "number" || identity.carIndex < 0) {
        return null;
    }
    const vehicles = vehicleIdsForRide(identity.rideId);
    if (!vehicles) {
        return null;
    }
    const headId = vehicles[identity.trainIndex];
    if (typeof headId !== "number") {
        return null;
    }

    const key = trainChainKey(identity.rideId, identity.trainIndex);
    let chain = trainChains[key];
    if (!chain) {
        chain = [headId];
        trainChains[key] = chain;
    }
    if (identity.carIndex < chain.length) {
        return chain[identity.carIndex];
    }

    let previousId = chain[chain.length - 1];
    while (chain.length <= identity.carIndex) {
        const previous = carById(previousId);
        if (!previous) {
            return null;
        }
        const next = previous.nextCarOnTrain;
        if (typeof next !== "number") {
            return null;
        }
        chain.push(next);
        previousId = next;
    }
    return chain[identity.carIndex];
}

/**
 * Identify a car entity by walking its ride's vehicle list.
 */
export function identifyCar(carId: number): CarIdentity | null {
    const entity = map.getEntity(carId);
    if (!entity || entity.type !== "car") {
        return null;
    }
    const car = entity as Car;
    const rideId = car.ride;
    if (typeof rideId !== "number") {
        return null;
    }
    const cars = walkRide(rideId);
    for (let i = 0; i < cars.length; i++) {
        const pos: CarPos = cars[i];
        if (pos.carId === carId) {
            return {
                rideId: rideId,
                trainIndex: pos.trainIndex,
                carIndex: pos.carIndex
            };
        }
    }
    return null;
}

/**
 * Resolve staff entity id by name. First match wins; duplicates are reported.
 */
export function resolveStaffIdByName(staffName: string): number | null {
    const staffList = map.getAllEntities("staff");
    let matchId: number | null = null;
    let matchCount = 0;
    for (let i = 0; i < staffList.length; i++) {
        const staff = staffList[i];
        if (staff.name !== staffName || staff.id === null) {
            continue;
        }
        matchCount += 1;
        if (matchId === null) {
            matchId = staff.id;
        }
    }
    if (matchCount === 0) {
        return null;
    }
    if (matchCount > 1) {
        error(
            "runtimeState",
            `Multiple staff named "${staffName}"; using first match (id ${matchId})`
        );
    }
    return matchId;
}

/**
 * Look up a staff member's name by entity id.
 */
export function getStaffName(staffId: number): string | null {
    const entity = map.getEntity(staffId);
    if (!entity || entity.type !== "staff") {
        return null;
    }
    return (entity as Staff).name;
}

/**
 * Resolve guest entity id by name. First match wins; duplicates are reported.
 */
export function resolveGuestIdByName(guestName: string): number | null {
    const guestList = map.getAllEntities("guest");
    let matchId: number | null = null;
    let matchCount = 0;
    for (let i = 0; i < guestList.length; i++) {
        const guest = guestList[i];
        if (guest.name !== guestName || guest.id === null) {
            continue;
        }
        matchCount += 1;
        if (matchId === null) {
            matchId = guest.id;
        }
    }
    if (matchCount === 0) {
        return null;
    }
    if (matchCount > 1) {
        error(
            "runtimeState",
            `Multiple guests named "${guestName}"; using first match (id ${matchId})`
        );
    }
    return matchId;
}

/**
 * Look up a guest's name by entity id.
 */
export function getGuestName(guestId: number): string | null {
    const entity = map.getEntity(guestId);
    if (!entity || entity.type !== "guest") {
        return null;
    }
    return (entity as Guest).name;
}
