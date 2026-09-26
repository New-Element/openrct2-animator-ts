/// <reference path="./../../openrct2.d.ts" />

import {carById, identifyCar, resolveCarId} from "./entityRematch";
import TriggerContext from "./trigger/triggerContext";

export type TriggerContextInvalidReason = "missing_train" | "missing_guest";

/** Lead car still on the ride. Does not walk the train. */
function headStillExists(context: TriggerContext): boolean {
    const target = context.target;
    if (!("carId" in target)) {
        return true;
    }

    let rideId = context.rideId;
    let trainIndex = context.trainIndex;
    if (typeof rideId !== "number" || typeof trainIndex !== "number") {
        const entity = carById(target.carId);
        if (!entity || entity.id === null) {
            return false;
        }
        const identity = identifyCar(entity.id);
        if (!identity) {
            return false;
        }
        rideId = identity.rideId;
        trainIndex = identity.trainIndex;
    }

    const headId = resolveCarId({
        rideId: rideId,
        trainIndex: trainIndex,
        carIndex: 0
    });
    if (headId === null) {
        return false;
    }
    return carById(headId) !== null;
}

/**
 * Whether a car-triggered run should keep going.
 * Leaving the fire tile does not abort — once started, the animation runs to
 * completion. Abort only if the train can no longer be resolved, unless
 * allowOffTile (e.g. Lift/Drop Track returning the track after the train is gone).
 */
export function getTriggerContextInvalidReason(
    context: TriggerContext
): TriggerContextInvalidReason | null {
    if ("guestId" in context.target) {
        const entity = map.getEntity(context.target.guestId);
        if (!entity || entity.type !== "guest") {
            return "missing_guest";
        }
        return null;
    }

    if (!("carId" in context.target)) {
        return null;
    }

    if (!headStillExists(context)) {
        if (context.allowOffTile) {
            // Step is responsible for cleanup (e.g. track return).
            return null;
        }
        return "missing_train";
    }

    return null;
}
