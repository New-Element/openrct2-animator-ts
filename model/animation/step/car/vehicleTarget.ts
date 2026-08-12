/// <reference path="./../../../../openrct2.d.ts" />

import {resolveCarId} from "../../entityRematch";
import {VehicleTargetDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import {
    resolveTriggerCar,
    resolveTriggerTrainHead,
    walkTrainFromHead
} from "./resolveCars";

export function usesTriggerTarget(target: VehicleTargetDesc): boolean {
    return target.useTriggerTarget !== false;
}

/**
 * Resolve the head car for a step's vehicle target (trigger car or explicit ride/train/car).
 * For trigger targeting this is the firer car (car steps), not the train head.
 */
export function resolveTargetHeadCar(
    run: StepRunContext,
    target: VehicleTargetDesc
): Car | null {
    if (usesTriggerTarget(target)) {
        return resolveTriggerCar(run);
    }

    if (typeof target.rideId !== "number" || typeof target.trainIndex !== "number") {
        return null;
    }

    const carIndex = typeof target.carIndex === "number" ? target.carIndex : 0;
    const carId = resolveCarId({
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: carIndex
    });
    if (carId === null) {
        return null;
    }

    const entity = map.getEntity(carId);
    if (!entity || entity.type !== "car") {
        return null;
    }
    return entity as Car;
}

/**
 * Resolve all cars on the targeted train (true train head + nextCarOnTrain chain).
 */
export function resolveTargetTrainCars(
    run: StepRunContext,
    target: VehicleTargetDesc
): Car[] {
    if (usesTriggerTarget(target)) {
        return walkTrainFromHead(resolveTriggerTrainHead(run));
    }

    if (typeof target.rideId !== "number" || typeof target.trainIndex !== "number") {
        return [];
    }

    const headId = resolveCarId({
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: 0
    });
    if (headId === null) {
        return [];
    }
    const entity = map.getEntity(headId);
    if (!entity || entity.type !== "car") {
        return [];
    }
    return walkTrainFromHead(entity as Car);
}

/** Fields to persist for vehicle targeting (omit ids when using trigger). */
export function persistVehicleTargetFields(target: VehicleTargetDesc): VehicleTargetDesc {
    if (usesTriggerTarget(target)) {
        return { useTriggerTarget: true };
    }
    const data: VehicleTargetDesc = {
        useTriggerTarget: false,
        rideId: typeof target.rideId === "number" ? target.rideId : 0,
        trainIndex: typeof target.trainIndex === "number" ? target.trainIndex : 0
    };
    if (typeof target.carIndex === "number") {
        data.carIndex = target.carIndex;
    }
    return data;
}
