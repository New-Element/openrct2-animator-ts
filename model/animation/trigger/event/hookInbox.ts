/// <reference path="./../../../../openrct2.d.ts" />

import {error} from "../../../logger";

export type RideBreakdownNotice = {
    rideId: number;
    breakdownReason: string;
};

export type VehicleCrashNotice = {
    vehicleId: number;
    crashIntoType: string;
    rideId?: number;
};

export type GuestGenerationNotice = {
    guestId: number;
};

let rideBreakdowns: RideBreakdownNotice[] = [];
let vehicleCrashes: VehicleCrashNotice[] = [];
let guestGenerations: GuestGenerationNotice[] = [];
let bound = false;

/**
 * One subscribe per game hook. Events read the lists in tryFire();
 * Conductor clears after all triggers have polled this tick.
 */
export function bindHookInbox(): void {
    if (bound) {
        return;
    }
    bound = true;
    try {
        context.subscribe("ride.breakdown", (e: RideBreakdownArgs) => {
            rideBreakdowns.push({
                rideId: e.rideId,
                breakdownReason: e.breakdownReason
            });
        });
        context.subscribe("vehicle.crash", (e: VehicleCrashArgs) => {
            let rideId: number | undefined;
            const entity = map.getEntity(e.id);
            if (entity && entity.type === "car") {
                rideId = (entity as Car).ride;
            }
            vehicleCrashes.push({
                vehicleId: e.id,
                crashIntoType: e.crashIntoType,
                rideId: rideId
            });
        });
        context.subscribe("guest.generation", (e: GuestGenerationArgs) => {
            if (typeof e.id !== "number") {
                return;
            }
            guestGenerations.push({guestId: e.id});
        });
    } catch (e) {
        error("trigger", "Failed to subscribe to game hooks", e);
    }
}

export function peekRideBreakdowns(): RideBreakdownNotice[] {
    return rideBreakdowns;
}

export function peekVehicleCrashes(): VehicleCrashNotice[] {
    return vehicleCrashes;
}

export function peekGuestGenerations(): GuestGenerationNotice[] {
    return guestGenerations;
}

export function clearHookInbox(): void {
    rideBreakdowns = [];
    vehicleCrashes = [];
    guestGenerations = [];
}

export function optionalRideId(rideId: number | undefined): number | undefined {
    return typeof rideId === "number" ? rideId : undefined;
}

export function matchesOptionalRide(
    filterRideId: number | undefined,
    noticeRideId: number | undefined
): boolean {
    if (typeof filterRideId !== "number") {
        return true;
    }
    return typeof noticeRideId === "number" && noticeRideId === filterRideId;
}
