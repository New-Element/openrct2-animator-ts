/// <reference path="./../../../../openrct2.d.ts" />

import {carById, resolveCarId} from "../../entityRematch";
import {VehicleTargetDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import {
    resolveTriggerCars,
    resolveTriggerTrainHeads,
    walkTrainFromHead
} from "./resolveCars";

export function usesTriggerTarget(target: VehicleTargetDesc): boolean {
    return target.useTriggerTarget !== false;
}

/**
 * Resolve cars for a step's vehicle target (context cars, or one explicit car).
 */
export function resolveTargetHeadCars(
    run: StepRunContext,
    target: VehicleTargetDesc
): Car[] {
    if (usesTriggerTarget(target)) {
        return resolveTriggerCars(run);
    }

    if (typeof target.rideId !== "number" || typeof target.trainIndex !== "number") {
        return [];
    }

    const carIndex = typeof target.carIndex === "number" ? target.carIndex : 0;
    const carId = resolveCarId({
        rideId: target.rideId,
        trainIndex: target.trainIndex,
        carIndex: carIndex
    });
    if (carId === null) {
        return [];
    }

    const car = carById(carId);
    if (!car) {
        return [];
    }
    return [car];
}

/**
 * Resolve all cars on the targeted train (true train head + nextCarOnTrain chain).
 */
export function resolveTargetTrainCars(
    run: StepRunContext,
    target: VehicleTargetDesc
): Car[] {
    if (usesTriggerTarget(target)) {
        const heads = resolveTriggerTrainHeads(run);
        const cars: Car[] = [];
        for (let i = 0; i < heads.length; i++) {
            const trainCars = walkTrainFromHead(heads[i]);
            for (let j = 0; j < trainCars.length; j++) {
                cars.push(trainCars[j]);
            }
        }
        return cars;
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
    const head = carById(headId);
    if (!head) {
        return [];
    }
    return walkTrainFromHead(head);
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
