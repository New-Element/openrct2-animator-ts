/// <reference path="./../../openrct2.d.ts" />

import reportPluginError from "../reportPluginError";
import {CarPos, walkRide} from "./trigger/rideCarSnapshot";

export interface CarIdentity {
    rideId: number;
    trainIndex: number;
    carIndex: number;
}

/**
 * Resolve a stable ride/train/car identity to the current entity id.
 */
export function resolveCarId(identity: CarIdentity): number | null {
    const cars = walkRide(identity.rideId);
    for (let i = 0; i < cars.length; i++) {
        const pos = cars[i];
        if (pos.trainIndex === identity.trainIndex && pos.carIndex === identity.carIndex) {
            return pos.carId;
        }
    }
    return null;
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
        reportPluginError(
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
