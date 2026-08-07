/// <reference path="./../../../../openrct2.d.ts" />

import {resolveCarId} from "../../entityRematch";
import {VehicleTargetDesc} from "../../jsonTypes";
import StepRunContext from "../stepRunContext";
import {resolveTriggerCar} from "./resolveCars";

export function usesTriggerTarget(target: VehicleTargetDesc): boolean {
    return target.useTriggerTarget !== false;
}

/**
 * Resolve the head car for a step's vehicle target (trigger car or explicit ride/train/car).
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
 * Resolve all cars on the targeted train (head + nextCarOnTrain chain).
 */
export function resolveTargetTrainCars(
    run: StepRunContext,
    target: VehicleTargetDesc
): Car[] {
    const cars: Car[] = [];
    // Train targeting always starts at the train head (car index 0).
    const headTarget: VehicleTargetDesc = usesTriggerTarget(target)
        ? target
        : {
            useTriggerTarget: false,
            rideId: target.rideId,
            trainIndex: target.trainIndex,
            carIndex: 0
        };

    let car = resolveTargetHeadCar(run, headTarget);
    while (car) {
        cars.push(car);
        if (car.nextCarOnTrain === null) {
            break;
        }
        const next = map.getEntity(car.nextCarOnTrain);
        if (!next || next.type !== "car") {
            break;
        }
        car = next as Car;
    }
    return cars;
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
